
from dataclasses import dataclass
from math import floor
from pprint import pprint
from flask import Flask, jsonify, request, make_response
from flask_restful import Resource, Api, reqparse
from pathlib import Path
from flask_cors import CORS
import sqlalchemy
from sqlalchemy import Table, Column, Integer, create_engine, MetaData, String, insert, select, ForeignKey, exc, and_, func, Float, engine
from random import shuffle
from shutil import rmtree, copy
from pydub import AudioSegment, exceptions
from multiprocessing import Pool, cpu_count
import time
import json
from typing import List
import logging
from ffmpeg import FFmpeg
import asyncio

logging.basicConfig(filename='api_info.log', encoding='utf-8', filemode='a', level=logging.INFO)
logging.basicConfig(filename='api_errors.log', encoding='utf-8', filemode='a', level=logging.ERROR)

app = Flask(__name__)
CORS(app)
api = Api(app)

_engine = create_engine('sqlite:///file_category.db',
                        connect_args={'check_same_thread': False},)
metadata = MetaData(_engine)


c_bindings = Table('bindings', metadata,
                   Column('id', Integer, primary_key=True,
                          autoincrement=True, nullable=False),
                   Column('audio_id', Integer, ForeignKey(
                       'audio.id', onupdate='CASCADE', ondelete='RESTRICT'), nullable=False),
                   Column('category_id', Integer, ForeignKey(
                       'categories.id', onupdate='CASCADE', ondelete='RESTRICT'), nullable=False),
                   Column('text_id', Integer, ForeignKey(
                       'texts.id', onupdate='CASCADE', ondelete='RESTRICT'), nullable=False)
                   )
c_categories = Table(
    'categories', metadata,
    Column('id', Integer, primary_key=True, nullable=False),
    Column('name', String, nullable=False, unique=True)
)

c_texts = Table('texts', metadata,
                Column('id', Integer, primary_key=True),
                Column('transcript', String, default=None),
                )

c_audio = Table('audio', metadata,
                Column('id', Integer, primary_key=True),
                Column('name', String, nullable=False),
                Column('duration_seconds', Float, nullable=False),
                Column('channels', Integer, nullable=False),
                Column('frame_rate', Integer, nullable=False))


class config(Resource):
    def get(self):
        pass

    def patch(self):
        pass


class status(Resource):
    def get(self):
        pass

    def patch(self):
        pass


class bindings(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument(
            'offset', type=int, help='From which point searching will start', default=0)
        parser.add_argument('limit', type=int,
                            help='How much rows must be fetched', default=30)
        args = parser.parse_args()
        with _engine.connect() as conn:
            query = \
                select(c_bindings.c)  \
                .limit(args['limit']).offset(args['offset'])
            res: List[engine.Row] = conn.execute(query).mappings().all()
            return [dict(row) for row in res]


class texts(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument(
            'offset', type=int, help='From which point searching will start', default=0)
        parser.add_argument('limit', type=int,
                            help='How much rows must be fetched', default=30)
        args = parser.parse_args()
        with _engine.connect() as conn:
            query = \
                select(c_texts.c)   \
                .select_from(c_bindings.join(c_texts))  \
                .limit(args['limit']).offset(args['offset'])
            res: List[engine.Row] = conn.execute(query).mappings().all()
            return [dict(row) for row in res]

    def patch(self):
        data = request.get_json()
        with _engine.connect() as conn:
            query = c_texts.update().where(
                c_texts.c.id == data['bindings_id']).values(transcript=data['text'])
            try:
                conn.execute(query)
            except Exception as e:
                print(e.args)
                return jsonify({"Error": f"Błąd w czasie aktualizacji. Treść: {e.args}"})
        return jsonify({"Success": "Tekst zaktualizowany pomyślnie"})


class categories(Resource):
    def get(self):
        with _engine.connect() as conn:
            query = select(c_categories.c).order_by(c_categories.c.name)
            res: List[engine.Row] = conn.execute(query).mappings().all()
            return [dict(row) for row in res]

    def post(self):
        data = request.get_json()
        with _engine.connect() as conn:
            query = c_categories.insert().values(name=data['category_name'])
            try:
                conn.execute(query)
            except sqlalchemy.exc.IntegrityError:
                return jsonify({"Error": f"Kategoria {data['category_name']} już istnieje"})
            except Exception as e:
                return jsonify({"Error": f"Nieznany błąd: {e.args[0]}"})
        return jsonify({"Success": f"Kategoria {data['category_name']} została pomyślnie dodana"})

    def patch(self):
        data = request.get_json()
        with _engine.connect() as conn:
            query = c_bindings.update().where(
                c_bindings.c.id == data['bindings_id']).values(category_id=data['category_id'])
            try:
                conn.execute(query)
            except Exception as e:
                print(e.args)
                return jsonify({"Error": f"Błąd w czasie aktualizacji. Treść: {e.args}"})
        return jsonify({"Success": "Kategoria pomyślnie zaktualizowana"})


class audios(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument(
            'offset', type=int, help='From which point searching will start', default=0)
        parser.add_argument('limit', type=int,
                            help='How much row must be fetched', default=30)
        args = parser.parse_args()
        with _engine.connect() as conn:
            query = \
                select(c_audio.c) \
                .limit(args['limit']).offset(args['offset'])
            res: List[engine.Row] = conn.execute(query).mappings().all()
            return [dict(row) for row in res]

    def patch(self):
        pass


@app.route('/get_size', methods=['GET'])
def get_size():
    res = select([func.count()]).select_from(c_bindings).execute()
    return jsonify(dict(res.mappings().all()[0]))


def insert_data(index: int, path: Path) -> None:
    print(path)
    try:
        audio = AudioSegment.from_file(path)
    except exceptions.CouldntDecodeError as e:
        logging.error(f"Couldn't decode audio. Path to audio: {path}")
        return
    except FileNotFoundError as e:
        logging.error(f"Couldn't find file. Path to audio: {path}")
        return

    frame_rate, channels, duration_seconds = [
        audio.frame_rate, audio.channels, round(audio.duration_seconds, 4)]
    file_name = path.parts[-1]

    with _engine.connect() as conn:
        c_texts.insert({"id": index, "transcript": ""}).execute()
        c_audio.insert({"id": index, "name": file_name, "channels": channels,
                       "duration_seconds": duration_seconds, "frame_rate": frame_rate}).execute()
        c_bindings.insert({"id": index, "audio_id": index,
                          "text_id": index, "category_id": 0}).execute()


@app.route('/setup_database', methods=['POST'])
def setup_database():
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
    t0 = time.time()
    with _engine.connect():
        x = tuple(enumerate(Path('./source').iterdir()))
        with Pool(cpu_count()) as pool:
            pool.starmap(insert_data, x)
        c_categories.insert({"id": 0, "name": "Nieznane"}).execute()
        c_categories.insert({"id": 1, "name": "Odpad"}).execute()
    t1 = time.time() - t0
    print(f'Baza ustawiona. Wykorzystany czas: {round(t1,2)} sekund')
    return {"Response": "Baza ustawiona"}


def export_audio_segment(path: Path, should_convert_multi_channel: bool = False):
    audio = AudioSegment.from_file(path)
    if not should_convert_multi_channel and audio.channels > 1:
        multi_channel_path = Path(*path.parts[:-2], 'multi_channel')
        multi_channel_path.mkdir(exist_ok=True)
        audio.export(Path(multi_channel_path, path.name))
        return
    audio.export(path, format='wav', parameters=[
                 '-ac', '1', '-ar', '22050', '-y'])


class BaseFinalise:
    """
    Base class containing methods to perform finalisation of project.
    That is:
        1. Export files to given category
        2. Provide transcription
        3. Optionally, format exported files.
    """

    def __init__(self, configuration: dict):
        """
        configuration: dict 
            Contains data prompted by user. In the future, it'll be based purely on config.json
        """
        self.general_query = select(c_bindings, c_audio, c_categories, c_texts) \
            .join(c_audio).join(c_categories).join(c_texts) \
            .where(c_categories.c.name != 'Nieznane').where(c_categories.c.name != 'Odpad').where(c_texts.c.transcript != '')

        self.general_data: List[dict] = self.general_query.order_by(
            c_audio.c.name).execute().mappings().all()
        self.configuration = configuration
        self.source = Path('./source')
    def categorise(self):
        """
            This method aims to export files to categories basing on the data from database.
        """
        pass

    def provide_transcription(self):
        """
            This method aims to provide transcription for each category and correct small errors like the lack of dot at the end.
            Run after self.categorise().
        """
        pass

    def format(self):
        """
            This method formats files if it's prompted by user.
            Run after self.categorise().
        """
        pass


class TacotronFinalise(BaseFinalise):
    """
    This class implements finalisation of the project optimised to train single Tacotron models
    """
    def __init__(self, configuration: dict):
        BaseFinalise.__init__(self, configuration)
        self.output = Path('./tacotron_output')
        if self.output.exists():
            rmtree(self.output)

    def categorise(self):
        category_query = self.general_query.group_by(c_categories.c.name)
        category_data = category_query.execute().mappings().all()
        
        for i in category_data:
            category_path = Path(self.output, i['name_1'])
            wavs_path = Path(category_path, 'wavs')
            audio_channels = i['channels']
            category_path.mkdir(exist_ok=True, parents = True)
            wavs_path.mkdir(exist_ok=True, parents = True)
        for i in self.general_data:
            name = i['name'].strip()
            category_name = i['name_1'].strip()
            audio_length = i['duration_seconds']
            output_file_path = Path(self.output, category_name, 'wavs')
            is_invalid_format = audio_length > self.configuration['maximum_length'] or audio_length < self.configuration['minimum_length'] or audio_channels != 1 
            if not is_invalid_format:
                path_for_invalid_length = Path(self.output, category_name, 'invalid_length')
                path_for_invalid_length.mkdir(exist_ok=True)
                copy(f'{self.source}/{name}', f'{path_for_invalid_length}')    
                continue
            copy(f'{self.source}/{name}', f'{output_file_path}')

    def provide_transcription(self):
        for i in self.general_data:
            audio_length = i['duration_seconds']
            audio_channels = i['channels']
            category_name = i['name_1']
            category_path = Path(self.output, category_name)
            transcription_path = Path(category_path, 'list.txt')
            is_invalid_format = audio_length > self.configuration['maximum_length'] or audio_length < self.configuration['minimum_length'] or audio_channels != 1 
            if is_invalid_format:
                transcription_path = Path(category_path, 'invalid_list.txt')
            with open(transcription_path, "a", encoding="utf-8") as output:
                name = i['name'].strip()
                if not name.endswith('.wav'):
                    name += '.wav'
                line = i['transcript'].strip()
                if not line.endswith((".","?","!")):
                    line += line.join(".")
                output.write(f"{name}|{line}\n")      

    def format(self):
        category_query = self.general_query.group_by(c_categories.c.name)
        category_data = category_query.execute().mappings().all()
        for category in category_data:
            wavs_path = Path(self.output, category['name_1'], 'wavs')
            temp_folder = Path(wavs_path, 'temp')
            temp_folder.mkdir()
            audios = (i for i in wavs_path.iterdir() if i.is_file())
            for audio in audios:
                output_name = f'{temp_folder}/{audio.name}' if audio.name.endswith('.wav') else f'{temp_folder}/{audio.name}.wav'
                current_file = FFmpeg().option('y').input(audio).output(output_name, ar=22050, ac=1)

                @current_file.on('stderr')
                def on_stderr(line):
                    #print('stderr:', line)
                    pass

                @current_file.on('error')
                def on_error(code):
                    print('Error:', code, f' on file: {audio}')
                @current_file.on('completed')
                def on_completed():
                    audio.unlink()
                    print(f'Completed formating file: {audio}')
                asyncio.run(current_file.execute())
            
            for audio in temp_folder.iterdir():
                copy(audio, wavs_path)
            rmtree(temp_folder)


class MultiSpeakerFinalise(BaseFinalise):
    """
    This class implements finalisation of the project optimised to train multispeaker models like Flowtron or Uberduck Pipeline Tacotron
    """
    def __init__(self, configuration: dict):
        self.output = Path('./multispeaker_output')
        if self.output.exists():
            rmtree(self.output) 
        self.output.mkdir()
        BaseFinalise.__init__(self, configuration)
        self.model_info = select(c_categories.c.id, c_categories.c.name,
                                       func.round(func.sum(c_audio.c.duration_seconds) / 60, 2).label('n_files')) \
            .select_from(c_audio) \
            .join(c_bindings).join(c_categories) \
            .join(c_texts).group_by(c_bindings.c.category_id) \
            .where(c_texts.c.transcript != '').where(c_categories.c.name not in ['Nieznane', 'Odpad']).execute().mappings().all()

    def categorise(self):
        wavs_path = Path(self.output, 'wavs')
        invalid_wavs_path = Path(self.output, 'invalid_wavs') 
        wavs_path.mkdir()
        invalid_wavs_path.mkdir() 
        
        for i in self.general_data:
            current_folder = wavs_path
            audio_length = i['duration_seconds']
            audio_channels = i['channels']
            is_invalid_format = audio_length > self.configuration['maximum_length'] or audio_length < self.configuration['minimum_length'] or audio_channels != 1
            if is_invalid_format:
                current_folder = invalid_wavs_path
            output_name = f"{i['category_id']}_{i['name']}"
            source_path = Path('source', i['name'])
            output_path = Path(current_folder, output_name)
                
            copy(source_path, output_path)
            

    def provide_transcription(self):
        data_path = Path(self.output, 'texts')
        data_path.mkdir()
        with open(Path(data_path, 'model_info.json'), "w", encoding='utf-8') as model_info_output:
            actors = [dict(i) for i in self.model_info]
            output_data = {
                "name":"", 
                "n_speakers": len(actors),
                "tacotron": "",
                "train_list": "",
                "actors": actors
            }
            json.dump(output_data, model_info_output)
        existing_data = [i for i in self.general_data if Path(self.output, 'wavs', f"{i['category_id']}_{i['name']}").exists()]
        validation_data_amount = len(existing_data) // 10
        validation_data = existing_data[:validation_data_amount:]
        training_data = existing_data[validation_data_amount:]
        with open(Path(data_path, 'list_train.txt'),"w", encoding='utf-8') as train_output, \
             open(Path(data_path, 'list_val.txt'),"w", encoding='utf-8') as val_output:
            for entry in training_data:
                name, category_id, transcript = entry['name'], entry['category_id'], entry['transcript']
                if self.configuration['should_format']:
                    name += '.wav'
                train_output.write(f"wavs/{category_id}_{name}|{transcript}|{category_id}\n")
            for entry in validation_data:
                name, category_id, transcript = entry['name'], entry['category_id'], entry['transcript']
                if self.configuration['should_format']:
                    name += '.wav'
                val_output.write(f"wavs/{category_id}_{name}|{transcript}|{category_id}\n")

    def format(self):
        temp_folder = Path(self.output, 'wavs', 'temp')
        wavs_path = Path(self.output, 'wavs')
        temp_folder.mkdir()
        audios = [i for i in wavs_path.iterdir() if i.is_file()] 
        for audio in audios:
            output_name = f'{temp_folder}/{audio.name}' if audio.name.endswith('.wav') else f'{temp_folder}/{audio.name}.wav'
            current_file = FFmpeg().option('y').input(audio).output(output_name, ar=22050, ac=1)
 
            @current_file.on('stderr')
            def on_stderr(line):
                #print('stderr:', line)
                pass

            @current_file.on('error')
            def on_error(code):
                print('Error:', code, f' on file: {audio}')
            @current_file.on('completed')
            def on_completed():
                audio.unlink()
                print(f'Completed formating file: {audio}')
            asyncio.run(current_file.execute())
        
        for audio in temp_folder.iterdir():
            copy(audio, wavs_path)
        rmtree(temp_folder)       

@app.route('/finalise', methods=['POST'])
def finalise_2():
    data = request.get_json()
    print(data)
    data['minimum_length'] = int(data['minimum_length'])
    data['maximum_length'] = int(data["maximum_length"])
    modes = {
        "tacotron": TacotronFinalise,
        "multispeaker": MultiSpeakerFinalise 
    }
    x = modes[data["mode"]](data)
    x.categorise()
    x.provide_transcription()
    if data['should_format']:
        x.format()
    return {"Message": "Finalizacja: Jest sukces"}

api.add_resource(bindings, '/bindings')
api.add_resource(texts, '/texts')
api.add_resource(categories, '/categories')
api.add_resource(audios, '/audios')
api.add_resource(status, '/status')
api.add_resource(config, '/config')

if __name__ == '__main__':
    status_file_path = Path('./status.json')
    if not status_file_path.exists():
        setup_database()
        with open('status.json', 'w', encoding='utf-8') as json_output:
            json.dump({"isDatabaseSet": True}, json_output)
    app.run(port=5002, debug=True)
