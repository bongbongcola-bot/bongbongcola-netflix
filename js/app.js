import * as api from './api.js';
import * as mylist from './mylist.js';
import { initMood, applyMood } from './mood.js';
import { openModal } from './modal.js';
import { openRoulette } from './roulette.js';
import { createRow } from './row.js';
import { createCard } from './card.js';
import { el, debounce } from './dom.js';

const $ = (id) => document.getElementById(id);
const rowsEl = $('rows');
const statusEl = $('status');

const ROWS = [
  { id: 'now_playing', title: '🎬 지금 극장에서', load: () => api.nowPlaying() },
  { id: 'popular', title: '🔥 요즘 인기', load: api.popular },
  { id: 'top_rated', title: '⭐ 평점 높은 영화', load: api.topRated },
  { id: 'upcoming', title: '📅 개봉 예정', load: api.upcoming },
  { id: 'g28', title: '💥 액션', load: () => api.byGenre(28) },
  { id: 'g35', title: '😂 코미디', load: () => api.byGenre(35) },
  { id: 'g878', title: '🚀 SF', load: () => api.byGenre(878) },
  { id: 'g27', title: '👻 공포', load: () => api.byGenre(27) },
  { id: 'g16', title: '🧸 애니메이션', load: () => api.byGenre(16) },
];

function showStatus(message, hint) {
  statusEl.replaceChildren(el('strong', {}, message), hint ? el('p', {}, hint) : null);
  statusEl.hidden = false;
}

function describe(error) {
  if (error instanceof api.NoKeyError) {
    return ['TMDB API 키가 설정되지 않았어요.', '.env 에 TMDB_API_KEY 를 넣고 `node serve.js` 로 다시 실행해 주세요.'];
  }
  return ['영화 정보를 불러오지 못했어요.', '네트워크 상태나 API 키가 올바른지 확인해 주세요.'];
}

// ---------- 히어로 ----------
function initHero(movies) {
  const hero = $('hero');
  const picks = movies.filter((m) => api.img(m.backdrop_path)).slice(0, 6);
  if (!picks.length) return;
  let index = 0;
  let timer = 0;

  const dots = picks.map((_, i) =>
    el('button', { class: 'hero__dot', type: 'button', 'aria-label': `${i + 1}번째 추천`, onclick: () => go(i, true) }),
  );
  const body = el('div', { class: 'hero__body' });
  const bg = el('img', { class: 'hero__bg', alt: '' });
  hero.replaceChildren(bg, el('div', { class: 'hero__shade' }), body, el('div', { class: 'hero__dots' }, dots));
  hero.hidden = false;

  function go(i, restart) {
    index = i;
    const m = picks[i];
    bg.classList.remove('in');
    bg.src = api.img(m.backdrop_path, 'w1280');
    bg.onload = () => bg.classList.add('in');
    body.replaceChildren(
      el('p', { class: 'hero__tag' }, '지금 상영 중'),
      el('h1', {}, m.title),
      el('p', { class: 'hero__overview' }, m.overview || ''),
      el(
        'div',
        { class: 'hero__actions' },
        el('button', { class: 'btn', type: 'button', onclick: () => openModal(m.id) }, 'ⓘ 상세 정보'),
        el('button', { class: 'btn btn--ghost', type: 'button', onclick: openRoulette }, '🎲 룰렛으로 고르기'),
      ),
    );
    dots.forEach((d, n) => d.setAttribute('aria-current', String(n === i)));
    applyMood(api.img(m.poster_path, 'w185'));
    if (restart) schedule();
  }
  function schedule() {
    clearInterval(timer);
    timer = setInterval(() => {
      if (!document.hidden && !hero.matches(':hover')) go((index + 1) % picks.length);
    }, 9000);
  }
  go(0);
  schedule();
}

// ---------- 행 (화면에 가까워질 때 로드) ----------
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      entry.target.__load();
    }
  },
  { rootMargin: '400px 0px' },
);

function mountRows() {
  for (const def of ROWS) {
    const row = createRow(def.id, def.title);
    row.section.__load = async () => {
      try {
        const movies = (await def.load()).filter((m) => api.img(m.poster_path));
        if (movies.length) row.set(movies);
        else row.section.remove();
      } catch (e) {
        row.section.remove();
        if (e instanceof api.NoKeyError) showStatus(...describe(e));
      }
    };
    rowsEl.append(row.section);
    observer.observe(row.section);
  }
}

// ---------- 내 찜 목록 ----------
function initMyList() {
  const navLink = $('nav-mylist');
  let section = null;
  const render = () => {
    section?.remove();
    section = null;
    const items = mylist.getList();
    navLink.hidden = !items.length;
    if (!items.length) return;
    const row = createRow('mylist', '❤️ 내 찜 목록');
    row.set(items);
    section = row.section;
    rowsEl.prepend(section);
  };
  mylist.onChange(render);
  render();
}

// ---------- 검색 ----------
function initSearch() {
  const input = $('search-input');
  const panel = $('search-results');
  const grid = $('search-grid');
  const title = $('search-title');
  const more = $('search-more');
  let query = '';
  let page = 1;
  let serial = 0;

  const toggleBrowse = (searching) => {
    panel.hidden = !searching;
    rowsEl.hidden = searching;
    $('hero').hidden = searching || !$('hero').childElementCount;
  };

  async function run(nextPage) {
    const mine = ++serial;
    try {
      const data = await api.search(query, nextPage);
      if (mine !== serial) return;
      const found = data.results.filter((m) => api.img(m.poster_path));
      if (nextPage === 1) grid.replaceChildren();
      grid.append(...found.map(createCard));
      page = nextPage;
      more.hidden = page >= data.total_pages;
      title.textContent = grid.childElementCount ? `“${query}” 검색 결과` : `“${query}” 검색 결과가 없어요`;
    } catch (e) {
      if (mine === serial) title.textContent = describe(e)[0];
    }
  }

  const onInput = debounce(() => {
    query = input.value.trim();
    if (!query) {
      serial++;
      toggleBrowse(false);
      return;
    }
    toggleBrowse(true);
    title.textContent = `“${query}” 검색 중…`;
    run(1);
  }, 350);

  input.addEventListener('input', onInput);
  $('search-form').addEventListener('submit', (e) => e.preventDefault());
  more.addEventListener('click', () => run(page + 1));
}

// ---------- 시작 ----------
function init() {
  initMood($('mood-btn'));
  $('roulette-btn').addEventListener('click', openRoulette);
  addEventListener('scroll', () => $('topbar').classList.toggle('topbar--solid', scrollY > 40), { passive: true });
  initMyList();
  initSearch();
  mountRows();
  api
    .nowPlaying()
    .then(initHero)
    .catch((e) => showStatus(...describe(e)));
}

init();
