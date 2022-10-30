
from tables_definition import *
from flask_restful import Resource, reqparse
from sqlalchemy import (
    select,
    engine,
)
from typing import List

class r_audios(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument(
            "offset", type=int, help="From which point searching will start", default=0
        )
        parser.add_argument(
            "limit", type=int, help="How much row must be fetched", default=30
        )
        args = parser.parse_args()
        query = select(c_audio.c).limit(
            args["limit"]).offset(args["offset"])
        res: List[engine.Row] = query.execute().mappings().all()
        return [dict(row) for row in res]

    def patch(self):
        pass