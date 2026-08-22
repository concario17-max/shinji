/**
 * Application Logic for Shinji Takahashi Luxury Archive Website
 * 
 * Features:
 * 1. 📖 다카하시 신지 이야기 (237편 완역 & 3D 럭셔리 카드 & 몰입형 풀스크린 뷰어)
 * 2. 📚 정법 도서관 (다카하시 신지 강연집 10강 + 최후 유고 신·부활 전편 완역)
 *    - 2열 스플릿 프리미엄 전자책 리더 (TOC 사이드바 + Noto Serif 명조 리더)
 *    - 3가지 독서 테마 (시네마 다크 / OLED 트루블랙 / 세피아 페이퍼)
 *    - 읽기 진행률 프로그레스 바 & 마지막 읽은 위치 자동 저장
 * 3. 🎬 강연 동영상 아카이브 (47편 노래/DVD/CD & 타임스탬프 목차)
 * 4. ⚡ 초고속 점프 커맨드 팔레트 (Ctrl + K / Cmd + K) - 이야기/서적/영상 통합 검색
 * 5. 🔍 URL 해시 딥링크 (#story-001, #book-lectures-1, #book-shin_buhwal-1, #video-01)
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. Global State
  // ==========================================
  let currentMode = 'story'; // 'story' | 'book' | 'video'
  let storyChapter = 'all';  // 'all' | '1' | '2' | '3' | '4' | '5' | 'bookmark'
  let videoCategory = 'all'; // 'all' | '노래' | 'DVD' | 'CD'
  let currentBookId = 'lectures'; // 'lectures' | 'shin_buhwal'
  let searchQuery = '';
  
  let activeStories = [...(typeof STORIES_DATA !== 'undefined' ? STORIES_DATA : [])];
  let activeLectures = [...(typeof LECTURE_DATA !== 'undefined' ? LECTURE_DATA : [])];
  let activeBooks = [...(typeof BOOKS_DATA !== 'undefined' ? BOOKS_DATA : [])];

  // Story Viewer State
  let currentStoryIndex = 0;
  let isTranslationDrawerOpen = false;
  let currentFontSizePercent = 100;
  
  // Book Reader State
  let currentReadingBook = null;
  let currentReadingChapterIndex = 0;
  let isBookTocOpen = true;
  let bookReaderTheme = localStorage.getItem('shinji_book_theme') || 'cinema';
  let bookFontSizePercent = parseInt(localStorage.getItem('shinji_book_font') || '100', 10);
  let bookmarkedBookChapters = JSON.parse(localStorage.getItem('shinji_book_bookmarks') || '[]');

  // Bookmarks & Preferences
  let bookmarkedIds = JSON.parse(localStorage.getItem('shinji_bookmarks') || '[]');
  let currentViewerTheme = localStorage.getItem('shinji_viewer_theme') || 'cinema';

  // Pagination / Chunk Loading
  const STORY_CHUNK = 12;
  const VIDEO_CHUNK = 8;
  let loadedStoryCount = 0;
  let loadedVideoCount = 0;
  let isStoryLoading = false;
  let isVideoLoading = false;

  // ==========================================
  // 2. DOM Elements
  // ==========================================
  
  // Mode Navigation & Global Headers
  const modeStoryBtn = document.getElementById('modeStoryBtn');
  const modeBookBtn = document.getElementById('modeBookBtn');
  const modeVideoBtn = document.getElementById('modeVideoBtn');
  const storiesSection = document.getElementById('storiesSection');
  const booksSection = document.getElementById('booksSection');
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

  // Story Elements
  const chapFilterBtns = document.querySelectorAll('.chap-filter-btn');
  const bookmarkCountPill = document.getElementById('bookmarkCountPill');
  const chapterInfoBanner = document.getElementById('chapterInfoBanner');
  const chapBannerBadge = document.getElementById('chapBannerBadge');
  const chapBannerTitle = document.getElementById('chapBannerTitle');
  const chapBannerRange = document.getElementById('chapBannerRange');
  const chapBannerFlow = document.getElementById('chapBannerFlow');
  const storyGrid = document.getElementById('storyGrid');
  const storyLoadingTrigger = document.getElementById('storyLoadingTrigger');

  // Story Viewer Modal
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

  // Story Drawer
  const btnToggleTranslation = document.getElementById('btnToggleTranslation');
  const btnCloseDrawer = document.getElementById('btnCloseDrawer');
  const metaOrigTitle = document.getElementById('metaOrigTitle');
  const metaContentType = document.getElementById('metaContentType');
  const rowContentType = document.getElementById('rowContentType');
  const storyModalBodyText = document.getElementById('storyModalBodyText');
  const storyCommentarySection = document.getElementById('storyCommentarySection');
  const storyModalNotes = document.getElementById('storyModalNotes');
  const btnFontDecrease = document.getElementById('btnFontDecrease');
  const btnFontIncrease = document.getElementById('btnFontIncrease');
  const fontIndicator = document.getElementById('fontIndicator');
  const btnCopyStoryText = document.getElementById('btnCopyStoryText');
  const btnShareStory = document.getElementById('btnShareStory');

  // Books Section Elements
  const bookNavTabs = document.getElementById('bookNavTabs');
  const bookSpotlightCard = document.getElementById('bookSpotlightCard');
  const bookChaptersGridTitle = document.getElementById('bookChaptersGridTitle');
  const bookChaptersCountTag = document.getElementById('bookChaptersCountTag');
  const bookChaptersGrid = document.getElementById('bookChaptersGrid');

  // E-Book Reader Modal Elements
  const bookReaderModal = document.getElementById('bookReaderModal');
  const bookReadingProgressBar = document.getElementById('bookReadingProgressBar');
  const btnToggleBookToc = document.getElementById('btnToggleBookToc');
  const readerBookBadge = document.getElementById('readerBookBadge');
  const readerChapterNumber = document.getElementById('readerChapterNumber');
  const readerChapterTitle = document.getElementById('readerChapterTitle');
  const btnBookmarkBookChapter = document.getElementById('btnBookmarkBookChapter');
  const btnBookThemeSelector = document.getElementById('btnBookThemeSelector');
  const bookThemeLabel = document.getElementById('bookThemeLabel');
  const btnBookFontDecrease = document.getElementById('btnBookFontDecrease');
  const bookFontIndicator = document.getElementById('bookFontIndicator');
  const btnBookFontIncrease = document.getElementById('btnBookFontIncrease');
  const btnToggleBookFullscreen = document.getElementById('btnToggleBookFullscreen');
  const btnCopyBookText = document.getElementById('btnCopyBookText');
  const bookReaderCloseBtn = document.getElementById('bookReaderCloseBtn');
  const bookReaderMainStage = document.getElementById('bookReaderMainStage');
  const bookTocSidebar = document.getElementById('bookTocSidebar');
  const tocSidebarBadge = document.getElementById('tocSidebarBadge');
  const tocSidebarBookTitle = document.getElementById('tocSidebarBookTitle');
  const btnCloseTocMobile = document.getElementById('btnCloseTocMobile');
  const bookTocItemsList = document.getElementById('bookTocItemsList');
  const bookContentCanvas = document.getElementById('bookContentCanvas');
  const artChapterNumber = document.getElementById('artChapterNumber');
  const artPageRange = document.getElementById('artPageRange');
  const artReadingTime = document.getElementById('artReadingTime');
  const artChapterTitle = document.getElementById('artChapterTitle');
  const artOrigTitle = document.getElementById('artOrigTitle');
  const artTagsBar = document.getElementById('artTagsBar');
  const artGuideBox = document.getElementById('artGuideBox');
  const artGuideText = document.getElementById('artGuideText');
  const artSummaryBox = document.getElementById('artSummaryBox');
  const artSummaryText = document.getElementById('artSummaryText');
  const artParagraphsContainer = document.getElementById('artParagraphsContainer');
  const btnBookPrevChapter = document.getElementById('btnBookPrevChapter');
  const btnBookPrevTitle = document.getElementById('btnBookPrevTitle');
  const btnBookOpenToc = document.getElementById('btnBookOpenToc');
  const btnBookNextChapter = document.getElementById('btnBookNextChapter');
  const btnBookNextTitle = document.getElementById('btnBookNextTitle');

  // Command Palette Elements
  const cmdPaletteModal = document.getElementById('cmdPaletteModal');
  const cmdPaletteInput = document.getElementById('cmdPaletteInput');
  const cmdResultsList = document.getElementById('cmdResultsList');
  let cmdActiveIndex = 0;
  let cmdFilteredItems = [];

  // Video Section Elements
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

  // ==========================================
  // 3. Initialization
  // ==========================================
  init();

  function init() {
    applyViewerTheme(currentViewerTheme);
    applyBookReaderTheme(bookReaderTheme);
    applyBookFontSize(bookFontSizePercent);
    updateBookmarkCountPill();
    checkContinueReading();
    setupEventListeners();
    updateStoriesData();
    renderBooksSection();
    updateVideosData();
    checkUrlHash();
  }

  function setupEventListeners() {
    // Mode Switcher Buttons
    modeStoryBtn.addEventListener('click', () => switchMode('story'));
    if (modeBookBtn) modeBookBtn.addEventListener('click', () => switchMode('book'));
    modeVideoBtn.addEventListener('click', () => switchMode('video'));

    // Search Input
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      if (searchClearBtn) {
        searchClearBtn.style.display = searchQuery ? 'flex' : 'none';
      }
      if (currentMode === 'story') {
        updateStoriesData();
      } else if (currentMode === 'book') {
        renderBooksSection();
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
        } else if (currentMode === 'book') {
          renderBooksSection();
        } else {
          updateVideosData();
        }
      });
    }

    // Command Palette Trigger
    if (btnOpenCommandPalette) {
      btnOpenCommandPalette.addEventListener('click', openCommandPalette);
    }

    // Continue Reading Banner
    if (btnContinueStory) {
      btnContinueStory.addEventListener('click', () => {
        if (currentMode === 'story') {
          const lastId = parseInt(localStorage.getItem('shinji_last_story'), 10);
          const story = STORIES_DATA.find(s => s.id === lastId);
          if (story) openStoryModal(story);
        } else if (currentMode === 'book') {
          const lastBookJson = localStorage.getItem('shinji_last_read_book');
          if (lastBookJson) {
            try {
              const lastInfo = JSON.parse(lastBookJson);
              openBookReader(lastInfo.bookId, lastInfo.chapterIndex);
            } catch (err) {}
          } else {
            openBookReader('lectures', 0);
          }
        } else {
          const lastVidId = parseInt(localStorage.getItem('shinji_last_video'), 10);
          const video = LECTURE_DATA.find(v => v.id === lastVidId);
          if (video) openVideoModal(video);
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

    // Story Viewer Events
    if (storyModalCloseBtn) storyModalCloseBtn.addEventListener('click', closeStoryModal);
    if (storyPrevBtn) storyPrevBtn.addEventListener('click', () => navigateStory(-1));
    if (storyNextBtn) storyNextBtn.addEventListener('click', () => navigateStory(1));
    if (btnBookmarkStory) btnBookmarkStory.addEventListener('click', toggleCurrentStoryBookmark);
    if (btnThemeSelector) btnThemeSelector.addEventListener('click', cycleViewerTheme);
    if (btnToggleFullscreen) btnToggleFullscreen.addEventListener('click', toggleFullscreen);
    if (storyModalImage) storyModalImage.addEventListener('dblclick', toggleFullscreen);
    if (btnToggleTranslation) btnToggleTranslation.addEventListener('click', toggleTranslationDrawer);
    if (btnCloseDrawer) btnCloseDrawer.addEventListener('click', closeTranslationDrawer);
    if (btnFontDecrease) btnFontDecrease.addEventListener('click', () => adjustFontSize(-15));
    if (btnFontIncrease) btnFontIncrease.addEventListener('click', () => adjustFontSize(15));
    if (btnCopyStoryText) btnCopyStoryText.addEventListener('click', copyCurrentStoryText);
    if (btnShareStory) btnShareStory.addEventListener('click', shareCurrentStoryLink);

    // E-Book Reader Modal Events
    if (bookReaderCloseBtn) bookReaderCloseBtn.addEventListener('click', closeBookReader);
    if (btnToggleBookToc) btnToggleBookToc.addEventListener('click', toggleBookToc);
    if (btnCloseTocMobile) btnCloseTocMobile.addEventListener('click', () => {
      if (bookTocSidebar) bookTocSidebar.classList.remove('toc-open');
    });
    if (btnBookOpenToc) btnBookOpenToc.addEventListener('click', toggleBookToc);
    if (btnBookPrevChapter) btnBookPrevChapter.addEventListener('click', () => navigateBookChapter(-1));
    if (btnBookNextChapter) btnBookNextChapter.addEventListener('click', () => navigateBookChapter(1));
    if (btnBookmarkBookChapter) btnBookmarkBookChapter.addEventListener('click', toggleCurrentBookBookmark);
    if (btnBookThemeSelector) btnBookThemeSelector.addEventListener('click', cycleBookTheme);
    if (btnBookFontDecrease) btnBookFontDecrease.addEventListener('click', () => adjustBookFontSize(-10));
    if (btnBookFontIncrease) btnBookFontIncrease.addEventListener('click', () => adjustBookFontSize(10));
    if (btnToggleBookFullscreen) btnToggleBookFullscreen.addEventListener('click', toggleBookFullscreen);
    if (btnCopyBookText) btnCopyBookText.addEventListener('click', copyCurrentBookText);

    // Reading Progress Listener on E-Book Content Canvas
    if (bookContentCanvas) {
      bookContentCanvas.addEventListener('scroll', updateReadingProgress);
    }

    // Video Modal Events
    if (videoModalCloseBtn) videoModalCloseBtn.addEventListener('click', closeVideoModal);
    if (videoModalBackdrop) {
      videoModalBackdrop.addEventListener('click', (e) => {
        if (e.target === videoModalBackdrop) closeVideoModal();
      });
    }

    // Global Keydown Shortcut Handler
    document.addEventListener('keydown', handleGlobalKeydown);

    // Scroll-to-Top Button & Infinite Scroll
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
      handleScroll();
    });

    if (scrollTopBtn) {
      scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  // ==========================================
  // 4. Mode Switching Logic
  // ==========================================
  function switchMode(mode) {
    if (currentMode === mode) return;
    currentMode = mode;

    modeStoryBtn.classList.toggle('active', mode === 'story');
    if (modeBookBtn) modeBookBtn.classList.toggle('active', mode === 'book');
    modeVideoBtn.classList.toggle('active', mode === 'video');

    storiesSection.style.display = mode === 'story' ? 'block' : 'none';
    if (booksSection) booksSection.style.display = mode === 'book' ? 'block' : 'none';
    videosSection.style.display = mode === 'video' ? 'block' : 'none';

    // Update Hero Banner
    if (mode === 'story') {
      heroTitle.textContent = '다카하시 신지 이야기 · 237편 완역';
      heroSubtitle.textContent = '5개 장으로 완성된 신지의 일대기와 영적 진리, 그리고 237편 요약 만화 카드와 번역 전문을 제공합니다.';
      totalCountEl.textContent = '237';
      subStat1.textContent = '5개 장 체계';
      subStat2.textContent = '237편 만화 요약 & 번역 전문 1:1';
      searchInput.placeholder = '이야기 번호, 제목, 키워드 검색...';
    } else if (mode === 'book') {
      heroTitle.textContent = '다카하시 신지 정법 도서관 · 핵심 서적 및 유고 완역';
      heroSubtitle.textContent = '10대 핵심 강연록 집대성 『강연집』 및 최후의 미완성 대작 『신·부활』 전편을 프리미엄 전자책으로 제공합니다.';
      totalCountEl.textContent = `${activeBooks.length}`;
      subStat1.textContent = '강연집 10강 + 신부활 3부 13절';
      subStat2.textContent = '프리미엄 2열 스플릿 전자책 뷰어';
      searchInput.placeholder = '서적 챕터, 강연 제목, 신리 키워드 검색...';
      renderBooksSection();
    } else {
      heroTitle.textContent = '다카하시 신지 강연 동영상 & 음원 아카이브';
      heroSubtitle.textContent = '노래, DVD 강연 시리즈(01~18), CD 음성 강연 등 47편의 귀중한 육성 기록을 타임스탬프 목차와 함께 감상하세요.';
      totalCountEl.textContent = '47';
      subStat1.textContent = '노래 · DVD · CD 전편';
      subStat2.textContent = '초단위 타임스탬프 목차 지원';
      searchInput.placeholder = '강연 번호, 제목, 강연 주제 검색...';
    }

    checkContinueReading();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ==========================================
  // 5. Books Library Section Logic
  // ==========================================
  function renderBooksSection() {
    if (!booksSection || activeBooks.length === 0) return;

    // 1. Render Book Tabs
    if (bookNavTabs) {
      bookNavTabs.innerHTML = '';
      activeBooks.forEach(book => {
        const btn = document.createElement('button');
        btn.className = `book-tab-btn ${book.id === currentBookId ? 'active' : ''}`;
        btn.innerHTML = `
          <span class="book-tab-icon">${book.id === 'lectures' ? '📜' : '✨'}</span>
          <div class="book-tab-text">
            <span class="book-tab-title">${book.title}</span>
            <span class="book-tab-meta">${book.badge} · ${book.totalChapters}개 챕터</span>
          </div>
        `;
        btn.addEventListener('click', () => {
          currentBookId = book.id;
          renderBooksSection();
        });
        bookNavTabs.appendChild(btn);
      });
    }

    const currentBook = activeBooks.find(b => b.id === currentBookId) || activeBooks[0];

    // 2. Render Spotlight Hero Card
    if (bookSpotlightCard) {
      bookSpotlightCard.innerHTML = `
        <div class="book-spotlight-inner">
          <div class="book-cover-graphic" style="background: ${currentBook.coverGradient}; border-color: ${currentBook.accentColor};">
            <span class="cover-badge">${currentBook.badge}</span>
            <div class="cover-title-group">
              <h4 class="cover-title">${currentBook.title}</h4>
              <p class="cover-author">${currentBook.author}</p>
            </div>
          </div>
          <div class="book-spotlight-info">
            <div class="spotlight-badge-row">
              <span class="spotlight-badge">${currentBook.badge}</span>
              <span class="spotlight-pages">📄 총 ${currentBook.totalPages}쪽 · ${currentBook.totalChapters}개 챕터 완역</span>
            </div>
            <h2 class="spotlight-title">${currentBook.title}</h2>
            <p class="spotlight-subtitle">${currentBook.subtitle || currentBook.origTitle}</p>
            <p class="spotlight-desc">${currentBook.description}</p>
            <div class="spotlight-cta-row">
              <button class="btn-read-start" id="btnSpotlightReadStart">
                <span>📖 1장부터 전자책으로 정주행</span>
              </button>
            </div>
          </div>
        </div>
      `;

      const readStartBtn = document.getElementById('btnSpotlightReadStart');
      if (readStartBtn) {
        readStartBtn.addEventListener('click', () => {
          openBookReader(currentBook.id, 0);
        });
      }
    }

    // 3. Render Chapter Cards
    if (bookChaptersGrid) {
      bookChaptersGrid.innerHTML = '';
      let chapters = currentBook.chapters;

      // Filter by search query if present
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        chapters = chapters.filter(c => 
          c.title.toLowerCase().includes(q) ||
          c.number.toLowerCase().includes(q) ||
          (c.origTitle && c.origTitle.toLowerCase().includes(q)) ||
          (c.summary && c.summary.toLowerCase().includes(q)) ||
          (c.tags && c.tags.some(t => t.toLowerCase().includes(q)))
        );
      }

      if (bookChaptersGridTitle) {
        bookChaptersGridTitle.textContent = `『${currentBook.title}』 수록 챕터`;
      }
      if (bookChaptersCountTag) {
        bookChaptersCountTag.textContent = `총 ${chapters.length}개 챕터`;
      }

      if (chapters.length === 0) {
        bookChaptersGrid.innerHTML = `
          <div class="empty-state-card">
            <div class="empty-state-icon">🔍</div>
            <h3 class="empty-state-title">검색된 챕터가 없습니다</h3>
            <p class="empty-state-desc">‘${escapeHtml(searchQuery)}’ 키워드와 일치하는 서적 챕터를 찾을 수 없습니다.</p>
          </div>
        `;
        return;
      }

      chapters.forEach(chap => {
        const originalIndex = currentBook.chapters.findIndex(c => c.id === chap.id);
        const card = createChapterCard(currentBook, chap, originalIndex);
        bookChaptersGrid.appendChild(card);
      });
    }
  }

  function createChapterCard(book, chap, index) {
    const card = document.createElement('div');
    card.className = 'book-chapter-card';

    const tagsHtml = (chap.tags || []).map(t => `<span class="chap-tag-pill">#${t}</span>`).join('');

    card.innerHTML = `
      <div>
        <div class="chap-card-top">
          <span class="chap-card-num">${chap.number}</span>
          <span class="chap-card-time">⏱️ ${chap.readingTime || '약 15분'}</span>
        </div>
        <h3 class="chap-card-title">${chap.title}</h3>
        ${chap.origTitle ? `<p class="chap-card-orig-title">${chap.origTitle}</p>` : ''}
        <p class="chap-card-summary">${chap.summary || ''}</p>
        <div class="chap-card-tags">${tagsHtml}</div>
      </div>
      <div class="chap-card-footer">
        <span class="chap-card-pages">${chap.origPages || chap.pageRange || ''}</span>
        <button class="chap-card-read-btn">
          <span>전문 읽기</span>
          <span>➔</span>
        </button>
      </div>
    `;

    card.addEventListener('click', () => {
      openBookReader(book.id, index);
    });

    return card;
  }

  // ==========================================
  // 6. Premium E-Book Reader Modal Logic
  // ==========================================
  function openBookReader(bookId, chapterIndex = 0) {
    const book = activeBooks.find(b => b.id === bookId) || activeBooks[0];
    if (!book || !book.chapters || book.chapters.length === 0) return;

    currentReadingBook = book;
    currentReadingChapterIndex = Math.max(0, Math.min(chapterIndex, book.chapters.length - 1));

    if (!bookReaderModal) return;

    // Set theme and font
    applyBookReaderTheme(bookReaderTheme);
    applyBookFontSize(bookFontSizePercent);

    // Update modal top bar info
    if (readerBookBadge) readerBookBadge.textContent = book.title;
    if (tocSidebarBookTitle) tocSidebarBookTitle.textContent = book.title;
    if (tocSidebarBadge) tocSidebarBadge.textContent = book.badge;

    // Render TOC Sidebar items
    renderBookTocItems();

    // Render Chapter Content
    renderBookReaderChapter(currentReadingChapterIndex);

    // Show Reader Modal
    bookReaderModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Save last read info
    localStorage.setItem('shinji_last_read_book', JSON.stringify({
      bookId: book.id,
      bookTitle: book.title,
      chapterIndex: currentReadingChapterIndex,
      chapterTitle: book.chapters[currentReadingChapterIndex].title
    }));
    checkContinueReading();

    // Deep link URL Hash
    if (history.replaceState) {
      history.replaceState(null, '', `#book-${book.id}-${book.chapters[currentReadingChapterIndex].id}`);
    }
  }

  function renderBookTocItems() {
    if (!bookTocItemsList || !currentReadingBook) return;
    bookTocItemsList.innerHTML = '';

    currentReadingBook.chapters.forEach((chap, idx) => {
      const btn = document.createElement('button');
      btn.className = `toc-item-btn ${idx === currentReadingChapterIndex ? 'active' : ''}`;
      btn.innerHTML = `
        <span class="toc-item-num">${chap.number}</span>
        <span class="toc-item-title">${chap.title}</span>
        <span class="toc-item-meta">${chap.origPages || chap.pageRange || ''} · ${chap.readingTime || ''}</span>
      `;
      btn.addEventListener('click', () => {
        currentReadingChapterIndex = idx;
        renderBookReaderChapter(idx);
        renderBookTocItems();
        // On mobile, close TOC after selecting
        if (window.innerWidth <= 1024 && bookTocSidebar) {
          bookTocSidebar.classList.remove('toc-open');
        }
      });
      bookTocItemsList.appendChild(btn);
    });
  }

  function renderBookReaderChapter(index) {
    if (!currentReadingBook) return;
    const chapter = currentReadingBook.chapters[index];
    if (!chapter) return;

    // Top Bar Meta
    if (readerChapterNumber) readerChapterNumber.textContent = chapter.number;
    if (readerChapterTitle) readerChapterTitle.textContent = chapter.title;

    // Bookmark Button state
    updateBookBookmarkUI(chapter);

    // Article Header
    if (artChapterNumber) artChapterNumber.textContent = chapter.number;
    if (artPageRange) artPageRange.textContent = chapter.origPages || chapter.pageRange || '';
    if (artReadingTime) artReadingTime.textContent = `⏱️ ${chapter.readingTime || '약 15분'}`;
    if (artChapterTitle) artChapterTitle.textContent = chapter.title;
    if (artOrigTitle) {
      artOrigTitle.textContent = chapter.origTitle || '';
      artOrigTitle.style.display = chapter.origTitle ? 'block' : 'none';
    }

    // Tags
    if (artTagsBar) {
      artTagsBar.innerHTML = (chapter.tags || []).map(t => `<span class="chap-tag-pill">#${t}</span>`).join('');
    }

    // Guide Box
    if (artGuideBox && artGuideText) {
      if (chapter.guideNote) {
        artGuideText.textContent = chapter.guideNote;
        artGuideBox.style.display = 'block';
      } else {
        artGuideBox.style.display = 'none';
      }
    }

    // Summary Box
    if (artSummaryBox && artSummaryText) {
      if (chapter.summary) {
        artSummaryText.textContent = chapter.summary;
        artSummaryBox.style.display = 'block';
      } else {
        artSummaryBox.style.display = 'none';
      }
    }

    // Body Paragraphs
    if (artParagraphsContainer) {
      artParagraphsContainer.innerHTML = '';
      (chapter.paragraphs || []).forEach(pText => {
        const p = document.createElement('p');
        if (pText.startsWith('“') || pText.startsWith('"') || pText.startsWith('‘')) {
          p.classList.add('dialogue-para');
        }
        p.textContent = pText;
        artParagraphsContainer.appendChild(p);
      });
    }

    // Bottom Navigation
    const prevChap = index > 0 ? currentReadingBook.chapters[index - 1] : null;
    const nextChap = index < currentReadingBook.chapters.length - 1 ? currentReadingBook.chapters[index + 1] : null;

    if (btnBookPrevChapter && btnBookPrevTitle) {
      btnBookPrevChapter.disabled = !prevChap;
      btnBookPrevTitle.textContent = prevChap ? `${prevChap.number} ${prevChap.title}` : '첫 챕터입니다';
    }
    if (btnBookNextChapter && btnBookNextTitle) {
      btnBookNextChapter.disabled = !nextChap;
      btnBookNextTitle.textContent = nextChap ? `${nextChap.number} ${nextChap.title}` : '마지막 챕터입니다';
    }

    // Reset scroll & progress
    if (bookContentCanvas) {
      bookContentCanvas.scrollTop = 0;
    }
    if (bookReadingProgressBar) {
      bookReadingProgressBar.style.width = '0%';
    }

    // Highlight active in sidebar
    renderBookTocItems();

    // Save Last Read
    localStorage.setItem('shinji_last_read_book', JSON.stringify({
      bookId: currentReadingBook.id,
      bookTitle: currentReadingBook.title,
      chapterIndex: index,
      chapterTitle: chapter.title
    }));
  }

  function closeBookReader() {
    if (bookReaderModal) {
      bookReaderModal.style.display = 'none';
    }
    document.body.style.overflow = '';
    if (history.replaceState && window.location.hash.startsWith('#book-')) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  function navigateBookChapter(direction) {
    if (!currentReadingBook) return;
    const newIdx = currentReadingChapterIndex + direction;
    if (newIdx >= 0 && newIdx < currentReadingBook.chapters.length) {
      currentReadingChapterIndex = newIdx;
      renderBookReaderChapter(newIdx);
    }
  }

  function updateReadingProgress() {
    if (!bookContentCanvas || !bookReadingProgressBar) return;
    const scrollTop = bookContentCanvas.scrollTop;
    const scrollHeight = bookContentCanvas.scrollHeight - bookContentCanvas.clientHeight;
    if (scrollHeight > 0) {
      const progress = Math.min(100, Math.max(0, Math.round((scrollTop / scrollHeight) * 100)));
      bookReadingProgressBar.style.width = `${progress}%`;
    }
  }

  function toggleBookToc() {
    if (!bookTocSidebar) return;
    if (window.innerWidth <= 1024) {
      bookTocSidebar.classList.toggle('toc-open');
    } else {
      isBookTocOpen = !isBookTocOpen;
      bookTocSidebar.classList.toggle('collapsed', !isBookTocOpen);
      if (btnToggleBookToc) {
        btnToggleBookToc.classList.toggle('active', isBookTocOpen);
      }
    }
  }

  function cycleBookTheme() {
    const themes = ['cinema', 'oled', 'sepia'];
    const currentIdx = themes.indexOf(bookReaderTheme);
    const nextTheme = themes[(currentIdx + 1) % themes.length];
    applyBookReaderTheme(nextTheme);
  }

  function applyBookReaderTheme(theme) {
    bookReaderTheme = theme;
    localStorage.setItem('shinji_book_theme', theme);
    if (bookReaderModal) {
      bookReaderModal.setAttribute('data-theme', theme);
    }
    if (bookThemeLabel) {
      const labels = { cinema: '시네마', oled: 'OLED', sepia: '세피아' };
      bookThemeLabel.textContent = labels[theme] || '시네마';
    }
  }

  function adjustBookFontSize(delta) {
    const validSizes = [85, 95, 100, 110, 120, 130, 140];
    let currentIdx = validSizes.indexOf(bookFontSizePercent);
    if (currentIdx === -1) currentIdx = 2; // default 100

    if (delta > 0 && currentIdx < validSizes.length - 1) {
      applyBookFontSize(validSizes[currentIdx + 1]);
    } else if (delta < 0 && currentIdx > 0) {
      applyBookFontSize(validSizes[currentIdx - 1]);
    }
  }

  function applyBookFontSize(size) {
    bookFontSizePercent = size;
    localStorage.setItem('shinji_book_font', size.toString());
    if (artParagraphsContainer) {
      artParagraphsContainer.style.fontSize = `${(size / 100) * 1.15}rem`;
    }
    if (bookFontIndicator) {
      bookFontIndicator.textContent = `${size}%`;
    }
  }

  function toggleBookFullscreen() {
    if (!document.fullscreenElement) {
      if (bookReaderModal.requestFullscreen) {
        bookReaderModal.requestFullscreen();
      } else if (bookReaderModal.webkitRequestFullscreen) {
        bookReaderModal.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  function toggleCurrentBookBookmark() {
    if (!currentReadingBook) return;
    const chap = currentReadingBook.chapters[currentReadingChapterIndex];
    const itemKey = `${currentReadingBook.id}-${chap.id}`;

    const exists = bookmarkedBookChapters.includes(itemKey);
    if (exists) {
      bookmarkedBookChapters = bookmarkedBookChapters.filter(k => k !== itemKey);
      showToast('📖 보관함에서 제거되었습니다.');
    } else {
      bookmarkedBookChapters.push(itemKey);
      showToast('⭐ 보관함에 저장되었습니다.');
    }
    localStorage.setItem('shinji_book_bookmarks', JSON.stringify(bookmarkedBookChapters));
    updateBookBookmarkUI(chap);
  }

  function updateBookBookmarkUI(chapter) {
    if (!btnBookmarkBookChapter || !currentReadingBook) return;
    const itemKey = `${currentReadingBook.id}-${chapter.id}`;
    const isBookmarked = bookmarkedBookChapters.includes(itemKey);
    const starIcon = btnBookmarkBookChapter.querySelector('.btn-star-icon');
    const label = btnBookmarkBookChapter.querySelector('.btn-tool-label');

    if (starIcon) starIcon.textContent = isBookmarked ? '★' : '☆';
    if (label) label.textContent = isBookmarked ? '보관됨' : '보관';
    btnBookmarkBookChapter.classList.toggle('active', isBookmarked);
  }

  function copyCurrentBookText() {
    if (!currentReadingBook) return;
    const chap = currentReadingBook.chapters[currentReadingChapterIndex];
    const textToCopy = `[${currentReadingBook.title}] ${chap.number} ${chap.title}\n\n${(chap.paragraphs || []).join('\n\n')}\n\n- 다카하시 신지 아카이브`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast('📋 본문 전문이 클립보드에 복사되었습니다.');
    }).catch(() => {
      showToast('복사에 실패했습니다.');
    });
  }

  // ==========================================
  // 7. Story Archive & Modal Logic
  // ==========================================
  function updateStoriesData() {
    let filtered = [...STORIES_DATA];

    if (storyChapter === 'bookmark') {
      filtered = filtered.filter(s => bookmarkedIds.includes(s.id));
    } else if (storyChapter !== 'all') {
      filtered = filtered.filter(s => s.chapter === parseInt(storyChapter, 10));
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.number.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        (s.origTitle && s.origTitle.toLowerCase().includes(q)) ||
        (s.body && s.body.toLowerCase().includes(q)) ||
        (s.keywords && s.keywords.some(k => k.toLowerCase().includes(q)))
      );
    }

    activeStories = filtered;
    loadedStoryCount = 0;
    storyGrid.innerHTML = '';

    if (chapterInfoBanner) {
      if (storyChapter !== 'all' && storyChapter !== 'bookmark') {
        const chapInfo = getChapterInfo(parseInt(storyChapter, 10));
        chapBannerBadge.textContent = chapInfo.badge;
        chapBannerTitle.textContent = chapInfo.title;
        chapBannerRange.textContent = `${chapInfo.range} (총 ${chapInfo.count}편)`;
        chapBannerFlow.textContent = chapInfo.flow;
        chapterInfoBanner.style.display = 'block';
      } else {
        chapterInfoBanner.style.display = 'none';
      }
    }

    if (activeStories.length === 0) {
      storyGrid.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-state-icon">${storyChapter === 'bookmark' ? '⭐' : '🔍'}</div>
          <h3 class="empty-state-title">${storyChapter === 'bookmark' ? '보관된 이야기가 없습니다' : '검색 결과가 없습니다'}</h3>
          <p class="empty-state-desc">${storyChapter === 'bookmark' ? '이야기 리더에서 별(☆) 아이콘을 눌러 즐겨찾기에 추가해 보세요.' : `‘${escapeHtml(searchQuery)}’ 에 해당하는 이야기를 찾을 수 없습니다.`}</p>
        </div>
      `;
      if (storyLoadingTrigger) storyLoadingTrigger.style.display = 'none';
      return;
    }

    renderNextStoryChunk();
  }

  function renderNextStoryChunk() {
    if (isStoryLoading || loadedStoryCount >= activeStories.length) return;
    isStoryLoading = true;

    const nextChunk = activeStories.slice(loadedStoryCount, loadedStoryCount + STORY_CHUNK);
    nextChunk.forEach(story => {
      const card = createStoryCard(story);
      storyGrid.appendChild(card);
    });

    loadedStoryCount += nextChunk.length;
    isStoryLoading = false;

    if (storyLoadingTrigger) {
      storyLoadingTrigger.style.display = loadedStoryCount < activeStories.length ? 'block' : 'none';
    }
  }

  function createStoryCard(story) {
    const card = document.createElement('div');
    card.className = `story-card chap-${story.chapter}`;

    const isBookmarked = bookmarkedIds.includes(story.id);
    const storyNumStr = story.num || String(story.id).padStart(3, '0');
    const thumbUrl = story.thumb || story.thumbImage || `images/stories/thumbs/${storyNumStr}.webp`;
    const fullUrl = story.image || story.fullImage || `images/stories/${storyNumStr}.webp`;

    card.innerHTML = `
      <div class="card-image-box">
        <img class="story-thumb" src="${thumbUrl}" alt="${story.title}" loading="lazy" decoding="async" onerror="this.src='${fullUrl}'">
        <span class="card-chap-pill chap-${story.chapter}">제${story.chapter}장</span>
        <button class="card-star-btn ${isBookmarked ? 'active' : ''}" data-id="${story.id}" title="보관함 저장">
          ${isBookmarked ? '★' : '☆'}
        </button>
      </div>
      <div class="story-card-body">
        <div class="card-meta-line">
          <span class="story-num">${story.number}</span>
          <span class="story-time">⏱️ 3분 읽기</span>
        </div>
        <h3 class="story-title">${story.title}</h3>
        <p class="story-excerpt">${story.body ? story.body.substring(0, 100) + '...' : ''}</p>
      </div>
    `;

    // Click card to open modal
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-star-btn')) {
        e.stopPropagation();
        toggleBookmark(story.id);
        return;
      }
      openStoryModal(story);
    });

    return card;
  }

  function openStoryModal(story) {
    const idx = activeStories.findIndex(s => s.id === story.id);
    currentStoryIndex = idx !== -1 ? idx : 0;
    renderStoryModalContent(story);

    storyModalBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Save last read story
    localStorage.setItem('shinji_last_story', story.id);
    checkContinueReading();

    if (history.replaceState) {
      history.replaceState(null, '', `#story-${String(story.id).padStart(3, '0')}`);
    }
  }

  function renderStoryModalContent(story) {
    const storyNumStr = story.num || String(story.id).padStart(3, '0');
    const fullUrl = story.image || story.fullImage || `images/stories/${storyNumStr}.webp`;
    const thumbUrl = story.thumb || story.thumbImage || `images/stories/thumbs/${storyNumStr}.webp`;

    storyModalChapBadge.textContent = `제${story.chapter}장`;
    storyModalNumber.textContent = story.number;
    storyModalTitle.textContent = story.title;
    storyModalIndex.textContent = `${storyNumStr} / 237`;
    storyModalImage.src = fullUrl;
    storyModalImage.alt = `${story.number} ${story.title} 요약 만화`;
    storyModalImage.onerror = function() {
      this.src = thumbUrl;
    };

    if (metaOrigTitle) metaOrigTitle.textContent = story.origTitle || '';
    if (metaContentType) metaContentType.textContent = story.contentType || '-';
    if (storyModalBodyText) {
      storyModalBodyText.innerHTML = (story.paragraphs || [story.body]).map(p => `<p>${p}</p>`).join('');
    }

    if (storyModalNotes && storyCommentarySection) {
      if (story.notes) {
        let notesArr = [];
        if (Array.isArray(story.notes)) {
          notesArr = story.notes;
        } else if (typeof story.notes === 'string' && story.notes.trim()) {
          notesArr = story.notes.split('\n').map(n => n.trim()).filter(n => n.length > 0);
        }
        if (notesArr.length > 0) {
          storyModalNotes.innerHTML = notesArr.map(n => `<li>${n.replace(/^[•\-\*]\s*/, '')}</li>`).join('');
          storyCommentarySection.style.display = 'block';
        } else {
          storyCommentarySection.style.display = 'none';
        }
      } else {
        storyCommentarySection.style.display = 'none';
      }
    }

    updateStoryBookmarkButton(story.id);
  }

  function closeStoryModal() {
    storyModalBackdrop.classList.remove('active');
    document.body.style.overflow = '';
    closeTranslationDrawer();
    if (history.replaceState && window.location.hash.startsWith('#story-')) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  function navigateStory(direction) {
    const newIdx = currentStoryIndex + direction;
    if (newIdx >= 0 && newIdx < activeStories.length) {
      currentStoryIndex = newIdx;
      renderStoryModalContent(activeStories[newIdx]);
    }
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

  function adjustFontSize(delta) {
    const validSizes = [85, 100, 115, 130];
    let currentIdx = validSizes.indexOf(currentFontSizePercent);
    if (currentIdx === -1) currentIdx = 1;

    if (delta > 0 && currentIdx < validSizes.length - 1) {
      currentFontSizePercent = validSizes[currentIdx + 1];
    } else if (delta < 0 && currentIdx > 0) {
      currentFontSizePercent = validSizes[currentIdx - 1];
    }

    if (storyModalBodyText) {
      storyModalBodyText.style.fontSize = `${currentFontSizePercent}%`;
    }
    if (fontIndicator) {
      fontIndicator.textContent = `${currentFontSizePercent}%`;
    }
  }

  function copyCurrentStoryText() {
    const currentStory = activeStories[currentStoryIndex];
    if (!currentStory) return;
    const textToCopy = `[다카하시 신지 이야기 ${currentStory.number}] ${currentStory.title}\n\n${currentStory.body}\n\n- 다카하시 신지 웹 아카이브`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast('📋 번역 전문이 복사되었습니다.');
    });
  }

  function shareCurrentStoryLink() {
    const currentStory = activeStories[currentStoryIndex];
    if (!currentStory) return;
    const url = `${window.location.origin}${window.location.pathname}#story-${String(currentStory.id).padStart(3, '0')}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast('🔗 이야기 공유 링크가 복사되었습니다.');
    });
  }

  // ==========================================
  // 8. Story Bookmarks & Themes
  // ==========================================
  function toggleBookmark(storyId) {
    const idx = bookmarkedIds.indexOf(storyId);
    if (idx !== -1) {
      bookmarkedIds.splice(idx, 1);
      showToast('보관함에서 제거되었습니다.');
    } else {
      bookmarkedIds.push(storyId);
      showToast('⭐ 보관함에 추가되었습니다.');
    }
    localStorage.setItem('shinji_bookmarks', JSON.stringify(bookmarkedIds));
    updateBookmarkCountPill();
    if (currentMode === 'story' && storyChapter === 'bookmark') {
      updateStoriesData();
    } else {
      document.querySelectorAll(`.card-star-btn[data-id="${storyId}"]`).forEach(btn => {
        btn.classList.toggle('active', idx === -1);
        btn.textContent = idx === -1 ? '★' : '☆';
      });
    }
  }

  function toggleCurrentStoryBookmark() {
    const currentStory = activeStories[currentStoryIndex];
    if (currentStory) toggleBookmark(currentStory.id);
  }

  function updateStoryBookmarkButton(storyId) {
    if (!btnBookmarkStory) return;
    const isBookmarked = bookmarkedIds.includes(storyId);
    const starIcon = btnBookmarkStory.querySelector('.btn-star-icon');
    const label = btnBookmarkStory.querySelector('.btn-tool-label');
    if (starIcon) starIcon.textContent = isBookmarked ? '★' : '☆';
    if (label) label.textContent = isBookmarked ? '보관됨' : '보관';
    btnBookmarkStory.classList.toggle('active', isBookmarked);
  }

  function updateBookmarkCountPill() {
    if (bookmarkCountPill) {
      bookmarkCountPill.textContent = bookmarkedIds.length.toString();
    }
  }

  function cycleViewerTheme() {
    const themes = ['cinema', 'oled', 'sepia'];
    const currentIdx = themes.indexOf(currentViewerTheme);
    const nextTheme = themes[(currentIdx + 1) % themes.length];
    applyViewerTheme(nextTheme);
  }

  function applyViewerTheme(theme) {
    currentViewerTheme = theme;
    localStorage.setItem('shinji_viewer_theme', theme);
    if (storyModalBackdrop) {
      storyModalBackdrop.setAttribute('data-theme', theme);
    }
    if (themeLabel) {
      const labels = { cinema: '시네마', oled: 'OLED', sepia: '세피아' };
      themeLabel.textContent = labels[theme] || '시네마';
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      if (storyModalBackdrop.requestFullscreen) {
        storyModalBackdrop.requestFullscreen();
      } else if (storyModalBackdrop.webkitRequestFullscreen) {
        storyModalBackdrop.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  function updateFullscreenUI() {
    const isFs = !!document.fullscreenElement;
    document.querySelectorAll('.fs-icon-enter').forEach(el => el.style.display = isFs ? 'none' : 'block');
    document.querySelectorAll('.fs-icon-exit').forEach(el => el.style.display = isFs ? 'block' : 'none');
  }

  // ==========================================
  // 9. Video Lectures Section Logic
  // ==========================================
  function updateVideosData() {
    let filtered = [...LECTURE_DATA];

    if (videoCategory !== 'all') {
      filtered = filtered.filter(v => v.category === videoCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(v => 
        v.number.toLowerCase().includes(q) ||
        v.title.toLowerCase().includes(q) ||
        (v.titleJp && v.titleJp.toLowerCase().includes(q)) ||
        (v.summary && v.summary.toLowerCase().includes(q)) ||
        (v.tags && v.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    activeLectures = filtered;
    loadedVideoCount = 0;
    videoGrid.innerHTML = '';

    if (activeLectures.length === 0) {
      videoGrid.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-state-icon">🎬</div>
          <h3 class="empty-state-title">검색된 강연이 없습니다</h3>
          <p class="empty-state-desc">‘${escapeHtml(searchQuery)}’ 에 해당하는 강연 영상을 찾을 수 없습니다.</p>
        </div>
      `;
      if (videoLoadingTrigger) videoLoadingTrigger.style.display = 'none';
      return;
    }

    renderNextVideoChunk();
  }

  function renderNextVideoChunk() {
    if (isVideoLoading || loadedVideoCount >= activeLectures.length) return;
    isVideoLoading = true;

    const nextChunk = activeLectures.slice(loadedVideoCount, loadedVideoCount + VIDEO_CHUNK);
    nextChunk.forEach(lecture => {
      const card = createVideoCard(lecture);
      videoGrid.appendChild(card);
    });

    loadedVideoCount += nextChunk.length;
    isVideoLoading = false;

    if (videoLoadingTrigger) {
      videoLoadingTrigger.style.display = loadedVideoCount < activeLectures.length ? 'block' : 'none';
    }
  }

  function createVideoCard(item) {
    const card = document.createElement('div');
    card.className = 'card';

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
      <p style="color: var(--text-dim); font-size: 0.82rem;">* 상세 강의록 및 한글 번역 대본은 상단 '정법 도서관' 강연집 10강 텍스트를 통해 확인하실 수 있습니다.</p>
    `;

    videoModalBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Save Last Video
    localStorage.setItem('shinji_last_video', item.id);
    checkContinueReading();

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

  // ==========================================
  // 10. Universal Command Palette (Ctrl + K)
  // ==========================================
  function openCommandPalette() {
    if (!cmdPaletteModal) return;
    cmdPaletteModal.classList.add('active');
    cmdPaletteInput.value = '';
    cmdPaletteInput.focus();
    renderCmdResults('');
  }

  function closeCommandPalette() {
    if (cmdPaletteModal) cmdPaletteModal.classList.remove('active');
  }

  function renderCmdResults(query) {
    if (!cmdResultsList) return;
    cmdResultsList.innerHTML = '';
    const q = query.toLowerCase().trim();

    let results = [];

    // 1. Stories (237)
    STORIES_DATA.forEach(s => {
      if (!q || s.number.toLowerCase().includes(q) || s.title.toLowerCase().includes(q) || (s.keywords && s.keywords.some(k => k.toLowerCase().includes(q)))) {
        results.push({
          type: 'story',
          categoryLabel: `📖 이야기 #${s.id}`,
          title: `${s.number} ${s.title}`,
          meta: `제${s.chapter}장`,
          action: () => {
            switchMode('story');
            openStoryModal(s);
          }
        });
      }
    });

    // 2. Books & Chapters
    activeBooks.forEach(b => {
      (b.chapters || []).forEach((c, idx) => {
        if (!q || c.title.toLowerCase().includes(q) || c.number.toLowerCase().includes(q) || b.title.toLowerCase().includes(q)) {
          results.push({
            type: 'book',
            categoryLabel: `📚 ${b.title}`,
            title: `${c.number} ${c.title}`,
            meta: c.origPages || c.pageRange || '',
            action: () => {
              switchMode('book');
              openBookReader(b.id, idx);
            }
          });
        }
      });
    });

    // 3. Videos (47)
    LECTURE_DATA.forEach(v => {
      if (!q || v.number.toLowerCase().includes(q) || v.title.toLowerCase().includes(q) || (v.tags && v.tags.some(t => t.toLowerCase().includes(q)))) {
        results.push({
          type: 'video',
          categoryLabel: `🎬 영상 ${v.category}`,
          title: `${v.number} ${v.title}`,
          meta: v.duration,
          action: () => {
            switchMode('video');
            openVideoModal(v);
          }
        });
      }
    });

    cmdFilteredItems = results.slice(0, 15);
    cmdActiveIndex = 0;

    if (cmdFilteredItems.length === 0) {
      cmdResultsList.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--text-dim);">
          일치하는 항목이 없습니다.
        </div>
      `;
      return;
    }

    cmdFilteredItems.forEach((item, idx) => {
      const itemEl = document.createElement('div');
      itemEl.className = `cmd-result-item ${idx === 0 ? 'active' : ''}`;
      itemEl.innerHTML = `
        <div class="cmd-item-left">
          <span class="cmd-item-badge">${item.categoryLabel}</span>
          <span class="cmd-item-title">${item.title}</span>
        </div>
        <span class="cmd-item-meta">${item.meta}</span>
      `;
      itemEl.addEventListener('click', () => {
        closeCommandPalette();
        item.action();
      });
      cmdResultsList.appendChild(itemEl);
    });
  }

  if (cmdPaletteInput) {
    cmdPaletteInput.addEventListener('input', (e) => {
      renderCmdResults(e.target.value);
    });

    cmdPaletteInput.addEventListener('keydown', (e) => {
      if (cmdFilteredItems.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        cmdActiveIndex = (cmdActiveIndex + 1) % cmdFilteredItems.length;
        updateCmdActiveItem();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        cmdActiveIndex = (cmdActiveIndex - 1 + cmdFilteredItems.length) % cmdFilteredItems.length;
        updateCmdActiveItem();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (cmdFilteredItems[cmdActiveIndex]) {
          closeCommandPalette();
          cmdFilteredItems[cmdActiveIndex].action();
        }
      } else if (e.key === 'Escape') {
        closeCommandPalette();
      }
    });
  }

  function updateCmdActiveItem() {
    const items = cmdResultsList.querySelectorAll('.cmd-result-item');
    items.forEach((item, idx) => {
      item.classList.toggle('active', idx === cmdActiveIndex);
      if (idx === cmdActiveIndex) item.scrollIntoView({ block: 'nearest' });
    });
  }

  if (cmdPaletteModal) {
    cmdPaletteModal.addEventListener('click', (e) => {
      if (e.target === cmdPaletteModal) closeCommandPalette();
    });
  }

  // ==========================================
  // 11. Helper Functions
  // ==========================================
  function handleGlobalKeydown(e) {
    // Ctrl + K or Cmd + K
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openCommandPalette();
      return;
    }

    // If Command Palette Open
    if (cmdPaletteModal && cmdPaletteModal.classList.contains('active')) {
      return;
    }

    // If E-Book Reader Modal Open
    if (bookReaderModal && bookReaderModal.style.display === 'flex') {
      if (e.key === 'Escape') {
        closeBookReader();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        navigateBookChapter(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        navigateBookChapter(1);
      } else if (e.key.toLowerCase() === 'm') {
        toggleBookToc();
      } else if (e.key.toLowerCase() === 'b') {
        toggleCurrentBookBookmark();
      } else if (e.key.toLowerCase() === 'f') {
        toggleBookFullscreen();
      }
      return;
    }

    // If Story Viewer Open
    if (storyModalBackdrop && storyModalBackdrop.classList.contains('active')) {
      if (e.key === 'Escape') {
        closeStoryModal();
      } else if (e.key === 'ArrowLeft') {
        navigateStory(-1);
      } else if (e.key === 'ArrowRight') {
        navigateStory(1);
      } else if (e.key.toLowerCase() === 't') {
        toggleTranslationDrawer();
      } else if (e.key.toLowerCase() === 'b') {
        toggleCurrentStoryBookmark();
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      }
      return;
    }

    // If Video Modal Open
    if (videoModalBackdrop && videoModalBackdrop.classList.contains('active')) {
      if (e.key === 'Escape') {
        closeVideoModal();
      }
      return;
    }
  }

  function checkContinueReading() {
    if (!continueReadingBanner || !continueStoryTitle) return;

    if (currentMode === 'story') {
      const lastId = parseInt(localStorage.getItem('shinji_last_story'), 10);
      if (lastId) {
        const story = STORIES_DATA.find(s => s.id === lastId);
        if (story) {
          continueStoryTitle.textContent = `${story.number} ${story.title}`;
          continueReadingBanner.style.display = 'flex';
          return;
        }
      }
    } else if (currentMode === 'book') {
      const lastBookJson = localStorage.getItem('shinji_last_read_book');
      if (lastBookJson) {
        try {
          const lastInfo = JSON.parse(lastBookJson);
          continueStoryTitle.textContent = `『${lastInfo.bookTitle}』 ${lastInfo.chapterTitle}`;
          continueReadingBanner.style.display = 'flex';
          return;
        } catch (err) {}
      }
    } else {
      const lastVidId = parseInt(localStorage.getItem('shinji_last_video'), 10);
      if (lastVidId) {
        const video = LECTURE_DATA.find(v => v.id === lastVidId);
        if (video) {
          continueStoryTitle.textContent = `${video.number} ${video.title}`;
          continueReadingBanner.style.display = 'flex';
          return;
        }
      }
    }

    continueReadingBanner.style.display = 'none';
  }

  function checkUrlHash() {
    const hash = window.location.hash;
    if (!hash) return;

    // 1. Story Deep Link: #story-001
    const storyMatch = hash.match(/^#story-(\d+)$/i);
    if (storyMatch) {
      const storyId = parseInt(storyMatch[1], 10);
      const story = STORIES_DATA.find(s => s.id === storyId);
      if (story) {
        switchMode('story');
        openStoryModal(story);
        return;
      }
    }

    // 2. Book Deep Link: #book-lectures-1 or #book-shin_buhwal-1
    const bookMatch = hash.match(/^#book-([a-z0-9_]+)-(\d+)$/i);
    if (bookMatch) {
      const bId = bookMatch[1];
      const chId = parseInt(bookMatch[2], 10);
      const book = activeBooks.find(b => b.id === bId);
      if (book) {
        const chIdx = book.chapters.findIndex(c => c.id === chId);
        switchMode('book');
        openBookReader(bId, chIdx !== -1 ? chIdx : 0);
        return;
      }
    }

    // 3. Video Deep Link: #video-01
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

  function handleScroll() {
    const scrollPosition = window.innerHeight + window.scrollY;
    const documentHeight = document.documentElement.scrollHeight;

    if (scrollPosition >= documentHeight - 600) {
      if (currentMode === 'story') {
        renderNextStoryChunk();
      } else if (currentMode === 'video') {
        renderNextVideoChunk();
      }
    }
  }

  function showToast(msg) {
    if (!toastBox) return;
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = msg;
    toastBox.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 2600);
  }

  function getChapterInfo(chapNum) {
    const chapters = {
      1: { badge: '제1장', title: '탄생과 전생, 그리고 참된 메시아의 출현', range: '001–050', count: 50, flow: '출생·가족·전생 → 어린 시절 체험 → 영적 각성 → 신지의 사명과 정법' },
      2: { badge: '제2장', title: '영혼의 세계와 정법의 실천', range: '051–100', count: 50, flow: '영혼·수호령·지도령 → 윤회 → 빙의·영적 현상 → 마음과 생활의 조화' },
      3: { badge: '제3장', title: '마음의 본질과 인간의 목적·사명', range: '101–150', count: 50, flow: '마음의 구조 → 신리와 과학 → 인간의 목적 → 윤회와 사명 → 사후세계와 현증' },
      4: { badge: '제4장', title: '정법의 전개와 삶에서 드러나는 현증', range: '151–200', count: 50, flow: '정법의 유전 → 사회·종교 비판 → 다양한 체험·현증 → 인생의 의미와 실천' },
      5: { badge: '제5장', title: '신리의 완성과 인류·지구의 미래', range: '201–237', count: 37, flow: '새로운 부활 → 태양계의 천사들 → 지구와 인류 → 마지막 기록 및 후기' }
    };
    return chapters[chapNum] || { badge: '', title: '', range: '', count: 0, flow: '' };
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
