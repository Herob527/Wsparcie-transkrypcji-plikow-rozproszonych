
from tables_definition import *
from flask import jsonify, request
from flask_restful import Resource
import sqlalchemy
from sqlalchemy import (
    select,
    engine,
)
from typing import List
class r_categories(Resource):
    def get(self):
        query = select(c_categories.c).order_by(c_categories.c.name)
        res: List[engine.Row] = query.execute().mappings().all()
        return [dict(row) for row in res]

    def post(self):
        data = request.get_json()
        query = c_categories.insert().values(name=data["category_name"])
        try:
            query.execute()
        except sqlalchemy.exc.IntegrityError:
            return jsonify(
                {"Error": f"Kategoria {data['category_name']} już istnieje"}
            )
        except Exception as e:
            return jsonify({"Error": f"Nieznany błąd: {e.args[0]}"})
        return jsonify(
            {"Success": f"Kategoria {data['category_name']} została pomyślnie dodana"}
        )

    def delete(self):
        category_id = int(request.get_json())
        query = (
            c_bindings.update()
            .where(c_bindings.c.category_id == category_id)
            .values(category_id=0)
        )
        delete_query = c_categories.delete(
            c_categories.c.id == category_id)
        try:
            query.execute()
            delete_query.execute()
        except Exception as e:
            print(e.args)
            return jsonify({"Error": f"Błąd w czasie usuwania. Treść: {e.args}"})
        return jsonify({"Success": "Usuwanie się powiodło"})

    def patch(self):
        data = request.get_json()
        print(data)
        query = (
            c_categories.update()
            .where(c_categories.c.id == data["category_id"])
            .values(name=data["new_value"])
        )
        try:
            query.execute()
        except Exception as e:
            print(e.args)
            return jsonify(
                {"Error": f"Błąd w czasie aktualizacji. Treść: {e.args}"}
            )
        return jsonify({"Success": "Kategoria pomyślnie zaktualizowana"})