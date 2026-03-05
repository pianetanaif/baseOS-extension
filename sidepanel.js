// sidepanel.js

// ── State ───────────────────────────────────────────────
let pageData = null;
let currentTags = [];
let allItems = [];
let activeFilterTags = new Set();
let currentSummary = '';

// ── Tab Switching ───────────────────────────────────────
function showView(name) {
  ['save','list','todo','settings'].forEach(k => {
    document.getElementById(`view-${k}`).classList.toggle('active', k === name);
    document.getElementById(`btn-${k}`).classList.toggle('active', k === name);
  });
  if (name === 'list') renderList();
  if (name === 'todo') renderTodos();
  if (name === 'settings') loadSettings();
}

document.getElementById('btn-save').addEventListener('click', () => showView('save'));
document.getElementById('btn-list').addEventListener('click', () => showView('list'));
document.getElementById('btn-todo').addEventListener('click', () => showView('todo'));
document.getElementById('btn-settings').addEventListener('click', () => showView('settings'));

// ════════════════════════════════════════════
// SAVE VIEW
// ════════════════════════════════════════════
async function initSaveView() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    document.getElementById('page-title').textContent = tab.title || tab.url;
    document.getElementById('page-url').textContent = tab.url;

    try {
      pageData = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_DATA' });
    } catch {
      pageData = { title: tab.title, url: tab.url, metaDesc: '' };
    }

    document.getElementById('page-title').textContent = pageData.title || tab.title;
    document.getElementById('page-url').textContent = pageData.url;

    const box = document.getElementById('summary-box');
    if (pageData.metaDesc) {
      box.textContent = pageData.metaDesc;
      box.classList.add('loaded');
    } else {
      box.textContent = 'No description available for this page.';
      box.classList.remove('loaded');
    }

    currentSummary = pageData.metaDesc || '';
  } catch (err) {
    console.error('initSaveView:', err);
  }
}

// Tags
const tagInput = document.getElementById('tag-input');
const tagsWrap = document.getElementById('tags-wrap');

tagInput.addEventListener('keydown', (e) => {
  const val = tagInput.value.trim().replace(/,/g, '').toLowerCase();
  if ((e.key === 'Enter' || e.key === ',') && val) {
    e.preventDefault();
    addTag(val);
    tagInput.value = '';
  }
  if (e.key === 'Backspace' && !tagInput.value && currentTags.length) {
    removeTag(currentTags[currentTags.length - 1]);
  }
});
tagsWrap.addEventListener('click', () => tagInput.focus());

function addTag(tag) {
  if (!tag || currentTags.includes(tag)) return;
  currentTags.push(tag);
  renderTagChips();
}
function removeTag(tag) {
  currentTags = currentTags.filter(t => t !== tag);
  renderTagChips();
}
function renderTagChips() {
  tagsWrap.querySelectorAll('.tag-chip').forEach(el => el.remove());
  currentTags.forEach(tag => {
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.innerHTML = `${esc(tag)}<span class="remove" data-tag="${esc(tag)}">×</span>`;
    chip.querySelector('.remove').addEventListener('click', () => removeTag(tag));
    tagsWrap.insertBefore(chip, tagInput);
  });
}

document.getElementById('save-btn').addEventListener('click', async () => {
  if (!pageData) return;
  const item = {
    id: Date.now().toString(),
    title: pageData.title || pageData.url,
    url: pageData.url,
    summary: currentSummary,
    notes: document.getElementById('notes-input').value.trim(),
    tags: [...currentTags],
    savedAt: new Date().toISOString()
  };
  const { savedItems = [] } = await chrome.storage.local.get('savedItems');
  const filtered = savedItems.filter(i => i.url !== item.url);
  filtered.unshift(item);
  await chrome.storage.local.set({ savedItems: filtered });

  const fb = document.getElementById('save-feedback');
  fb.textContent = 'Saved successfully';
  setTimeout(() => { fb.textContent = ''; }, 2500);

  document.getElementById('notes-input').value = '';
  currentTags = [];
  renderTagChips();
});

// ════════════════════════════════════════════
// LIST VIEW
// ════════════════════════════════════════════
async function renderList() {
  const { savedItems = [] } = await chrome.storage.local.get('savedItems');
  allItems = savedItems;

  const allTags = [...new Set(savedItems.flatMap(i => i.tags))].sort();
  const filterWrap = document.getElementById('tag-filter-wrap');
  filterWrap.innerHTML = '';
  allTags.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'filter-tag' + (activeFilterTags.has(tag) ? ' active' : '');
    btn.textContent = tag;
    btn.addEventListener('click', () => {
      if (activeFilterTags.has(tag)) activeFilterTags.delete(tag);
      else activeFilterTags.add(tag);
      renderList();
    });
    filterWrap.appendChild(btn);
  });
  renderItems();
}

function renderItems() {
  const query = document.getElementById('search-input').value.toLowerCase();
  const list = document.getElementById('items-list');
  const countLabel = document.getElementById('count-label');

  let filtered = allItems;
  if (activeFilterTags.size > 0) {
    filtered = filtered.filter(item => [...activeFilterTags].every(tag => item.tags.includes(tag)));
  }
  if (query) {
    filtered = filtered.filter(item =>
      item.title.toLowerCase().includes(query) ||
      (item.summary || '').toLowerCase().includes(query) ||
      (item.notes || '').toLowerCase().includes(query) ||
      item.tags.some(t => t.includes(query))
    );
  }

  list.innerHTML = '';
  countLabel.textContent = `${filtered.length} item${filtered.length !== 1 ? 's' : ''}`;

  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state">${allItems.length ? 'No results' : 'Nothing saved yet'}</div>`;
    return;
  }

  filtered.forEach(item => {
    const el = document.createElement('div');
    el.className = 'list-item';
    const dateStr = new Date(item.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const tagsHtml = item.tags.length
      ? `<span class="dot-sep"></span>` + item.tags.map(t => `<span class="item-tag">${esc(t)}</span>`).join('')
      : '';
    el.innerHTML = `
      <div class="item-title">${esc(item.title)}</div>
      ${item.summary ? `<div class="item-summary">${esc(item.summary)}</div>` : ''}
      ${item.notes   ? `<div class="item-notes">${esc(item.notes)}</div>` : ''}
      <div class="item-meta">
        <span class="item-date">${dateStr}</span>${tagsHtml}
      </div>
      <div class="item-actions">
        <button class="item-btn" data-url="${esc(item.url)}" title="Open">↗</button>
        <button class="item-btn del" data-id="${item.id}" title="Delete">×</button>
      </div>`;
    el.querySelector('[data-url]').addEventListener('click', e => { e.stopPropagation(); chrome.tabs.create({ url: item.url }); });
    el.querySelector('[data-id]').addEventListener('click',  e => { e.stopPropagation(); deleteItem(item.id); });
    list.appendChild(el);
  });
}

async function deleteItem(id) {
  const { savedItems = [] } = await chrome.storage.local.get('savedItems');
  await chrome.storage.local.set({ savedItems: savedItems.filter(i => i.id !== id) });
  allItems = allItems.filter(i => i.id !== id);
  renderList();
}

document.getElementById('search-input').addEventListener('input', renderItems);

document.getElementById('export-btn').addEventListener('click', async () => {
  const { savedItems = [] } = await chrome.storage.local.get('savedItems');
  if (!savedItems.length) return;
  const exportDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  let md = `# BaseOS — Saved Links\n\n*Exported ${exportDate}*\n\n---\n\n`;
  savedItems.forEach(item => {
    const date = new Date(item.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    md += `## [${item.title}](${item.url})\n\n`;
    if (item.summary) md += `> ${item.summary}\n\n`;
    if (item.notes)   md += `**Notes:** ${item.notes}\n\n`;
    if (item.tags.length) md += `**Tags:** ${item.tags.map(t => `#${t}`).join(' ')}\n\n`;
    md += `*Saved: ${date}*\n\n---\n\n`;
  });
  const blob = new Blob([md], { type: 'text/markdown' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `baseos-links-${Date.now()}.md`; a.click();
  URL.revokeObjectURL(url);
});

// ════════════════════════════════════════════
// TODO VIEW
// ════════════════════════════════════════════
async function renderTodos() {
  const { todos = [] } = await chrome.storage.local.get('todos');
  const list = document.getElementById('todo-list');
  const countEl = document.getElementById('todo-count');

  list.innerHTML = '';

  const pending = todos.filter(t => !t.done);
  const done    = todos.filter(t => t.done);
  const ordered = [...pending, ...done];

  countEl.textContent = `${pending.length} remaining`;

  if (!ordered.length) {
    list.innerHTML = '<div class="empty-state">no tasks yet</div>';
    return;
  }

  ordered.forEach(todo => {
    const el = document.createElement('div');
    el.className = 'todo-item' + (todo.done ? ' done' : '');
    el.innerHTML = `
      <div class="todo-checkbox" data-id="${todo.id}">
        <span class="check">✓</span>
      </div>
      <div class="todo-label">${esc(todo.text)}</div>
      <button class="todo-del" data-id="${todo.id}" title="Delete">×</button>`;
    el.querySelector('.todo-checkbox').addEventListener('click', () => toggleTodo(todo.id));
    el.querySelector('.todo-del').addEventListener('click', () => deleteTodo(todo.id));
    list.appendChild(el);
  });
}

async function addTodo(text) {
  if (!text.trim()) return;
  const { todos = [] } = await chrome.storage.local.get('todos');
  todos.unshift({ id: Date.now().toString(), text: text.trim(), done: false, createdAt: new Date().toISOString() });
  await chrome.storage.local.set({ todos });
  renderTodos();
}

async function toggleTodo(id) {
  const { todos = [] } = await chrome.storage.local.get('todos');
  const todo = todos.find(t => t.id === id);
  if (todo) todo.done = !todo.done;
  await chrome.storage.local.set({ todos });
  renderTodos();
}

async function deleteTodo(id) {
  const { todos = [] } = await chrome.storage.local.get('todos');
  await chrome.storage.local.set({ todos: todos.filter(t => t.id !== id) });
  renderTodos();
}

const todoInput = document.getElementById('todo-input');
todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && todoInput.value.trim()) {
    addTodo(todoInput.value);
    todoInput.value = '';
  }
});
document.getElementById('todo-add-btn').addEventListener('click', () => {
  if (todoInput.value.trim()) {
    addTodo(todoInput.value);
    todoInput.value = '';
  }
});

document.getElementById('clear-done-btn').addEventListener('click', async () => {
  const { todos = [] } = await chrome.storage.local.get('todos');
  await chrome.storage.local.set({ todos: todos.filter(t => !t.done) });
  renderTodos();
});

// ════════════════════════════════════════════
// SETTINGS
// ════════════════════════════════════════════
async function loadSettings() {
  const { apiKey = '' } = await chrome.storage.local.get('apiKey');
  document.getElementById('api-key-input').value = apiKey;
}

document.getElementById('settings-save-btn').addEventListener('click', async () => {
  const key = document.getElementById('api-key-input').value.trim();
  await chrome.storage.local.set({ apiKey: key });
  const fb = document.getElementById('settings-feedback');
  fb.textContent = 'Saved';
  setTimeout(() => { fb.textContent = ''; }, 2000);
});

// ════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════
function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ════════════════════════════════════════════
// ════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ════════════════════════════════════════════
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault();
    document.getElementById('save-btn').click();
  }
});

// ════════════════════════════════════════════
// BOOT
// ════════════════════════════════════════════
initSaveView();

chrome.tabs.onActivated.addListener(() => {
  pageData = null; currentTags = []; currentSummary = '';
  document.getElementById('notes-input').value = '';
  renderTagChips();
  initSaveView();
});
