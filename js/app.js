/**
 * Application Logic for Shinji Takahashi Archive Website
 * Supports:
 * 1. 📖 다카하시 신지 이야기 (236편 완역 & 5개 장 & 1:1 만화/번역 뷰어)
 * 2. 🎬 강연 동영상 아카이브 (47편 노래/DVD/CD)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global State
  let currentMode = 'story'; // 'story' | 'video'
  let storyChapter = 'all';  // 'all' | '1' | '2' | '3' | '4' | '5'
  let videoCategory = 'all'; // 'all' | '노래' | 'DVD' | 'CD'
  let searchQuery = '';
  
  let activeStories = [...(typeof STORIES_DATA !== 'undefined' ? STORIES_DATA : [])];
  let activeLectures = [...(typeof LECTURE_DATA !== 'undefined' ? LECTURE_DATA : [])];

  let currentStoryIndex = 0; // index in activeStories
  let currentStoryViewMode = 'manga'; // 'manga' | 'text' | 'split'

  // Pagination / Chunk Loading
  const STORY_CHUNK = 12;
  const VIDEO_CHUNK = 8;
  let loadedStoryCount = 0;
  let loadedVideoCount = 0;
  let isStoryLoading = false;
  let isVideoLoading = false;

  // DOM Elements - Mode Nav & Global
  const modeStoryBtn = document.getElementById('modeStoryBtn');
  const modeVideoBtn = document.getElementById('modeVideoBtn');
  const storiesSection = document.getElementById('storiesSection');
  const videosSection = document.getElementById('videosSection');
  const searchInput = document.getElementById('searchInput');
  const heroTitle = document.getElementById('heroTitle');
  const heroSubtitle = document.getElementById('heroSubtitle');
  const totalCountEl = document.getElementById('totalCount');
  const subStat1 = document.getElementById('subStat1');
  const subStat2 = document.getElementById('subStat2');

  // DOM Elements - Stories
  const chapFilterBtns = document.querySelectorAll('.chap-filter-btn');
  const chapterInfoBanner = document.getElementById('chapterInfoBanner');
  const chapBannerBadge = document.getElementById('chapBannerBadge');
  const chapBannerTitle = document.getElementById('chapBannerTitle');
  const chapBannerRange = document.getElementById('chapBannerRange');
  const chapBannerFlow = document.getElementById('chapBannerFlow');
  const storyGrid = document.getElementById('storyGrid');
  const storyLoadingTrigger = document.getElementById('storyLoadingTrigger');

  // DOM Elements - Story Modal
  const storyModalBackdrop = document.getElementById('storyModalBackdrop');
  const storyModalCloseBtn = document.getElementById('storyModalCloseBtn');
  const storyModalChapBadge = document.getElementById('storyModalChapBadge');
  const storyModalNumber = document.getElementById('storyModalNumber');
  const storyModalTitle = document.getElementById('storyModalTitle');
  const storyModalOrigTitle = document.getElementById('storyModalOrigTitle');
  const storyModalBody = document.getElementById('storyModalBody');
  const storyModalImage = document.getElementById('storyModalImage');
  const mangaPlaceholder = document.getElementById('mangaPlaceholder');
  const mangaZoomBtn = document.getElementById('mangaZoomBtn');
  const metaOrigTitle = document.getElementById('metaOrigTitle');
  const metaContentType = document.getElementById('metaContentType');
  const rowContentType = document.getElementById('rowContentType');
  const storyModalBodyText = document.getElementById('storyModalBodyText');
  const storyCommentarySection = document.getElementById('storyCommentarySection');
  const storyModalNotes = document.getElementById('storyModalNotes');
  const storyPrevBtn = document.getElementById('storyPrevBtn');
  const storyNextBtn = document.getElementById('storyNextBtn');
  const storyModalIndex = document.getElementById('storyModalIndex');
  const tabMangaBtn = document.getElementById('tabMangaBtn');
  const tabTextBtn = document.getElementById('tabTextBtn');
  const tabSplitBtn = document.getElementById('tabSplitBtn');
  const btnGoToText = document.getElementById('btnGoToText');

  // DOM Elements - Lightbox
  const lightboxBackdrop = document.getElementById('lightboxBackdrop');
  const lightboxCloseBtn = document.getElementById('lightboxCloseBtn');
  const lightboxImage = document.getElementById('lightboxImage');

  // DOM Elements - Videos
  const filterBtns = document.querySelectorAll('.filter-btn');
  const videoGrid = document.getElementById('videoGrid');
  const videoLoadingTrigger = document.getElementById('videoLoadingTrigger');
  const videoModalBackdrop = document.getElementById('modalBackdrop');
  const videoModalCloseBtn = document.getElementById('modalCloseBtn');
  const videoModalTitle = document.getElementById('modalTitle');
  const videoModalJpTitle = document.getElementById('modalJpTitle');
  const playerFrame = document.getElementById('playerFrame');
  const timestampList = document.getElementById('timestampList');
  const transcriptText = document.getElementById('transcriptText');

  // Initialization
  init();

  function init() {
    setupEventListeners();
    updateStoriesData();
    updateVideosData();
  }

  function setupEventListeners() {
    // Mode Switcher (Stories vs Videos)
    modeStoryBtn.addEventListener('click', () => switchMode('story'));
    modeVideoBtn.addEventListener('click', () => switchMode('video'));

    // Search Input
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      if (currentMode === 'story') {
        updateStoriesData();
      } else {
        updateVideosData();
      }
    });

    // Story Chapter Filters
    chapFilterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetBtn = e.currentTarget;
        chapFilterBtns.forEach(b => b.classList.remove('active'));
        targetBtn.classList.add('active');
        storyChapter = targetBtn.dataset.chapter;
        updateStoriesData();
      });
    });

    // Video Category Filters
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        videoCategory = e.target.dataset.category;
        updateVideosData();
      });
    });

    // Story Modal Tab Views
    tabMangaBtn.addEventListener('click', () => setStoryViewTab('manga'));
    tabTextBtn.addEventListener('click', () => setStoryViewTab('text'));
    if (tabSplitBtn) {
      tabSplitBtn.addEventListener('click', () => setStoryViewTab('split'));
    }
    if (btnGoToText) {
      btnGoToText.addEventListener('click', () => setStoryViewTab('text'));
    }

    // Story Prev / Next
    storyPrevBtn.addEventListener('click', () => navigateStory(-1));
    storyNextBtn.addEventListener('click', () => navigateStory(1));

    // Story Modal Close
    storyModalCloseBtn.addEventListener('click', closeStoryModal);
    storyModalBackdrop.addEventListener('click', (e) => {
      if (e.target === storyModalBackdrop) closeStoryModal();
    });

    // Lightbox Open / Close
    mangaZoomBtn.addEventListener('click', openLightbox);
    storyModalImage.addEventListener('click', openLightbox);
    lightboxCloseBtn.addEventListener('click', closeLightbox);
    lightboxBackdrop.addEventListener('click', (e) => {
      if (e.target === lightboxBackdrop) closeLightbox();
    });

    // Video Modal Close
    videoModalCloseBtn.addEventListener('click', closeVideoModal);
    videoModalBackdrop.addEventListener('click', (e) => {
      if (e.target === videoModalBackdrop) closeVideoModal();
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (lightboxBackdrop.classList.contains('active')) {
          closeLightbox();
        } else if (storyModalBackdrop.classList.contains('active')) {
          closeStoryModal();
        } else if (videoModalBackdrop.classList.contains('active')) {
          closeVideoModal();
        }
      } else if (storyModalBackdrop.classList.contains('active')) {
        if (e.key === 'ArrowLeft') {
          navigateStory(-1);
        } else if (e.key === 'ArrowRight') {
          navigateStory(1);
        }
      }
    });

    // Scroll Handler for Infinite Loading
    window.addEventListener('scroll', handleScroll);
  }

  // Switch between Story Mode and Video Mode
  function switchMode(mode) {
    currentMode = mode;
    if (mode === 'story') {
      modeStoryBtn.classList.add('active');
      modeVideoBtn.classList.remove('active');
      storiesSection.style.display = 'block';
      videosSection.style.display = 'none';
      
      heroTitle.textContent = '다카하시 신지 이야기 · 236편 완역';
      heroSubtitle.textContent = '5개 장으로 완성된 신지의 일대기와 영적 진리, 그리고 요약 만화 카드와 충실 번역 전문을 제공합니다.';
      searchInput.placeholder = '이야기 번호, 제목, 키워드 검색...';
      subStat1.textContent = '5개 장 체계';
      subStat2.textContent = '만화 요약 & 완역 전문 1:1';
      totalCountEl.textContent = activeStories.length;
    } else {
      modeVideoBtn.classList.add('active');
      modeStoryBtn.classList.remove('active');
      storiesSection.style.display = 'none';
      videosSection.style.display = 'block';

      heroTitle.textContent = '마음의 원리와 영혼의 조화';
      heroSubtitle.textContent = '다카하시 신지 종교지도자의 강연 시리즈를 한국어 번역 자막 및 강연록과 함께 시청하실 수 있습니다.';
      searchInput.placeholder = '강의 제목, 키워드 검색...';
      subStat1.textContent = '편당 약 1시간 45분';
      subStat2.textContent = '무료 시청 & 강연록';
      totalCountEl.textContent = activeLectures.length;
    }
  }

  // ========================================================
  // STORY SECTION LOGIC
  // ========================================================
  function updateStoriesData() {
    activeStories = STORIES_DATA.filter(item => {
      const matchChapter = (storyChapter === 'all') || (item.chapter === parseInt(storyChapter));
      const matchSearch = !searchQuery || 
        item.num.includes(searchQuery) ||
        item.number.toLowerCase().includes(searchQuery) ||
        item.title.toLowerCase().includes(searchQuery) ||
        (item.origTitle && item.origTitle.toLowerCase().includes(searchQuery)) ||
        item.summary.toLowerCase().includes(searchQuery) ||
        item.body.toLowerCase().includes(searchQuery);
      return matchChapter && matchSearch;
    });

    if (currentMode === 'story' && totalCountEl) {
      totalCountEl.textContent = activeStories.length;
    }

    // Update Chapter Roadmap Banner
    if (storyChapter !== 'all' && typeof STORY_CHAPTERS !== 'undefined') {
      const chapMeta = STORY_CHAPTERS.find(c => c.id === parseInt(storyChapter));
      if (chapMeta) {
        chapterInfoBanner.style.display = 'flex';
        chapBannerBadge.textContent = chapMeta.name;
        chapBannerBadge.className = `chapter-badge-lg chap-${chapMeta.id}`;
        chapBannerTitle.textContent = chapMeta.title;
        chapBannerRange.textContent = `${chapMeta.range} (총 ${chapMeta.id === 5 ? 36 : 50}편)`;
        chapBannerFlow.textContent = chapMeta.flow;
      }
    } else {
      chapterInfoBanner.style.display = 'none';
    }

    // Reset Grid
    storyGrid.innerHTML = '';
    loadedStoryCount = 0;
    renderNextStoryChunk();
  }

  function renderNextStoryChunk() {
    if (isStoryLoading || loadedStoryCount >= activeStories.length) {
      if (storyLoadingTrigger) storyLoadingTrigger.style.display = 'none';
      return;
    }

    isStoryLoading = true;
    if (storyLoadingTrigger) storyLoadingTrigger.style.display = 'block';

    const nextBatch = activeStories.slice(loadedStoryCount, loadedStoryCount + STORY_CHUNK);

    setTimeout(() => {
      const fragment = document.createDocumentFragment();

      nextBatch.forEach(item => {
        const card = createStoryCard(item);
        fragment.appendChild(card);
      });

      storyGrid.appendChild(fragment);
      loadedStoryCount += nextBatch.length;
      isStoryLoading = false;

      if (loadedStoryCount >= activeStories.length) {
        if (storyLoadingTrigger) storyLoadingTrigger.style.display = 'none';
      }
    }, 40);
  }

  function createStoryCard(item) {
    const card = document.createElement('div');
    card.className = 'story-card';
    card.setAttribute('data-id', item.id);

    const chapMeta = item.chapterMeta || { name: `제${item.chapter}장`, badgeColor: 'purple' };

    let thumbHtml = '';
    if (item.hasImage) {
      thumbHtml = `
        <div class="story-card-thumb-wrap">
          <img src="${item.image}" alt="${item.title}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'story-card-text-cover\\'><span class=\\'text-cover-num\\'>${item.number}</span><p class=\\'text-cover-title\\'>${item.title}</p></div>'">
          <div class="story-card-badges">
            <span class="story-num-pill">${item.number}</span>
            <span class="story-chap-pill chap-${item.chapter}">${chapMeta.name}</span>
          </div>
          <span class="story-media-tag">🖼️ 요약 만화</span>
        </div>
      `;
    } else {
      thumbHtml = `
        <div class="story-card-thumb-wrap">
          <div class="story-card-text-cover">
            <span class="text-cover-num">${item.number}</span>
            <p class="text-cover-title">${item.title}</p>
            <span class="text-cover-badge">📄 충실 번역 전문 수록</span>
          </div>
          <div class="story-card-badges">
            <span class="story-num-pill">${item.number}</span>
            <span class="story-chap-pill chap-${item.chapter}">${chapMeta.name}</span>
          </div>
          <span class="story-media-tag">📄 번역 전문</span>
        </div>
      `;
    }

    card.innerHTML = `
      ${thumbHtml}
      <div class="story-card-content">
        <h4 class="story-card-title">${item.title}</h4>
        ${item.origTitle ? `<p class="story-card-orig-title">${item.origTitle}</p>` : ''}
        <p class="story-card-summary">${item.summary}</p>
        <div class="story-card-footer">
          <span class="story-card-read-btn">만화 / 번역 읽기 ➔</span>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      openStoryModal(item);
    });

    return card;
  }

  // Open Story Modal
  function openStoryModal(item) {
    const idx = activeStories.findIndex(s => s.id === item.id);
    currentStoryIndex = idx >= 0 ? idx : 0;
    renderStoryModalContent(item);
    storyModalBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function renderStoryModalContent(item) {
    const chapMeta = item.chapterMeta || { name: `제${item.chapter}장`, title: '' };

    storyModalChapBadge.textContent = `${chapMeta.name} · ${chapMeta.title}`;
    storyModalChapBadge.className = `chap-badge chap-${item.chapter}`;
    storyModalNumber.textContent = item.number;
    storyModalTitle.textContent = item.title;
    storyModalOrigTitle.textContent = item.origTitle || '';

    // Manga Panel setup
    if (item.hasImage) {
      storyModalImage.src = item.image;
      storyModalImage.style.display = 'block';
      mangaPlaceholder.style.display = 'none';
      mangaZoomBtn.style.display = 'inline-block';
      // Default to manga tab if available
      setStoryViewTab(currentStoryViewMode === 'text' ? 'text' : 'manga');
    } else {
      storyModalImage.src = '';
      storyModalImage.style.display = 'none';
      mangaPlaceholder.style.display = 'block';
      mangaZoomBtn.style.display = 'none';
      // Default to text if no image
      setStoryViewTab('text');
    }

    // Text Reader Panel setup
    metaOrigTitle.textContent = item.origTitle || '원문 표기 없음';
    if (item.contentType) {
      metaContentType.textContent = item.contentType;
      rowContentType.style.display = 'flex';
    } else {
      rowContentType.style.display = 'none';
    }

    storyModalBodyText.textContent = item.body;

    if (item.notes && item.notes.trim()) {
      storyCommentarySection.style.display = 'block';
      storyModalNotes.textContent = item.notes;
    } else {
      storyCommentarySection.style.display = 'none';
      storyModalNotes.textContent = '';
    }

    // Counter
    storyModalIndex.textContent = `${item.num} / 236`;

    // Scroll panels to top
    const mangaPanel = document.getElementById('storyMangaPanel');
    const textPanel = document.getElementById('storyTextPanel');
    if (mangaPanel) mangaPanel.scrollTop = 0;
    if (textPanel) textPanel.scrollTop = 0;
  }

  function setStoryViewTab(tab) {
    currentStoryViewMode = tab;
    storyModalBody.setAttribute('data-active-tab', tab);

    tabMangaBtn.classList.toggle('active', tab === 'manga');
    tabTextBtn.classList.toggle('active', tab === 'text');
    if (tabSplitBtn) tabSplitBtn.classList.toggle('active', tab === 'split');
  }

  function navigateStory(direction) {
    if (activeStories.length === 0) return;
    currentStoryIndex += direction;
    if (currentStoryIndex < 0) {
      currentStoryIndex = activeStories.length - 1;
    } else if (currentStoryIndex >= activeStories.length) {
      currentStoryIndex = 0;
    }
    const nextItem = activeStories[currentStoryIndex];
    renderStoryModalContent(nextItem);
  }

  function closeStoryModal() {
    storyModalBackdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Lightbox
  function openLightbox() {
    const activeItem = activeStories[currentStoryIndex];
    if (activeItem && activeItem.hasImage) {
      lightboxImage.src = activeItem.image;
      lightboxBackdrop.classList.add('active');
    }
  }

  function closeLightbox() {
    lightboxBackdrop.classList.remove('active');
    lightboxImage.src = '';
  }

  // ========================================================
  // VIDEO LECTURE SECTION LOGIC
  // ========================================================
  function updateVideosData() {
    activeLectures = LECTURE_DATA.filter(item => {
      const matchCategory = (videoCategory === 'all') || (item.category === videoCategory);
      const matchSearch = !searchQuery || 
        item.title.toLowerCase().includes(searchQuery) ||
        item.titleJp.toLowerCase().includes(searchQuery) ||
        item.summary.toLowerCase().includes(searchQuery) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery));
      return matchCategory && matchSearch;
    });

    if (currentMode === 'video' && totalCountEl) {
      totalCountEl.textContent = activeLectures.length;
    }

    videoGrid.innerHTML = '';
    loadedVideoCount = 0;
    renderNextVideoChunk();
  }

  function renderNextVideoChunk() {
    if (isVideoLoading || loadedVideoCount >= activeLectures.length) {
      if (videoLoadingTrigger) videoLoadingTrigger.style.display = 'none';
      return;
    }

    isVideoLoading = true;
    if (videoLoadingTrigger) videoLoadingTrigger.style.display = 'block';

    const nextBatch = activeLectures.slice(loadedVideoCount, loadedVideoCount + VIDEO_CHUNK);

    setTimeout(() => {
      const fragment = document.createDocumentFragment();

      nextBatch.forEach(item => {
        const card = createVideoCard(item);
        fragment.appendChild(card);
      });

      videoGrid.appendChild(fragment);
      loadedVideoCount += nextBatch.length;
      isVideoLoading = false;

      if (loadedVideoCount >= activeLectures.length) {
        if (videoLoadingTrigger) videoLoadingTrigger.style.display = 'none';
      }
    }, 40);
  }

  function createVideoCard(item) {
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('data-id', item.id);

    const tagsHtml = item.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

    card.innerHTML = `
      <div class="card-thumb-wrap">
        <img class="card-thumb" src="${item.thumbnail}" alt="${item.title}" loading="lazy" onerror="this.src='https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg'">
        <div class="play-overlay">
          <div class="play-circle">
            <div class="play-triangle"></div>
          </div>
        </div>
        <span class="video-duration">${item.duration}</span>
        <span class="card-badge">${item.category}</span>
      </div>
      <div class="card-content">
        <div class="card-number">${item.number}</div>
        <h3 class="card-title">${item.title}</h3>
        <p class="card-summary">${item.summary}</p>
        <div class="card-tags">${tagsHtml}</div>
      </div>
    `;

    card.addEventListener('click', () => {
      openVideoModal(item);
    });

    return card;
  }

  function openVideoModal(item) {
    videoModalTitle.textContent = item.title;
    videoModalJpTitle.textContent = item.titleJp;
    playerFrame.src = `https://www.youtube.com/embed/${item.youtubeId}?autoplay=1&enablejsapi=1&rel=0`;

    // Render timestamps
    timestampList.innerHTML = '';
    if (item.timestamps && item.timestamps.length > 0) {
      item.timestamps.forEach(ts => {
        const row = document.createElement('div');
        row.className = 'timestamp-item';
        row.innerHTML = `
          <span class="timestamp-time">${ts.time}</span>
          <span class="timestamp-desc">${ts.title}</span>
        `;
        row.addEventListener('click', () => {
          playerFrame.src = `https://www.youtube.com/embed/${item.youtubeId}?autoplay=1&start=${ts.seconds}&enablejsapi=1&rel=0`;
        });
        timestampList.appendChild(row);
      });
    }

    transcriptText.innerHTML = `
      <p style="margin-bottom: 12px; font-weight: 500; color: #fff;">${item.summary}</p>
      <p style="color: var(--text-dim); font-size: 0.82rem;">* 상세 강의록 및 한글 번역 대본은 영상 타임스탬프 목차와 함께 순차적으로 업데이트됩니다.</p>
    `;

    videoModalBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeVideoModal() {
    videoModalBackdrop.classList.remove('active');
    playerFrame.src = '';
    document.body.style.overflow = '';
  }

  // Infinite Scroll Trigger
  function handleScroll() {
    const scrollPosition = window.innerHeight + window.scrollY;
    const documentHeight = document.documentElement.scrollHeight;

    if (scrollPosition >= documentHeight - 600) {
      if (currentMode === 'story') {
        renderNextStoryChunk();
      } else {
        renderNextVideoChunk();
      }
    }
  }
});
