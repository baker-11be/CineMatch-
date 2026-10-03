// ============================================================================
// CineMatch — tmdbApi.js
// ----------------------------------------------------------------------------
// All communication with The Movie Database (TMDB) lives here so the rest of
// the app never has to build URLs or know about image sizing.
//
// Exports:
//   TMDB_BASE, IMG_BASE                 - base URLs
//   POSTER_SIZE, BACKDROP_SIZE          - default image sizes
//   imageUrl(path, size)                - full image URL from a TMDB path
//   posterUrl(path), backdropUrl(path)   - convenience helpers
//   getTrendingMovies(timeWindow)        - /trending/movie/{day|week}
//   searchMovies(query, page)            - /search/movie
//   discoverMovies(params)               - /discover/movie
//   getGenres()                          - /genre/movie/list
// ============================================================================

import { API_KEY } from './config.js';

export const TMDB_BASE = 'https://api.themoviedb.org/3';
export const IMG_BASE = 'https://image.tmdb.org/t/p/';

export const POSTER_SIZE = 'w500';
export const BACKDROP_SIZE = 'w780';

/**
 * Build a full image URL from a TMDB image path.
 * Returns an empty string when the path is missing so callers can fall back
 * to a local placeholder instead of a broken image.
 * @param {string|null|undefined} path - e.g. "/abc123.jpg"
 * @param {string} [size] - TMDB image size segment, e.g. "w500"
 * @returns {string}
 */
export function imageUrl(path, size = POSTER_SIZE) {
    if (!path) return '';
    return `${IMG_BASE}${size}${path}`;
}

/** Full poster URL (w500) for a movie's `poster_path`. */
export function posterUrl(path) {
    return imageUrl(path, POSTER_SIZE);
}

/** Full backdrop URL (w780) for a movie's `backdrop_path`. */
export function backdropUrl(path) {
    return imageUrl(path, BACKDROP_SIZE);
}

/**
 * Low-level TMDB request helper. Builds a URL with the API key and language,
 * fetches it, and returns the parsed JSON. Throws on any failure so callers
 * can decide how to handle errors.
 * @param {string} endpoint - e.g. "/trending/movie/day"
 * @param {Object} [params] - extra query parameters
 * @returns {Promise<Object>}
 */
async function tmdbFetch(endpoint, params = {}) {
    if (!API_KEY || API_KEY === 'YOUR_TMDB_API_KEY_HERE') {
        throw new Error(
            'Missing TMDB API key. Add your key to config.js (see README.md).'
        );
    }

    const url = new URL(`${TMDB_BASE}${endpoint}`);
    url.searchParams.set('api_key', API_KEY);
    url.searchParams.set('language', 'en-US');

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.set(key, value);
        }
    });

    const response = await fetch(url.toString(), {
        headers: { accept: 'application/json' }
    });

    if (!response.ok) {
        throw new Error(`TMDB request failed (${response.status}) for ${endpoint}`);
    }

    return response.json();
}

/**
 * Trending movies for the day or week. Returns [] on any error.
 * @param {'day'|'week'} [timeWindow]
 * @returns {Promise<Array>}
 */
export async function getTrendingMovies(timeWindow = 'day') {
    try {
        const data = await tmdbFetch(`/trending/movie/${timeWindow}`);
        return Array.isArray(data.results) ? data.results : [];
    } catch (error) {
        console.error('[tmdbApi] getTrendingMovies failed:', error);
        return [];
    }
}

/**
 * Search movies by title. Returns [] on any error.
 * @param {string} query
 * @param {number} [page]
 * @returns {Promise<Array>}
 */
export async function searchMovies(query, page = 1) {
    try {
        const data = await tmdbFetch('/search/movie', {
            query,
            page,
            include_adult: false
        });
        return Array.isArray(data.results) ? data.results : [];
    } catch (error) {
        console.error('[tmdbApi] searchMovies failed:', error);
        return [];
    }
}

/**
 * Discover movies using TMDB discover filters (genres, sorting, etc.).
 * Returns [] on any error.
 * @param {Object} [params] - e.g. { with_genres: '28', sort_by: 'vote_average.desc' }
 * @returns {Promise<Array>}
 */
export async function discoverMovies(params = {}) {
    try {
        const data = await tmdbFetch('/discover/movie', params);
        return Array.isArray(data.results) ? data.results : [];
    } catch (error) {
        console.error('[tmdbApi] discoverMovies failed:', error);
        return [];
    }
}

/**
 * The official TMDB genre list: [{ id, name }, ...]. Returns [] on any error.
 * @returns {Promise<Array>}
 */
export async function getGenres() {
    try {
        const data = await tmdbFetch('/genre/movie/list');
        return Array.isArray(data.genres) ? data.genres : [];
    } catch (error) {
        console.error('[tmdbApi] getGenres failed:', error);
        return [];
    }
}