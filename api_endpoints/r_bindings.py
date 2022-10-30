from tables_definition import c_bindings
from flask_restful import Resource, reqparse
from typing import List
from sqlalchemy import engine, select

class r_bindings(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument(
            "offset", type=int, help="From which point searching will start", default=0
        )
        parser.add_argument(
            "limit", type=int, help="How much rows must be fetched", default=30
        )
        args = parser.parse_args()
        query = select(c_bindings.c).limit(
            args["limit"]).offset(args["offset"])
        res: List[engine.Row] = query.execute().mappings().all()
        return [dict(row) for row in res]