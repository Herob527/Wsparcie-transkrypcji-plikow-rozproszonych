from sqlalchemy import (
    Table,
    Integer,
    Column,
    ForeignKey,
    String,
    Float,
    create_engine,
    MetaData,
)
import json
with open("./config.json","r", encoding='utf8') as json_input:
    config_api = json.load(json_input)['apiConfig']
    
_engine = create_engine(
    config_api["databaseConnectionConfig"]["connectionString"],
    connect_args={"check_same_thread": False},
)
metadata = MetaData(_engine)

c_bindings = Table(
    "bindings",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True, nullable=False),
    Column(
        "audio_id",
        Integer,
        ForeignKey("audio.id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
    ),
    Column(
        "category_id",
        Integer,
        ForeignKey("categories.id", onupdate="CASCADE", ondelete="SET DEFAULT"),
        nullable=False,
        default=0,
    ),
    Column(
        "text_id",
        Integer,
        ForeignKey("texts.id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
    ),
)
c_categories = Table(
    "categories",
    metadata,
    Column("id", Integer, primary_key=True, nullable=False, autoincrement=True),
    Column("name", String, nullable=False, unique=True)
)

c_texts = Table(
    "texts",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("transcript", String, default=None),
)

c_audio = Table(
    "audio",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String, nullable=False),
    Column("directory", String, default=None),
    Column("duration_seconds", Float, nullable=False),
    Column("channels", Integer, nullable=False),
    Column("frame_rate", Integer, nullable=False),
)
