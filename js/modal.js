import * as api from './api.js';
import * as mylist from './mylist.js';
import { applyMood } from './mood.js';
import { el, toast, year, rating } from './dom.js';

const dialog = document.getElementById('modal');
let current = 0;

dialog.addEventListener('click', (e) => {
  if (e.target === dialog) dialog.close();
});
dialog.addEventListener('close', () => {
  dialog.replaceChildren();
  current = 0;
});

export function closeModal() {
  if (dialog.open) dialog.close();
}

export async function openModal(id) {
  current = id;
  dialog.replaceChildren(
    el('button', { class: 'modal__close', type: 'button', 'aria-label': '닫기', onclick: closeModal }, '✕'),
    el('div', { class: 'modal__loading' }, '불러오는 중…'),
  );
  if (!dialog.open) dialog.showModal();
  try {
    const movie = await api.details(id);
    if (current === id) render(movie);
  } catch {
    if (current === id) {
      dialog.replaceChildren(
        el('button', { class: 'modal__close', type: 'button', 'aria-label': '닫기', onclick: closeModal }, '✕'),
        el('div', { class: 'modal__loading' }, '상세 정보를 불러오지 못했어요.'),
      );
    }
  }
}

function render(movie) {
  const backdrop = api.img(movie.backdrop_path, 'w1280');
  const trailer = api.pickTrailerKey(movie);
  const stage = el('div', { class: 'modal__stage' });
  const showBackdrop = () =>
    stage.replaceChildren(
      backdrop ? el('img', { src: backdrop, alt: '' }) : el('div', { class: 'modal__nobackdrop' }),
      el('div', { class: 'modal__fade' }),
    );
  const showTrailer = () => {
    stage.replaceChildren(
      el('iframe', {
        src: api.embedUrl(trailer),
        title: `${movie.title} 예고편`,
        allow: 'autoplay; encrypted-media; picture-in-picture',
        allowfullscreen: true,
        referrerpolicy: 'strict-origin-when-cross-origin',
      }),
    );
  };
  showBackdrop();

  const likeBtn = el('button', { class: 'btn btn--ghost', type: 'button' });
  const syncLike = () => {
    const on = mylist.has(movie.id);
    likeBtn.textContent = on ? '✓ 찜 완료' : '＋ 내 찜 목록';
    likeBtn.setAttribute('aria-pressed', String(on));
  };
  likeBtn.addEventListener('click', () => {
    toast(mylist.toggle(movie) ? '찜 목록에 추가했어요' : '찜 목록에서 뺐어요');
    syncLike();
  });
  syncLike();

  const buttons = el('div', { class: 'modal__actions' });
  if (trailer) {
    const playBtn = el('button', { class: 'btn', type: 'button' }, '▶ 예고편');
    let playing = false;
    playBtn.addEventListener('click', () => {
      playing = !playing;
      if (playing) showTrailer();
      else showBackdrop();
      playBtn.textContent = playing ? '■ 예고편 닫기' : '▶ 예고편';
    });
    buttons.append(playBtn);
  } else {
    buttons.append(el('span', { class: 'muted' }, '등록된 예고편이 없어요'));
  }
  buttons.append(likeBtn);

  const cast = (movie.credits?.cast ?? []).slice(0, 8).map((c) => el('li', {}, c.name));
  const similar = (movie.recommendations?.results ?? [])
    .filter((m) => api.img(m.poster_path))
    .slice(0, 10)
    .map((m) =>
      el(
        'button',
        { class: 'mini', type: 'button', title: m.title, onclick: () => openModal(m.id) },
        el('img', { src: api.img(m.poster_path, 'w185'), alt: m.title, loading: 'lazy' }),
      ),
    );

  dialog.replaceChildren(
    el('button', { class: 'modal__close', type: 'button', 'aria-label': '닫기', onclick: closeModal }, '✕'),
    stage,
    el(
      'div',
      { class: 'modal__body' },
      el('h2', {}, movie.title),
      movie.original_title && movie.original_title !== movie.title
        ? el('p', { class: 'muted' }, movie.original_title)
        : null,
      el(
        'p',
        { class: 'meta' },
        el('span', { class: 'meta__score' }, `★ ${rating(movie.vote_average)}`),
        el('span', {}, year(movie.release_date)),
        movie.runtime ? el('span', {}, `${movie.runtime}분`) : null,
      ),
      el('ul', { class: 'chips' }, (movie.genres ?? []).map((g) => el('li', {}, g.name))),
      movie.tagline ? el('p', { class: 'tagline' }, movie.tagline) : null,
      el('p', { class: 'overview' }, movie.overview || '줄거리 정보가 아직 없어요.'),
      buttons,
      cast.length ? el('h3', {}, '출연') : null,
      cast.length ? el('ul', { class: 'chips chips--plain' }, cast) : null,
      similar.length ? el('h3', {}, '비슷한 영화') : null,
      similar.length ? el('div', { class: 'minis' }, similar) : null,
    ),
  );
  applyMood(api.img(movie.poster_path, 'w185'));
}
