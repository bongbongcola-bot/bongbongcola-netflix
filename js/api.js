const BASE = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p';
const PATH_RE = /^\/[\w.-]+$/;
const YT_RE = /^[\w-]{11}$/;

export const img = (path, size = 'w342') =>
  typeof path === 'string' && PATH_RE.test(path) ? `${IMG}/${size}${path}` : null;

export class NoKeyError extends Error {}

async function get(path, params = {}) {
  const key = window.APP_CONFIG?.TMDB_API_KEY;
  if (!key) throw new NoKeyError('API 키가 없어요');
  const url = new URL(BASE + path);
  url.search = new URLSearchParams({ api_key: key, language: 'ko-KR', region: 'KR', ...params });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB 요청 실패 (${res.status})`);
  return res.json();
}

const results = async (path, params) => (await get(path, params)).results ?? [];

export const nowPlaying = (page = 1) => results('/movie/now_playing', { page });
export const popular = () => results('/movie/popular');
export const topRated = () => results('/movie/top_rated');
export const upcoming = () => results('/movie/upcoming');
export const byGenre = (genreId) =>
  results('/discover/movie', { with_genres: genreId, sort_by: 'popularity.desc', 'vote_count.gte': 100 });

export function search(query, page = 1) {
  return get('/search/movie', { query, page, include_adult: false });
}

export function pool(genreIds) {
  const params = { sort_by: 'popularity.desc', 'vote_count.gte': 300, page: 1 + Math.floor(Math.random() * 5) };
  if (genreIds.length) params.with_genres = genreIds.join('|');
  return results('/discover/movie', params);
}

const detailCache = new Map();
export function details(id) {
  if (!detailCache.has(id)) {
    const request = get(`/movie/${id}`, {
      append_to_response: 'videos,credits,recommendations',
      include_video_language: 'ko,en,null',
    }).catch((e) => {
      detailCache.delete(id);
      throw e;
    });
    detailCache.set(id, request);
  }
  return detailCache.get(id);
}

export function pickTrailerKey(movie) {
  const videos = (movie.videos?.results ?? []).filter((v) => v.site === 'YouTube' && YT_RE.test(v.key));
  const best =
    videos.find((v) => v.type === 'Trailer' && v.official) ??
    videos.find((v) => v.type === 'Trailer') ??
    videos.find((v) => v.type === 'Teaser');
  return best?.key ?? null;
}

export const trailerKey = async (id) => pickTrailerKey(await details(id));

export const embedUrl = (key, { controls = 1 } = {}) =>
  `https://www.youtube-nocookie.com/embed/${key}?autoplay=1&mute=1&controls=${controls}&playsinline=1&rel=0&modestbranding=1&loop=1&playlist=${key}`;
