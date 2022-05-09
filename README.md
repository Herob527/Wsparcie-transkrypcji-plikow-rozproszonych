# Informacje
Ta aplikacja ma na celu wesprzeć transkrypt i kategoryzację plików nieuporządkowanych
Obecnie, jest to wczesna alfa i nie wszystko działa jak należy

# To-Do lista
1. Zaimplementować trzeci poziom eksportu, czyli wsparcie dla treningu modeli multi_speaker tj. Flowtron lub Uberduck Tacotron
2. Zautomatyzować proces wstępnej konfiguracji bazy
3. Dodać wsparcie dla innnych wersji językowych
4. Dodać ciemny styl
5. Przy konfiguracji dodać rekursywne przeszukiwanie folderów z plikami źródłowymi
6. Konfiguracja aplikacji z poziomu interfejsu

# Dalekie plany
1. Przetestować framework Electron
2. Przetestować chmurowe systemy bazodanowe
3. Przepisać API na nowo, żeby ułatwić implementację na inne systemy bazodanowe
4. Zaimplementować wsparcie auto-tranksrypcji

# Konfiguracja bazy
Obecnie aplikacja wymaga ręcznej konfiguracji bazy
1. Należy uruchomić python api.py
2. Pliki muszą być w folderze source
3. Należy wykonać żądanie POST dla endpointa /setup_database
Dla CMD
curl http://localhost:5002/setup_database -X POST

