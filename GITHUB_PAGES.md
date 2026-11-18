# MORSE LINK — jedno repozytorium, GitHub Pages + Render

To jest jeden projekt i jedno repozytorium GitHub, ale dwie usługi korzystają z różnych katalogów:

- **Render** pobiera to repozytorium i uruchamia backend Node.js z `server.js` (Root Directory puste, Start Command `npm start`).
- **GitHub Pages** publikuje statyczny frontend z katalogu `/docs`.
- Frontend łączy się z `https://letter-scroll.onrender.com` przez Socket.IO.

## Co dzieje się po nocy / bezczynności

Render Free może uśpić usługę po okresie bezczynności. Strona GitHub Pages nadal działa. Klient Socket.IO jest ładowany niezależnie z CDN, a nie z uśpionego Rendera. Dopiero po kliknięciu **Utwórz pokój** albo **Dołącz** strona rozpoczyna połączenie z Renderem. Pierwsze połączenie wybudza usługę; aplikacja automatycznie ponawia próby i po uzyskaniu połączenia wykonuje zapamiętaną akcję. W tym czasie pokaże komunikat o wybudzaniu — może to potrwać około 50 sekund.

## Ustawienia Render (jednorazowo)

- Repository: to samo repozytorium GitHub, w którym znajdują się te pliki.
- Root Directory: puste.
- Runtime: Node.
- Build Command: `npm install`.
- Start Command: `npm start`.
- Auto-Deploy: włączony (np. On Commit), aby zmiany w repozytorium wdrażały backend.

Render używa `server.js`, `package.json` i katalogu `public/`. Nie ustawiaj Root Directory na `docs`.

## Ustawienia GitHub Pages (jednorazowo)

1. Repozytorium → Settings → Pages.
2. Source: `Deploy from a branch`.
3. Branch: `main` (lub gałąź, na której są pliki).
4. Folder: `/docs`.
5. Save i poczekaj na publikację.

GitHub Pages publikuje `docs/index.html`. Nie przenoś `docs/` do `public/` ani odwrotnie.

## Test

1. Otwórz adres GitHub Pages na telefonie.
2. Kliknij **Utwórz pokój**. Jeśli Render spał, zobaczysz komunikat o wybudzaniu; nie zamykaj strony.
3. Po uruchomieniu backendu pojawi się sześciocyfrowy kod.
4. Otwórz tę samą stronę na komputerze, kliknij **Dołącz** i wpisz kod.

Pokoje są przechowywane w pamięci serwera. Restart/deploy Rendera usuwa istniejące pokoje. GitHub Pages nie uruchamia backendu — wybudzenie następuje przez pierwsze połączenie z usługą Render.
