# Informacje
Ta aplikacja ma na celu wesprzeć transkrypt i kategoryzację plików nieuporządkowanych

Obecnie, jest to wczesna alfa i nie wszystko działa jak należy

Do działania wymaga ffmpeg.exe

Ogólnie aplikacja jest uruchamiana w środowisku deweloperskim ReactJS, więc wymaga pakietu react-scripts

# Skróty klawiszowe
F3 - Zatrzymaj / Wznów audio

# To-Do lista
- [x] Zaimplementować trzeci poziom eksportu, czyli wsparcie dla treningu modeli multi_speaker tj. Flowtron lub Uberduck Tacotron
- [ ] Zaimplementować opcjonalne formatowanie plików
- [ ] Zautomatyzować proces wstępnej konfiguracji bazy
- [ ] Dodać wsparcie dla innnych wersji językowych
- [ ] Dodać ciemny styl
- [ ] Przy konfiguracji dodać rekursywne przeszukiwanie folderów z plikami źródłowymi
- [ ] Konfiguracja aplikacji z poziomu interfejsu
- [ ] Zaimplementować skróty klawiszowe
- [ ] Ogólnie dostosować aplikację do ułatwienia rozproszonego developmentu

W ogromnym skrócie, uczynić aplikację user friendly i dev friendly

# Dalekie plany
- [ ] Przetestować framework Electron
- [ ] Przetestować chmurowe systemy bazodanowe
- [ ] Przepisać API na nowo, żeby ułatwić implementację na inne systemy bazodanowe
- [ ] Zaimplementować wsparcie auto-tranksrypcji

# Wstępna konfiguracja bazy
Obecnie aplikacja wymaga ręcznej konfiguracji bazy
1. Należy uruchomić python api.py
2. Pliki muszą być w folderze source
3. Należy wykonać żądanie POST dla endpointa /setup_database

Dla command line Windows:

curl http://localhost:5002/setup_database -X POST

I czekać

# Wsparcie techniczne
Jako iż to wczesna alfa, to też nie udzielam wsparcia technicznego w problemach jakie mogą nastąpić
