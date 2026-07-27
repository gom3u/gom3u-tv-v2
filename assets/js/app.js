/**
 * GoM3U TV v2 - Core Application Controller
 */

let channelsData = [];
let categoriesData = [];
let favorites = JSON.parse(localStorage.getItem('gom3u_favs') || '[]');
let currentCategory = 'cat-all';

document.addEventListener('DOMContentLoaded', async () => {
  initPWA();
  setupEventListeners();
  await loadNotice();
  await loadCategories();
  await loadChannels();
  initTVNavigation();
});

// Register PWA Service Worker
function initPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
      .catch(err => console.log('SW registration failed:', err));
  }
}

// Fetch Notice
async function loadNotice() {
  try {
    let notice = JSON.parse(localStorage.getItem('gom3u_notice'));
    if (!notice) {
      const res = await fetch('./notice.json');
      notice = await res.json();
    }
    if (notice && notice.active) {
      const banner = document.getElementById('noticeBanner');
      const content = document.getElementById('noticeContent');
      if (banner && content) {
        content.textContent = notice.message;
        banner.style.display = 'block';
      }
    }
  } catch (e) {
    console.warn('Notice loading fallback:', e);
  }
}

// Fetch Categories
async function loadCategories() {
  try {
    const res = await fetch('./categories.json');
    categoriesData = await res.json();
  } catch (e) {
    categoriesData = [
      { id: 'cat-all', name: 'All Channels', icon: '📺' },
      { id: 'cat-fav', name: 'Favorites', icon: '⭐' }
    ];
  }
  renderCategories();
}

function renderCategories() {
  const container = document.getElementById('categoriesScroll');
  if (!container) return;
  
  container.innerHTML = categoriesData.map(cat => `
    <button class="cat-btn tv-focusable ${cat.id === currentCategory ? 'active' : ''}" 
            onclick="selectCategory('${cat.id}')">
      ${cat.icon || ''} ${cat.name}
    </button>
  `).join('');
}

function selectCategory(catId) {
  currentCategory = catId;
  renderCategories();
  filterAndRenderChannels();
}

// Fetch Channels
async function loadChannels() {
  const localData = localStorage.getItem('gom3u_custom_channels');
  if (localData) {
    channelsData = JSON.parse(localData);
  } else {
    try {
      const res = await fetch('./channels.json');
      channelsData = await res.json();
    } catch (e) {
      channelsData = [];
    }
  }
  setupHeroBanner();
  filterAndRenderChannels();
}

function setupHeroBanner() {
  const hero = document.getElementById('heroBanner');
  if (!hero || channelsData.length === 0) return;
  
  const featured = channelsData.find(c => c.isFeatured) || channelsData[0];
  hero.style.backgroundImage = `linear-gradient(180deg, rgba(11, 12, 16, 0.2) 0%, #0b0c10 100%), url('${featured.logo}')`;
  document.getElementById('heroTitle').textContent = featured.name;
  document.getElementById('heroCategory').textContent = featured.category || 'Live Streaming';
  document.getElementById('heroPlayBtn').onclick = () => playChannel(featured.id);
}

function filterAndRenderChannels() {
  const grid = document.getElementById('channelsGrid');
  const searchVal = (document.getElementById('searchInput')?.value || '').toLowerCase();
  
  if (!grid) return;

  let filtered = channelsData.filter(ch => {
    const matchesSearch = ch.name.toLowerCase().includes(searchVal);
    if (!matchesSearch) return false;
    
    if (currentCategory === 'cat-fav') {
      return favorites.includes(ch.id);
    }
    if (currentCategory === 'cat-all') return true;
    
    const catObj = categoriesData.find(c => c.id === currentCategory);
    return catObj ? ch.category === catObj.name : true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">No channels found matching your criteria.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(ch => {
    const isFav = favorites.includes(ch.id);
    return `
      <div class="channel-card tv-focusable" onclick="playChannel('${ch.id}')" tabindex="0">
        <div class="card-thumb">
          <img src="${ch.logo}" alt="${ch.name}" onerror="this.src='https://picsum.photos/200?blur=2'">
          <div class="fav-star ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite('${ch.id}')">
            ${isFav ? '★' : '☆'}
          </div>
        </div>
        <div class="card-body">
          <div class="card-title">${ch.name}</div>
          <div class="card-category">${ch.category || 'General'}</div>
        </div>
      </div>
    `;
  }).join('');
}

function toggleFavorite(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(favId => favId !== id);
  } else {
    favorites.push(id);
  }
  localStorage.setItem('gom3u_favs', JSON.stringify(favorites));
  filterAndRenderChannels();
}

function playChannel(id) {
  window.location.href = `player.html?id=${id}`;
}

function setupEventListeners() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', filterAndRenderChannels);
  }
}

// Android TV / D-Pad Remote Navigation System
function initTVNavigation() {
  document.addEventListener('keydown', (e) => {
    const focusable = Array.from(document.querySelectorAll('.tv-focusable, button, input, [tabindex="0"]'));
    const active = document.activeElement;
    let index = focusable.indexOf(active);

    if (index === -1 && focusable.length > 0) {
      focusable[0].focus();
      return;
    }

    switch (e.key) {
      case 'ArrowRight':
        if (index < focusable.length - 1) focusable[index + 1].focus();
        break;
      case 'ArrowLeft':
        if (index > 0) focusable[index - 1].focus();
        break;
      case 'ArrowDown':
        // Find element below spatially
        if (index + 4 < focusable.length) focusable[index + 4].focus();
        break;
      case 'ArrowUp':
        // Find element above spatially
        if (index - 4 >= 0) focusable[index - 4].focus();
        break;
      case 'Enter':
        active.click();
        break;
    }
  });
}
