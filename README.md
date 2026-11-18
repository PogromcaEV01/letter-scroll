# MORSE LINK — osobny projekt

To niezależna aplikacja. Nie korzysta z Rangiku, Supabase, Gemini ani PeerJS.

## Pliki
- `server.js` — backend Express + Socket.IO
- `package.json` — zależności i komenda startowa
- `public/index.html` — aplikacja na Samsung i PC
- `public/manifest.webmanifest` — instalacja PWA
- `public/sw.js` — cache zasobów aplikacji

## Ustawienia Render
W istniejącym Web Service `letter-scroll` ustaw:
- Runtime: Node
- Build Command: `npm install`
- Start Command: `npm start`
- Root Directory: puste, jeśli pliki są w głównym katalogu repo

Nie dodawaj zmiennych środowiskowych — serwer używa automatycznie `PORT` z Render.

## Wdrożenie
1. Rozpakuj archiwum.
2. Wgraj całą zawartość do nowego, osobnego repozytorium GitHub.
3. Upewnij się, że `server.js` i `package.json` są w katalogu głównym, a frontend w `public/`.
4. Podłącz to repozytorium do usługi Render `letter-scroll`.
5. Uruchom deploy.
6. Otwórz `https://letter-scroll.onrender.com/health` — oczekiwana odpowiedź to JSON z `ok: true`.
7. Otwórz `https://letter-scroll.onrender.com/` — powinna wyświetlić się aplikacja.

## Test
1. Otwórz stronę na telefonie i komputerze.
2. Kliknij „Utwórz pokój” na jednym urządzeniu.
3. Wpisz 6-cyfrowy kod na drugim i kliknij „Dołącz”.
4. Krótkie naciśnięcie nada kropkę; przytrzymanie przez co najmniej 260 ms nada kreskę.
5. 850 ms ciszy kończy literę; 1900 ms ciszy oznacza granicę słowa.
6. Odbiornik na telefonie wibruje krótko dla kropki i długo dla kreski.

## Uwagi
- Wiadomości przechodzą przez serwer Socket.IO w Render, a nie bezpośrednio P2P.
- Pokój ma maksymalnie dwóch uczestników; kod pokoju jest tymczasowym identyfikatorem, nie silnym uwierzytelnieniem.
- Bez bazy danych pokoje istnieją tylko w pamięci procesu. Restart lub deploy serwera rozłączy aktywne sesje.
- Render Free może usypiać nieaktywne usługi; pierwsze połączenie po bezczynności może wymagać chwili oczekiwania.
- Vibration API zależy od obsługi przeglądarki i urządzenia. Testuj na Samsungu z otwartą stroną i aktywnym ekranem.
