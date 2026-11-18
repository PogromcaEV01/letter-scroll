# MORSE LINK — BETA 0.1

## Co działa w tej wersji
- Jedna strona na Samsung i komputer.
- Pokój P2P przez PeerJS / WebRTC DataChannel.
- Krótkie naciśnięcie = kropka; przytrzymanie >= 260 ms = kreska.
- Automatyczne zamknięcie znaku po 850 ms ciszy.
- Odbiór kodu jako wzór wibracji na telefonie.
- Pełny ekran i instalacja PWA (po publikacji przez HTTPS).

## Uruchomienie
To statyczna strona — nie wymaga Pythona ani serwera na komputerze.
Żeby urządzenia połączyły się przez internet, pliki muszą być opublikowane pod adresem HTTPS, np. GitHub Pages lub Netlify:
1. Wgraj `index.html`, `manifest.webmanifest` i `sw.js` do jednego repozytorium / katalogu publikacji.
2. Włącz publikację strony przez HTTPS.
3. Otwórz ten sam adres na Samsungu i PC.
4. Na jednym urządzeniu kliknij „Utwórz pokój”.
5. Skopiuj kod pokoju, wpisz go na drugim urządzeniu i kliknij „Połącz”.

## Sterowanie
- Telefon: dotknij i puść szybko = `.`, przytrzymaj co najmniej 260 ms = `-`.
- PC: kliknij/przytrzymaj okrągły przycisk albo użyj spacji.
- Przerwa 850 ms kończy aktualnie nadawany znak.
- „Test wibracji” sprawdza obsługę wibracji.

## Ważne ograniczenia BETA
- PeerJS Cloud służy do sygnalizacji; właściwe dane idą WebRTC P2P, jeśli NAT/firewall na to pozwala.
- Nie ma wbudowanego serwera TURN. W niektórych sieciach (np. restrykcyjny NAT, sieć firmowa) połączenie P2P może się nie zestawić.
- Do użycia publicznego należy skonfigurować własny serwer sygnalizacyjny/TURN i zabezpieczyć pokoje. Publiczny identyfikator pokoju nie jest hasłem.
- Vibration API działa tylko w obsługiwanych przeglądarkach/urządzeniach i może wymagać HTTPS oraz interakcji użytkownika. Android może ograniczać wibracje w tle; zostaw stronę otwartą i ekran aktywny podczas testów.
- W tej becie odbierany kod jest wibrowany jako ciąg kropek i kresek. Znak `/` oznacza dłuższą przerwę między słowami.
- Nie jest to szyfrowany komunikator z uwierzytelnianiem użytkowników. Nie przesyłaj poufnych danych.

## Parametry
- Próg kropka/kreska: 260 ms
- Koniec znaku: 850 ms ciszy
- Wzór wibracji: kropka 110 ms, kreska 330 ms, przerwa 110 ms
