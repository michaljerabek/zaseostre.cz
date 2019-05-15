# Vývoj šablony

Vysvětlení kódu a podrobný popis vývoje se nachází v dodaném manuálu (`/manual/index.html`).

Pro spojení vývojových souborů budete potřebovat Node.js, NPM a Gulp.

Produkční kód se nachází ve složce `/build`.

## Gulp tasky

- `build` — spojí CSS i JS (a zakomentuje vývojový kód v HTML souborech)
- `css` — spojí CSS
- `js` — spojí JS

## CSS

Soubory, které mají být součástí spojeného souboru se nastavují v souboru `/dev/load-css.js`. Podrobný popis je uvnitř souboru.

## JS

Soubory, které mají být součástí spojeného souboru se nastavují v souboru `/dev/load-js.js`. Podrobný popis je uvnitř souboru.