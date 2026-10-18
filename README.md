# IMDb 250 Roulette

A tiny static site that picks a random movie from the IMDb Top 250 and keeps track of which ones you've seen.

- **🎲 Pick a random movie** — by default only picks from movies you haven't seen.
- **✓ I've seen it** — marks the picked movie as seen (with the date). Click again to undo.
- **The list** — search, filter by seen/unseen, and tick off any movie directly.
- **Your data** — saved in your browser's `localStorage`. Use *Export backup* / *Import backup* to move it between devices or browsers.

No build step, no dependencies: just `index.html`, `style.css`, `app.js` and `movies.js`.

## Publish on GitHub Pages

1. Go to **Settings → Pages** in this repository.
2. Under **Build and deployment**, set **Source** to *Deploy from a branch*.
3. Pick the branch with these files (e.g. `main`) and the `/ (root)` folder, then **Save**.
4. After a minute the site is live at `https://<your-username>.github.io/imdb250/`.

## Updating the list

The movie list lives in `movies.js` as `[title, year]` pairs in rank order. Seen status is keyed by title + year, so you can reorder or swap entries without losing what you've marked.

## Run locally

Open `index.html` in a browser, or serve the folder: `python3 -m http.server`.
