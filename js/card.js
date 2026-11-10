import * as api from './api.js';
import * as mylist from './mylist.js';
import { openModal } from './modal.js';
import { el, toast, year, rating } from './dom.js';

const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
const PREVIEW_DELAY = 700;

export function createCard(movie) {
  const poster = api.img(movie.poster_path);
  const media = el(
    'div',
    { class: 'card__media' },
    poster
      ? el('img', { src: poster, alt: `${movie.title} 포스터`, loading: 'lazy', decoding: 'async' })
      : el('div', { class: 'card__noposter' }, movie.title),
    movie.vote_average ? el('span', { class: 'card__score' }, `★ ${rating(movie.vote_average)}`) : null,
  );

  const likeBtn = el('button', { class: 'card__like', type: 'button' });
  const syncLike = () => {
    const on = mylist.has(movie.id);
    likeBtn.textContent = on ? '✓' : '＋';
    likeBtn.setAttribute('aria-label', on ? `${movie.title} 찜 해제` : `${movie.title} 찜하기`);
    likeBtn.setAttribute('aria-pressed', String(on));
  };
  likeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toast(mylist.toggle(movie) ? '찜 목록에 추가했어요' : '찜 목록에서 뺐어요');
  });
  mylist.onChange(syncLike);
  syncLike();

  const open = el(
    'button',
    { class: 'card__open', type: 'button', onclick: () => openModal(movie.id) },
    el('span', { class: 'sr-only' }, `${movie.title} 상세 보기`),
  );

  const card = el(
    'article',
    { class: 'card' },
    media,
    el(
      'div',
      { class: 'card__info' },
      el('h3', { class: 'card__title', title: movie.title }, movie.title),
      el('span', { class: 'card__year' }, year(movie.release_date)),
    ),
    open,
    likeBtn,
  );

  if (canHover) attachPreview(card, media, movie.id);
  return card;
}

// 카드에 잠시 머물면 예고편을 음소거 상태로 재생한다. 마우스가 벗어나면 iframe을 제거한다.
function attachPreview(card, media, id) {
  let timer = 0;
  let frame = null;
  card.addEventListener('mouseenter', () => {
    timer = setTimeout(async () => {
      try {
        const key = await api.trailerKey(id);
        if (!key || !card.matches(':hover')) return;
        frame = el('iframe', {
          class: 'card__preview',
          src: api.embedUrl(key, { controls: 0 }),
          title: '예고편 미리보기',
          tabindex: '-1',
          allow: 'autoplay; encrypted-media',
        });
        media.append(frame);
      } catch {
        // 미리보기는 부가 기능이라 실패해도 조용히 넘어간다.
      }
    }, PREVIEW_DELAY);
  });
  card.addEventListener('mouseleave', () => {
    clearTimeout(timer);
    frame?.remove();
    frame = null;
  });
}
