const WATCHLIST_KEY = 'cinematch-watchlist-v1';

/** Load the saved watchlist from this browser. */
export function loadWatchlist() {
    const stored = localStorage.getItem(WATCHLIST_KEY);
    if (!stored) return [];

    const movies = JSON.parse(stored);
    if (!Array.isArray(movies)) {
        throw new Error('Saved watchlist data is not a valid list.');
    }

    return movies.filter((movie) =>
        movie && Number.isFinite(Number(movie.id)) && typeof movie.title === 'string'
    );
}

/** Persist the complete watchlist to this browser. */
export function saveWatchlist(movies) {
    if (!Array.isArray(movies)) {
        throw new TypeError('Watchlist must be an array of movies.');
    }
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(movies));
}
