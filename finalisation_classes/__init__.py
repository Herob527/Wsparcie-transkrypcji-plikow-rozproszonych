from pathlib import Path

def get_methods():
    return [i for i in Path('finalisation_classes').iterdir() if i.name not in ['BaseFinalise.py', '__init__.py', '__pycache__']]