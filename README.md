# Informacje

Ta aplikacja ma na celu wesprzeć transkrypt i kategoryzację plików nieuporządkowanych

Obecnie, jest to wczesna alfa i nie wszystko działa jak należy

Do działania wymaga ffmpeg.exe

Ogólnie aplikacja jest uruchamiana w środowisku deweloperskim ReactJS, więc wymaga pakietu react-scripts

## Skróty klawiszowe

F2 - Zatrzymaj / Wznów audio

## To-Do lista

- [x] Zaimplementować ~~trzeci~~ drugi poziom eksportu, czyli wsparcie dla treningu modeli multi_speaker tj. Flowtron lub Uberduck Tacotron
- [x] Zautomatyzować proces wstępnej konfiguracji bazy (obecnie istnieje on w oparciu o istnienie pliku status.json)
- [x] Zaimplementować opcjonalne formatowanie plików przy finalizacji
- [ ] Dodać wsparcie dla innnych wersji językowych
- [ ] Dodać ciemny styl
- [x] Rekursywne przeszukiwanie folderów (w folderach szuka w folderze **wavs**)
- [x] Więcej opcji finalizacji (osobny panel) - Wymaga zmian w API w klasach finalizacji
- [x] Konfiguracja aplikacji z poziomu interfejsu - Wyłącznie kategorie podlegają modyfikacji
- [x] Zaimplementować skróty klawiszowe
- [ ] Ogólnie dostosować aplikację do ułatwienia rozproszonego development
- [ ] Rozwiązazć problemy wycieku pamięci
- [x] Użytkownik decyduje o tym, co jest w linijce - Wymaga zmian po stronie klas finalizacji. Na ten czas tylko TacotronFinalise wspiera to.

W ogromnym skrócie, uczynić aplikację user friendly i dev friendly

## Dalekie plany

- [ ] Przetestować framework Electron
- [ ] Przetestować chmurowe systemy bazodanowe
- [ ] Przepisać API na nowo, żeby ułatwić implementację na inne systemy bazodanowe
- [ ] Zaimplementować wsparcie auto-tranksrypcji
- [ ] Startowanie nie byłoby automatyczne jak teraz, tylko z GUI

# Wsparcie techniczne

Jako iż to wczesna alfa, to też nie udzielam wsparcia technicznego w problemach jakie mogą nastąpić
