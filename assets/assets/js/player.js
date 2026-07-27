/**
 * GoM3U TV v2 - Advanced HLS Player Engine
 */

let hlsPlayer = null;
let currentChannel = null;
let allChannels = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadChannelsData();
  const urlParams = new URLSearchParams(window.location.search);
  const channelId = urlParams.get('id') || (allChannels[0] ? allChannels[0].id : null);
  
  if (channelId) {
    initPlayer(channelId);
  }
  
  renderSidebarList();
  setupPlayerControls();
});

async function loadChannelsData() {
  const localData = localStorage.getItem('gom3u_custom_channels');
  if (localData) {
    allChannels = JSON.parse(localData);
  } else {
    try {
      const res = await fetch('./channels.json');
      allChannels = await res.json();
    } catch (e) {
      allChannels = [];
    }
  }
}

function initPlayer(channelId) {
  currentChannel = allChannels.find(c => c.id === channelId);
  if (!currentChannel) return;

  document.getElementById('playerChannelTitle').textContent = currentChannel.name;
  document.getElementById('playerChannelCategory').textContent = currentChannel.category || 'Live Stream';
  document.getElementById('playerChannelLogo').src = currentChannel.logo;

  const video = document.getElementById('videoPlayer');

  if (Hls.isSupported() && currentChannel.url.includes('.m3u8')) {
    if (hlsPlayer) hlsPlayer.destroy();
    
    hlsPlayer = new Hls({
      enableWorker: true,
      lowLatencyMode: true
    });
    hlsPlayer.loadSource(currentChannel.url);
    hlsPlayer.attachMedia(video);
    hlsPlayer.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play().catch(() => console.log('Autoplay blocked'));
    });
  } else if (video.canPlayType('application/vnd.apple.mpegurl') || currentChannel.url) {
    video.src = currentChannel.url;
    video.play().catch(() => console.log('Autoplay blocked'));
  }
  
  updateActiveSidebarItem();
}

function renderSidebarList() {
  const sidebar = document.getElementById('sidebarList');
  if (!sidebar) return;

  sidebar.innerHTML = allChannels.map(ch => `
    <div class="sidebar-item tv-focusable ${currentChannel && currentChannel.id === ch.id ? 'active' : ''}" 
         onclick="switchChannel('${ch.id}')" tabindex="0">
      <img src="${ch.logo}" onerror="this.src='https://picsum.photos/100'">
      <div>
        <div style="font-weight: 700; font-size: 0.9rem;">${ch.name}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">${ch.category || 'Live'}</div>
      </div>
    </div>
  `).join('');
}

function updateActiveSidebarItem() {
  document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
  renderSidebarList();
}

function switchChannel(id) {
  initPlayer(id);
}

function setupPlayerControls() {
  const video = document.getElementById('videoPlayer');
  const playBtn = document.getElementById('playPauseBtn');
  
  playBtn.addEventListener('click', () => {
    if (video.paused) {
      video.play();
      playBtn.innerHTML = '⏸';
    } else {
      video.pause();
      playBtn.innerHTML = '▶';
    }
  });

  document.getElementById('fullscreenBtn').addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.querySelector('.player-page').requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  });

  // Sidebar toggle
  document.getElementById('toggleSidebarBtn').addEventListener('click', () => {
    document.getElementById('playerSidebar').classList.toggle('hidden');
  });

  // TV Remote controls inside player
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' || e.key === 'Escape') {
      window.location.href = 'index.html';
    }
  });
}
