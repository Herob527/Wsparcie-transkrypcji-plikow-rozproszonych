from flask import Flask, render_template
import requests
from multiprocessing import Pool
from json import dumps, load, dump
import os
from functools import partial
app = Flask(__name__)

app.static_folder = 'static'
api_url = 'http://localhost:5002'

with open("status.json", "r") as status_json:
    project_status = load(status_json)
    if not project_status["IsDatabaseSet"]:
        response = requests.post(f'{api_url}/setup_database').json()
        if response['Response'] == "Baza ustawiona":
            project_status["IsDatabaseSet"] = True
            with open("status.json", "w") as status_json_write:
                dump(project_status,status_json_write)

        

@app.route('/')
def render_main():
    r = requests.get
    endpoints = [f'{api_url}/texts',
                 f'{api_url}/bindings',
                 f'{api_url}/audios',
                 f'{api_url}/categories',
                 f'{api_url}/get_size'
                 ]
    with Pool(5) as pool:
        res = [i.json() for i in pool.map(requests.get, endpoints)]
        texts, bindings, audios,categories, length = res
    data = {
        "texts": texts,
        "bindings": bindings,
        "audios": audios,
        "categories":categories,
        "length": length
    }
    data_to_pug_template(data, 'templates/index2.pug', 'templates')
    return render_template('index2.html')


def data_to_pug_template(data: dict, input_path: str, output_path: str):
    open("options.json", "w", encoding="utf8").write(dumps(data, ensure_ascii=False))
    command = f"pug {input_path} -o {output_path} -P -O options.json"
    open("command.txt", 'w', encoding='utf-8').write(command)
    x = os.system(command)
    print(x)


if __name__ == '__main__':
    app.run(debug=True)
