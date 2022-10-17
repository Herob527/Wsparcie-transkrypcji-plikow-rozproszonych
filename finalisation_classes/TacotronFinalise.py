from finalisation_classes.BaseFinalise import BaseFinalise
from pathlib import Path
from shutil import rmtree
from tables_definition import *
from sqlalchemy import select, func
from shutil import copy
import asyncio
from ffmpeg import FFmpeg
from typing import List
from sqlalchemy.engine import Engine
class TacotronFinalise(BaseFinalise):
    """
    This class implements finalisation of the project optimised to train single Tacotron models
    """

    def __init__(self, configuration: dict, sql_engine):
        BaseFinalise.__init__(self, configuration, sql_engine)
        self.output = Path("./tacotron_output")
        self.name = 'distinctive'
        self.ux_name = 'Każda kategoria do jednego folderu'
        if self.output.exists():
            rmtree(self.output)

    def categorise(self):
        category_query = self.general_query.group_by(c_categories.c.name)
        category_data = category_query.execute().mappings().all()
        
        for i in category_data:
            category_path = Path(self.output, i["name_1"])
            wavs_path = Path(category_path, "wavs")
            audio_channels = i["channels"]
            category_path.mkdir(exist_ok=True, parents=True)
            wavs_path.mkdir(exist_ok=True, parents=True)
        for i in self.general_data:
            directory = i['directory']
            name = i["name"].strip()
            category_name = i["name_1"].strip()
            audio_length = i["duration_seconds"]
            output_file_path = Path(self.output, category_name, "wavs")
            
            is_invalid_format = (
                audio_length > self.configuration["max_length"]
                or audio_length < self.configuration["min_length"]
                or audio_channels != 1
            )
            source_path = f"{directory}/{name}" 
            if is_invalid_format and self.configuration['should_filter']:
                path_for_invalid_length = Path(
                    self.output, category_name, "invalid_length"
                )
                path_for_invalid_length.mkdir(exist_ok=True)
                copy(source_path, f"{path_for_invalid_length}")
                continue
            copy(source_path, f"{output_file_path}")

    def provide_transcription(self):
        for i in self.general_data:
            audio_length = i["duration_seconds"]
            audio_channels = i["channels"]
            category_name = i["name_1"]
            category_path = Path(self.output, category_name)
            transcription_path = Path(category_path, "list.txt")
            is_invalid_format = (
                audio_length > self.configuration["max_length"]
                or audio_length < self.configuration["min_length"]
                or audio_channels != 1
            )

            if is_invalid_format and self.configuration['should_filter']:
                transcription_path = Path(category_path, "invalid_list.txt")
            with open(transcription_path, "a", encoding="utf-8") as output:
                name = i["name"].strip()
                if self.configuration["should_format"] == "true" and not name.endswith(
                    ".wav"
                ):
                    name += ".wav"
                line = i["transcript"].strip()
                if not line.endswith((".", "?", "!")):
                    line += line.join(".")
                output.write(f"wavs/{name}|{line}\n")

    def format(self):
        category_query = self.general_query.group_by(c_categories.c.name)
        category_data = category_query.execute().mappings().all()
        for category in category_data:
            wavs_path = Path(self.output, category["name_1"], "wavs")
            temp_folder = Path(wavs_path, "temp")
            temp_folder.mkdir()
            audios = (i for i in wavs_path.iterdir() if i.is_file())
            for audio in audios:
                output_name = (
                    f"{temp_folder}/{audio.name}"
                    if audio.name.endswith(".wav")
                    else f"{temp_folder}/{audio.name}.wav"
                )
                current_file = (
                    FFmpeg()
                    .option("y")
                    .input(audio)
                    .output(output_name, ar=22050, ac=1)
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

