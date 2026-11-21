# Digitális receptkönyv

Modern, reszponzív, magyar nyelvű receptkezelő webalkalmazás. Receptek böngészése, saját receptek létrehozása, szerkesztése és törlése, keresés és szűrés, kedvencek kezelése, valamint **automatikus, összevonó bevásárlólista**. Az adatok tartósan, helyi SQLite-adatbázisban tárolódnak.

> Egyetemi beadandó: Dunaújvárosi Egyetem, mérnökinformatikus BSc, *Informatika projekt 1*.

![Főoldal](docs/kepernyokepek/fooldal.png)

## 🚀 Gyors indítás – egy kattintással

1. **Töltsd le** a projektet: GitHubon a zöld **Code → Download ZIP** gomb, majd csomagold ki. (Vagy: `git clone`.)
2. **Indítsd el** az operációs rendszerednek megfelelő fájlt dupla kattintással:

| Rendszer | Indítófájl |
| --- | --- |
| Windows | `start.bat` |
| macOS | `start.command` |
| Linux | `./start.sh` (terminálból) |

Az indító mindent elintéz:

- ellenőrzi a Node.js-t; ha hiányzik, felajánlja a telepítését (Windowson `winget`, macOS-en Homebrew segítségével), vagy megnyitja a letöltési oldalt;
- az első indításkor telepíti a függőségeket (kb. 1–2 perc, internet kell hozzá);
- elkészíti a felületet, elindítja a szervert, és **megnyitja a böngészőt** (<http://localhost:3001>);
- az adatbázis automatikusan létrejön, 20 mintarecepttel.

A leállításhoz zárd be a megnyílt terminálablakot (vagy nyomd meg a Ctrl+C billentyűket). A második indítás már csak néhány másodperc. Ha a program már fut, az indító csak megnyitja a böngészőt.

> **macOS-tipp:** ha az első dupla kattintásnál a rendszer azt írja, hogy a fájl „nem azonosított fejlesztőtől” származik, kattints rá jobb gombbal → **Megnyitás** → **Megnyitás**. Ezt csak egyszer kell megtenni.
>
> **Windows-tipp:** ha a SmartScreen figyelmeztet, válaszd a **További információ → Futtatás mindenképp** lehetőséget.

Ugyanez parancssorból: `npm run app`.

## Funkciók

- **Főoldal / dashboard:** kereső, receptszám, kategóriák receptszámmal, kiemelt receptek, gyorselérés a kedvencekhez és a bevásárlólistához, „Új recept hozzáadása” gomb.
- **Receptkezelés (CRUD):** létrehozás, megtekintés, szerkesztés, törlés megerősítés után. Egy recept adatai: név, leírás, kategória, elkészítési idő, adagszám, nehézség, hozzávalók (név, mennyiség, mértékegység), sorba rendezhető lépések, opcionális kép (URL vagy feltöltés), létrehozás és módosítás dátuma.
- **20 előre feltöltött recept** (pl. bolognai spagetti, carbonara, csirkepaprikás, gulyásleves, lasagne, somlói galuska). A seedelés idempotens.
- **Keresés és szűrés:** receptnév (ékezet- és kisbetű-független), hozzávalók (akár több, vesszővel elválasztva), kategória, maximális elkészítési idő, nehézség, rendezés név, idő vagy dátum szerint. A feltételek együtt is működnek, és az URL-ben tárolódnak.
- **Kedvencek:** jelölés vagy eltávolítás kártyáról és receptoldalról, külön kedvencek oldal. Újraindítás után is megmaradnak.
- **Bevásárlólista:** egy gombnyomással egy recept összes hozzávalója a listára kerül, az aktuális adagszámra átszámítva. Az azonos nevű **és** azonos mértékegységű tételeket összevonja, a különböző mértékegységűeket nem adja össze. Kézi felvétel, szerkesztés, kipipálás, kipipáltak törlése, teljes kiürítés.
- **Adagszám-kalkulátor:** a receptoldalon az adagszám módosítása arányosan átszámítja a mennyiségeket.
- **Állapotkezelés:** betöltés („csontváz” kártyák), üres találati lista, mezőnkénti validációs hibák, sikeres mentés és hiba értesítéssel, sikertelen API-kérés újrapróbálással, törlés megerősítése.

## Technológiák

| Réteg | Technológia |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7, Lucide ikonok |
| Backend | Node.js, Express 5, TypeScript (futtatás: `tsx`), REST API, Zod validáció |
| Adatbázis | SQLite a Node.js **beépített `node:sqlite`** moduljával |
| Tesztelés | Vitest, Supertest (API-tesztek) |

**Eltérés az alapértelmezett stacktől:** külső SQLite-csomag (pl. `better-sqlite3`) helyett a Node.js beépített `node:sqlite` modulját használjuk. Így a telepítéshez nem kell natív C++ fordítás (Python, Visual Studio Build Tools, Xcode), és macOS-en és Windowson is egyformán működik egy sima `npm install` után. A Zod-sémák közösek (`shared/`): ugyanaz a validáció fut a frontenden és a backenden.

## Telepítés (fejlesztőknek, kézi módon)

Ha nem az indítófájlt használod. **Követelmény:** [Node.js](https://nodejs.org/) **22.13 vagy újabb** (ajánlott a legfrissebb LTS). Ellenőrzés: `node -v`.

```bash
npm install
```

## Futtatás

Fejlesztői mód (a backend és a frontend egyszerre indul):

```bash
npm run dev
```

- Frontend: <http://localhost:5173>
- API: <http://localhost:3001/api>

Az adatbázis (`data/receptkonyv.db`) az első indításkor automatikusan létrejön, és feltöltődik a mintareceptekkel.

Éles build és indítás (egyetlen szerver szolgálja ki a frontendet és az API-t):

```bash
npm run build
```

```bash
npm start
```

Ezután az alkalmazás a <http://localhost:3001> címen érhető el.

Adatbázis visszaállítása a kezdőállapotra (például bemutató előtt):

```bash
npm run db:reset
```

### Hasznos parancsok

| Parancs | Leírás |
| --- | --- |
| `npm run app` | Egykattintásos indító (telepítés, build, szerver, böngésző) |
| `npm run dev` | Backend (tsx watch) és frontend (Vite) együtt |
| `npm run build` | TypeScript-típusellenőrzés és frontend build (`dist/client`) |
| `npm start` | Szerver indítása; build után a frontendet is kiszolgálja |
| `npm run test` | Automatikus tesztek (Vitest) |
| `npm run typecheck` | Csak típusellenőrzés |
| `npm run db:reset` | Adatbázis törlése és újraseedelése |

Környezeti változók (opcionális): `PORT` (alapértelmezés: 3001), `DB_FILE` (az adatbázisfájl elérési útja).

## Tesztek futtatása

```bash
npm run test
```

6 tesztfájl, 48 teszt: recept-CRUD, keresés és szűrés, kedvencek, bevásárlólista (összevonás, mértékegységek, átszámítás), adatmegmaradás újraindítás után, érvénytelen bemenetek. A részletes eredmények a [docs/testing.md](docs/testing.md) fájlban vannak.

## Projektstruktúra

```
digitalis-receptkonyv/
├── client/                 # React frontend (Vite gyökér)
│   ├── index.html
│   └── src/
│       ├── components/     # Újrahasznosítható UI-komponensek
│       ├── pages/          # Oldalak (route-ok)
│       ├── hooks/          # useAsync, useDebounced
│       └── lib/            # API-kliens, formázás, globális állapot
├── server/src/             # Express backend
│   ├── db/                 # séma, kapcsolat, seed, reset
│   ├── routes/             # REST-végpontok
│   ├── services/           # üzleti logika és SQL
│   └── lib/                # hibakezelés, validáció
├── shared/                 # közös típusok, Zod-sémák, szövegsegédek
├── tests/                  # Vitest + Supertest tesztek
├── scripts/launch.mjs      # platformfüggetlen indító logika
├── start.bat / start.command / start.sh   # egykattintásos indítók
├── docs/                   # dokumentáció
└── data/                   # SQLite adatbázis (automatikusan jön létre)
```

## Dokumentáció

- [Követelmények](docs/requirements.md)
- [Architektúra és REST API](docs/architecture.md)
- [Adatbázis és ER-diagram](docs/database.md)
- [Felhasználói útmutató](docs/user-guide.md)
- [Tesztelés és eredmények](docs/testing.md)
