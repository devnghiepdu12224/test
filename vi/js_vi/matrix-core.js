/*
  Matrix Hanzi Pro - Clean Core
  Rebuilt: 2026-06-21
  Mục tiêu: tách sạch logic dùng chung cho Home và Workspace, không phụ thuộc DOM của trang còn lại.
*/
(function () {
  'use strict';

  const STORAGE_PREFIX = 'matrix_hanzi_pro_vi';
  const STORAGE_KEYS = {
    vocabList: STORAGE_PREFIX + '_vocab_list',
    currentMeta: STORAGE_PREFIX + '_current_meta',
    userLibrary: STORAGE_PREFIX + '_user_library',
    progressByList: STORAGE_PREFIX + '_progress_by_list',
    columns: STORAGE_PREFIX + '_columns',
    speakMode: STORAGE_PREFIX + '_speak_mode',
    theme: STORAGE_PREFIX + '_theme_mode',
    mode: STORAGE_PREFIX + '_study_mode',
    range: STORAGE_PREFIX + '_range_state',
    userName: STORAGE_PREFIX + '_user_name'
  };

  const PRESET_SOURCES = [
      { id: '1', name: '[HSK1 3.0] 500 từ', premium: false, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/hsk1_3.0.txt' },
      { id: '2', name: '[HSK1 2.0] 150 từ', premium: false, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/150_tuvung(HSK1-2.0).txt' },
      { id: '3', name: '70 câu ví dụ', premium: false, contentType: 'example-sentence', searchStrategy: 'example-sentence', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/câu-ví-dụ-tham-khao-test.txt' },
      { id: '4', name: '500 câu giao tiếp thông dụng', premium: false, contentType: 'example-sentence', searchStrategy: 'example-sentence', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/hk1_500cau_vi.txt' },
      { id: '5', name: '[HSK2 3.0] 1272 từ', premium: true, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/1272_tuvung(HSK2).txt' },
      { id: '6', name: '[HSK3 3.0] 2245 từ', premium: true, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/2245_tuvung(HSK3).txt' },
      { id: '7', name: '[HSK4 3.0] 3245 từ', premium: true, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/3245_tuvung(HSK4).txt' },
      { id: '8', name: '[HSK5 3.0] 4316 từ', premium: true, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/4316_tuvung(HSK5).txt' },
      { id: '9', name: '[HSK6 3.0] 5456 từ', premium: true, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/5456_tuvung(HSK6).txt' },
      { id: 'van-phong', name: 'Từ vựng Văn phòng', premium: false, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/Văn_phòng.txt' },
      { id: 'giao-tiep-cong-viec', name: 'Giao tiếp công việc', premium: false, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/Giao_tiếp_công_việc.txt' },
      { id: 'khu-cong-nghiep-nha-may', name: 'Khu công nghiệp - nhà máy', premium: true, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/Khu_công_nghiệp_-_nhà_máy.txt' },
      { id: 'san-xuat-chat-luong', name: 'Sản xuất - chất lượng', premium: true, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/Sản_xuất_-_chất_lượng.txt' },
      { id: 'kho-van-logistics', name: 'Kho vận - logistics', premium: true, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/Kho_vận_-_logistics.txt' },
      { id: 'kinh-doanh-thuong-mai', name: 'Kinh doanh - thương mại', premium: true, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/Kinh_doanh_-_thương_mại.txt' },
      { id: 'nhan-su-tuyen-dung', name: 'Nhân sự - tuyển dụng', premium: false, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/Nhân_sự_-_tuyển_dụng.txt' },
      { id: 'tai-chinh-ke-toan', name: 'Tài chính - kế toán', premium: false, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/Tài_chính_-_kế_toán.txt' },
      { id: 'it-website-du-lieu', name: 'IT - website - dữ liệu', premium: false, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/IT_-_website_-_dữ_liệu.txt' },
      { id: 'an-toan-lao-dong', name: 'An toàn lao động', premium: false, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/An_toàn_lao_động.txt' },
      { id: 'doi-song-giao-tiep-hang-ngay', name: 'Đời sống - giao tiếp hằng ngày', premium: false, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/Đời_sống_-_giao_tiếp_hằng_ngày.txt' }
    ];

  const state = {
    masterVocabList: [],
    vocabList: [],
    currentListId: 'default-list',
    currentListName: '',
    currentSourceMeta: { type: 'empty', contentType: 'vocabulary', searchStrategy: 'vocabulary' },
    currentStudyMode: 'normal',
    range: { start: 0, end: null },
    speakMode: 1
  };

  function $(id) { return document.getElementById(id); }
  function q(sel, root = document) { return root.querySelector(sel); }
  function qa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
  function on(el, event, handler, options) { if (el) el.addEventListener(event, handler, options); }

  function safeJsonParse(value, fallback) {
    try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[ch]));
  }

  function hashText(text) {
    let hash = 0;
    const str = String(text || '');
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }

  function normalizeText(text) {
    return String(text || '')
      .trim()
      .replace(/\s+/g, '')
      .replace(/[，。！？、；：,.!?;:]/g, '')
      .toLowerCase();
  }

  function splitCsvLike(line, delimiter) {
    const out = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === delimiter && !inQuotes) {
        out.push(cur); cur = '';
      } else cur += ch;
    }
    out.push(cur);
    return out;
  }

  function splitDelimitedLine(line) {
    const delimiters = ['|', '\t', ',', ';'];
    let best = null;
    for (const delimiter of delimiters) {
      const parts = splitCsvLike(line, delimiter).map(x => x.trim());
      if (parts.length >= 3) { best = parts; break; }
    }
    if (best) return best;
    const match = line.match(/^([^\s]+)\s+([a-zA-ZāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüÜńňǹḿ\s'’-]+?)\s+(.+)$/u);
    return match ? [match[1], match[2], match[3]] : [line, '', ''];
  }

  function inferContentTypeFromText(text) {
    const sample = String(text || '').split(/\r?\n/).filter(Boolean).slice(0, 20).join(' ');
    const longChinese = /[\u4e00-\u9fff].{8,}/.test(sample);
    return longChinese ? 'example-sentence' : 'vocabulary';
  }

  function normalizeSourceMeta(meta = {}, rawText = '') {
    const contentType = meta.contentType || inferContentTypeFromText(rawText) || 'vocabulary';
    return {
      type: meta.type || 'unknown',
      id: meta.id || ('source-' + hashText(meta.name || rawText.slice(0, 120) || Date.now())),
      name: meta.name || 'Bộ từ vựng',
      premium: !!meta.premium,
      contentType,
      searchStrategy: meta.searchStrategy || contentType || 'vocabulary'
    };
  }

  function parseVocabulary(text, sourceMeta = state.currentSourceMeta) {
    const normalizedMeta = normalizeSourceMeta(sourceMeta, text);
    const lines = String(text || '')
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    const rows = [];
    for (const rawLine of lines) {
      let line = rawLine.replace(/^\d+[\.\)\-\s]+/, '').trim();
      const parts = splitDelimitedLine(line);
      const hanzi = (parts[0] || '').trim();
      const pinyin = (parts[1] || '').trim();
      const meaning = parts.slice(2).join(' ').trim();
      if (!hanzi && !meaning) continue;
      rows.push({
        rawIndex: rows.length,
        id: 'word-' + (rows.length + 1),
        hanzi,
        pinyin,
        meaning,
        contentType: normalizedMeta.contentType || 'vocabulary',
        searchStrategy: normalizedMeta.searchStrategy || normalizedMeta.contentType || 'vocabulary',
        forgotten: false,
        userAnswer: ''
      });
    }
    return rows;
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEYS.vocabList, JSON.stringify(state.masterVocabList));
    localStorage.setItem(STORAGE_KEYS.currentMeta, JSON.stringify({
      currentListId: state.currentListId,
      currentListName: state.currentListName,
      currentSourceMeta: state.currentSourceMeta
    }));
    localStorage.setItem(STORAGE_KEYS.mode, state.currentStudyMode);
    localStorage.setItem(STORAGE_KEYS.range, JSON.stringify(state.range));
  }

  function restoreState() {
    const meta = safeJsonParse(localStorage.getItem(STORAGE_KEYS.currentMeta), null);
    if (meta) {
      state.currentListId = meta.currentListId || state.currentListId;
      state.currentListName = meta.currentListName || state.currentListName;
      state.currentSourceMeta = meta.currentSourceMeta || state.currentSourceMeta;
    }
    const savedVocab = safeJsonParse(localStorage.getItem(STORAGE_KEYS.vocabList), []);
    if (Array.isArray(savedVocab)) {
      state.masterVocabList = savedVocab.map((item, i) => ({
        rawIndex: Number.isInteger(item.rawIndex) ? item.rawIndex : i,
        id: item.id || 'word-' + (i + 1),
        hanzi: item.hanzi || '',
        pinyin: item.pinyin || '',
        meaning: item.meaning || '',
        contentType: item.contentType || state.currentSourceMeta.contentType || 'vocabulary',
        searchStrategy: item.searchStrategy || state.currentSourceMeta.searchStrategy || 'vocabulary',
        forgotten: !!item.forgotten,
        userAnswer: item.userAnswer || ''
      }));
    }
    state.currentStudyMode = localStorage.getItem(STORAGE_KEYS.mode) || state.currentStudyMode;
    state.range = safeJsonParse(localStorage.getItem(STORAGE_KEYS.range), state.range) || state.range;
    state.speakMode = Number(localStorage.getItem(STORAGE_KEYS.speakMode) || 1);
    applyProgressToMasterList();
  }

  function getListKey() { return state.currentListId || 'default-list'; }
  function createEmptyProgress() { return { answers: {}, forgottenIndexes: [], wrongIndexes: [] }; }
  function loadProgressByList() { return safeJsonParse(localStorage.getItem(STORAGE_KEYS.progressByList), {}) || {}; }
  function saveProgressByList(data) { localStorage.setItem(STORAGE_KEYS.progressByList, JSON.stringify(data || {})); }
  function getCurrentProgress() {
    const all = loadProgressByList();
    const key = getListKey();
    if (!all[key]) all[key] = createEmptyProgress();
    return all[key];
  }
  function uniqueNumbers(arr) { return Array.from(new Set((arr || []).map(Number).filter(Number.isFinite))).sort((a,b)=>a-b); }
  function updateCurrentProgress(mutator) {
    const all = loadProgressByList();
    const key = getListKey();
    const progress = all[key] || createEmptyProgress();
    mutator(progress);
    progress.forgottenIndexes = uniqueNumbers(progress.forgottenIndexes);
    progress.wrongIndexes = uniqueNumbers(progress.wrongIndexes);
    all[key] = progress;
    saveProgressByList(all);
  }
  function saveAnswer(rawIndex, answer) {
    const stt = Number(rawIndex) + 1;
    updateCurrentProgress(progress => {
      if (answer) progress.answers[String(stt)] = answer;
      else delete progress.answers[String(stt)];
    });
  }
  function setForgotten(rawIndex, value) {
    const stt = Number(rawIndex) + 1;
    updateCurrentProgress(progress => {
      const set = new Set(progress.forgottenIndexes || []);
      value ? set.add(stt) : set.delete(stt);
      progress.forgottenIndexes = Array.from(set);
    });
  }
  function setWrong(rawIndex, value) {
    const stt = Number(rawIndex) + 1;
    updateCurrentProgress(progress => {
      const set = new Set(progress.wrongIndexes || []);
      value ? set.add(stt) : set.delete(stt);
      progress.wrongIndexes = Array.from(set);
    });
  }
  function applyProgressToMasterList() {
    const progress = getCurrentProgress();
    state.masterVocabList.forEach(item => {
      const stt = item.rawIndex + 1;
      item.userAnswer = progress.answers[String(stt)] || item.userAnswer || '';
      item.forgotten = (progress.forgottenIndexes || []).includes(stt);
    });
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function getBaseListByMode() {
    applyProgressToMasterList();
    const progress = getCurrentProgress();
    const mode = state.currentStudyMode || 'normal';
    if (mode === 'forgotten') return state.masterVocabList.filter(item => (progress.forgottenIndexes || []).includes(item.rawIndex + 1));
    if (mode === 'wrong') return state.masterVocabList.filter(item => (progress.wrongIndexes || []).includes(item.rawIndex + 1));
    if (mode === 'random') return shuffle([...state.masterVocabList]);
    return [...state.masterVocabList];
  }
  /* Cập nhật trong matrix-core.js */
  /* Cập nhật trong matrix-core.js */
  function getViewList() {
    const base = getBaseListByMode();
    let start = 0;
    
    // Ép kiểu số nguyên cực kỳ an toàn
    if (state.range && state.range.start !== undefined && state.range.start !== null) {
      start = parseInt(state.range.start, 10);
      if (isNaN(start)) start = 0;
    }
    
    // Ràng buộc an toàn: Nếu mốc bắt đầu lớn hơn mảng hiện tại thì reset về 0
    if (start >= base.length || start < 0) start = 0; 

    let end = base.length;
    if (state.range && state.range.end !== undefined && state.range.end !== null) {
      let parsedEnd = parseInt(state.range.end, 10);
      if (!isNaN(parsedEnd) && parsedEnd > start) {
        end = Math.min(base.length, parsedEnd);
      }
    }
    
    state.vocabList = base.slice(start, end);
    return state.vocabList;
  }

  function setLoadedList(list, meta) {
    const normalizedMeta = normalizeSourceMeta(meta || {}, '');
    state.masterVocabList = (list || []).map((item, i) => ({ ...item, rawIndex: i, id: item.id || 'word-' + (i + 1) }));
    state.currentSourceMeta = normalizedMeta;
    state.currentListId = normalizedMeta.id || ('list-' + Date.now());
    state.currentListName = normalizedMeta.name || 'Bộ từ vựng';
    state.range = { start: 0, end: null };
    saveState();
  }

  function getUserLibrary() { return safeJsonParse(localStorage.getItem(STORAGE_KEYS.userLibrary), []) || []; }
  function setUserLibrary(library) { localStorage.setItem(STORAGE_KEYS.userLibrary, JSON.stringify(library || [])); }

  function applyTheme(mode) {
    const theme = mode === 'light' ? 'light' : 'dark';
    document.body.classList.toggle('light-mode', theme === 'light');
    localStorage.setItem(STORAGE_KEYS.theme, theme);
    const btn = $('themeToggleBtn');
    if (btn) btn.textContent = theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode';
  }
  function initTheme() {
    applyTheme(localStorage.getItem(STORAGE_KEYS.theme) || 'dark');
    on($('themeToggleBtn'), 'click', () => applyTheme(document.body.classList.contains('light-mode') ? 'dark' : 'light'));
  }

  function initCustomerName() {
    if (!localStorage.getItem(STORAGE_KEYS.userName)) localStorage.setItem(STORAGE_KEYS.userName, 'LEARNER');
    const chip = $('customerNameChip');
    const display = $('customerNameDisplay');
    if (chip && display) { display.textContent = localStorage.getItem(STORAGE_KEYS.userName); chip.style.display = 'inline-flex'; }
    const badge = $('premiumBadge');
    if (badge) { badge.textContent = '🧠 Recall Mode'; badge.className = 'badge free'; }
  }

  function compactImageText(text) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFC')
      .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function buildImagePayload(item) {
    if (!item) return null;
    const hanzi = item.hanzi || item.han_tu || '';
    const meaning = item.meaning || item.nghia || '';
    const contentType = item.contentType || state.currentSourceMeta.contentType || 'vocabulary';
    const searchStrategy = item.searchStrategy || state.currentSourceMeta.searchStrategy || contentType || 'vocabulary';
    return {
      _t: Date.now(),
      stt: item.rawIndex + 1,
      han_tu: hanzi,
      hanzi,
      display_han_tu: item.display_han_tu || item.original_han_tu || hanzi,
      original_han_tu: item.original_han_tu || hanzi,
      pinyin: item.pinyin || item.pin_yin || '',
      nghia: meaning,
      meaning,
      display_nghia: item.display_nghia || item.original_nghia || meaning,
      original_nghia: item.original_nghia || meaning,
      contentType,
      type: contentType,
      searchStrategy,
      imageQuery: item.imageQuery || hanzi || meaning || '',
      imageFallbackQueries: Array.isArray(item.imageFallbackQueries)
        ? item.imageFallbackQueries
        : [hanzi, meaning].filter(Boolean),
      imageCacheKey: compactImageText(`${hanzi}|${meaning}`)
    };
  }

  function publishCurrentVocab(item) {
    const payload = buildImagePayload(item);
    if (!payload) return null;
    try {
      localStorage.removeItem('current_vocab');
      localStorage.setItem('current_vocab', JSON.stringify(payload));
      sessionStorage.setItem('current_vocab', JSON.stringify(payload));
    } catch {}
    return payload;
  }

  function publishPrefetchQueue(items) {
    const payload = {
      _t: Date.now(),
      items: (items || []).map(buildImagePayload).filter(Boolean).slice(0, 8)
    };
    try {
      localStorage.removeItem('matrix_vocab_prefetch_queue');
      localStorage.setItem('matrix_vocab_prefetch_queue', JSON.stringify(payload));
      sessionStorage.setItem('matrix_vocab_prefetch_queue', JSON.stringify(payload));
    } catch {}
    return payload;
  }

  window.MatrixApp = {
    $, q, qa, on, escapeHtml, hashText, normalizeText,
    STORAGE_PREFIX, STORAGE_KEYS, PRESET_SOURCES, state,
    parseVocabulary, normalizeSourceMeta, inferContentTypeFromText,
    saveState, restoreState, setLoadedList,
    getCurrentProgress, updateCurrentProgress, saveAnswer, setForgotten, setWrong, applyProgressToMasterList,
    getViewList, getUserLibrary, setUserLibrary,
    initTheme, initCustomerName, applyTheme,
    publishCurrentVocab, publishPrefetchQueue, buildImagePayload, compactImageText,
    isPremium: () => true,
    requirePremium: () => true
  };

  window.isPremium = () => true;
  window.requirePremium = () => true;
  window.escapeHtml = escapeHtml;
  window.hashText = hashText;
})();