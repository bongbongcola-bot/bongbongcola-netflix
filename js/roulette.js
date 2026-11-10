import * as api from './api.js';
import { openModal } from './modal.js';
import { applyMood } from './mood.js';
import { el, year, rating } from './dom.js';

const dialog = document.getElementById('roulette');
const MOODS = [
  { label: '😆 신나게', genres: [28, 12, 35] },
  { label: '😭 눈물 펑펑', genres: [18, 10749] },
  { label: '😱 소름 돋게', genres: [27, 53] },
  { label: '🧠 머리 쓰게', genres: [9648, 878] },
  { label: '🧸 가볍게', genres: [16, 10751, 35] },
  { label: '🎲 아무거나', genres: [] },
];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
let selected = MOODS[5];
let spinning = false;
let token = 0;

dialog.addEventListener('click', (e) => {
  if (e.target === dialog) dialog.close();
});
dialog.addEventListener('close', () => {
  token++;
  spinning = false;
  dialog.replaceChildren();
});

export function openRoulette() {
  render();
  if (!dialog.open) dialog.showModal();
}

function render() {
  const reel = el('div', { class: 'reel', 'aria-live': 'polite' }, el('div', { class: 'reel__empty' }, '❓'));
  const result = el('div', { class: 'roulette__result' });
  const spinBtn = el('button', { class: 'btn', type: 'button' }, '돌려라!');
  const chips = MOODS.map((m) =>
    el('button', {
      class: 'chip',
      type: 'button',
      'aria-pressed': String(m === selected),
      onclick: (e) => {
        selected = m;
        chips.forEach((c) => c.setAttribute('aria-pressed', String(c === e.currentTarget)));
      },
    }, m.label),
  );

  spinBtn.addEventListener('click', () => spin(reel, result, spinBtn));
  dialog.replaceChildren(
    el('button', { class: 'modal__close', type: 'button', 'aria-label': '닫기', onclick: () => dialog.close() }, '✕'),
    el(
      'div',
      { class: 'modal__body roulette' },
      el('h2', {}, '오늘 뭐 볼까?'),
      el('p', { class: 'muted' }, '기분을 고르고 룰렛을 돌려보세요.'),
      el('div', { class: 'chip-row' }, chips),
      reel,
      spinBtn,
      result,
    ),
  );
}

async function spin(reel, result, button) {
  if (spinning) return;
  spinning = true;
  const mine = ++token;
  button.disabled = true;
  result.replaceChildren();
  try {
    const candidates = (await api.pool(selected.genres)).filter((m) => api.img(m.poster_path));
    if (mine !== token) return;
    if (candidates.length < 2) throw new Error('후보 부족');
    const winner = candidates[Math.floor(Math.random() * candidates.length)];
    await animate(reel, candidates, winner, mine);
    if (mine !== token) return;
    reveal(result, winner);
    applyMood(api.img(winner.poster_path, 'w185'));
  } catch {
    if (mine === token) result.replaceChildren(el('p', { class: 'muted' }, '후보를 불러오지 못했어요. 다시 돌려보세요.'));
  } finally {
    if (mine === token) {
      spinning = false;
      button.disabled = false;
      button.textContent = '다시 돌리기';
    }
  }
}

// 포스터를 빠르게 넘기다가 점점 느려지며 당첨작에서 멈춘다.
async function animate(reel, candidates, winner, mine) {
  const show = (m) => {
    reel.replaceChildren(el('img', { src: api.img(m.poster_path, 'w342'), alt: m === winner ? `${m.title} 포스터` : '' }));
    reel.classList.toggle('reel--spinning', m !== winner);
  };
  if (reduceMotion.matches) return show(winner);
  const frames = 22;
  for (let i = 0; i < frames; i++) {
    show(candidates[(i * 7 + Math.floor(Math.random() * 3)) % candidates.length]);
    await new Promise((r) => setTimeout(r, 60 + i * i * 1.1));
    if (mine !== token) return;
  }
  show(winner);
}

function reveal(result, movie) {
  result.replaceChildren(
    el('h3', { class: 'roulette__title' }, movie.title),
    el('p', { class: 'meta' }, el('span', { class: 'meta__score' }, `★ ${rating(movie.vote_average)}`), el('span', {}, year(movie.release_date))),
    el('p', { class: 'overview overview--clamp' }, movie.overview || '줄거리 정보가 아직 없어요.'),
    el(
      'button',
      {
        class: 'btn btn--ghost',
        type: 'button',
        onclick: () => {
          dialog.close();
          openModal(movie.id);
        },
      },
      '상세 보기',
    ),
  );
}
