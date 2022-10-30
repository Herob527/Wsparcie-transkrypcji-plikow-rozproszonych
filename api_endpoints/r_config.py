import json
from flask_restful import Resource

class r_config(Resource):
    def get(self):
        with open("config.json", "r", encoding="utf-8") as output:
            return json.load(output)

    def patch(self):
        pass