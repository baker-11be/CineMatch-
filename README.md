# CineMatch

Find a good movie without hopping between a dozen apps. CineMatch is a clean,
ad-free web app for exploring trending movies, searching titles, filtering by
genre, and keeping a personal watchlist.

Movie data comes from [The Movie Database (TMDB)](https://www.themoviedb.org/).
This product uses the TMDB API but is not endorsed or certified by TMDB.

## Week 5 — Setup & API Connection

The project covers the Week 5, Week 6, and Week 7 cards:

| Card | Task | Status |
| ---- | ---- | ------ |
| 1 | Create base project files (`index.html`, `styles.css`, `main.js`) | ✅ |
| 2 | Build page layout using CSS Grid | ✅ |
| 3 | Set up TMDB API module (`tmdbApi.js`) | ✅ |
| 4 | Fetch and display trending movies on the homepage | ✅ |
| 5 | Test API fetch (verify poster paths, handle broken images) | ✅ |

## Week 6 — Core Features

| Card | Requirement | Implementation |
| ---- | ----------- | -------------- |
| 6 | Search input functionality | Search TMDB by title as the user types, with a short debounce |
| 7 | Genre filter dropdown | Load TMDB genres and filter search/discovery results by genre |
| 8 | Movie detail popup modal | Show movie backdrop, overview, release year, and TMDB rating |
| 9 | Watchlist stored with `localStorage` | Add/remove titles; the list persists in the current browser |
| 10 | Mark as watched and personal rating | Track watched status and save a 1–5 star personal rating |

### Try the Week 6 features

1. Search for a title or select a genre; using both applies the genre to the
   search results.
2. Choose **Details** on a movie card to open its modal. The modal can also be
   closed with the close button, the Escape key, or by clicking the backdrop.
3. Add a movie to your watchlist. Use **Watchlist** in the navigation to see,
   mark watched/unwatched, and remove saved movies.
4. In the detail modal, mark a title as watched and save a personal rating
   from 1 to 5. **Watched** in the navigation shows titles marked as watched.
5. Reload the page to confirm watchlist, watched state, and personal ratings
   are still present in this browser's `localStorage`.

## Week 7 — Polish & Deployment

| Card | Requirement | Implementation |
| ---- | ----------- | -------------- |
| 11 | Sort by release date or rating | Sort the current home/search results newest-first or highest-rated-first |
| 12 | Refine visual styles | Keep the charcoal/red brand palette, clear controls, and interactive card states |
| 13 | Responsive layout | Two-column small-phone grid, expanding to tablet and desktop columns; navigation collapses on mobile |
| 14 | Debug and fix issues | Show actionable TMDB/search errors, ignore stale searches, and test build and feature flows |

The search field submits a title to TMDB after a brief pause in typing, or
immediately when you press Enter or select **Search**. Search can be combined
with the genre dropdown; the sort control applies to the resulting movie list.
Search, genre, and sorting are available on the Home view.

## Project structure

```
CineMatch-/
├── index.html                  # Page shell: header, nav, filter bar, movie grid, footer
├── styles.css                  # Brand palette, CSS Grid layout, responsive breakpoints
├── main.js                     # Search, filters, movie modal, and watchlist UI
├── tmdbApi.js                  # TMDB requests + image-URL helpers (ES module)
├── storage.js                  # Watchlist persistence using localStorage
├── .env.example                # Local TMDB_API_KEY template
├── config.js                   # Safe fallback; dist/config.js is generated from .env
├── config.example.js           # Safe template of config.js
├── scripts/build.mjs           # Copies required source assets to dist/
├── images/
│   ├── favicon.svg             # Site icon
│   └── poster-placeholder.svg  # Fallback shown when a poster is missing/broken
└── README.md
```

## Setup — add your TMDB API key

The app needs a free TMDB API key before it can load movies.

1. Create a free account: <https://www.themoviedb.org/signup>
2. Request an API key: <https://www.themoviedb.org/settings/api>
3. Copy `.env.example` to `.env` and set `TMDB_API_KEY` to your **API Key (v3 auth)**.

   ```env
   TMDB_API_KEY=your_real_key_here
   ```

> **Security note:** this is a browser-only (client-side) app, so the key is
> visible in the built page and browser requests. Never commit `.env`; it is
> git-ignored. Rotate any API key that has been accidentally shared.

## Run it locally

ES modules must be served over HTTP (opening `index.html` with `file://` will
not work). After setting `TMDB_API_KEY` in `.env`, run this from the project
folder:

```powershell
npm start
```

This builds the application into `dist/`, reads the local `.env`, and serves
the built site. Open the URL printed by the server. If you see a message that
`TMDB_API_KEY` is not set, search and movie data cannot load until the key is
configured.

## Testing the API connection (Card 5)

1. Open the page and confirm the grid fills with trending movie posters.
2. **Broken / missing images:** any movie whose `poster_path` is `null`, or
   whose image request fails, automatically falls back to
   `images/poster-placeholder.svg` (handled by the `error` listener in
   `main.js`).
3. Throttle the network to "Slow 3G" in DevTools to check the loading/empty
   status messages behave (the status line is an `aria-live` region).

## Build & deploy (Render)

```powershell
npm install
npm run lint     # style/syntax check
npm run build    # copies the site into ./dist (git-ignored)
```

Render Static Site settings:

| Setting           | Value                             |
| ----------------- | --------------------------------- |
| Branch            | `main`                            |
| Build Command     | `npm install && npm run build`    |
| Publish Directory | `dist`                            |
| Env var           | `TMDB_API_KEY` = your TMDB v3 key |

The build writes `TMDB_API_KEY` into `dist/config.js`, so the real key does not
need to be committed. Render redeploys whenever `main` changes, so merge your
`Cinematch-week5` branch into `main` for the fix to go live.

## Remaining project work

- **"Surprise Me":** a proposal feature, separate from the Week 7 cards.
- **Deployment:** build and configure Render with `TMDB_API_KEY`; deployment is
  not performed by the local build command.