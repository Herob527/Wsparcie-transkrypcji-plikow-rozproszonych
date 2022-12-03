from tables_definition import c_texts, c_bindings, c_categories
from flask_restful import Resource, reqparse
from typing import List
from sqlalchemy import engine, select
from flask import jsonify, request


class r_texts(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument(
            "offset", type=int, help="From which point searching will start", default=0
        )
        parser.add_argument(
            "limit", type=int, help="How much rows must be fetched", default=30
        )
        args = parser.parse_args()
        query = (
            select(c_texts.c)
            .select_from(c_bindings.join(c_texts))
            .limit(args["limit"])
            .offset(args["offset"])
            .order_by(c_categories.c.name)
        )
        res: List[engine.Row] = query.execute().mappings().all()
        return [dict(row) for row in res]

    def patch(self):
        data = request.get_json()
        print(data)
        query = (
            c_texts.update()
            .where(c_texts.c.id == data["bindings_id"])
            .values(transcript=data["text"])
        )
        try:
            query.execute()
        except Exception as e:
            print(e.args)
            return jsonify({"Error": f"Błąd w czasie aktualizacji. Treść: {e.args}"})
        return jsonify({"Success": "Tekst zaktualizowany pomyślnie"})
