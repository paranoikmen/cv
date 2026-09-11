# CV site

Personal CV website. Plain HTML/CSS/JS, no build step — deploys to GitHub Pages as is.

## Structure

```
index.html             page shell (top bar, container, footer)
assets/css/style.css   styles: light/dark theme, mobile layout, print/PDF layout
assets/js/i18n.js      language detection, loading and merging translations
assets/js/app.js       renders the CV from content JSON
content/languages.json list of languages + default one
content/en.json        main content (source of truth)
content/ru.json        translation — only the text that differs from en.json
```

## Run locally

The content is loaded with `fetch`, so opening `index.html` from disk won't work — use any static server:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Editing content

Everything is in `content/en.json`. Dates are `YYYY-MM` (or just `YYYY`); `"end": null` means "present".
An item without `start` shows only its end date (handy for graduation years).
Durations ("2 yrs 3 mos") and month names are formatted automatically for the current language.
Empty sections are hidden automatically. For a photo, add `"photo": "assets/img/photo.jpg"` to `profile`.

## Adding a language

1. Create `content/<code>.json` (e.g. `de.json`).
2. Add `{ "code": "de", "label": "Deutsch" }` to `content/languages.json`.

A translation file is **deep-merged over the default language**: objects by key, arrays of
objects by index. So you only write the strings that change — dates, links and stacks are
taken from `en.json`. Keep the order of items in arrays the same as in `en.json`.
Arrays of plain strings (`highlights`, `items`, `stack`) are replaced as a whole.

`ui.units` holds plural forms for durations using
[`Intl.PluralRules`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules)
categories (`one`, `few`, `many`, `other`…).

Language priority: `?lang=xx` in the URL → last choice (localStorage) → default (English).
The browser language is not used, so first-time visitors always see English. To send someone
a specific version, share a link like `https://<site>/?lang=de`.

## Deploy to GitHub Pages

1. Create a repository — `<username>.github.io` for `https://<username>.github.io`,
   or any name for `https://<username>.github.io/<repo>/`.
2. Push this folder to the `main` branch.
3. Repository → Settings → Pages → Source: **Deploy from a branch**, branch `main`, folder `/ (root)`.

All paths are relative, so both variants work without changes.
