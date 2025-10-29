const screenElement = document.getElementById('screen');
const screenLabel = document.getElementById('screenLabel');
const quickActionButton = document.getElementById('quickAction');
const navButtons = Array.from(document.querySelectorAll('.nav-button'));

const screens = {
  home: {
    label: 'Головна',
    render: () => `
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Сьогодні</h2>
          <button class="section-action" type="button">Переглянути все</button>
        </div>
        <div class="card-list">
          ${renderTaskCard({
            title: 'Фічер: оплата підписки',
            time: '09:00 – 11:00',
            tags: ['Дизайн', 'UI kit'],
          })}
          ${renderTaskCard({
            title: 'Зідзвон з маркетингом',
            time: '13:30 – 14:00',
            tags: ['Дослідження'],
          })}
        </div>
      </section>
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Фокус</h2>
          <button class="section-action" type="button">Редагувати</button>
        </div>
        <div class="chip-group">
          <span class="chip">Гейміфікація</span>
          <span class="chip">Спліт-тести</span>
          <span class="chip">Ретеншн</span>
        </div>
      </section>
    `,
  },
  schedule: {
    label: 'Розклад',
    render: () => `
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Спітрек тижня</h2>
          <button class="section-action" type="button">Синхронізувати</button>
        </div>
        <div class="card-list">
          ${renderTimelineCard({
            day: 'Пн',
            items: [
              { label: 'Онбординг нових користувачів', time: '10:00' },
              { label: 'UX ревʼю', time: '15:00' },
            ],
          })}
          ${renderTimelineCard({
            day: 'Вт',
            items: [
              { label: 'Команда Growth', time: '09:30' },
              { label: 'Підготовка презентації', time: '16:00' },
            ],
          })}
        </div>
      </section>
    `,
  },
  insights: {
    label: 'Аналітика',
    render: () => `
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Показники</h2>
          <button class="section-action" type="button">Експорт</button>
        </div>
        <div class="card-list">
          ${renderInsightCard({
            metric: 'Активні користувачі',
            value: '12 480',
            trend: '+8.5% з минулого тижня',
          })}
          ${renderInsightCard({
            metric: 'Середній час в застосунку',
            value: '14 хв',
            trend: '+1.2 хв',
          })}
        </div>
      </section>
    `,
  },
  profile: {
    label: 'Профіль',
    render: () => `
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Марія Іванчук</h2>
          <button class="section-action" type="button">Налаштування</button>
        </div>
        <div class="card-list">
          <div class="card" data-card>
            <h3 class="card-title">Роль</h3>
            <p class="card-meta">Lead Product Designer</p>
          </div>
          <div class="card" data-card>
            <h3 class="card-title">Цілі на квартал</h3>
            <p class="card-meta">Запустити нову систему онбордингу та збільшити конверсію активних користувачів.</p>
          </div>
        </div>
      </section>
    `,
  },
};

function renderTaskCard(task) {
  return `
    <article class="card" data-card>
      <h3 class="card-title">${task.title}</h3>
      <p class="card-meta">${task.time}</p>
      <div class="chip-group">
        ${task.tags.map((tag) => `<span class="chip">${tag}</span>`).join('')}
      </div>
    </article>
  `;
}

function renderTimelineCard({ day, items }) {
  return `
    <article class="card" data-card>
      <h3 class="card-title">${day}</h3>
      ${items.map((item) => `<p class="card-meta">${item.time} · ${item.label}</p>`).join('')}
    </article>
  `;
}

function renderInsightCard({ metric, value, trend }) {
  return `
    <article class="card" data-card>
      <h3 class="card-title">${metric}</h3>
      <strong>${value}</strong>
      <p class="card-meta">${trend}</p>
    </article>
  `;
}

function updateScreen(key) {
  const screen = screens[key];
  if (!screen) return;
  screenElement.innerHTML = screen.render();
  screenLabel.textContent = screen.label;
  screenElement.focus({ preventScroll: true });
  navButtons.forEach((button) => {
    const isActive = button.dataset.screen === key;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
  hydrateCards();
}

function hydrateCards() {
  const cards = screenElement.querySelectorAll('[data-card]');
  cards.forEach((card) => {
    card.addEventListener('click', () => {
      const meta = card.querySelector('.card-meta');
      if (!meta) return;
      const expanded = card.dataset.expanded === 'true';
      if (expanded) {
        card.dataset.expanded = 'false';
        meta.textContent = meta.dataset.original;
      } else {
        meta.dataset.original = meta.textContent;
        card.dataset.expanded = 'true';
        meta.textContent = 'Нотатка: це демо-картка для тестування сценаріїв.';
      }
    });
  });
}

navButtons.forEach((button) => {
  button.addEventListener('click', () => updateScreen(button.dataset.screen));
});

quickActionButton.addEventListener('click', () => {
  const list = screenElement.querySelector('.card-list');
  if (!list) return;
  const mockCard = document.createElement('article');
  mockCard.className = 'card';
  mockCard.innerHTML = `
    <h3 class="card-title">Нова макетна задача</h3>
    <p class="card-meta">Додана о ${new Date().toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
    })}</p>
  `;
  mockCard.dataset.card = '';
  list.prepend(mockCard);
  hydrateCards();
});

updateScreen('home');
