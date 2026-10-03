// ============================================================================
// CineMatch — main.js
// ----------------------------------------------------------------------------
// Bootstraps the homepage: wires the mobile navigation, asks tmdbApi.js for
// the day's trending movies, and renders them into the CSS Grid (#movie-grid).
//
// Design notes
//   * Cards are built with createElement + textContent (no untrusted innerHTML).
//   * Poster paths are converted to full TMDB URLs in tmdbApi.js; when a poster
//     is missing OR fails to load we swap in a local placeholder (Card 5).
// ============================================================================

import { getTrendingMovies, posterUrl } from './tmdbApi.js';

const PLACEHOLDER_IMG = 'images/poster-placeholder.svg';

const grid = document.getElementById('movie-grid');
const statusMessage = document.getElementById('status-message');

/** Year from a "YYYY-MM-DD" release date, or an em dash when unknown. */
function formatYear(releaseDate) {
    return releaseDate ? releaseDate.slice(0, 4) : '—';
}

/** Rating to one decimal place, or "NR" when a film has no votes yet. */
function formatRating(voteAverage) {
    const value = Number(voteAverage);
    return Number.isFinite(value) && value > 0 ? value.toFixed(1) : 'NR';
}

/** Vote count, compacted (e.g. 1234 -> "1.2k"). */
function formatVotes(voteCount) {
    const value = Number(voteCount) || 0;
    return value < 1000 ? `${value}` : `${(value / 1000).toFixed(1)}k`;
}

/** Update the aria-live status line under the heading. */
function setStatus(text) {
    if (statusMessage) {
        statusMessage.textContent = text;
    }
}

/**
 * Build a single movie card element.
 * @param {Object} movie - a TMDB movie object
 * @returns {HTMLElement}
 */
function createMovieCard(movie) {
    const title = movie.title || movie.name || 'Untitled';
    const poster = posterUrl(movie.poster_path);

    const card = document.createElement('article');
    card.className = 'movie-card';
    card.dataset.movieId = String(movie.id);

    // ---- Poster with graceful fallback for broken / missing images ----
    const img = document.createElement('img');
    img.className = 'movie-poster';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.width = 500;
    img.height = 750;
    img.alt = `${title} poster`;
    img.src = poster || PLACEHOLDER_IMG;

    img.addEventListener('error', () => {
        // Guard against an infinite loop if the placeholder itself is missing.
        if (!img.src.endsWith(PLACEHOLDER_IMG)) {
            img.src = PLACEHOLDER_IMG;
        }
    });

    // ---- Rating badge overlaid on the poster ----
    const badge = document.createElement('span');
    badge.className = 'rating-badge';
    badge.textContent = `★ ${formatRating(movie.vote_average)}`;

    // ---- Title + meta row ----
    const info = document.createElement('div');
    info.className = 'movie-info';

    const heading = document.createElement('h2');
    heading.className = 'movie-title';
    heading.textContent = title;

    const meta = document.createElement('p');
    meta.className = 'movie-meta';

    const year = document.createElement('span');
    year.className = 'movie-year';
    year.textContent = formatYear(movie.release_date);

    const votes = document.createElement('span');
    votes.className = 'movie-votes';
    votes.textContent = `${formatVotes(movie.vote_count)} votes`;

    meta.append(year, votes);
    info.append(heading, meta);
    card.append(img, badge, info);

    return card;
}

/** Render an array of movies into the grid, or show an empty-state message. */
function renderMovies(movies) {
    if (!grid) return;
    grid.innerHTML = '';

    if (!Array.isArray(movies) || movies.length === 0) {
        setStatus(
            'No movies to display right now. If this is your first run, add your ' +
            'TMDB API key to config.js (see README.md).'
        );
        return;
    }

    const fragment = document.createDocumentFragment();
    movies.forEach((movie) => fragment.append(createMovieCard(movie)));
    grid.append(fragment);

    setStatus(`Showing ${movies.length} trending movies.`);
}

/** Fetch and display trending movies (Card 4). */
async function loadTrending() {
    setStatus('Loading trending movies…');
    if (grid) grid.setAttribute('aria-busy', 'true');

    const movies = await getTrendingMovies('day');

    if (grid) grid.removeAttribute('aria-busy');
    renderMovies(movies);

    // Card 5 testing aid: log raw + resolved poster paths so the TMDB base URL
    // and file path combination can be verified in the browser DevTools console.
    console.groupCollapsed('[CineMatch] Trending fetch');
    console.log('movies returned:', movies.length);
    console.table(
        movies.slice(0, 10).map((movie) => ({
            title: movie.title,
            poster_path: movie.poster_path,
            poster_url: posterUrl(movie.poster_path) || PLACEHOLDER_IMG
        }))
    );
    console.groupEnd();
}

/** Mobile hamburger toggle for the primary navigation. */
function setupNavigation() {
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('primary-nav');
    if (!hamburger || !nav) return;

    hamburger.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('open');
        hamburger.setAttribute('aria-expanded', String(isOpen));
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    loadTrending();
});