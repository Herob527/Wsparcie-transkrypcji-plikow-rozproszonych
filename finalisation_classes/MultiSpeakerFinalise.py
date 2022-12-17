from finalisation_classes.BaseFinalise import BaseFinalise
from pathlib import Path
from shutil import rmtree
from tables_definition import *
from sqlalchemy import select, func
from shutil import copy
import json
import asyncio
from ffmpeg import FFmpeg
from sqlalchemy.engine import Engine


class MultiSpeakerFinalise(BaseFinalise):
    """
    This class implements finalisation of the project optimised to train multispeaker models like Flowtron or Uberduck Pipeline Tacotron
    """

    def __init__(self, configuration: dict, sql_engine: Engine):
        BaseFinalise.__init__(self, configuration, sql_engine)
        self.output = Path("./multispeaker_output")
        if self.output.exists():
            rmtree(self.output)
        self.output.mkdir()

        self.name = "all_to_one"
        self.ux_name = "Każda kategoria do jednego folderu"
        self.model_info = (
            select(
                c_categories.c.id,
                c_categories.c.name,
                func.round(func.sum(c_audio.c.duration_seconds) / 60, 2).label(
                    "n_files"
                ),
            )
            .select_from(c_audio)
            .join(c_bindings)
            .join(c_categories)
            .join(c_texts)
            .group_by(c_bindings.c.category_id)
            .where(c_texts.c.transcript != "")
            .where(c_categories.c.name not in ["Nieznane", "Odpad"])
            .execute()
            .mappings()
            .all()
        )

    def categorise(self):
        wavs_path = Path(self.output, "wavs")
        invalid_wavs_path = Path(self.output, "invalid_wavs")
        wavs_path.mkdir()
        invalid_wavs_path.mkdir()

        for i in self.general_data:
            current_folder = wavs_path
            directory = i["directory"]
            audio_length = i["duration_seconds"]
            audio_channels = i["channels"]
            is_invalid_format = (
                audio_length > self.configuration["max_length"]
                or audio_length < self.configuration["min_length"]
                or audio_channels != 1
            )
            if is_invalid_format and self.configuration["should_filter"]:
                current_folder = invalid_wavs_path
            output_name = f"{i['category_id']}_{i['name']}"
            source_path = Path(directory, i["name"])
            output_path = Path(current_folder, output_name)

            copy(source_path, output_path)

    def provide_transcription(self):
        data_path = Path(self.output, "texts")
        data_path.mkdir()
        with open(
            Path(data_path, "model_info.json"), "w", encoding="utf-8"
        ) as model_info_output:
            actors = [dict(i) for i in self.model_info]
            output_data = {
                "name": "",
                "n_speakers": len(actors),
                "tacotron": "",
                "train_list": "",
                "actors": actors,
            }
            json.dump(output_data, model_info_output)
        existing_data = [
            i
            for i in self.general_data
            if Path(self.output, "wavs", f"{i['category_id']}_{i['name']}").exists()
        ]
        validation_data_amount = len(existing_data) // 10
        validation_data = existing_data[:validation_data_amount:]
        training_data = existing_data[validation_data_amount:]
        with open(
            Path(data_path, "list_train.txt"), "w", encoding="utf-8"
        ) as train_output, open(
            Path(data_path, "list_val.txt"), "w", encoding="utf-8"
        ) as val_output:
            for entry in training_data:
                name, category_id, transcript = (
                    entry["name"],
                    entry["category_id"],
                    entry["transcript"],
                )
                if self.configuration["should_format"] == "true" and not name.endswith(
                    ".wav"
                ):
                    name += ".wav"
                train_output.write(
                    f"wavs/{category_id}_{name}|{transcript}|{category_id}\n"
                )
            for entry in validation_data:
                name, category_id, transcript = (
                    entry["name"],
                    entry["category_id"],
                    entry["transcript"],
                )
                if self.configuration["should_format"] == "true" and not name.endswith(
                    ".wav"
                ):
                    name += ".wav"
                val_output.write(
                    f"wavs/{category_id}_{name}|{transcript}|{category_id}\n"
                )

    def format(self):
        temp_folder = Path(self.output, "wavs", "temp")
        wavs_path = Path(self.output, "wavs")
        temp_folder.mkdir()
        audios = [i for i in wavs_path.iterdir() if i.is_file()]
        for audio in audios:
            output_name = (
                f"{temp_folder}/{audio.name}"
                if audio.name.endswith(".wav")
                else f"{temp_folder}/{audio.name}.wav"
            )
            current_file = (
                FFmpeg().option("y").input(audio).output(output_name, ar=22050, ac=1)
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
