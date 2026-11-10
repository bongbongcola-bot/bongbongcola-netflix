import { createCard } from './card.js';
import { el } from './dom.js';

export function createRow(id, title) {
  const scroller = el('div', { class: 'row__scroller', tabindex: '-1' });
  const section = el(
    'section',
    { class: 'row', id: `row-${id}` },
    el('h2', { class: 'row__title' }, title),
    el(
      'div',
      { class: 'row__wrap' },
      el('button', { class: 'row__arrow row__arrow--prev', type: 'button', 'aria-label': `${title} 이전`, onclick: () => scrollBy(scroller, -1) }, '‹'),
      scroller,
      el('button', { class: 'row__arrow row__arrow--next', type: 'button', 'aria-label': `${title} 다음`, onclick: () => scrollBy(scroller, 1) }, '›'),
    ),
  );
  fill(scroller, null);
  return { section, set: (movies) => fill(scroller, movies) };
}

function scrollBy(scroller, dir) {
  scroller.scrollBy({ left: dir * scroller.clientWidth * 0.85, behavior: 'smooth' });
}

function fill(scroller, movies) {
  if (!movies) {
    scroller.replaceChildren(...Array.from({ length: 8 }, () => el('div', { class: 'card card--skeleton' })));
    return;
  }
  scroller.replaceChildren(...movies.map(createCard));
}
