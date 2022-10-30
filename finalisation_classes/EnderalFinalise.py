from pprint import pprint
from finalisation_classes.BaseFinalise import BaseFinalise
from dataclasses import dataclass
from pathlib import Path
from tables_definition import *
from sqlalchemy import select, func
from typing import List
from sqlalchemy.sql import text
from sqlalchemy.engine import Engine
from collections import Counter

@dataclass
class EnderalFinalise(BaseFinalise):
    name = "enderal-finalise"
    ux_name = "Finalizacja pod Enderal"

    def __init__(self, configuration: dict, sql_engine: Engine):
        with sql_engine.connect() as con:
            self.general_query = con.execute(
                text(
                    """
                    with audio_text as (
                        select audio.name as a_name, t2.transcript
                        from audio
                                join bindings b2 on audio.id = b2.audio_id
                                join texts t2 on b2.text_id = t2.id
                    ),
                        category_audio as (
                            select distinct audio.name as a_name, c2.name as c_name
                            from audio
                                    join bindings b2 on audio.id = b2.audio_id
                                    join categories c2 on b2.category_id = c2.id
                            where c_name not in ('1Odpad', 'Nieznane')
                            group by audio.name
                        )
                    select distinct a.name as name,ca.c_name, at.transcript
                    from audio a
                            join audio_text at on a.name = at.a_name
                            join category_audio as ca on ca.a_name = a.name
                    order by a.name desc;
                    """
                )
            )
            self.characters_card_query = con.execute(
                text(
                    """
                    with count_category_entries as (
                        select name, count(*) as entries_count from bindings bd join categories c on c.id = bd.category_id group by c.name
                    )

                    select distinct categories.name, entries_count as ilosc_w_kategorii from categories
                        join bindings b on categories.id = b.category_id
                        join audio a on a.id = b.audio_id
                        join texts t on b.text_id = t.id
                        join count_category_entries cce on categories.name = cce.name
                    where categories.name not in ('1Odpad', 'Nieznane')
                    order by entries_count desc
                    """
                )
            )
            self.general_data = sorted([*self.general_query], key=lambda d: d['c_name'])
            self.characters_card_data = [*self.characters_card_query]

    def filter(self):
        pass

    def categorise(self):
        pass

    def provide_transcription(self):
        with open("texts.txt", "w", encoding="utf-8") as f_texts_output, open("karty_postaci.csv", "w", encoding="utf-8") as f_chars_output:
            current_category = ""
            f_chars_output.write('Nazwa_postaci;Ilość_tekstów\n')
            for i in self.general_data:
                file_name, category_name, transcript = i
                
                if current_category != category_name:
                    f_texts_output.write(f'\n{category_name}\n')
                    f_texts_output.write("-" * 20)
                    f_texts_output.write("\n")
                    current_category = category_name
                f_texts_output.write(f'{file_name}|{transcript}\n')
            for j in self.characters_card_data:
                category_name, count = j
                f_chars_output.write(f'{category_name};{count}\n')

    def format(self):
        pass
