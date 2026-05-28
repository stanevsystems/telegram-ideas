const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('search');

const MIN_QUERY_LENGTH = 3;

let ideas = [];
let filteredIdeas = [];
let activeMatchIndex = -1;
let currentQuery = '';

const searchUi = createSearchUi();

async function loadData() {
  const response = await fetch(`./ideas.json?v=${Date.now()}`);
  ideas = await response.json();
  applySearch();
}

function createSearchUi() {
  const controls = document.createElement('div');
  controls.className = 'search-controls';
  controls.innerHTML = `
    <button type="button" id="searchPrev" class="search-nav">◀</button>
    <span id="searchStatus" class="search-status">Введите минимум 3 символа</span>
    <button type="button" id="searchNext" class="search-nav">▶</button>
  `;

  searchInput.insertAdjacentElement('afterend', controls);

  const prevButton = controls.querySelector('#searchPrev');
  const nextButton = controls.querySelector('#searchNext');
  const status = controls.querySelector('#searchStatus');

  prevButton.addEventListener('click', () => shiftMatch(-1));
  nextButton.addEventListener('click', () => shiftMatch(1));

  return {
    prevButton,
    nextButton,
    status,
  };
}

function renderTable(data, activeIndex = -1) {
  tableBody.innerHTML = '';

  if (data.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="3">Ничего не найдено</td>';
    tableBody.appendChild(row);
    return;
  }

  data.forEach((item, index) => {
    const row = document.createElement('tr');
    row.dataset.rowIndex = String(index);
    if (index === activeIndex) {
      row.classList.add('active-match');
    }

    const isActiveRow = index === activeIndex;
    row.innerHTML = `
      <td>${escapeHtml(item.date)}</td>
      <td>${highlightText(item.author, currentQuery, isActiveRow)}</td>
      <td>${highlightText(item.text, currentQuery, isActiveRow)}</td>
    `;

    tableBody.appendChild(row);
  });

  if (activeIndex >= 0) {
    const activeRow = tableBody.querySelector(`tr[data-row-index="${activeIndex}"]`);
    if (activeRow) {
      activeRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }
}

function escapeHtml(text) {
  return String(text ?? '—')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightText(text, query, isActiveRow = false) {
  const source = String(text ?? '—');
  if (!query || query.length < MIN_QUERY_LENGTH) {
    return escapeHtml(source);
  }

  const pattern = new RegExp(escapeRegExp(query), 'ig');
  let result = '';
  let lastIndex = 0;
  let match = pattern.exec(source);

  while (match) {
    const start = match.index;
    const end = start + match[0].length;
    result += escapeHtml(source.slice(lastIndex, start));
    const hitClass = isActiveRow ? 'search-hit search-hit-active' : 'search-hit';
    result += `<mark class="${hitClass}">${escapeHtml(source.slice(start, end))}</mark>`;
    lastIndex = end;
    match = pattern.exec(source);
  }

  if (lastIndex === 0) {
    return escapeHtml(source);
  }

  result += escapeHtml(source.slice(lastIndex));
  return result;
}

function applySearch() {
  const query = searchInput.value.trim().toLowerCase();
  currentQuery = query;

  if (query.length < MIN_QUERY_LENGTH) {
    filteredIdeas = ideas;
    activeMatchIndex = -1;
    searchUi.status.textContent = `Введите минимум ${MIN_QUERY_LENGTH} символа`;
    toggleNavButtons(false);
    renderTable(filteredIdeas);
    return;
  }

  filteredIdeas = ideas.filter(item => {
    const author = String(item.author ?? '').toLowerCase();
    const message = String(item.text ?? '').toLowerCase();
    return author.includes(query) || message.includes(query);
  });

  if (filteredIdeas.length === 0) {
    activeMatchIndex = -1;
    searchUi.status.textContent = 'Совпадений нет';
    toggleNavButtons(false);
    renderTable(filteredIdeas);
    return;
  }

  activeMatchIndex = 0;
  updateSearchStatus();
  toggleNavButtons(filteredIdeas.length > 1);
  renderTable(filteredIdeas, activeMatchIndex);
}

function shiftMatch(step) {
  if (filteredIdeas.length === 0 || activeMatchIndex < 0) {
    return;
  }

  activeMatchIndex = (activeMatchIndex + step + filteredIdeas.length) % filteredIdeas.length;
  updateSearchStatus();
  renderTable(filteredIdeas, activeMatchIndex);
}

function updateSearchStatus() {
  searchUi.status.textContent = `${activeMatchIndex + 1} из ${filteredIdeas.length}`;
}

function toggleNavButtons(enabled) {
  searchUi.prevButton.disabled = !enabled;
  searchUi.nextButton.disabled = !enabled;
}

searchInput.addEventListener('input', applySearch);
searchInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    shiftMatch(event.shiftKey ? -1 : 1);
  }
});

loadData();