const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('search');
const sortDateButton = document.getElementById('sortDate');

let ideas = [];
let descending = true;

async function loadData() {
    const response = await fetch(
        `./ideas.json?v=${Date.now()}`
    );

  ideas = await response.json();

  renderTable(ideas);
}

function renderTable(data) {
  tableBody.innerHTML = '';

  data.forEach(item => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${formatDate(item.date)}</td>
      <td>${escapeHtml(item.author)}</td>
      <td>придумал</td>
      <td>${escapeHtml(item.text)}</td>
    `;

    tableBody.appendChild(row);
  });
}

function formatDate(dateString) {
    if (!dateString) {
      return '—';
    }
  
    const date = new Date(dateString);
  
    if (isNaN(date.getTime())) {
      return dateString;
    }
  
    return date.toLocaleString('ru-RU');
  }

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

searchInput.addEventListener('input', event => {
  const query = event.target.value.toLowerCase();

  const filtered = ideas.filter(item => {
    return (
      item.text.toLowerCase().includes(query) ||
      item.author.toLowerCase().includes(query)
    );
  });

  renderTable(filtered);
});

sortDateButton.addEventListener('click', () => {
  descending = !descending;

  const sorted = [...ideas].sort((a, b) => {
    const left = new Date(a.date);
    const right = new Date(b.date);

    return descending
      ? right - left
      : left - right;
  });

  renderTable(sorted);

  sortDateButton.innerText = descending
    ? 'Дата ↓'
    : 'Дата ↑';
});

loadData();