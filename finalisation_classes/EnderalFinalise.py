from finalisation_classes.BaseFinalise import BaseFinalise
from dataclasses import dataclass
from pathlib import Path
from tables_definition import *
from sqlalchemy import select, func
from typing import List
from sqlalchemy.sql import text
from sqlalchemy.engine import Engine


@dataclass
class EnderalFinalise(BaseFinalise):
    name = "enderal-finalise"
    ux_name = "Finalizacja pod Enderal"

    def __init__(self, configuration: dict, sql_engine: Engine):
        with sql_engine.connect() as con:
            self.general_query = con.execute(
                text(
                    """
                    with count_category_entries as (
                        select name, count(*) as entries_count from bindings bd join categories c on c.id = bd.category_id group by c.name
                    )

                    select categories.name, a.name, transcript, entries_count as ilosc_w_kategorii from categories
                        join bindings b on categories.id = b.category_id
                        join audio a on a.id = b.audio_id
                        join texts t on b.text_id = t.id
                        join count_category_entries cce on categories.name = cce.name
                    where categories.name not in ('1Odpad', 'Nieznane')
                    order by ilosc_w_kategorii desc, categories.name                 
                    """
                )
            )
            self.general_data = [*self.general_query]

    def filter(self):
        pass

    def categorise(self):
        pass

    def provide_transcription(self):
        with open("texts.txt", "w", encoding="utf-8") as f_texts_output, open("karty_postaci.csv", "w", encoding="utf-8") as f_chars_output:
            current_category = ""
            f_chars_output.write('Nazwa_postaci;Ilość_tekstów\n')
            for i in self.general_data:
                category_name, file_name, transcript, count = i
                
                if current_category != category_name:
                    f_texts_output.write(f'\n{category_name}\n')
                    f_texts_output.write("-" * 20)
                    f_texts_output.write("\n")
                    f_chars_output.write(f'{category_name};{count}\n')
                    current_category = category_name
                f_texts_output.write(f'{file_name}|{transcript}\n')

    def format(self):
        pass
