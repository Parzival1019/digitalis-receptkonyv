# Követelmények

## 1. Áttekintés

A *Digitális receptkönyv* egyfelhasználós, helyben futó webalkalmazás, amellyel a felhasználó recepteket tárolhat, kereshet és kezelhet, kedvenceket jelölhet, és a receptek alapján automatikusan bevásárlólistát állíthat össze. Bejelentkezésre nincs szükség.

## 2. Funkcionális követelmények

| Azonosító | Követelmény | Megvalósítás |
| --- | --- | --- |
| **F1 – Főoldal** | | |
| F1.1 | Az alkalmazás neve és a navigáció minden oldalon látható | `Layout`: felső navigáció asztalon, alsó tab-sáv mobilon |
| F1.2 | Kiemelt receptek megjelenítése | `GET /api/recipes?featured=true&limit=6` |
| F1.3 | Receptkategóriák receptszámmal | `GET /api/categories` |
| F1.4 | Keresőmező | A hero keresője a receptlistára visz `?q=` paraméterrel |
| F1.5 | Kedvencek és bevásárlólista gyorselérése | Gyorskártyák darabszámmal, jelvények a navigációban |
| F1.6 | Az összes recept száma | `GET /api/stats` |
| F1.7 | Jól látható „Új recept hozzáadása” gomb | Fejléc, főoldali kártya, mobil középső gomb |
| **F2 – Receptkezelés** | | |
| F2.1 | Recept létrehozása | `POST /api/recipes`, `RecipeFormPage` |
| F2.2 | Recept megtekintése | `GET /api/recipes/:id`, `RecipeDetailPage` |
| F2.3 | Recept szerkesztése | `PUT /api/recipes/:id` |
| F2.4 | Recept törlése megerősítés után | `ConfirmDialog` → `DELETE /api/recipes/:id` |
| F2.5 | Receptadatok: azonosító, név, leírás, kategória, idő, adag, nehézség, hozzávalók (név, mennyiség, egység), sorrendezett lépések, opcionális kép, létrehozás és módosítás dátuma | `recipes`, `recipe_ingredients`, `recipe_steps` táblák |
| F2.6 | Tartós mentés adatbázisba | SQLite fájl: `data/receptkonyv.db` |
| **F3 – Mintaadatok** | | |
| F3.1 | Legalább 15 valószerű recept az első indításkor | 20 recept, 6 kategória (`seedData.ts`) |
| F3.2 | Idempotens seedelés | `app_meta.seed_version` jelző és `INSERT OR IGNORE` |
| **F4 – Keresés és szűrés** | | |
| F4.1 | Keresés receptnév alapján | `q` paraméter, ékezet- és kisbetű-független |
| F4.2 | Keresés hozzávalók alapján | `ingredient` paraméter, több érték vesszővel (ÉS kapcsolat) |
| F4.3 | Kategóriaszűrés | `category` (slug) |
| F4.4 | Elkészítési idő szerinti szűrés | `maxTime` (perc) |
| F4.5 | Nehézség szerinti szűrés | `difficulty` |
| F4.6 | Rendezés név és idő szerint | `sort=name|time|newest`, `order=asc|desc` |
| F4.7 | A feltételek együttesen működnek | Dinamikus `WHERE ... AND ...` |
| **F5 – Kedvencek** | | |
| F5.1 | Kedvencnek jelölés és eltávolítás | `PUT` / `DELETE /api/favorites/:recipeId` |
| F5.2 | Kedvencek külön oldalon | `/kedvencek`, `GET /api/favorites` |
| F5.3 | Megmarad újraindítás után | `favorites` tábla |
| **F6 – Bevásárlólista** | | |
| F6.1 | Recept hozzávalóinak hozzáadása egy gombnyomással | `POST /api/shopping-list/from-recipe/:id` |
| F6.2 | Kézi felvétel | `POST /api/shopping-list` |
| F6.3 | Tételek szerkesztése, mennyiség módosítása | `PATCH /api/shopping-list/:id` |
| F6.4 | Tétel törlése | `DELETE /api/shopping-list/:id` |
| F6.5 | Kipipálás | `PATCH { isChecked }` |
| F6.6 | Kipipált tételek eltávolítása | `DELETE /api/shopping-list/checked` |
| F6.7 | Teljes lista kiürítése | `DELETE /api/shopping-list` |
| F6.8 | Azonos hozzávaló és azonos egység esetén összevonás | `addOrMergeItem` |
| F6.9 | Különböző mértékegységek nem adódnak össze | Az összevonás feltétele az egyező egység |
| F6.10 | Minden módosítás mentésre kerül | Minden művelet API-hívás |

**Többletfunkciók:** adagszám-kalkulátor a receptoldalon, átszámított mennyiségek a bevásárlólistára téve, képfeltöltés (a böngésző lekicsinyíti, az adatbázisban tárolódik, internet nélkül is megjelenik), kategória-létrehozás és -törlés API-n keresztül, `npm run db:reset`.

## 3. Nem funkcionális követelmények

| Azonosító | Követelmény | Megvalósítás |
| --- | --- | --- |
| NF1 | Magyar nyelvű felület helyes ékezetekkel | Minden felirat és hibaüzenet magyar, `lang="hu"` |
| NF2 | Reszponzív felület (asztali, tablet, mobil) | Tailwind töréspontok, mobil alsó navigáció; 390 px-en ellenőrizve, nincs vízszintes görgetés |
| NF3 | Modern, prémium megjelenés | Törtfehér és zsályazöld paletta, Fraunces és Inter betűk, kártyák, lágy árnyékok, hover-animációk |
| NF4 | Egyszerű telepítés, külső szolgáltatás nélkül | `npm install` → `npm run dev`; nincs natív fordítás, API-kulcs vagy felhő |
| NF5 | macOS- és Windows-kompatibilitás | Csak Node.js-függőség, `path`-alapú útvonalak, platformfüggetlen npm-szkriptek |
| NF6 | Szerveroldali validáció, egyértelmű státuszkódok | Zod; 200/201/204/400/404/409/413/500; egységes JSON hibaformátum |
| NF7 | Adatintegritás | Elsődleges és idegen kulcsok, `ON DELETE CASCADE`, `CHECK` megszorítások, tranzakciók |
| NF8 | Karbantartható kód | Rétegek: route → service → DB; közös típusok és sémák; TypeScript strict mód |
| NF9 | Biztonság | Paraméterezett SQL (nincs SQL injection), LIKE-escape, kép-URL whitelist (`http(s)`, `data:image`), body-méretkorlát |
| NF10 | Hozzáférhetőség | Szemantikus HTML, `aria-label`-ek, fókuszjelzés, billentyűzettel kezelhető párbeszédablak (Esc) |
| NF11 | Offline működés | A képek nélküli receptek illusztrált helyettesítőt kapnak; a webfont hiányában rendszerbetűre vált |

## 4. Felhasználói esetek

### UC1 – Recept keresése meglévő hozzávalók alapján
**Szereplő:** felhasználó. **Előfeltétel:** az alkalmazás fut.
1. A felhasználó megnyitja a *Receptek* oldalt.
2. A „Hozzávalók” mezőbe beírja: `tojás, kolbász`.
3. A rendszer gépelés után kb. 0,3 másodperccel lekérdezi a szervert, és csak azokat a recepteket mutatja, amelyekben mindkét hozzávaló szerepel (Lecsó, Rakott krumpli).
4. A felhasználó további szűrőt ad meg (pl. *Könnyű*): a lista tovább szűkül.

**Alternatív ág:** nincs találat → „Nincs a feltételeknek megfelelő recept” üzenet és „Szűrők törlése” gomb.

### UC2 – Új recept létrehozása
1. A felhasználó az „Új recept” gombra kattint.
2. Kitölti az alapadatokat, hozzávalókat ad hozzá (a nevekhez javaslatot kap), és rögzíti a lépéseket.
3. A „Recept mentése” gombra kattint.
4. A rendszer kliensoldalon validál, majd elküldi az adatokat. A szerver újra validál és ment.
5. Megjelenik a „sikeresen elmentve” értesítés, és a rendszer a recept oldalára navigál.

**Alternatív ág:** hibás adat → a hibás mezők piros keretet és magyar hibaüzenetet kapnak, a nézet az első hibára görget.

### UC3 – Recept szerkesztése és törlése
1. A receptoldalon a *Szerkesztés* gomb előre kitöltött űrlapot nyit.
2. Mentés után a módosítás dátuma frissül.
3. A *Törlés* gomb megerősítő ablakot nyit. Megerősítés után a recept, a hozzávalói, a lépései és a kedvenc-jelölése is törlődik.

### UC4 – Bevásárlólista összeállítása több receptből
1. A felhasználó a *Bolognai spagetti* oldalán a „Bevásárlólistára” gombra kattint.
2. Ezután a *Carbonara* oldalán is.
3. A rendszer értesít: „5 új tétel, 3 összevonva”.
4. A bevásárlólistán a spagetti egy sorban, **800 g**-mal szerepel (400 g + 400 g), a parmezán **70 g**-mal.
5. A *Csirkepaprikás* (2 ek pirospaprika) és a *Lecsó* (1 tk pirospaprika) hozzáadása után a pirospaprika **két külön sorban** marad, mert a mértékegységek eltérnek.

### UC5 – Vásárlás a listával
1. A felhasználó mobilon megnyitja a *Lista* fület.
2. Bolt közben kipipálja a tételeket; a folyamatjelző mutatja a haladást.
3. A végén a „Kipipáltak törlése” gombbal eltávolítja a megvett tételeket (megerősítés után).

### UC6 – Kedvencek
1. A felhasználó egy kártyán a szív ikonra kattint: a recept kedvenc lesz, a navigációs jelvény frissül.
2. A *Kedvencek* oldalon az összes kedvenc látható. A szívre kattintva a recept azonnal lekerül a listáról.
3. Újraindítás után a kedvencek megmaradnak.
