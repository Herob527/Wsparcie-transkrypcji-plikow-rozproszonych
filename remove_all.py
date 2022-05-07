from os import remove, listdir
from pathlib import Path

from multiprocessing import Pool

def _remove(file):
	remove(file)

if __name__ == '__main__':
	with Pool(32) as p:
		targets = tuple(Path('./source').iterdir())
		p.map(_remove, targets)
