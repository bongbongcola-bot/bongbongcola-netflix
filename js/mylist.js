const KEY = 'bbf-mylist';
const listeners = new Set();

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY));
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((m) => m && Number.isInteger(m.id) && typeof m.title === 'string');
  } catch {
    return [];
  }
}

let items = load();

function save() {
  localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((fn) => fn(items));
}

export const getList = () => items;
export const has = (id) => items.some((m) => m.id === id);
export const onChange = (fn) => listeners.add(fn);

export function toggle(movie) {
  if (has(movie.id)) {
    items = items.filter((m) => m.id !== movie.id);
  } else {
    items = [
      {
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path ?? null,
        backdrop_path: movie.backdrop_path ?? null,
        vote_average: movie.vote_average ?? 0,
      },
      ...items,
    ];
  }
  save();
  return has(movie.id);
}
