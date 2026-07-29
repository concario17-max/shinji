/**
 * Application Logic for Shinji Takahashi Lecture Video Site
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const videoGrid = document.getElementById('videoGrid');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const searchInput = document.getElementById('searchInput');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalTitle = document.getElementById('modalTitle');
  const modalJpTitle = document.getElementById('modalJpTitle');
  const playerFrame = document.getElementById('playerFrame');
  const timestampList = document.getElementById('timestampList');
  const transcriptText = document.getElementById('transcriptText');
  const totalCountEl = document.getElementById('totalCount');
  const loadingTrigger = document.getElementById('loadingTrigger');

  let currentCategory = 'all';
  let searchQuery = '';
  let activeLectures = [...LECTURE_DATA];
  
  // Continuous scroll chunk loading
  let loadedCount = 0;
  const CHUNK_SIZE = 8;
  let isLoading = false;

  // Initialize
  init();

  function init() {
    updateFilteredData();
    setupEventListeners();
  }

  function setupEventListeners() {
    // Category Filter Buttons
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentCategory = e.target.dataset.category;
        updateFilteredData();
      });
    });

    // Search Input
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      updateFilteredData();
    });

    // Modal Close
    modalCloseBtn.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    // Infinite Scroll simulation
    window.addEventListener('scroll', handleScroll);
  }

  function updateFilteredData() {
    activeLectures = LECTURE_DATA.filter(item => {
      const matchCategory = (currentCategory === 'all') || (item.category === currentCategory);
      const matchSearch = !searchQuery || 
        item.title.toLowerCase().includes(searchQuery) ||
        item.titleJp.toLowerCase().includes(searchQuery) ||
        item.summary.toLowerCase().includes(searchQuery) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery));
      return matchCategory && matchSearch;
    });

    if (totalCountEl) {
      totalCountEl.textContent = activeLectures.length;
    }

    // Reset grid & render first chunk
    videoGrid.innerHTML = '';
    loadedCount = 0;
    renderNextChunk();
  }

  function renderNextChunk() {
    if (isLoading || loadedCount >= activeLectures.length) {
      if (loadingTrigger) loadingTrigger.style.display = 'none';
      return;
    }

    isLoading = true;
    if (loadingTrigger) loadingTrigger.style.display = 'block';

    const nextBatch = activeLectures.slice(loadedCount, loadedCount + CHUNK_SIZE);
    
    setTimeout(() => {
      nextBatch.forEach(item => {
        const cardNode = createLectureCard(item);
        videoGrid.appendChild(cardNode);
      });

      loadedCount += nextBatch.length;
      isLoading = false;

      if (loadedCount >= activeLectures.length) {
        if (loadingTrigger) loadingTrigger.style.display = 'none';
      }
    }, 200); // smooth micro-delay simulation
  }

  function createLectureCard(item) {
    const card = document.createElement('div');
    card.className = 'lecture-card';
    
    const tagsHtml = item.tags.map(tag => `<span class="tag-pill">${tag}</span>`).join('');

    card.innerHTML = `
      <div class="card-thumbnail-wrapper">
        <img src="${item.thumbnail}" alt="${item.title}" class="card-thumbnail-img" loading="lazy" />
        <span class="badge-number">${item.number}</span>
        <span class="badge-duration">${item.duration}</span>
        <div class="play-overlay">
          <div class="play-icon-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </div>
        </div>
      </div>
      <div class="card-content">
        <h3 class="card-title">${item.title}</h3>
        <p class="card-title-jp">${item.titleJp}</p>
        <p class="card-summary">${item.summary}</p>
        <div class="card-tags">
          ${tagsHtml}
        </div>
      </div>
    `;

    card.addEventListener('click', () => openModal(item));
    return card;
  }

  function openModal(item) {
    modalTitle.textContent = `${item.number} ${item.title}`;
    modalJpTitle.textContent = item.titleJp;

    // Embed YouTube Player (Autoplay enabled)
    playerFrame.src = `https://www.youtube.com/embed/${item.youtubeId}?enablejsapi=1&autoplay=1`;

    // Render Timestamps
    timestampList.innerHTML = '';
    item.timestamps.forEach(ts => {
      const tsItem = document.createElement('div');
      tsItem.className = 'timestamp-item';
      tsItem.innerHTML = `
        <span class="timestamp-time">${ts.time}</span>
        <span class="timestamp-desc">${ts.title}</span>
      `;
      tsItem.addEventListener('click', () => {
        seekToTime(ts.seconds);
      });
      timestampList.appendChild(tsItem);
    });

    // Render Transcript
    transcriptText.textContent = item.transcript;

    // Show Backdrop
    modalBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function seekToTime(seconds) {
    if (playerFrame && playerFrame.contentWindow) {
      playerFrame.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: 'seekTo',
          args: [seconds, true]
        }),
        '*'
      );
    }
  }

  function closeModal() {
    modalBackdrop.classList.remove('active');
    playerFrame.src = '';
    document.body.style.overflow = 'auto';
  }

  function handleScroll() {
    if (isLoading || loadedCount >= activeLectures.length) return;

    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight - 400) {
      renderNextChunk();
    }
  }
});
