from pathlib import Path
from shutil import rmtree
from tables_definition import c_audio, c_bindings, c_categories, c_texts
from sqlalchemy import select, func
from sqlalchemy.engine import Engine
from shutil import copy
import json
import asyncio
from ffmpeg import FFmpeg
from typing import List
from dataclasses import dataclass


@dataclass
class BaseFinalise:
    """
    Base class containing methods to perform finalisation of project.
    That is:
            1. Export files to given category
            2. Provide transcription
            3. Optionally, format exported files.
    """

    def __init__(self, configuration: dict, sql_engine: Engine):
        """
        configuration: dict
                Contains data prompted by user. In the future, it'll be based purely on config.json
        """
        
        """
            Name on page
        """
        self.name: str
        
        """
            Name visible to user
        """
        self.ux_name: str
        self.general_query = (
            select(c_bindings, c_audio, c_categories, c_texts)
            .join(c_audio)
            .join(c_categories)
            .join(c_texts)
            .where(c_categories.c.name != "Nieznane")
            .where(c_categories.c.name != "Odpad")
            .where(c_texts.c.transcript != "")
        )

        self.general_data: List[dict] = (
            self.general_query.order_by(c_audio.c.name).execute().mappings().all()
        )
        self.configuration = configuration
        self.source = Path("./source")
        self.data = []
        
    def filter(self):
        """
        This method filters out entries based on form input.
        If invalid_dir is empty, invalid entries will be ignored
        Else, invalid entries will be moved to specified directory
        """
        pass
    def categorise(self):
        """
        This method aims to export files to categories basing on the data from database.
        Run after self.filter()
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

