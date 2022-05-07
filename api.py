from urllib.parse import urldefrag, urlparse
from flask import Flask, jsonify, request, make_response
from flask_restful import Resource, Api, reqparse
from pathlib import Path
from flask_cors import CORS
import sqlalchemy
from sqlalchemy import Table, Column, Integer, create_engine, MetaData, String, insert, select, ForeignKey, exc, and_, func, Float, engine
from pprint import pprint
from shutil import copyfile, rmtree, copy
from os import mkdir, stat, getcwd, listdir
from urllib.parse import urlparse
from urllib.parse import parse_qs
from pydub import AudioSegment, exceptions
from multiprocessing import Pool
import time
import json
from typing import List
import logging

logging.basicConfig(filename='api_logs.log', encoding='utf-8')

app = Flask(__name__)
CORS(app)
api = Api(app)

AudioSegment.converter = './ffmpeg.exe'
AudioSegment.ffmpeg = './ffmpeg.exe'

_engine = create_engine('sqlite:///file_category.db',
                       connect_args={'check_same_thread': False},)
metadata = MetaData(_engine)


c_bindings = Table('bindings', metadata,
                   Column('id', Integer, primary_key=True, autoincrement=True, nullable=False),
                   Column('audio_id', Integer, ForeignKey('audio.id', onupdate='CASCADE', ondelete='RESTRICT'), nullable=False),
                   Column('category_id', Integer,ForeignKey('categories.id', onupdate='CASCADE', ondelete='RESTRICT'), nullable=False), 
                   Column('text_id', Integer, ForeignKey('texts.id', onupdate='CASCADE', ondelete='RESTRICT'), nullable=False)
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
                Column('duration_seconds', Float,nullable=False), 
                Column('channels', Integer,nullable=False),
                Column('frame_rate', Integer,nullable=False))

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
        parser.add_argument('offset', type=int, help='From which point searching will start', default=0)
        parser.add_argument('limit', type=int, help='How much rows must be fetched', default=30)
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
        parser.add_argument('offset', type=int, help='From which point searching will start', default=0)
        parser.add_argument('limit', type=int, help='How much rows must be fetched', default=30)
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
            query = c_texts.update().where(c_texts.c.id==data['bindings_id']).values(transcript=data['text'])
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
            query = c_bindings.update().where(c_bindings.c.id==data['bindings_id']).values(category_id=data['category_id'])
            try:
                conn.execute(query)
            except Exception as e:
                print(e.args)
                return jsonify({"Error": f"Błąd w czasie aktualizacji. Treść: {e.args}"})
        return jsonify({"Success": "Kategoria pomyślnie zaktualizowana"})

class audios(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('offset', type=int, help='From which point searching will start', default=0)
        parser.add_argument('limit', type=int, help='How much row must be fetched', default=30)
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
    

    frame_rate, channels, duration_seconds = [audio.frame_rate, audio.channels, round(audio.duration_seconds,4)]
    file_name = path.parts[-1]
    
    with _engine.connect() as conn:
        c_texts.insert({"id": index, "transcript": ""}).execute()
        c_audio.insert({"id": index, "name": file_name, "channels": channels, "duration_seconds": duration_seconds, "frame_rate": frame_rate}).execute()
        c_bindings.insert({"id": index, "audio_id":index, "text_id": index, "category_id":0}).execute()
        

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
        with Pool(6) as pool:
            pool.starmap(insert_data, x)
        c_categories.insert({"id": 0, "name":"Nieznane"}).execute()            
    t1 = time.time() - t0
    print(f'Baza ustawiona. Wykorzystany czas: {round(t1,2)} sekund')
    return {"Response": "Baza ustawiona"}


@app.route('/finalise', methods=['POST'])
def finalise():
    source = Path('./public/source')
    output = Path('./output')
    try:
        rmtree(output)
    except FileNotFoundError:
        pass
    output.mkdir(exist_ok=True)
    data = request.get_json()
    categorise_level = data['categoriseLevel']
    
    def categorise_divide():
        with _engine.connect():
            general_query = select(c_bindings, c_audio, c_categories, c_texts).join(c_audio).join(c_categories).join(c_texts)
            general_res = general_query.execute().mappings().all()

            category_query = select(c_categories)
            cat_res = category_query.execute().mappings().all()
            category_dirs = [Path(output, i['name']) for i in cat_res]

            # Creating clear lists yet to be filled with transcription
            for i in cat_res:
                category_path = Path(output, i['name'])
                category_path.mkdir(exist_ok=True)
                open(f'{category_path}/list.txt', 'w', encoding='utf-8').close()

            # Copying files to assigned categories and filling created lists with transcription
            for i in general_res:
                name = i['name']
                category_name = i['name_1']
                text = i['transcript']
                path = Path(output, category_name, 'wavs')
                path.mkdir(parents=True ,exist_ok=True)
                with open(f'{output}/{category_name}/list.txt', 'a', encoding='utf-8') as transcription:
                    file_name = name.replace(f'{category_name.lower()}/','')
                    transcription.write(f"{file_name}|{text}\n")
                copy(f'{source}/{name}', f'{path}')

            for i in category_dirs:
                path_to_list = Path(i) 
                with open(f'{path_to_list}/list.txt', 'r', encoding='utf-8') as input, \
                open(f'{path_to_list}/list_train.txt','w', encoding='utf-8') as train_output, \
                open(f'{path_to_list}/list_val.txt', 'w' ,encoding='utf-8') as val_output:
                    all_files = input.readlines()
                    # Declaration of number proportions 
                    amount_of_files = len(all_files)
                    validation_share = 10
                    val_amount = amount_of_files // validation_share
                    train_amount = amount_of_files - val_amount

                    # Dividing dataset to train and validation sets
                    train_files = all_files[val_amount: val_amount + train_amount]
                    val_files = all_files[:val_amount]
                    for i in train_files:
                        train_output.write(f'{i}')

                    for i in val_files:
                        val_output.write(f'{i}')
        return "0"

    def categorise_format_divide():
        return "1"
    
    def flowtron():
        return "2"
    _bindings = {
        "0": categorise_divide,
        "1": categorise_format_divide,
        "2": flowtron,
    }
    choice = _bindings[categorise_level]()
    return choice


api.add_resource(bindings, '/bindings')
api.add_resource(texts, '/texts')
api.add_resource(categories, '/categories')
api.add_resource(audios, '/audios')

if __name__ == '__main__':
    app.run(port=5002, debug=True)
