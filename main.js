import {
    backdropUrl,
    getGenres,
    getTrendingMovies,
    posterUrl,
    searchMovies,
    discoverMovies
} from './tmdbApi.js';
import { loadWatchlist, saveWatchlist } from './storage.js';

const PLACEHOLDER_IMG = 'images/poster-placeholder.svg';
const state = {
    trendingMovies: [],
    homeMovies: [],
    watchlist: [],
    currentView: 'home',
    selectedMovie: null,
    requestId: 0,
    storageError: ''
};

const grid = document.getElementById('movie-grid');
const statusMessage = document.getElementById('status-message');
const searchInput = document.getElementById('search-input');
const genreSelect = document.getElementById('genre-select');
const sortSelect = document.getElementById('sort-select');
const resultsHeading = document.getElementById('results-heading');
const movieDialog = document.getElementById('movie-dialog');
const dialogBackdrop = document.getElementById('dialog-backdrop');
const dialogTitle = document.getElementById('dialog-title');
const dialogMeta = document.getElementById('dialog-meta');
const dialogOverview = document.getElementById('dialog-overview');
const dialogWatchlist = document.getElementById('dialog-watchlist');
const dialogWatched = document.getElementById('dialog-watched');
const personalRating = document.getElementById('personal-rating');

let searchTimer;

function formatYear(releaseDate) {
    return releaseDate ? releaseDate.slice(0, 4) : 'Year unknown';
}

function formatRating(voteAverage) {
    const value = Number(voteAverage);
    return Number.isFinite(value) && value > 0 ? value.toFixed(1) : 'NR';
}

function setStatus(text) {
    if (!statusMessage) return;
    statusMessage.textContent = state.storageError
        ? `${text} Watchlist storage warning: ${state.storageError}`
        : text;
}

function isSaved(movieId) {
    return state.watchlist.some((movie) => String(movie.id) === String(movieId));
}

function savedMovie(movieId) {
    return state.watchlist.find((movie) => String(movie.id) === String(movieId));
}

function createAction(label, action, movieId, className = 'action-button') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.dataset.action = action;
    button.dataset.movieId = String(movieId);
    button.textContent = label;
    return button;
}

function createMovieCard(movie) {
    const title = movie.title || movie.name || 'Untitled';
    const poster = posterUrl(movie.poster_path);
    const saved = savedMovie(movie.id);
    const card = document.createElement('article');
    card.className = 'movie-card';

    const img = document.createElement('img');
    img.className = 'movie-poster';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.width = 500;
    img.height = 750;
    img.alt = `${title} poster`;
    img.src = poster || PLACEHOLDER_IMG;
    img.addEventListener('error', () => {
        if (!img.src.endsWith(PLACEHOLDER_IMG)) img.src = PLACEHOLDER_IMG;
    });

    const badge = document.createElement('span');
    badge.className = 'rating-badge';
    badge.textContent = `★ ${formatRating(movie.vote_average)}`;

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

    const personalScore = document.createElement('span');
    personalScore.className = 'movie-votes';
    personalScore.textContent = saved?.personalRating
        ? `Your rating: ${saved.personalRating}/5`
        : `TMDB ★ ${formatRating(movie.vote_average)}`;
    meta.append(year, personalScore);

    const actions = document.createElement('div');
    actions.className = 'movie-actions';
    actions.append(
        createAction('Details', 'details', movie.id),
        createAction(
            saved ? 'Remove from Watchlist' : 'Add to Watchlist',
            'watchlist',
            movie.id,
            saved ? 'action-button' : 'action-button action-primary'
        )
    );
    if (saved) {
        actions.append(createAction(
            saved.watched ? 'Mark unwatched' : 'Mark as watched',
            'watched',
            movie.id
        ));
    }

    info.append(heading, meta, actions);
    card.append(img, badge, info);
    return card;
}

function currentMovies() {
    if (state.currentView === 'watched') {
        return state.watchlist.filter((movie) => movie.watched);
    }
    if (state.currentView === 'watchlist') {
        return state.watchlist;
    }
    return state.homeMovies;
}

function sortedMovies(movies) {
    if (state.currentView !== 'home' || sortSelect.value === 'default') {
        return movies;
    }

    const direction = sortSelect.value === 'rating' ? 'rating' : 'release-date';
    return [...movies].sort((a, b) => {
        if (direction === 'rating') {
            const ratingA = Number(a.vote_average) || 0;
            const ratingB = Number(b.vote_average) || 0;
            return ratingB - ratingA;
        }

        const dateA = a.release_date || '';
        const dateB = b.release_date || '';
        if (!dateA) return dateB ? 1 : 0;
        if (!dateB) return -1;
        return dateB.localeCompare(dateA);
    });
}

function renderMovies() {
    if (!grid) return;
    const movies = sortedMovies(currentMovies());
    grid.replaceChildren();

    if (state.currentView === 'home') {
        resultsHeading.textContent = searchInput.value.trim()
            ? 'Search Results'
            : genreSelect.value
                ? `${genreSelect.selectedOptions[0].text} Movies`
                : 'Trending Today';
    } else {
        resultsHeading.textContent = state.currentView === 'watched'
            ? 'Watched Movies'
            : 'Your Watchlist';
    }

    if (movies.length === 0) {
        if (state.currentView === 'watched') {
            setStatus('No watched movies yet. Mark a watchlist movie as watched to see it here.');
        } else if (state.currentView === 'watchlist') {
            setStatus('Your watchlist is empty. Add movies from the home page to save them here.');
        } else if (searchInput.value.trim() || genreSelect.value) {
            setStatus('No movies match those search and genre filters.');
        } else {
            setStatus('No movies to display right now. Check your TMDB API key and try again.');
        }
        return;
    }

    const fragment = document.createDocumentFragment();
    movies.forEach((movie) => fragment.append(createMovieCard(movie)));
    grid.append(fragment);
    setStatus(`Showing ${movies.length} ${movies.length === 1 ? 'movie' : 'movies'}.`);
}

function persistWatchlist(movies) {
    try {
        saveWatchlist(movies);
        state.watchlist = movies;
        state.storageError = '';
        renderMovies();
        return true;
    } catch (error) {
        console.error('[CineMatch] Could not save the watchlist:', error);
        state.storageError = error.message;
        setStatus(`Could not save your watchlist in this browser: ${error.message}`);
        return false;
    }
}

function updateSavedMovie(movie, changes) {
    const existing = savedMovie(movie.id);
    const updated = existing
        ? { ...existing, ...movie, ...changes }
        : { ...movie, watched: false, personalRating: null, ...changes };
    const remaining = state.watchlist.filter(
        (entry) => String(entry.id) !== String(movie.id)
    );
    persistWatchlist([...remaining, updated]);
}

function movieForId(movieId) {
    return currentMovies().find((movie) => String(movie.id) === String(movieId))
        || state.trendingMovies.find((movie) => String(movie.id) === String(movieId));
}

function toggleWatchlist(movie) {
    if (isSaved(movie.id)) {
        persistWatchlist(state.watchlist.filter(
            (entry) => String(entry.id) !== String(movie.id)
        ));
    } else {
        updateSavedMovie(movie, {});
    }
}

function toggleWatched(movie) {
    const saved = savedMovie(movie.id);
    updateSavedMovie(movie, { watched: !saved?.watched });
}

function openMovieDetails(movie) {
    state.selectedMovie = movie;
    const title = movie.title || movie.name || 'Untitled';
    const backdrop = backdropUrl(movie.backdrop_path);
    dialogTitle.textContent = title;
    dialogMeta.textContent =
        `${formatYear(movie.release_date)} · TMDB ★ ${formatRating(movie.vote_average)}`;
    dialogOverview.textContent = movie.overview || 'No overview is available for this title.';
    dialogBackdrop.hidden = !backdrop;
    if (backdrop) dialogBackdrop.src = backdrop;
    const saved = savedMovie(movie.id);
    dialogWatchlist.textContent = saved ? 'Remove from Watchlist' : 'Add to Watchlist';
    dialogWatched.textContent = saved?.watched ? 'Mark as unwatched' : 'Mark as watched';
    personalRating.value = saved?.personalRating ? String(saved.personalRating) : '';
    movieDialog.showModal();
}

function updateDialog() {
    if (!state.selectedMovie) return;
    const saved = savedMovie(state.selectedMovie.id);
    dialogWatchlist.textContent = saved ? 'Remove from Watchlist' : 'Add to Watchlist';
    dialogWatched.textContent = saved?.watched ? 'Mark as unwatched' : 'Mark as watched';
    personalRating.value = saved?.personalRating ? String(saved.personalRating) : '';
}

function setView(view) {
    state.currentView = ['home', 'watchlist', 'watched'].includes(view) ? view : 'home';
    state.requestId += 1;
    if (grid) grid.removeAttribute('aria-busy');
    const filterBar = document.querySelector('.filter-bar');
    filterBar.hidden = state.currentView !== 'home';
    document.querySelectorAll('#primary-nav a').forEach((link) => {
        const isActive = link.dataset.view === state.currentView;
        link.classList.toggle('active', isActive);
        if (isActive) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
    });
    renderMovies();
}

async function fetchHomeMovies() {
    const query = searchInput.value.trim();
    const genreId = genreSelect.value;
    const requestId = ++state.requestId;

    if (!query && !genreId) {
        state.homeMovies = state.trendingMovies;
        renderMovies();
        return;
    }

    setStatus('Searching movies…');
    if (grid) grid.setAttribute('aria-busy', 'true');

    try {
        const results = query
            ? await searchMovies(query)
            : await discoverMovies({ with_genres: genreId, sort_by: 'popularity.desc' });

        if (requestId !== state.requestId) return;
        state.homeMovies = genreId
            ? results.filter((movie) =>
                Array.isArray(movie.genre_ids)
                && movie.genre_ids.some((id) => String(id) === genreId)
            )
            : results;
        renderMovies();
    } catch (error) {
        if (requestId !== state.requestId) return;
        console.error('[CineMatch] Movie search failed:', error);
        state.homeMovies = [];
        grid.replaceChildren();
        setStatus(`Movie search failed. Check your TMDB API key or connection and try again. ${error.message}`);
    } finally {
        if (requestId === state.requestId && grid) {
            grid.removeAttribute('aria-busy');
        }
    }
}

async function loadInitialData() {
    const requestId = state.requestId;
    setStatus('Loading trending movies and genres…');
    if (grid) grid.setAttribute('aria-busy', 'true');
    const [moviesResult, genresResult] = await Promise.allSettled([
        getTrendingMovies('day'),
        getGenres()
    ]);

    const failures = [];
    if (moviesResult.status === 'fulfilled') {
        state.trendingMovies = moviesResult.value;
        if (
            requestId === state.requestId
            && !searchInput.value.trim()
            && !genreSelect.value
        ) {
            state.homeMovies = moviesResult.value;
        }
    } else {
        console.error('[CineMatch] Could not load trending movies:', moviesResult.reason);
        failures.push('Trending movies could not be loaded.');
    }

    if (genresResult.status === 'fulfilled') {
        genresResult.value.forEach((genre) => {
            const option = document.createElement('option');
            option.value = String(genre.id);
            option.textContent = genre.name;
            genreSelect.append(option);
        });
    } else {
        console.error('[CineMatch] Could not load movie genres:', genresResult.reason);
        failures.push('Genre filters could not be loaded.');
    }

    if (grid) grid.removeAttribute('aria-busy');
    if (requestId === state.requestId && !searchInput.value.trim() && !genreSelect.value) {
        renderMovies();
    }
    if (failures.length > 0 && state.currentView === 'home') {
        setStatus(`${failures.join(' ')} Check your TMDB API key or connection and try again.`);
    }
}

function setupNavigation() {
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('primary-nav');
    if (!hamburger || !nav) return;

    hamburger.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('open');
        hamburger.setAttribute('aria-expanded', String(isOpen));
    });

    nav.addEventListener('click', (event) => {
        const link = event.target.closest('a[data-view]');
        if (!link) return;
        nav.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
    });

    window.addEventListener('hashchange', () => {
        setView(window.location.hash.slice(1) || 'home');
    });
}

function setupMovieActions() {
    grid.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const movie = movieForId(button.dataset.movieId);
        if (!movie) return;

        if (button.dataset.action === 'details') openMovieDetails(movie);
        if (button.dataset.action === 'watchlist') {
            toggleWatchlist(movie);
            updateDialog();
        }
        if (button.dataset.action === 'watched') {
            toggleWatched(movie);
            updateDialog();
        }
    });

    document.getElementById('dialog-close').addEventListener('click', () => {
        movieDialog.close();
    });
    movieDialog.addEventListener('click', (event) => {
        if (event.target === movieDialog) movieDialog.close();
    });
    dialogWatchlist.addEventListener('click', () => {
        if (state.selectedMovie) toggleWatchlist(state.selectedMovie);
        updateDialog();
    });
    dialogWatched.addEventListener('click', () => {
        if (state.selectedMovie) toggleWatched(state.selectedMovie);
        updateDialog();
    });
    document.getElementById('save-rating').addEventListener('click', () => {
        if (!state.selectedMovie) return;
        const rating = Number(personalRating.value);
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            setStatus('Choose a rating from 1 to 5 stars before saving.');
            return;
        }
        updateSavedMovie(state.selectedMovie, { personalRating: rating });
        updateDialog();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupMovieActions();
    try {
        state.watchlist = loadWatchlist();
    } catch (error) {
        console.error('[CineMatch] Could not load the saved watchlist:', error);
        state.storageError = error.message;
        setStatus(`Could not load your saved watchlist: ${error.message}`);
    }

    const searchForm = document.querySelector('.search-form');
    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        window.clearTimeout(searchTimer);
        fetchHomeMovies();
    });
    searchInput.addEventListener('input', () => {
        state.requestId += 1;
        window.clearTimeout(searchTimer);
        searchTimer = window.setTimeout(fetchHomeMovies, 300);
    });
    genreSelect.addEventListener('change', fetchHomeMovies);
    sortSelect.addEventListener('change', renderMovies);

    setView(window.location.hash.slice(1) || 'home');
    loadInitialData();
});
