# MORSE LINK — backend Render + frontend GitHub Pages

Jedno repozytorium GitHub obsługuje obie usługi:

- Render uruchamia backend z `server.js` i `public/`.
- GitHub Pages publikuje frontend z `docs/`.
- Obie wersje frontendu łączą się z `https://letter-scroll.onrender.com`.

## Render

- Root Directory: puste
- Build Command: `npm install`
- Start Command: `npm start`
- Auto-Deploy: On Commit

## GitHub Pages

Settings → Pages → Deploy from a branch → `main` → `/docs` → Save.

## Wybudzanie Rendera

Klient Socket.IO ładuje się z CDN. Nie próbuje pobierać biblioteki z uśpionego Rendera. Po kliknięciu Utwórz pokój/Dołącz rozpoczyna połączenie z Renderem. Jeśli usługa jest uśpiona, strona pokazuje komunikat i automatycznie ponawia połączenie; po wybudzeniu wykona oczekującą akcję. Pierwszy start może trwać około 50 sekund.

Szczegółowa instrukcja: `GITHUB_PAGES.md`.
