# Projektdokumentáció

Ez a dokumentum a csapat Projektalapító Dokumentumának (PAD) szerkezetét követi. Bemutatja, hogyan teljesültek a projekt céljai, hatóköre, kritériumai és mérföldkövei, milyen döntéseket hoztunk a fejlesztés során, és milyen kockázatokkal kellett számolni.

> ✏️ A **✏️** jelölésű részeket a csapat tölti ki a tényleges munkamenet alapján (megbeszélések, egyéni hozzájárulások). Ezek az adatok a forráskódból és a verziókezelésből nem állapíthatók meg.

## 1. Összefoglaló

| | |
| --- | --- |
| **Projekt neve** | Digitális receptkönyv alkalmazás fejlesztése |
| **Tárgy** | Informatika projekt 1 – Dunaújvárosi Egyetem, mérnökinformatikus BSc |
| **Eredmény** | Működő, bemutatható webalkalmazás és teljes dokumentáció |
| **Forráskód** | <https://github.com/Parzival1019/digitalis-receptkonyv> |
| **Terjedelem** | kb. 5 000 sor TypeScript (backend ~1 600, frontend ~2 400, közös kód ~330, tesztek ~530) |
| **Tesztek** | 48 automatikus teszt, mind sikeres; böngészős végponttól végpontig ellenőrzés 14/14 |
| **Közvetlen költség** | 0 Ft (csak ingyenes, nyílt forráskódú eszközök) |

A PAD célja egy könnyen használható receptkezelő volt receptrögzítéssel, szerkesztéssel, kategorizálással, kereséssel, kedvencekkel és bevásárlólistával, strukturált adattárolással. **Ez a cél teljes egészében megvalósult**, és néhány többletfunkcióval bővült (lásd [7. pont](#7-eltérések-a-pad-tól-és-többletfunkciók)).

## 2. Projektcsapat és felelősségi területek

| Szerepkör (PAD szerint) | Név | Felelősségi terület a kódban |
| --- | --- | --- |
| Projektvezető | Porczió Fábió | Koordináció, dokumentáció (`docs/`), tesztelés (`tests/`), verziókezelés, bemutató |
| Adatbázis és háttérfunkciók | Androvics Bence | Adatmodell és séma (`server/src/db/`), üzleti logika és REST API (`server/src/services/`, `server/src/routes/`), mintaadatok (`seedData.ts`) |
| Alkalmazás és felhasználói felület | Németh Dávid | Felület és navigáció (`client/src/components/`, `client/src/pages/`), receptkezelő űrlapok, design (`client/src/index.css`) |

A közös kódot (`shared/`: típusok és validációs szabályok) a két fejlesztői terület együtt használja. Ez a két terület közötti „szerződés”.

### Tényleges munkamegosztás ✏️

| Tag | Elvégzett feladatok | Ráfordított idő (becslés) |
| --- | --- | --- |
| Porczió Fábió | ✏️ | ✏️ |
| Androvics Bence | ✏️ | ✏️ |
| Németh Dávid | ✏️ | ✏️ |

### Eszközhasználat

| Terület | Eszköz |
| --- | --- |
| Fejlesztői környezet | Claude Code; ✏️ további használt szerkesztők |
| Verziókezelés | Git, GitHub |
| AI-asszisztens | Claude Code (Anthropic): kódgenerálás, tesztírás, dokumentáció |
| Tervezés, dokumentáció | Markdown, Mermaid diagramok |

> ✏️ A tárgy AI-eszközökre vonatkozó szabályainak megfelelően itt érdemes röviden leírni, mire és milyen mértékben használtátok az AI-asszisztenst, és hogyan ellenőriztétek az eredményét (kódátnézés, tesztek futtatása, kézi kipróbálás).

## 3. A hatókör teljesülése

| # | PAD hatóköri tétel | Állapot | Megvalósítás |
| --- | --- | --- | --- |
| I. | Adatbázismodell elkészítése | ✅ Kész | 8 entitás, ER-diagram: [database.md](database.md) |
| II. | Relációs sémák létrehozása | ✅ Kész | Elsődleges és idegen kulcsok, `CHECK` és `UNIQUE` megszorítások, kaszkádolt törlés: `server/src/db/schema.ts` |
| III. | Menürendszer és navigáció | ✅ Kész | Felső menü asztalon, alsó tab-sáv mobilon, jelvények a darabszámokkal |
| IV. | Receptfeltöltő és -szerkesztő felület | ✅ Kész | Közös űrlap új receptre és szerkesztésre, mezőnkénti validáció, képfeltöltés |
| V. | Előre rögzített receptek | ✅ Kész | 20 magyar recept, 6 kategóriában, idempotens betöltéssel |
| VI. | Keresés és szűrés | ✅ Kész | Név (ékezetfüggetlen), hozzávalók, kategória, idő, nehézség, rendezés, kombinálva |
| VII. | Kedvencek kezelése | ✅ Kész | Jelölés kártyáról és receptoldalról, külön oldal |
| VIII. | Bevásárlólista-funkció | ✅ Kész | Egy kattintás receptenként, azonos tételek összevonása, kézi szerkesztés |
| IX. | Tesztelés és hibajavítás | ✅ Kész | 48 automatikus teszt, E2E ellenőrzés, válaszidő-mérés: [testing.md](testing.md) |
| X. | Projekt- és felhasználói dokumentáció | ✅ Kész | Ez a dokumentum, valamint [requirements](requirements.md), [architecture](architecture.md), [database](database.md), [user-guide](user-guide.md), [testing](testing.md) |

A **hatókörön kívüli** tevékenységek (éttermi rendelés, online fizetés, webshop-integráció, kereskedelmi terjesztés, közösségi funkciók, raktárkezelés) közül egyik sem került megvalósításra, a PAD-nak megfelelően.

## 4. A kritériumok teljesülése

| # | PAD-kritérium | Teljesülés | Bizonyíték |
| --- | --- | --- | --- |
| 1 | Egyszerű, könnyű kezelhetőség | ✅ | Legfeljebb 2 kattintásos fő funkciók, magyar felület, egyértelmű visszajelzések (értesítések, megerősítés) |
| 2 | Egységes, átlátható felület | ✅ | Egységes színvilág és komponensek (gombok, kártyák, űrlapmezők), reszponzív elrendezés: [képernyőképek](kepernyokepek/) |
| 3 | Strukturált, redundanciamentes adatbázis | ✅ | Normalizált modell külön hozzávaló-törzzsel és N:M kapcsolótáblával. A néhány levezetett oszlop (pl. ékezet nélküli keresőmező) indoklása: [database.md, 5. pont](database.md#5-normalizálás-és-tervezési-döntések) |
| 4 | Megbízható tárolás és visszakeresés | ✅ | SQLite-fájl, tranzakciók, idegen kulcsok; perzisztenciateszt újraindítással |
| 5 | Működő keresés és szűrés | ✅ | 11 dedikált teszt (`tests/search.test.ts`) |
| 6 | Recept rögzíthető és szerkeszthető | ✅ | CRUD-tesztek és E2E-folyamat |
| 7 | Előre rögzített receptek | ✅ | 20 recept; teszt ellenőrzi a 10 kötelező receptet |
| 8 | Működő kedvencek | ✅ | 4 dedikált teszt |
| 9 | Működő bevásárlólista | ✅ | 11 dedikált teszt, köztük az összevonás és a mértékegység-kezelés |
| 10 | Stabil működés, tesztelés lezárás előtt | ✅ | 48/48 teszt sikeres, típusellenőrzés hibamentes |

### Válaszidő (a PAD „megfelelő válaszidő” célkitűzése)

Mérés: `npm run perf`, minden művelet 200 ismétléssel, a HTTP-kérés teljes körülfordulási idejével (Apple M5, Node.js 26).

| Művelet | Medián | 95. percentilis |
| --- | --- | --- |
| Receptlista (20 recept) | 0,27 ms | 0,44 ms |
| Kombinált keresés | 0,23 ms | 0,35 ms |
| Recept mentése (10 hozzávaló, 5 lépés) | 0,39 ms | 0,55 ms |
| Recept a bevásárlólistára (összevonással) | 0,50 ms | 0,62 ms |
| Hozzávaló-keresés **1020 recept** között | 0,95 ms | 1,02 ms |

Minden művelet jóval 100 ms alatt marad (ez az a határ, amely alatt a felhasználó azonnalinak érzékeli a választ), 1000 feletti recepttel is. A teljes mérés: [testing.md](testing.md#45-válaszidő-mérés).

## 5. Mérföldkövek

| Mérföldkő (PAD) | Tervezett határidő | Teljesülés |
| --- | --- | --- |
| Projektfeladatok és felelősségek meghatározása | 2026. 10. 11. | ✏️ |
| Adatbázis és alapvető felhasználói felület megtervezése | 2026. 10. 24. | ✏️ |
| Adatbázis és alapfunkciók implementálása | 2026. 11. 08. | ✏️ |
| Fő alkalmazásfunkciók fejlesztésének befejezése | 2026. 11. 14. | ✏️ |
| Integrált tesztelés és hibajavítás | 2026. 11. 18. | ✏️ (a végleges tesztkör 2026. 11. 21-én: 48/48) |
| Dokumentáció és prezentáció elkészítése | 2026. 11. 21. | ✅ 2026. 11. 21. |
| Projekt lezárása | 2026. 11. 22. | ✏️ |

### Megbeszélések ✏️

| Dátum | Résztvevők | Fő témák, döntések |
| --- | --- | --- |
| ✏️ | ✏️ | ✏️ |

## 6. Fontosabb tervezési és technológiai döntések

| Döntés | Indoklás |
| --- | --- |
| **Webalkalmazás** (React + Express) asztali program helyett | Bármely gépen fut böngészőben, reszponzív (mobilon is használható), és jól szétválasztható az adatbázis- és a felületi munka |
| **SQLite** relációs adatbázis | Nem kell külön adatbázis-szervert telepíteni, egyetlen fájl, mégis teljes értékű SQL, idegen kulcsokkal és tranzakciókkal |
| **Beépített `node:sqlite`** külső csomag helyett | Nincs natív fordítás, a telepítés Windowson is egyetlen `npm install` |
| **TypeScript** a teljes kódbázisban | A típushibák már fordításkor kiderülnek; a frontend és a backend ugyanazokat a típusokat használja |
| **Közös Zod-validáció** (`shared/schemas.ts`) | Egyszer leírt szabályok: az űrlap és a szerver pontosan ugyanazt ellenőrzi, azonos magyar hibaüzenetekkel |
| **Külön hozzávaló-törzs és N:M kapcsolat** | Redundanciamentes tárolás; ezen alapul a hozzávaló szerinti keresés és a bevásárlólista-összevonás |
| **Összevonás csak azonos mértékegységnél** | Biztonságos szabály: g és kg, illetve ek és tk soha nem adódik össze hibásan |
| **Idempotens seed** (`app_meta.seed_version`) | Újraindításkor nem duplikálódnak a mintareceptek, és a törölt receptek sem jelennek meg újra |
| **Egykattintásos indítók** (`start.bat`, `start.command`, `start.sh`) | Az oktató vagy bárki más fejlesztői ismeretek nélkül elindíthatja a programot |

## 7. Eltérések a PAD-tól és többletfunkciók

A PAD-ban vállalt funkciók közül **nincs elmaradás**. A következő többletfunkciók készültek el:

- **Adagszám-kalkulátor:** a recept mennyiségei tetszőleges adagszámra átszámíthatók, és a bevásárlólistára is így kerülnek.
- **Képfeltöltés:** URL vagy fájl; a böngésző lekicsinyíti a képet, és az adatbázisba menti (internet nélkül is megjelenik).
- **Több hozzávalós keresés** („mit főzzek abból, ami otthon van”): `tojás, kolbász`.
- **Ékezetfüggetlen keresés:** `gulyas` → Gulyásleves.
- **Kategóriák kezelése** a REST API-n keresztül (létrehozás, törlés, védelem a használt kategória törlése ellen).
- **Válaszidő-mérő szkript** (`npm run perf`) és **egykattintásos indítók**.

## 8. Kockázatok és kezelésük

| Kockázat (PAD és fejlesztés közben azonosított) | Hatás | Kezelés |
| --- | --- | --- |
| Az adatbázis és az alapfunkciók késése (PAD) | A ráépülő funkciók is csúsznak | Az adatmodell és a közös típusok készültek el először; a funkciók erre épültek |
| Kevés idő az integrált tesztelésre (PAD) | Rejtett hibák maradnak | Automatikus tesztek; minden módosítás után a teljes tesztcsomag lefut (kb. 0,4 mp) |
| Eltérő operációs rendszerek a csapatban és az oktatónál | „Nálam működik” probléma | Natív függőség nélküli stack, platformfüggetlen indítók. **Windowson a végleges verzió ellenőrzése szükséges** ✏️ |
| A macOS és a Windows blokkolja a letöltött, alá nem írt indítófájlt | Az első indítás elakad | Lépésenkénti feloldási útmutató a README-ben |
| Túl régi Node.js a futtató gépen | Nem indul el | Az indító ellenőrzi a verziót (22.13+), és telepítést ajánl fel |
| Adatvesztés bemutató közben | Kellemetlen demó | Tartós SQLite-tárolás; `npm run db:reset` a tiszta kezdőállapothoz |

## 9. Fejlesztés közben talált hibák

| Hiba | Hogyan derült ki | Javítás |
| --- | --- | --- |
| Meglévő hozzávalónál elveszett a beírt írásmód („Rizs” → „rizs”) | Automatikus teszt | Új `display_name` oszlop a kapcsolótáblában |
| Az indító a második indításkor akkor is megnyitotta a böngészőt, amikor nem kellett | Indítóteszt | A „már fut” ellenőrzés áthelyezése, a `NO_BROWSER` kapcsoló figyelembevétele |
| A macOS-útmutató („jobb klikk → Megnyitás”) újabb rendszeren már nem működött | Kipróbálás letöltött ZIP-ből | README frissítve a működő feloldási módokkal |

## 10. Továbbfejlesztési lehetőségek

A PAD „nagyobb összefüggésbe helyezés” pontjával összhangban:

- **Felhasználói fiókok** és bejelentkezés (több felhasználó saját receptekkel és kedvencekkel).
- **Receptek megosztása** linkkel, exportálás PDF-be vagy nyomtatható nézetbe.
- **Táplálkozási adatok** (kalória, makrotápanyagok) hozzávalónként.
- **Mértékegység-átváltás** (g ↔ kg, dl ↔ l) az összevonásnál.
- **Heti menütervező**, amelyből automatikusan készül a bevásárlólista.
- **Telepíthető alkalmazás (PWA)** mobilra, offline bevásárlólistával.

## 11. Bemutató forgatókönyv (kb. 5 perc élő demó)

Előkészítés: `npm run db:reset`, majd a `start` indító. A böngésző a <http://localhost:3001> címen nyílik meg.

1. **Főoldal:** receptszám, kategóriák, kiemelt receptek. A *Levesek* kategóriára kattintva megjelenik a szűrt lista.
2. **Keresés:** a *Receptek* oldalon a „Hozzávalók” mezőbe `tojás, kolbász` → 2 találat. Ezután a *Könnyű* szűrő → a lista szűkül. A névmezőbe `gulyas` (ékezet nélkül) → Gulyásleves.
3. **Recept megtekintése:** Bolognai spagetti, az adagszám 4 → 2 (a mennyiségek feleződnek), majd **Kedvencekhez**.
4. **Bevásárlólista:** Bolognai → *Bevásárlólistára*, utána Carbonara → *Bevásárlólistára*. Az értesítés szerint 3 tétel összevonva. A listán a **spagetti 800 g** egy sorban. Ha marad idő: Csirkepaprikás és Lecsó hozzáadása, ekkor a **pirospaprika két sorban** marad (2 ek és 1 tk), mert a mértékegységek eltérnek. Kipipálás, majd *Kipipáltak törlése*.
5. **Új recept:** üres űrlap beküldése → magyar hibaüzenetek. Kitöltés és mentés → sikeres értesítés, megnyílik a recept oldala.
6. **Szerkesztés, majd törlés** megerősítő ablakkal.
7. **Tartósság:** az indító ablakának bezárása, újraindítás → a kedvenc és a bevásárlólista megmaradt.
8. *(Ha kérdezik)* `npm run test` → 48/48 zöld teszt; mobilnézet a böngésző fejlesztői eszközeivel.
