from finalisation_classes import (
    TacotronFinalise,
    MultiSpeakerFinalise,
    get_methods,
    EnderalFinalise,
)
from tables_definition import *
import contextlib
from flask import Flask, jsonify, request
from flask_restful import Api
from pathlib import Path
from flask_cors import CORS
import sqlalchemy
from sqlalchemy import (
    create_engine,
    MetaData,
    select,
    func,
)
from pydub import AudioSegment, exceptions
import time
import json
from typing import List
import logging
from concurrent.futures import ThreadPoolExecutor

from api_endpoints.r_status import r_status
from api_endpoints.r_config import r_config
from api_endpoints.r_bindings import r_bindings
from api_endpoints.r_texts import r_texts
from api_endpoints.r_categories import r_categories
from api_endpoints.r_audios import r_audios

log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)

app = Flask(__name__)
CORS(app)
api = Api(app)

with open("./config.json", "r", encoding="utf8") as json_input:
    config_api = json.load(json_input)["apiConfig"]

_engine = create_engine(
    config_api["databaseConnectionConfig"]["connectionString"],
    connect_args={"check_same_thread": False},
    echo=True,
    pool_pre_ping=True,
    pool_recycle=3600,
)
metadata = MetaData(_engine)


@app.route("/set_category", methods=["PATCH"])
def set_category():
    data = request.get_json()
    (
        category_id,
        bindings_id,
    ) = (data["category_id"], data["bindings_id"])
    with _engine.connect():
        query = (
            c_bindings.update()
            .values(category_id=category_id)
            .where(c_bindings.c.id == bindings_id)
        )
        query.execute()

    return {"Success": "Kategoria pomyślnie zaktualizowana"}


@app.route("/get_size", methods=["GET"])
def get_size():
    args = request.args

    query = select([func.count()]).select_from(c_bindings)
    if args["category_id"] != -1:
        query = query.where(c_bindings.c.category_id == args["category_id"])
    res = query.execute()

    return jsonify(dict(res.mappings().all()[0]))


def get_audio(path: Path):
    try:
        return AudioSegment.from_file(path)
    except exceptions.CouldntDecodeError:
        logging.error(f"Couldn't decode audio. Path to audio: {path}")
        return None
    except FileNotFoundError:
        logging.error(f"Couldn't find file. Path to audio: {path}")
        return None


def insert_data_to_database(index, path, additional_data, audio, file_name):
    category_id, text = additional_data["category_id"], additional_data["text"]

    frame_rate, channels, duration_seconds = (
        audio.frame_rate,
        audio.channels,
        round(audio.duration_seconds, 4),
    )
    try:
        c_texts.insert({"id": index, "transcript": text}).execute()
    except sqlalchemy.exc.IntegrityError:
        logging.error(
            f"Failed to enter text {text} with id {index}. It already exists."
        )

    try:
        c_audio.insert(
            {
                "id": index,
                "name": file_name,
                "channels": channels,
                "duration_seconds": duration_seconds,
                "frame_rate": frame_rate,
                "directory": str(path.parent),
            }
        ).execute()
    except sqlalchemy.exc.IntegrityError:
        logging.error(
            f"Failed to enter audio {file_name} with id {index}. It exists.")
    try:
        c_bindings.insert(
            {
                "id": index,
                "audio_id": index,
                "text_id": index,
                "category_id": category_id,
            }
        ).execute()

    except sqlalchemy.exc.IntegrityError:
        logging.error(f"Failed to enter binding with id {index}. It exists.")


def insert_data(index: int, path: Path, additional_data: dict = None) -> None:
    audio = get_audio(path)
    if audio is None:
        return
    file_name = path.parts[-1]
    insert_data_to_database(index, path, additional_data, audio, file_name)


@app.route("/get_lines", methods=["GET"])
def get_line():
    args = request.args
    general_query = (
        select(
            c_bindings.c.id.label("bindings_id"),
            c_categories.c.id.label("category_id"),
            c_categories.c.name.label("category_name"),
            c_audio.c.name.label("audio_name"),
            c_audio.c.directory.label("audio_directory"),
            c_audio.c.duration_seconds,
            c_texts.c.transcript,

        )
        .join(c_audio)
        .join(c_categories)
        .join(c_texts)
        .order_by(c_audio.c.duration_seconds)
        .limit(args["limit"])
        .offset(args["offset"])
    )
    if int(args['category_id']) != -1:
        general_query = general_query.where(
            c_categories.c.id == args["category_id"])

    general_data: List[dict] = (
        general_query.order_by(c_audio.c.name).execute().mappings().all()
    )
    return jsonify([dict(row) for row in general_data])


@app.route("/setup_database", methods=["POST"])
def setup_database():
    source_path = Path(config_api["sourceFolder"])
    initial_categories = {
        """
            Category used for files with unassigned category. Default category.
        """
        "unknown": {"id": 0, "name": "Nieznany", "initial_category": "Nieznany"},
        """
            Category set by user, who identify a file as... trash, insufficient for later usage or something. It's up to them
        """
        "trash": {"id": 1, "name": "Odpad", "initial_category": "Odpad"},
    }
    print("Usuwanie istniejących tabel")
    if c_categories.exists():
        c_categories.drop()
    if c_texts.exists():
        c_texts.drop()
    if c_audio.exists():
        c_audio.drop()
    if c_bindings.exists():
        c_bindings.drop()
    print("Tworzenie nowych tabel tabel")
    c_categories.create()
    c_texts.create()
    c_audio.create()
    c_bindings.create()

    print("Wstawianie danych")
    start_time = time.time()
    for val in initial_categories.values():
        c_categories.insert().values(
            id=val["id"], name=val["name"], initial_category=val["initial_category"]
        ).execute()

    with _engine.connect():
        dirs = [i for i in source_path.iterdir() if i.is_dir()]
        unknowns = [i for i in source_path.iterdir() if i.is_file()]

        data = [
            {
                "path": unknown,
                "additional_data": {
                    "category_name": "Nieznany",
                    "text": "",
                    "category_id": 0,
                },
            }
            for unknown in unknowns
        ]

        for index, directory in enumerate(dirs, start=2):
            with contextlib.suppress(sqlalchemy.exc.IntegrityError):
                c_categories.insert().values(
                    name=directory.name, initial_category=directory.name
                ).execute()

            path_to_text = Path(directory, f"{directory.name}.txt")
            if path_to_text.exists():
                with open(str(path_to_text), "r", encoding="utf-8") as f_input:
                    for line in f_input:
                        wav, transcript = line.strip().split("|")
                        data.append(
                            {
                                "path": Path(directory, "wavs", wav),
                                "additional_data": {
                                    "category_id": index,
                                    "category_name": directory.name,
                                    "text": transcript,
                                },
                            }
                        )
            else:
                path_to_wavs = Path(directory, "wavs")
                data.extend(
                    {
                        "path": Path(wav),
                        "additional_data": {
                            "category_id": index,
                            "category_name": directory.name,
                            "text": "",
                        },
                    }
                    for wav in path_to_wavs.iterdir()
                )

        with ThreadPoolExecutor() as executor:
            for index, i in enumerate(data):
                x = executor.submit(insert_data, index,
                                    i["path"], i["additional_data"])
                x.result()

    total_time = time.time() - start_time
    print(f"Baza ustawiona. Wykorzystany czas: {round(total_time, 2)} sekund")
    return {"Response": "Baza ustawiona"}


@app.route("/finalise", methods=["POST"])
def finalise():
    print(get_methods())
    config = request.get_json()

    config["min_length"] = float(config["min_length"])
    config["max_length"] = float(config["max_length"])

    config["output_sample_rate"] = int(config["output_sample_rate"])
    config["output_channels"] = int(config["output_channels"])

    config["should_format"] = "should_format" in config.keys()
    config["should_filter"] = "should_filter" in config.keys()
    modes = {
        "distinctive": TacotronFinalise.TacotronFinalise,
        "to_one_folder": MultiSpeakerFinalise.MultiSpeakerFinalise,
        "enderal-finalise": EnderalFinalise.EnderalFinalise,
    }

    current_mode = modes[config["export_method"]](config, sql_engine=_engine)
    current_mode.categorise()
    current_mode.provide_transcription()
    if config["should_format"]:
        current_mode.format()
    return {"Message": "Finalizacja: Jest sukces"}


api.add_resource(r_bindings, "/bindings")
api.add_resource(r_texts, "/texts")
api.add_resource(r_categories, "/categories")
api.add_resource(r_audios, "/audios")
api.add_resource(r_status, "/status")
api.add_resource(r_config, "/config")


def create_status_file():
    with open("status.json", "w", encoding="utf-8") as json_output:
        json.dump({"isDatabaseSet": True}, json_output)


if __name__ == "__main__":
    status_file_path = Path("./status.json")

    if not status_file_path.exists():
        setup_database()
        create_status_file()
    app.run(port=5002, debug=True)
