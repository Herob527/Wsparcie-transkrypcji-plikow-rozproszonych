from os import remove, listdir
from pathlib import Path
from shutil import rmtree
from multiprocessing import Pool

def _remove(file):
	rmtree(file)

if __name__ == '__main__':
	with Pool(32) as p:
		targets = tuple(Path('./output').iterdir())
		p.map(_remove, targets)
