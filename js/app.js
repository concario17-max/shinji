/**
 * Application Logic for Shinji Takahashi Luxury Archive Website
 * 
 * Features:
 * 1. 📖 다카하시 신지 이야기 (237편 완역 & 3D 럭셔리 카드 & 몰입형 풀스크린 뷰어)
 * 2. 🎨 뷰어 테마 3종 토글 (시네마 다크 / OLED 딥블랙 / 세피아 웜)
 * 3. ⭐ 나만의 즐겨찾기(북마크) 보관함 시스템 (LocalStorage 연동)
 * 4. 🔖 "지난번에 읽던 이야기 이어보기" 배너 (자동 기억)
 * 5. ⚡ 초고속 점프 커맨드 팔레트 (Ctrl + K / Cmd + K)
 * 6. ⛶ 브라우저 전체화면(F11) 토글 (단축키: F / 더블클릭)
 * 7. 📱 모바일 터치 스와이프 제스처 네비게이션
 * 8. 🎬 강연 동영상 아카이브 (47편 노래/DVD/CD & 타임스탬프 목차)
 * 9. 🔍 스마트 정밀 검색 & URL 해시 딥링크 (#story-001, #video-01)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global State
  let currentMode = 'story'; // 'story' | 'video'
  let storyChapter = 'all';  // 'all' | '1' | '2' | '3' | '4' | '5' | 'bookmark'
  let videoCategory = 'all'; // 'all' | '노래' | 'DVD' | 'CD'
  let searchQuery = '';
  
  let activeStories = [...(typeof STORIES_DATA !== 'undefined' ? STORIES_DATA : [])];
  let activeLectures = [...(typeof LECTURE_DATA !== 'undefined' ? LECTURE_DATA : [])];

  let currentStoryIndex = 0; // index in activeStories
  let isTranslationDrawerOpen = false;
  let currentFontSizePercent = 100; // 85 | 100 | 115 | 130
  
  // Bookmarks & Preferences (LocalStorage)
  let bookmarkedIds = JSON.parse(localStorage.getItem('shinji_bookmarks') || '[]');
  let currentViewerTheme = localStorage.getItem('shinji_viewer_theme') || 'cinema';

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
  const searchClearBtn = document.getElementById('searchClearBtn');
  const btnOpenCommandPalette = document.getElementById('btnOpenCommandPalette');
  const heroTitle = document.getElementById('heroTitle');
  const heroSubtitle = document.getElementById('heroSubtitle');
  const totalCountEl = document.getElementById('totalCount');
  const subStat1 = document.getElementById('subStat1');
  const subStat2 = document.getElementById('subStat2');
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  const toastBox = document.getElementById('toastBox');

  // Continue Reading Banner
  const continueReadingBanner = document.getElementById('continueReadingBanner');
  const continueStoryTitle = document.getElementById('continueStoryTitle');
  const btnContinueStory = document.getElementById('btnContinueStory');

  // DOM Elements - Stories
  const chapFilterBtns = document.querySelectorAll('.chap-filter-btn');
  const bookmarkCountPill = document.getElementById('bookmarkCountPill');
  const chapterInfoBanner = document.getElementById('chapterInfoBanner');
  const chapBannerBadge = document.getElementById('chapBannerBadge');
  const chapBannerTitle = document.getElementById('chapBannerTitle');
  const chapBannerRange = document.getElementById('chapBannerRange');
  const chapBannerFlow = document.getElementById('chapBannerFlow');
  const storyGrid = document.getElementById('storyGrid');
  const storyLoadingTrigger = document.getElementById('storyLoadingTrigger');

  // DOM Elements - Fullscreen Story Viewer
  const storyModalBackdrop = document.getElementById('storyModalBackdrop');
  const storyModalCloseBtn = document.getElementById('storyModalCloseBtn');
  const storyModalChapBadge = document.getElementById('storyModalChapBadge');
  const storyModalNumber = document.getElementById('storyModalNumber');
  const storyModalTitle = document.getElementById('storyModalTitle');
  const storyModalIndex = document.getElementById('storyModalIndex');
  const storyModalBody = document.getElementById('storyModalBody');
  const storyModalImage = document.getElementById('storyModalImage');
  const storyMangaPanel = document.getElementById('storyMangaPanel');
  const storyPrevBtn = document.getElementById('storyPrevBtn');
  const storyNextBtn = document.getElementById('storyNextBtn');
  const btnToggleFullscreen = document.getElementById('btnToggleFullscreen');
  const btnBookmarkStory = document.getElementById('btnBookmarkStory');
  const btnThemeSelector = document.getElementById('btnThemeSelector');
  const themeLabel = document.getElementById('themeLabel');

  // DOM Elements - Drawer & Translation
  const btnToggleTranslation = document.getElementById('btnToggleTranslation');
  const btnCloseDrawer = document.getElementById('btnCloseDrawer');
  const metaOrigTitle = document.getElementById('metaOrigTitle');
  const metaContentType = document.getElementById('metaContentType');
  const rowContentType = document.getElementById('rowContentType');
  const storyModalBodyText = document.getElementById('storyModalBodyText');
  const storyCommentarySection = document.getElementById('storyCommentarySection');
  const storyModalNotes = document.getElementById('storyModalNotes');

  // DOM Elements - Reader Toolbar
  const btnFontDecrease = document.getElementById('btnFontDecrease');
  const btnFontIncrease = document.getElementById('btnFontIncrease');
  const fontIndicator = document.getElementById('fontIndicator');
  const btnCopyStoryText = document.getElementById('btnCopyStoryText');
  const btnShareStory = document.getElementById('btnShareStory');

  // DOM Elements - Command Palette
  const cmdPaletteModal = document.getElementById('cmdPaletteModal');
  const cmdPaletteInput = document.getElementById('cmdPaletteInput');
  const cmdResultsList = document.getElementById('cmdResultsList');
  let cmdActiveIndex = 0;
  let cmdFilteredItems = [];

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
    applyViewerTheme(currentViewerTheme);
    updateBookmarkCountPill();
    checkContinueReading();
    setupEventListeners();
    updateStoriesData();
    updateVideosData();
    checkUrlHash();
  }

  function setupEventListeners() {
    // Mode Switcher (Stories vs Videos)
    modeStoryBtn.addEventListener('click', () => switchMode('story'));
    modeVideoBtn.addEventListener('click', () => switchMode('video'));

    // Search Input
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      if (searchClearBtn) {
        searchClearBtn.style.display = searchQuery ? 'flex' : 'none';
      }
      if (currentMode === 'story') {
        updateStoriesData();
      } else {
        updateVideosData();
      }
    });

    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        searchClearBtn.style.display = 'none';
        searchInput.focus();
        if (currentMode === 'story') {
          updateStoriesData();
        } else {
          updateVideosData();
        }
      });
    }

    // Command Palette Trigger
    if (btnOpenCommandPalette) {
      btnOpenCommandPalette.addEventListener('click', openCommandPalette);
    }

    // Continue Reading Button
    if (btnContinueStory) {
      btnContinueStory.addEventListener('click', () => {
        const lastId = parseInt(localStorage.getItem('shinji_last_story'), 10);
        const story = STORIES_DATA.find(s => s.id === lastId);
        if (story) {
          switchMode('story');
          openStoryModal(story);
        }
      });
    }

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

    // Fullscreen Toggle
    if (btnToggleFullscreen) {
      btnToggleFullscreen.addEventListener('click', toggleFullscreen);
    }
    if (storyModalImage) {
      storyModalImage.addEventListener('dblclick', toggleFullscreen);
    }
    document.addEventListener('fullscreenchange', updateFullscreenUI);
    document.addEventListener('webkitfullscreenchange', updateFullscreenUI);

    // Bookmark Toggle inside Story Viewer
    if (btnBookmarkStory) {
      btnBookmarkStory.addEventListener('click', toggleCurrentStoryBookmark);
    }

    // Theme Switcher inside Story Viewer
    if (btnThemeSelector) {
      btnThemeSelector.addEventListener('click', cycleViewerTheme);
    }

    // Fullscreen Story Viewer Drawer Toggle
    if (btnToggleTranslation) {
      btnToggleTranslation.addEventListener('click', toggleTranslationDrawer);
    }
    if (btnCloseDrawer) {
      btnCloseDrawer.addEventListener('click', () => closeTranslationDrawer());
    }

    // Reader Toolbar Events
    if (btnFontDecrease) {
      btnFontDecrease.addEventListener('click', () => adjustFontSize(-15));
    }
    if (btnFontIncrease) {
      btnFontIncrease.addEventListener('click', () => adjustFontSize(15));
    }
    if (btnCopyStoryText) {
      btnCopyStoryText.addEventListener('click', copyCurrentStoryText);
    }
    if (btnShareStory) {
      btnShareStory.addEventListener('click', shareCurrentStoryLink);
    }

    // Story Prev / Next
    storyPrevBtn.addEventListener('click', () => navigateStory(-1));
    storyNextBtn.addEventListener('click', () => navigateStory(1));

    // Story Modal Close
    storyModalCloseBtn.addEventListener('click', closeStoryModal);
    storyMangaPanel.addEventListener('click', (e) => {
      if (e.target === storyMangaPanel || e.target.classList.contains('comic-image-wrapper')) {
        closeStoryModal();
      }
    });

    // Mobile Touch Swipe Navigation
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    storyMangaPanel.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    storyMangaPanel.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1) {
        touchEndX = e.changedTouches[0].clientX;
        touchEndY = e.changedTouches[0].clientY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;

        if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY) * 1.4) {
          if (diffX < 0) {
            navigateStory(1);
          } else {
            navigateStory(-1);
          }
        }
      }
    }, { passive: true });

    // Video Modal Close
    videoModalCloseBtn.addEventListener('click', closeVideoModal);
    videoModalBackdrop.addEventListener('click', (e) => {
      if (e.target === videoModalBackdrop) closeVideoModal();
    });

    // Scroll to Top Floating Button
    if (scrollTopBtn) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
          scrollTopBtn.classList.add('visible');
        } else {
          scrollTopBtn.classList.remove('visible');
        }
      });
      scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Global Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      // Command Palette (Ctrl + K or Cmd + K)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        openCommandPalette();
        return;
      }

      // Command Palette active state
      if (cmdPaletteModal && cmdPaletteModal.classList.contains('active')) {
        if (e.key === 'Escape') {
          closeCommandPalette();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          moveCmdHighlight(1);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          moveCmdHighlight(-1);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          selectCmdItem();
        }
        return;
      }

      if (e.key === 'Escape') {
        if (storyModalBackdrop.classList.contains('active')) {
          closeStoryModal();
        } else if (videoModalBackdrop.classList.contains('active')) {
          closeVideoModal();
        }
      } else if (storyModalBackdrop.classList.contains('active')) {
        if (e.key === 'ArrowLeft') {
          navigateStory(-1);
        } else if (e.key === 'ArrowRight') {
          navigateStory(1);
        } else if (e.key === 't' || e.key === 'T' || e.key === 'ㅅ') {
          toggleTranslationDrawer();
        } else if (e.key === 'b' || e.key === 'B' || e.key === 'ㅠ') {
          toggleCurrentStoryBookmark();
        } else if (e.key === 'f' || e.key === 'F' || e.key === 'ㄹ' || e.key === 'F11') {
          e.preventDefault();
          toggleFullscreen();
        }
      }
    });

    // Command Palette Input Events
    if (cmdPaletteInput) {
      cmdPaletteInput.addEventListener('input', (e) => {
        renderCmdResults(e.target.value.trim());
      });
    }

    if (cmdPaletteModal) {
      cmdPaletteModal.addEventListener('click', (e) => {
        if (e.target === cmdPaletteModal) closeCommandPalette();
      });
    }

    // Scroll Handler for Infinite Loading
    window.addEventListener('scroll', handleScroll);

    // Hash change listener (Back/Forward browser buttons)
    window.addEventListener('hashchange', checkUrlHash);
  }

  // ========================================================
  // ⭐ BOOKMARK & FAVORITES SYSTEM
  // ========================================================
  function toggleCurrentStoryBookmark() {
    const item = activeStories[currentStoryIndex];
    if (!item) return;

    const isBookmarked = bookmarkedIds.includes(item.id);
    if (isBookmarked) {
      bookmarkedIds = bookmarkedIds.filter(id => id !== item.id);
      showToast('☆ 즐겨찾기 보관함에서 삭제되었습니다.');
    } else {
      bookmarkedIds.push(item.id);
      showToast('⭐ 즐겨찾기 보관함에 저장되었습니다!');
    }

    localStorage.setItem('shinji_bookmarks', JSON.stringify(bookmarkedIds));
    updateBookmarkButtonUI(item.id);
    updateBookmarkCountPill();

    if (storyChapter === 'bookmark') {
      updateStoriesData();
    }
  }

  function updateBookmarkButtonUI(storyId) {
    if (!btnBookmarkStory) return;
    const isBookmarked = bookmarkedIds.includes(storyId);
    btnBookmarkStory.classList.toggle('bookmarked', isBookmarked);
    const starIcon = btnBookmarkStory.querySelector('.btn-star-icon');
    const label = btnBookmarkStory.querySelector('.btn-tool-label');
    if (starIcon) starIcon.textContent = isBookmarked ? '★' : '☆';
    if (label) label.textContent = isBookmarked ? '보관됨' : '보관';
  }

  function updateBookmarkCountPill() {
    if (bookmarkCountPill) {
      bookmarkCountPill.textContent = bookmarkedIds.length;
    }
  }

  // Check and display "Continue Reading"
  function checkContinueReading() {
    const lastId = parseInt(localStorage.getItem('shinji_last_story'), 10);
    if (lastId && continueReadingBanner) {
      const story = STORIES_DATA.find(s => s.id === lastId);
      if (story) {
        continueStoryTitle.textContent = `${story.number} ${story.title}`;
        continueReadingBanner.style.display = 'inline-flex';
      }
    }
  }

  // ========================================================
  // 🎨 VIEWER THEMES (Cinema, OLED Black, Sepia Paper)
  // ========================================================
  function cycleViewerTheme() {
    const themes = ['cinema', 'oled', 'sepia'];
    const nextIdx = (themes.indexOf(currentViewerTheme) + 1) % themes.length;
    currentViewerTheme = themes[nextIdx];
    localStorage.setItem('shinji_viewer_theme', currentViewerTheme);
    applyViewerTheme(currentViewerTheme);

    const names = { cinema: '시네마 다크', oled: 'OLED 블랙', sepia: '세피아 웜' };
    showToast(`🎨 독서 테마: ${names[currentViewerTheme]}`);
  }

  function applyViewerTheme(theme) {
    if (!storyModalBackdrop) return;
    storyModalBackdrop.setAttribute('data-theme', theme);
    if (themeLabel) {
      const names = { cinema: '시네마', oled: 'OLED', sepia: '세피아' };
      themeLabel.textContent = names[theme] || '테마';
    }
  }

  // ========================================================
  // ⚡ COMMAND PALETTE (Ctrl + K)
  // ========================================================
  function openCommandPalette() {
    if (!cmdPaletteModal) return;
    cmdPaletteModal.classList.add('active');
    cmdPaletteInput.value = '';
    cmdActiveIndex = 0;
    renderCmdResults('');
    setTimeout(() => cmdPaletteInput.focus(), 50);
  }

  function closeCommandPalette() {
    if (!cmdPaletteModal) return;
    cmdPaletteModal.classList.remove('active');
  }

  function renderCmdResults(query) {
    const cleanQ = query.toLowerCase();
    cmdResultsList.innerHTML = '';

    if (!cleanQ) {
      // Show first 15 stories by default
      cmdFilteredItems = STORIES_DATA.slice(0, 15);
    } else {
      const numMatch = query.match(/^\d+$/);
      if (numMatch) {
        const targetId = parseInt(numMatch[0], 10);
        cmdFilteredItems = STORIES_DATA.filter(s => s.id === targetId || s.num.includes(numMatch[0])).slice(0, 20);
      } else {
        cmdFilteredItems = STORIES_DATA.filter(s =>
          s.title.toLowerCase().includes(cleanQ) ||
          s.number.toLowerCase().includes(cleanQ) ||
          s.summary.toLowerCase().includes(cleanQ)
        ).slice(0, 20);
      }
    }

    if (cmdFilteredItems.length === 0) {
      cmdResultsList.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--text-dim); font-size: 0.86rem;">
          일치하는 항목이 없습니다.
        </div>
      `;
      return;
    }

    cmdActiveIndex = 0;
    cmdFilteredItems.forEach((item, idx) => {
      const el = document.createElement('div');
      el.className = `cmd-item ${idx === 0 ? 'active' : ''}`;
      el.innerHTML = `
        <div class="cmd-item-left">
          <span class="cmd-item-num">${item.number}</span>
          <span class="cmd-item-title">${item.title}</span>
        </div>
        <span class="cmd-item-chap">제${item.chapter}장</span>
      `;
      el.addEventListener('click', () => {
        closeCommandPalette();
        switchMode('story');
        openStoryModal(item);
      });
      cmdResultsList.appendChild(el);
    });
  }

  function moveCmdHighlight(direction) {
    const items = cmdResultsList.querySelectorAll('.cmd-item');
    if (items.length === 0) return;

    items[cmdActiveIndex]?.classList.remove('active');
    cmdActiveIndex = (cmdActiveIndex + direction + items.length) % items.length;
    items[cmdActiveIndex]?.classList.add('active');
    items[cmdActiveIndex]?.scrollIntoView({ block: 'nearest' });
  }

  function selectCmdItem() {
    if (cmdFilteredItems[cmdActiveIndex]) {
      const target = cmdFilteredItems[cmdActiveIndex];
      closeCommandPalette();
      switchMode('story');
      openStoryModal(target);
    }
  }

  // ========================================================
  // FULLSCREEN HANDLER (F11)
  // ========================================================
  function toggleFullscreen(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }

    const isFs = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );

    if (!isFs) {
      const docEl = document.documentElement;
      const requestMethod = docEl.requestFullscreen ||
                            docEl.webkitRequestFullscreen ||
                            docEl.webkitRequestFullScreen ||
                            docEl.mozRequestFullScreen ||
                            docEl.msRequestFullscreen;

      if (requestMethod) {
        try {
          const promise = requestMethod.call(docEl);
          if (promise && promise.catch) {
            promise.catch(() => {
              showToast('💡 브라우저 F11 키를 직접 누르면 전체화면으로 전환됩니다.');
            });
          }
        } catch (err) {
          showToast('💡 키보드의 F11 키를 직접 누르면 전체화면으로 전환됩니다.');
        }
      } else {
        showToast('💡 브라우저의 F11 키를 눌러 전체화면으로 전환해 주세요.');
      }
    } else {
      const exitMethod = document.exitFullscreen ||
                         document.webkitExitFullscreen ||
                         document.webkitCancelFullScreen ||
                         document.mozCancelFullScreen ||
                         document.msExitFullscreen;
      if (exitMethod) {
        try {
          const promise = exitMethod.call(document);
          if (promise && promise.catch) promise.catch(() => {});
        } catch (err) {}
      }
    }
  }

  function updateFullscreenUI() {
    const isFs = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );

    document.body.classList.toggle('is-native-fullscreen', isFs);
    if (storyModalBackdrop) {
      storyModalBackdrop.classList.toggle('is-native-fullscreen', isFs);
    }

    if (btnToggleFullscreen) {
      btnToggleFullscreen.classList.toggle('is-fullscreen', isFs);
      btnToggleFullscreen.title = isFs ? '전체화면 해제 (단축키: F / Esc)' : '브라우저 전체화면 전환 (단축키: F / F11)';
      const fsIconEnter = btnToggleFullscreen.querySelector('.fs-icon-enter');
      const fsIconExit = btnToggleFullscreen.querySelector('.fs-icon-exit');
      const fsText = btnToggleFullscreen.querySelector('.fs-text');
      if (fsIconEnter) fsIconEnter.style.display = isFs ? 'none' : 'inline-block';
      if (fsIconExit) fsIconExit.style.display = isFs ? 'inline-block' : 'none';
      if (fsText) fsText.textContent = isFs ? '화면 해제' : '전체화면';
    }

    if (isFs) {
      showToast('⛶ 전체화면 모드 (단축키: F 또는 Esc 로 해제)');
    }
  }

  // Switch between Story Mode and Video Mode
  function switchMode(mode) {
    currentMode = mode;
    if (mode === 'story') {
      modeStoryBtn.classList.add('active');
      modeVideoBtn.classList.remove('active');
      storiesSection.style.display = 'block';
      videosSection.style.display = 'none';
      
      heroTitle.textContent = '다카하시 신지 이야기 · 237편 완역';
      heroSubtitle.textContent = '5개 장으로 완성된 신지의 일대기와 영적 진리, 그리고 237편 요약 만화 카드와 번역 전문을 제공합니다.';
      searchInput.placeholder = '이야기 번호, 제목, 키워드 검색...';
      subStat1.textContent = '5개 장 체계';
      subStat2.textContent = '237편 만화 요약 & 번역 전문 1:1';
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
  // STORY SECTION LOGIC (Smart Number Search & Bookmarks)
  // ========================================================
  function updateStoriesData() {
    const rawQ = (searchQuery || '').trim();
    const cleanQ = rawQ.toLowerCase();
    
    const isNumSearch = /^[#]?\d+$/.test(rawQ);
    const targetNum = isNumSearch ? parseInt(rawQ.replace('#', ''), 10) : null;

    activeStories = STORIES_DATA.filter(item => {
      // Check Bookmark Tab
      if (storyChapter === 'bookmark') {
        if (!bookmarkedIds.includes(item.id)) return false;
      } else if (storyChapter !== 'all') {
        if (item.chapter !== parseInt(storyChapter)) return false;
      }

      if (!cleanQ) return true;

      if (targetNum !== null) {
        if (item.id === targetNum) return true;
        const digits = rawQ.replace('#', '');
        if (digits.length >= 2 && item.num.includes(digits)) return true;
        return false;
      }

      return item.num.includes(cleanQ) ||
        item.number.toLowerCase().includes(cleanQ) ||
        item.title.toLowerCase().includes(cleanQ) ||
        (item.origTitle && item.origTitle.toLowerCase().includes(cleanQ)) ||
        item.summary.toLowerCase().includes(cleanQ) ||
        item.body.toLowerCase().includes(cleanQ);
    });

    if (targetNum !== null && activeStories.length > 1) {
      activeStories.sort((a, b) => (a.id === targetNum ? -1 : b.id === targetNum ? 1 : a.id - b.id));
    }

    if (currentMode === 'story' && totalCountEl) {
      totalCountEl.textContent = activeStories.length;
    }

    // Update Chapter Roadmap Banner
    if (storyChapter !== 'all' && storyChapter !== 'bookmark' && typeof STORY_CHAPTERS !== 'undefined') {
      const chapMeta = STORY_CHAPTERS.find(c => c.id === parseInt(storyChapter));
      if (chapMeta) {
        chapterInfoBanner.style.display = 'flex';
        chapBannerBadge.textContent = chapMeta.name;
        chapBannerBadge.className = `chapter-badge-lg chap-${chapMeta.id}`;
        chapBannerTitle.textContent = chapMeta.title;
        chapBannerRange.textContent = `${chapMeta.range} (총 ${chapMeta.id === 5 ? 37 : 50}편)`;
        chapBannerFlow.textContent = chapMeta.flow;
      }
    } else {
      chapterInfoBanner.style.display = 'none';
    }

    // Reset Grid & Check Empty State
    storyGrid.innerHTML = '';
    loadedStoryCount = 0;

    if (activeStories.length === 0) {
      if (storyChapter === 'bookmark') {
        storyGrid.innerHTML = `
          <div class="empty-state-card">
            <div class="empty-state-icon">⭐</div>
            <h3 class="empty-state-title">보관함이 비어 있습니다</h3>
            <p class="empty-state-desc">감명 깊은 이야기의 상단 <strong>[ ⭐ 보관 ]</strong> 버튼을 누르면<br>언제든 이곳에서 모아서 감상하실 수 있습니다.</p>
          </div>
        `;
      } else {
        storyGrid.innerHTML = `
          <div class="empty-state-card">
            <div class="empty-state-icon">🔍</div>
            <h3 class="empty-state-title">일치하는 이야기가 없습니다</h3>
            <p class="empty-state-desc">'<strong>${escapeHtml(rawQ)}</strong>' 검색어와 일치하는 항목을 찾을 수 없습니다.<br>번호(예: 1, 237) 또는 다른 키워드로 검색해 보세요.</p>
            <button class="empty-state-btn" id="btnResetStorySearch">전체 목록 보기</button>
          </div>
        `;
        const resetBtn = document.getElementById('btnResetStorySearch');
        if (resetBtn) {
          resetBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchQuery = '';
            if (searchClearBtn) searchClearBtn.style.display = 'none';
            updateStoriesData();
          });
        }
      }
      if (storyLoadingTrigger) storyLoadingTrigger.style.display = 'none';
      return;
    }

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
    const thumbSrc = item.thumb || item.image;

    card.innerHTML = `
      <div class="story-card-thumb-wrap">
        <img src="${thumbSrc}" alt="${item.title}" loading="lazy" decoding="async" onerror="this.parentElement.innerHTML='<div class=\\'story-card-text-cover\\'><span class=\\'text-cover-num\\'>${item.number}</span><p class=\\'text-cover-title\\'>${item.title}</p></div>'">
        <div class="story-card-badges">
          <span class="story-num-pill">${item.number}</span>
          <span class="story-chap-pill chap-${item.chapter}">${chapMeta.name}</span>
        </div>
        <span class="story-media-tag">🖼️ 요약 만화</span>
      </div>
      <div class="story-card-content">
        <h4 class="story-card-title">${item.title}</h4>
        ${item.origTitle ? `<p class="story-card-orig-title">${item.origTitle}</p>` : ''}
        <p class="story-card-summary">${item.summary}</p>
        <div class="story-card-footer">
          <span class="story-card-read-btn">만화 크게 보기 ➔</span>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      openStoryModal(item);
    });

    return card;
  }

  // ========================================================
  // IMMERSIVE FULLSCREEN COMIC VIEWER
  // ========================================================
  function openStoryModal(item) {
    const idx = activeStories.findIndex(s => s.id === item.id);
    currentStoryIndex = idx >= 0 ? idx : 0;
    renderStoryModalContent(item);

    storyModalBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Save Last Read
    localStorage.setItem('shinji_last_story', item.id);
    checkContinueReading();

    // Update URL hash for deep linking
    if (history.replaceState) {
      history.replaceState(null, '', `#story-${item.num}`);
    }
  }

  function renderStoryModalContent(item) {
    const chapMeta = item.chapterMeta || { name: `제${item.chapter}장`, title: '' };

    // Header Badges & Title
    storyModalChapBadge.textContent = chapMeta.name;
    storyModalChapBadge.className = `viewer-chap-badge chap-${item.chapter}`;
    storyModalNumber.textContent = item.number;
    storyModalTitle.textContent = item.title;
    storyModalIndex.textContent = `${item.num} / ${typeof STORIES_DATA !== 'undefined' ? STORIES_DATA.length : 237}`;

    // Update Bookmark UI
    updateBookmarkButtonUI(item.id);

    // Load High-Res Comic Image
    storyModalImage.src = item.image;
    storyModalImage.alt = `${item.number} ${item.title}`;

    // Populate Translation Drawer
    metaOrigTitle.textContent = item.origTitle ? `원제: ${item.origTitle}` : '원문 표기 없음';
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

    // Apply font size
    applyFontSize();

    // Scroll panels to top
    const drawerScroll = document.querySelector('.drawer-content-scroll');
    if (drawerScroll) drawerScroll.scrollTop = 0;
    storyMangaPanel.scrollTop = 0;
  }

  function toggleTranslationDrawer() {
    isTranslationDrawerOpen = !isTranslationDrawerOpen;
    storyModalBody.classList.toggle('drawer-open', isTranslationDrawerOpen);
    btnToggleTranslation.classList.toggle('active', isTranslationDrawerOpen);
  }

  function closeTranslationDrawer() {
    isTranslationDrawerOpen = false;
    storyModalBody.classList.remove('drawer-open');
    btnToggleTranslation.classList.remove('active');
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

    localStorage.setItem('shinji_last_story', nextItem.id);
    checkContinueReading();

    if (history.replaceState) {
      history.replaceState(null, '', `#story-${nextItem.num}`);
    }
  }

  function closeStoryModal() {
    storyModalBackdrop.classList.remove('active');
    document.body.style.overflow = '';
    closeTranslationDrawer();

    if (history.replaceState && window.location.hash.startsWith('#story-')) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  // Reader Font Size Controls
  function adjustFontSize(delta) {
    currentFontSizePercent = Math.max(85, Math.min(145, currentFontSizePercent + delta));
    applyFontSize();
  }

  function applyFontSize() {
    if (storyModalBodyText) {
      storyModalBodyText.style.fontSize = `${(1.02 * currentFontSizePercent) / 100}rem`;
    }
    if (fontIndicator) {
      fontIndicator.textContent = `${currentFontSizePercent}%`;
    }
  }

  // Copy Full Story Text
  function copyCurrentStoryText() {
    const item = activeStories[currentStoryIndex];
    if (!item) return;

    let fullTextToCopy = `${item.number} ${item.title}\n`;
    if (item.origTitle) fullTextToCopy += `(원제: ${item.origTitle})\n`;
    fullTextToCopy += `\n[한국어 번역 본문]\n${item.body}\n`;
    if (item.notes && item.notes.trim()) {
      fullTextToCopy += `\n[해설 및 번역 메모]\n${item.notes}\n`;
    }
    fullTextToCopy += `\n출처: 다카하시 신지 이야기 아카이브 (${window.location.origin}${window.location.pathname}#story-${item.num})`;

    navigator.clipboard.writeText(fullTextToCopy).then(() => {
      showToast('📋 이야기 본문이 클립보드에 복사되었습니다!');
    }).catch(() => {
      showToast('⚠️ 복사에 실패했습니다.');
    });
  }

  // Share Story Link
  function shareCurrentStoryLink() {
    const item = activeStories[currentStoryIndex];
    if (!item) return;

    const url = `${window.location.origin}${window.location.pathname}#story-${item.num}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast(`🔗 #${item.num} 이야기 링크가 복사되었습니다!`);
    }).catch(() => {
      showToast('⚠️ 링크 복사에 실패했습니다.');
    });
  }

  // Toast Notification
  function showToast(msg) {
    if (!toastBox) return;
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = msg;
    toastBox.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 2600);
  }

  // ========================================================
  // VIDEO LECTURE SECTION LOGIC
  // ========================================================
  function updateVideosData() {
    const rawQ = (searchQuery || '').trim();
    const cleanQ = rawQ.toLowerCase();

    activeLectures = LECTURE_DATA.filter(item => {
      const matchCategory = (videoCategory === 'all') || (item.category === videoCategory);
      if (!matchCategory) return false;
      if (!cleanQ) return true;

      return item.title.toLowerCase().includes(cleanQ) ||
        item.titleJp.toLowerCase().includes(cleanQ) ||
        item.summary.toLowerCase().includes(cleanQ) ||
        item.tags.some(tag => tag.toLowerCase().includes(cleanQ));
    });

    if (currentMode === 'video' && totalCountEl) {
      totalCountEl.textContent = activeLectures.length;
    }

    videoGrid.innerHTML = '';
    loadedVideoCount = 0;

    if (activeLectures.length === 0) {
      videoGrid.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-state-icon">🎬</div>
          <h3 class="empty-state-title">일치하는 강연 영상이 없습니다</h3>
          <p class="empty-state-desc">'<strong>${escapeHtml(rawQ)}</strong>' 검색어와 일치하는 영상을 찾을 수 없습니다.<br>다른 주제나 키워드로 검색해 보세요.</p>
          <button class="empty-state-btn" id="btnResetVideoSearch">전체 강연 보기</button>
        </div>
      `;
      const resetBtn = document.getElementById('btnResetVideoSearch');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          searchInput.value = '';
          searchQuery = '';
          if (searchClearBtn) searchClearBtn.style.display = 'none';
          updateVideosData();
        });
      }
      if (videoLoadingTrigger) videoLoadingTrigger.style.display = 'none';
      return;
    }

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
        <img class="card-thumb" src="${item.thumbnail}" alt="${item.title}" loading="lazy" decoding="async" onerror="this.src='https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg'">
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
          const allRows = timestampList.querySelectorAll('.timestamp-item');
          allRows.forEach(r => r.classList.remove('active'));
          row.classList.add('active');

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

    if (history.replaceState) {
      history.replaceState(null, '', `#video-${item.id}`);
    }
  }

  function closeVideoModal() {
    videoModalBackdrop.classList.remove('active');
    playerFrame.src = '';
    document.body.style.overflow = '';
    if (history.replaceState && window.location.hash.startsWith('#video-')) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  // Check URL Hash for Deep Linking on Page Load
  function checkUrlHash() {
    const hash = window.location.hash;
    if (!hash) return;

    const storyMatch = hash.match(/^#story-(\d+)$/i);
    if (storyMatch) {
      const storyNum = storyMatch[1];
      const storyId = parseInt(storyNum, 10);
      const story = STORIES_DATA.find(s => s.id === storyId);
      if (story) {
        switchMode('story');
        openStoryModal(story);
        return;
      }
    }

    const videoMatch = hash.match(/^#video-(\d+)$/i);
    if (videoMatch) {
      const vidId = parseInt(videoMatch[1], 10);
      const video = LECTURE_DATA.find(v => v.id === vidId);
      if (video) {
        switchMode('video');
        openVideoModal(video);
        return;
      }
    }
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

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
