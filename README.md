# CineMatch

Find a good movie without hopping between a dozen apps. CineMatch is a clean,
ad-free web app for exploring trending movies, searching titles, filtering by
genre, and keeping a personal watchlist.

Movie data comes from [The Movie Database (TMDB)](https://www.themoviedb.org/).
This product uses the TMDB API but is not endorsed or certified by TMDB.

## Week 5 — Setup & API Connection

The work in this branch covers the Week 5 cards:

| Card | Task | Status |
| ---- | ---- | ------ |
| 1 | Create base project files (`index.html`, `styles.css`, `main.js`) | ✅ |
| 2 | Build page layout using CSS Grid | ✅ |
| 3 | Set up TMDB API module (`tmdbApi.js`) | ✅ |
| 4 | Fetch and display trending movies on the homepage | ✅ |
| 5 | Test API fetch (verify poster paths, handle broken images) | ✅ |

## Project structure

```
CineMatch-/
├── index.html                  # Page shell: header, nav, filter bar, movie grid, footer
├── styles.css                  # Brand palette, CSS Grid layout, responsive breakpoints
├── main.js                     # Bootstrap: nav toggle + render trending movies
├── tmdbApi.js                  # TMDB requests + image-URL helpers (ES module)
├── config.js                   # Your TMDB API key (edit this)  <-- see below
├── config.example.js           # Template of config.js
├── images/
│   ├── favicon.svg             # Site icon
│   └── poster-placeholder.svg  # Fallback shown when a poster is missing/broken
└── README.md
```

## Setup — add your TMDB API key

The app needs a free TMDB API key before it can load movies.

1. Create a free account: <https://www.themoviedb.org/signup>
2. Request an API key: <https://www.themoviedb.org/settings/api>
3. Open `config.js` and replace the placeholder with your **API Key (v3 auth)**:

   ```js
   export const API_KEY = 'your_real_key_here';
   ```

> **Security note:** this is a browser-only (client-side) app, so the key is
> visible in the served page. That is normal for a class project, but if you
> want to keep the key private, put it in a git-ignored `config.local.js`
> instead of `config.js`.

## Run it locally

ES modules must be served over HTTP (opening `index.html` with `file://` will
not work). From the project folder run any static server, for example:

```powershell
# Python (built in on most machines)
python -m http.server 8000

# or Node
npx serve .
```

Then open <http://localhost:8000>.

## Testing the API connection (Card 5)

1. Open the page and confirm the grid fills with trending movie posters.
2. Open DevTools → **Console**. `main.js` logs a table of the first 10 movies
   with each `poster_path` and the fully-resolved `poster_url`, so you can
   confirm the `https://image.tmdb.org/t/p/w500` base URL is being combined
   correctly.
3. **Broken / missing images:** any movie whose `poster_path` is `null`, or
   whose image request fails, automatically falls back to
   `images/poster-placeholder.svg` (handled by the `error` listener in
   `main.js`).
4. Throttle the network to "Slow 3G" in DevTools to check the loading/empty
   status messages behave (the status line is an `aria-live` region).

## Roadmap

- **Week 6:** search input, genre filter dropdown, movie detail modal, and
  `localStorage` watchlist.
- **Week 7:** sorting, "Surprise Me", responsive polish, testing, and deploy to
  GitHub Pages / Render.