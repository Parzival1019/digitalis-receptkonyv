# Tesztelés

## 1. Tesztelési stratégia

| Szint | Eszköz | Mit ellenőriz |
| --- | --- | --- |
| **Egységtesztek** | Vitest | Tiszta üzleti függvények: szövegnormalizálás, mértékegység-egységesítés, kerekítés, adagszám-átszámítás, magyar számformázás (`shared/text.ts`) |
| **API- és integrációs tesztek** | Vitest + Supertest | A teljes backend (route → validáció → service → SQLite) valódi HTTP-kérésekkel, memóriában futó, seedelt adatbázison |
| **Perzisztenciateszt** | Vitest, fájl alapú SQLite | Az adatbázis lezárása és újranyitása után megmaradnak-e az adatok, és nem duplikálódik-e a seed |
| **Statikus ellenőrzés** | TypeScript (strict) | A teljes kódbázis (`server`, `client`, `shared`, `tests`) típushelyessége |
| **Végponttól végpontig (E2E) felületi ellenőrzés** | Headless Chrome, DevTools Protocol szkript | Valódi felhasználói folyamat a lefordított alkalmazáson |
| **Teljesítmény** | Saját mérőszkript (`npm run perf`) | Válaszidők medián, 95. percentilis és maximum értéke, nagy adatmennyiséggel is |
| **Reszponzivitás** | Headless Chrome, 390×844 eszközemuláció | Vízszintes túlcsordulás minden oldalon, képernyőképek |

**Tesztizoláció:** minden API-tesztfájl (illetve a legtöbb teszt `beforeEach`-ben) saját, `:memory:` SQLite-adatbázist kap, a seeddel együtt. A tesztek így nem függnek egymástól, nem írják a valódi `data/receptkonyv.db` fájlt, és gyorsan futnak. Ehhez az `createApp(db)` az adatbázist paraméterként kapja (függőséginjektálás).

## 2. Futtatás

```bash
npm run test
```

Figyelő mód fejlesztés közben: `npm run test:watch`. Típusellenőrzés: `npm run typecheck`. Build: `npm run build`.

## 3. Fő tesztesetek

### Recept-CRUD (`tests/recipes.test.ts`)
| Teszteset | Elvárt eredmény |
| --- | --- |
| Seed: legalább 15 recept, 6 kategória | `totalRecipes ≥ 15`, `categoryCount = 6` |
| A 10 kötelező mintarecept szerepel, hozzávalókkal és lépésekkel | Mind megtalálható |
| Recept létrehozása | `201`, a válasz és a visszaolvasott recept azonos, a lépések sorszámozása 1..n |
| Meglévő hozzávaló újrahasznosítása | A „tojás” egyszer szerepel az `ingredients` táblában |
| Recept módosítása | Minden mező frissül, a hozzávalók és lépések lecserélődnek, `updatedAt` nő, `createdAt` változatlan |
| Recept törlése | `204`, utána `404`; a hozzávaló-, lépés- és kedvencsorok is törlődnek (CASCADE) |
| Nem létező recept módosítása vagy törlése | `404 NOT_FOUND` |

### Érvénytelen bemenetek (`tests/recipes.test.ts`, `tests/shoppingList.test.ts`)
| Teszteset | Elvárt eredmény |
| --- | --- |
| Hiányzó vagy hibás mezők (rövid név, negatív idő, 0 adag, ismeretlen nehézség, üres listák) | `400 VALIDATION_ERROR`, mezőnkénti `details` |
| Negatív hozzávaló-mennyiség, üres lépés | `400`, `ingredients.0.quantity`, `steps.0` |
| Nem létező kategória | `400`, `categoryId` |
| `javascript:` kép-URL | `400` |
| Hibás JSON-törzs | `400 INVALID_JSON` |
| Nem szám azonosító, ismeretlen végpont | `400`, illetve `404` |
| Érvénytelen szűrőparaméter (`difficulty=extrem`, `maxTime=sok`) | `400` |
| Bevásárlólista: üres név, 0 vagy szöveges mennyiség, üres PATCH, nem logikai `isChecked` | `400` |

### Keresés és szűrés (`tests/search.test.ts`)
| Teszteset | Elvárt eredmény |
| --- | --- |
| `q=gulyas`, `q=CARBONARA` | Ékezet- és kisbetű-független találat |
| `ingredient=darált marhahús` | Bolognai spagetti, Lasagne |
| `ingredient=tojás, kolbász` | Csak azok, amelyekben mindkettő szerepel: Lecsó, Rakott krumpli |
| Kategória, `maxTime=15`, `difficulty=nehez` | Csak a feltételnek megfelelő receptek |
| Kombinált: kategória + idő + nehézség + hozzávaló | Egyetlen találat: Túrós csusza |
| Rendezés idő és név szerint, növekvő és csökkenő | Helyes sorrend |
| Nincs találat; `%_` karakterek | Üres lista, nincs hiba (LIKE-escape) |
| `featured=true&limit=3` | 3 kiemelt recept |

### Kedvencek (`tests/favorites.test.ts`)
| Teszteset | Elvárt eredmény |
| --- | --- |
| Jelölés, listázás, eltávolítás | Helyes lista, `isFavorite` a részleteknél is |
| Kétszeri jelölés | Idempotens, a darabszám 1 |
| Nem létező recept | `404` |
| `favorites=true` szűrő | Csak a kedvencek |

### Bevásárlólista (`tests/shoppingList.test.ts`)
| Teszteset | Elvárt eredmény |
| --- | --- |
| Recept hozzáadása egy kéréssel | Bolognai: 13 új tétel |
| **Azonos hozzávaló összevonása** | Bolognai + Carbonara → spagetti **800 g** egy sorban, parmezán **70 g**, a só (ízlés szerint) egy sorban |
| **Különböző mértékegységek** | Pirospaprika: `2 ek` és `1 tk` két külön sorban |
| Ugyanaz a recept kétszer | Nincs új sor, a tej 5 dl → 10 dl |
| Adagszám-átszámítás | 4 → 2 adag: darált hús 500 g → 250 g |
| Kipipált tétel | Új sort nyit, nem ad hozzá a megvetthez |
| Kézi felvétel és összevonás, egységalias | „darab” → „db”, 1 + 2 = 3 |
| Szerkesztés | Név, mennyiség, egység, kipipálás frissül |
| Törlés, kipipáltak törlése, kiürítés | Helyes darabszámok, üres lista |
| Nem létező recept | `404` |

### Adatmegmaradás (`tests/persistence.test.ts`)
Ideiglenes fájlba mentett adatbázis: létrehozás, kedvenc, listára tétel és törlés, majd **lezárás és újranyitás**, kétszer egymás után.
- Az új recept, a kedvenc és a 3 listatétel megmarad.
- A seed nem fut le újra: a receptszám helyes, a törölt mintarecept nem jelenik meg újra, a kategóriák száma továbbra is 6.

## 4. Tényleges eredmények

A futtatás dátuma: **2026. 11. 21.**, macOS (Apple Silicon), Node.js 26.0.0, npm 11.12.1.

### 4.1 Ellenőrzési lépések

| # | Ellenőrzés | Parancs | Eredmény |
| --- | --- | --- | --- |
| 1 | Függőségek telepítése | `npm install` | ✅ sikeres, 0 sebezhetőség |
| 2 | TypeScript-típusellenőrzés | `npm run typecheck` | ✅ 0 hiba (server és client) |
| 3 | Production build | `npm run build` | ✅ sikeres (JS 418 kB / gzip 128 kB, CSS 50 kB / gzip 8 kB) |
| 4 | Automatikus tesztek | `npm run test` | ✅ **6 tesztfájl, 48/48 teszt sikeres** |
| 5 | Adatbázis létrehozása és seedelése | `npm run dev` üres `data/` mappával | ✅ `data/receptkonyv.db` létrejött, 20 recept, 6 kategória |
| 6 | Backend API kézi ellenőrzése | `curl` a Vite proxyn keresztül | ✅ `/api/stats`, keresés, validációs hiba (400 mezőnkénti üzenetekkel), recept hozzáadása a listához (`added: 5, merged: 3`) |
| 7 | Újraindítás utáni adatmegmaradás (valódi szerver) | Leállítás, majd `npm start` | ✅ kedvencek (1) és listatételek (19) megmaradtak, a receptszám nem duplikálódott |
| 8 | Éles mód | `npm start` | ✅ a 3001-es porton az API és a lefordított frontend is elérhető (SPA-útvonal: 200) |
| 9 | E2E felületi folyamat | Headless Chrome (lásd 4.3) | ✅ 14/14 ellenőrzés |
| 10 | Reszponzivitás 390 px-en | Headless Chrome eszközemuláció | ✅ egyik oldalon sincs vízszintes túlcsordulás (`scrollWidth = 390`) |
| 11 | Egykattintásos indító tiszta letöltésből | `./start.sh` friss másolatban | ✅ telepít, buildel, elindul; a második indítás felismeri a futó példányt; leállításkor nem marad folyamat |
| 12 | Válaszidő | `npm run perf` | ✅ minden művelet < 3 ms, 1020 recepttel is (lásd 4.5) |

### 4.2 Automatikus tesztek kimenete

```
 ✓ tests/text.test.ts (6)
 ✓ tests/search.test.ts (11)
 ✓ tests/persistence.test.ts (1)
 ✓ tests/favorites.test.ts (4)
 ✓ tests/shoppingList.test.ts (11)
 ✓ tests/recipes.test.ts (15)

 Test Files  6 passed (6)
      Tests  48 passed (48)
```

### 4.3 E2E felületi ellenőrzés (headless Chrome)

A lefordított alkalmazáson, valódi böngészőben (DevTools Protocol szkript, a felület elemeire kattintva és mezőket kitöltve):

| Lépés | Eredmény |
| --- | --- |
| Üres űrlap beküldése: név-, kategória- és hozzávaló-hibaüzenet megjelenik | ✅ |
| Űrlap kitöltése (`0,5` tizedesvesszővel), mentés: navigálás a recept oldalára | ✅ |
| „Az új recept sikeresen elmentve.” értesítés | ✅ |
| `0,5 kg` helyesen jelenik meg | ✅ |
| Kedvencnek jelölés, értesítés | ✅ |
| Bevásárlólistára tétel, értesítés | ✅ |
| Adagszám 4 → 5: mennyiség 0,63 kg | ✅ |
| Törlés: megerősítő ablak megjelenik | ✅ |
| Megerősítés után navigálás a listára, a recept `GET`-je 404 | ✅ |
| Kombinált keresés (`paprikas` + közepes + főételek): Csirkepaprikás, „1 találat” | ✅ |
| Nem létező kulcsszó: üres találati állapot | ✅ |

### 4.4 Fejlesztés közben talált és javított hibák

| Hiba | Észlelés | Javítás |
| --- | --- | --- |
| Ha egy hozzávaló már létezett a törzstáblában (pl. „rizs”), a felhasználó által beírt írásmód („Rizs”) elveszett a receptben | 2 sikertelen API-teszt (`recipes.test.ts`) | Új `display_name` oszlop a `recipe_ingredients` táblában; a törzstábla csak azonosításra és keresésre szolgál |
| Tailwind v4-ben az egyedi komponensosztályok (`btn-primary` → `btn`) `@apply`-ja `@layer components`-ben nem működik | Tervezéskor | Átírás `@utility` direktívákra |
| Az E2E szkript két ellenőrzése hibás elvárást tartalmazott (a név szerinti keresés a leírásban is keres, pl. a Csirkepaprikás leírásában szerepel a „nokedlivel”) | E2E futtatás | A szkript javítva (törlés ellenőrzése azonosító alapján, pontosabb szűrés); az alkalmazás viselkedése helyes volt |

### 4.5 Válaszidő-mérés

Futtatás: `npm run perf` ([scripts/measure-performance.mjs](../scripts/measure-performance.mjs)). A szkript ideiglenes adatbázissal saját szervert indít, minden műveletet 10 bemelegítő kérés után 200-szor lefuttat, és a HTTP-kérés teljes körülfordulási idejét méri (localhost, Apple M5, Node.js 26.0.0, 2026. 11. 21.).

| Művelet | Medián (ms) | 95. percentilis (ms) | Maximum (ms) |
| --- | --- | --- | --- |
| Receptlista (összes, 20 recept) | 0,27 | 0,44 | 0,75 |
| Kombinált keresés (név + hozzávaló + szűrők) | 0,23 | 0,35 | 0,80 |
| Recept részletei | 0,17 | 0,38 | 0,86 |
| Főoldali statisztika | 0,09 | 0,11 | 0,56 |
| Recept mentése (10 hozzávaló, 5 lépés) | 0,39 | 0,55 | 2,29 |
| Kedvenc jelölése | 0,07 | 0,10 | 1,50 |
| Recept a bevásárlólistára (összevonással) | 0,50 | 0,62 | 2,41 |
| Recept törlése | 0,14 | 0,18 | 0,95 |

Terheléses adatmennyiséggel (1000 további recept, összesen **1020**):

| Művelet | Medián (ms) | 95. percentilis (ms) | Maximum (ms) |
| --- | --- | --- | --- |
| Név szerinti keresés 1020 recept között | 0,23 | 0,27 | 2,10 |
| Hozzávaló szerinti keresés 1020 recept között | 0,95 | 1,02 | 1,63 |

**Értékelés:** minden szerveroldali művelet 3 ms alatt teljesül, nagyobb adatmennyiségnél is. Ez nagyságrendekkel a 100 ms-os „azonnali válasz” érzetküszöb alatt van, így a PAD „megfelelő válaszidő” célkitűzése teljesül. A mérés localhoston készült, hálózati késleltetés nélkül; lassabb gépen az értékek arányosan nagyobbak lehetnek. A frontend teljes letöltendő mérete tömörítve kb. 136 kB (JS 128 kB + CSS 8 kB).

## 5. Nem ellenőrzött területek és korlátok

- **Windows:** a futtatás csak macOS-en történt. A kód platformfüggetlen (nincs natív függőség, az útvonalak `path`-tal készülnek, az npm-szkriptekben nincs shell-specifikus szintaxis), de Windows-gépen ténylegesen nem futtattuk.
- **Node.js minimális verziója:** a `package.json` `engines` mezője `>=22.13.0` (ettől érhető el a `node:sqlite` kapcsoló nélkül). A teszteket Node 26-on futtattuk, a 22.x verzión nem. Régebbi Node-on a `node:sqlite` nem érhető el.
- **Frontend-komponenstesztek:** a React-komponensekhez nincs külön egységteszt (pl. Testing Library). A felületet a fenti E2E-szkript és képernyőképek ellenőrzik, de az E2E-szkript nem része az `npm run test` parancsnak, mert telepített Chrome-ot igényel.
- **Böngészők:** csak Chrome-ban (headless) ellenőriztük; Firefox és Safari nem volt tesztelve.
- **Külső kép-URL-ek** és a Google Fonts betűtípus internetkapcsolatot igényelnek. Offline módban a képek helyett illusztráció, a webfont helyett rendszerbetű jelenik meg (ez szándékos tartalék).
