from finalisation_classes.BaseFinalise import BaseFinalise
from pathlib import Path
from shutil import rmtree
from tables_definition import *
from shutil import copy
import asyncio
from ffmpeg import FFmpeg
from operator import itemgetter


class TacotronFinalise(BaseFinalise):
    """
    This class implements finalisation of the project optimised to train single Tacotron models
    """

    def __init__(self, configuration: dict, sql_engine):
        BaseFinalise.__init__(self, configuration, sql_engine)
        self.output = Path("./tacotron_output")
        self.name = 'distinctive'
        self.ux_name = 'Każda kategoria do jednego folderu'
        if self.configuration['line_format_input'] == '':
            self.configuration['line_format_input'] = 'wavs/{audio_name}|{text_transcript}'
        if self.output.exists():
            rmtree(self.output)

    def categorise(self):
        category_query = self.general_query.group_by(c_categories.c.name)
        category_data = category_query.execute().mappings().all()
        min_length, max_length, should_filter = itemgetter(
            'min_length', 'max_length', 'should_filter')(self.configuration)
        for i in category_data:
            category_path = Path(self.output, i["category_name"])
            wavs_path = Path(category_path, "wavs")
            audio_channels = i["audio_channels"]
            category_path.mkdir(exist_ok=True, parents=True)
            wavs_path.mkdir(exist_ok=True, parents=True)
        for i in self.general_data:
            directory = i["audio_directory"]
            name = i["audio_name"].strip()
            category_name = i["category_name"].strip()
            audio_length = i["audio_length"]
            output_file_path = Path(self.output, category_name, "wavs")

            is_invalid_format = (
                audio_length > max_length
                or audio_length < min_length
                or audio_channels != 1
            )
            source_path = f"{directory}/{name}"
            if should_filter and is_invalid_format:
                path_for_invalid_length = Path(
                    self.output, category_name, "invalid_length"
                )
                path_for_invalid_length.mkdir(exist_ok=True)
                copy(source_path, f"{path_for_invalid_length}")
                continue
            copy(source_path, f"{output_file_path}")

    def provide_transcription(self):
        output_type, min_length, max_length, should_format, line_format_input, should_filter = itemgetter(
            'output_type', 'min_length', 'max_length', 'should_format', 'line_format_input', 'should_filter')(self.configuration)
        for i in self.general_data:
            audio_length = i["audio_length"]
            audio_channels = i["audio_channels"]
            category_name = i["category_name"]
            category_path = Path(self.output, category_name)
            transcription_path = Path(category_path, "list.txt")
            is_invalid_format = (
                audio_length > max_length
                or audio_length < min_length
                or audio_channels != 1
            )
            if is_invalid_format and should_filter:
                transcription_path = Path(category_path, "invalid_list.txt")
            with open(transcription_path, "a", encoding="utf-8") as output:
                formatted_line = line_format_input.format_map(i)
                line = formatted_line.strip()
                if not line.endswith((".", "?", "!")):
                    line += line.join(".")
                output.write(f"{formatted_line}\n")

    def format(self):
        category_query = self.general_query.group_by(c_categories.c.name)
        category_data = category_query.execute().mappings().all()
        output_type, output_audio_filter, output_sample_rate, output_channels = itemgetter(
            'output_type', 'output_audio_filter', 'output_sample_rate', 'output_channels')(self.configuration)
        output_params = {
            "ac": output_channels,
            "ar": output_sample_rate
        }
        if output_audio_filter != '':
            output_params['af'] = output_audio_filter

        for category in category_data:
            wavs_path = Path(self.output, category["category_name"], "wavs")
            temp_folder = Path(wavs_path, "temp")
            temp_folder.mkdir()
            audios = (i for i in wavs_path.iterdir() if i.is_file())

            for audio in audios:
                output_name = (
                    f"{temp_folder}/{audio.name}"
                    if audio.name.endswith(output_type)
                    else f"{temp_folder}/{audio.name}.{output_type}"
                )
                current_file = (
                    FFmpeg()
                    .option("y")
                    .input(audio)
                    .output(output_name, **output_params)
                )

                @current_file.on("stderr")
                def on_stderr(line):
                    # print('stderr:', line)
                    pass

                @current_file.on("error")
                def on_error(code):
                    print("Error:", code, f" on file: {audio}")

                @current_file.on("completed")
                def on_completed():
                    audio.unlink()
                    print(f"Completed formating file: {audio}")

                asyncio.run(current_file.execute())

            for audio in temp_folder.iterdir():
                copy(audio, wavs_path)
            rmtree(temp_folder)
