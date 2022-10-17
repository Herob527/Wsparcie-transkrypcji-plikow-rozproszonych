# Informacje
Ta aplikacja ma na celu wesprzeć transkrypt i kategoryzację plików nieuporządkowanych

Obecnie, jest to wczesna alfa i nie wszystko działa jak należy

Do działania wymaga ffmpeg.exe

Ogólnie aplikacja jest uruchamiana w środowisku deweloperskim ReactJS, więc wymaga pakietu react-scripts

# Skróty klawiszowe
F2 - Zatrzymaj / Wznów audio

# To-Do lista
- [x] Zaimplementować ~~trzeci~~ drugi poziom eksportu, czyli wsparcie dla treningu modeli multi_speaker tj. Flowtron lub Uberduck Tacotron
- [x] Zautomatyzować proces wstępnej konfiguracji bazy (obecnie istnieje on w oparciu o istnienie pliku status.json)
- [x] Zaimplementować opcjonalne formatowanie plików przy finalizacji
- [ ] Dodać wsparcie dla innnych wersji językowych
- [ ] Dodać ciemny styl
- [x] Rekursywne przeszukiwanie folderów (w folderach szuka w folderze **wavs**)
- [x] Więcej opcji finalizacji (osobny panel) - Wymaga zmian w API
- [x] Konfiguracja aplikacji z poziomu interfejsu - Alfa
- [x] Zaimplementować skróty klawiszowe
- [ ] Ogólnie dostosować aplikację do ułatwienia rozproszonego developmentu
- [ ] Naprawić problem z wyciekiem pamięci

W ogromnym skrócie, uczynić aplikację user friendly i dev friendly

# Dalekie plany
- [ ] Przetestować framework Electron
- [ ] Przetestować chmurowe systemy bazodanowe
- [ ] Przepisać API na nowo, żeby ułatwić implementację na inne systemy bazodanowe
- [ ] Zaimplementować wsparcie auto-tranksrypcji

# Wsparcie techniczne
Jako iż to wczesna alfa, to też nie udzielam wsparcia technicznego w problemach jakie mogą nastąpić

# Instrukcja użytkowania
1. Tworzymy plik source
2. Tworzymy plik source w folderze public
3. Kopiujemy pliki do source i public
4. Uruchamiamy API
5. Po inicjalizacji
W obecnym stanie TacotronFinalise i MultispeakerFinalise nie są dobrze dostowane pod UI
