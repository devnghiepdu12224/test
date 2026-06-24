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
      { id: 'Hanzi HSK1 3.0', name: '[500]Hanzi HSK1 3.0- Free full', premium: false, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/1272-hsk2-en.txt' },
      { id: 'Hanzi HSK2 3.0', name: '[1272]Hanzi HSK2 3.0- Free full', premium: false, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/500-hsk1-en.txt' },
      { id: 'Hanzi HSK3 3.0', name: '[2245]Hanzi HSK3 3.0- Free full', premium: false, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/2245-hsk3-en.txt' },
      { id: 'Hanzi HSK4 3.0', name: '[3245]Hanzi HSK4 3.0- Free full', premium: false, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/3245-hsk4-en.txt' },
      { id: 'Hanzi HSK5 3.0', name: '[4316]Hanzi HSK5 3.0- Free full', premium: false, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/4316-hsk5-en.txt' },
      { id: 'Hanzi HSK6 3.0', name: '[5456]Hanzi HSK6 3.0- Free full', premium: false, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/55456-hsk6-en.txt' },
  
      { id: 'Essential Hanzi Vocabulary_1', name: 'Essential Hanzi Vocabulary_1 - Free full', premium: false, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/en_td_1.txt' },
      { id: 'Essential Hanzi Vocabulary_2', name: 'Essential Hanzi Vocabulary_2 - Free full', premium: false, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/en_td_2.txt' },
      { id: 'Essential Hanzi Vocabulary_3', name: 'Essential Hanzi Vocabulary_3 - Free full', premium: false, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/en_td_3.txt' },
      { id: 'Essential Hanzi Vocabulary_4', name: 'Essential Hanzi Vocabulary_4 - Free full', premium: false, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/en_td_4.txt' },
      { id: 'Essential Hanzi Vocabulary_5', name: 'Essential Hanzi Vocabulary_5 - Free full', premium: false, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/en_td_5.txt' },
      { id: 'Essential Hanzi Vocabulary_6', name: 'Essential Hanzi Vocabulary_6 - Free full', premium: false, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/en_td_6.txt' },
      { id: 'Essential Hanzi Vocabulary_7', name: 'Essential Hanzi Vocabulary_7 - Free full', premium: false, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/en_td_7.txt' },
      { id: 'Essential Hanzi Vocabulary_8', name: 'Essential Hanzi Vocabulary_8 - Free full', premium: false, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/en_td_8.txt' },
      { id: 'Essential Hanzi Vocabulary_9', name: 'Essential Hanzi Vocabulary_9 - Free full', premium: false, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/en_td_9.txt' },
      { id: 'Essential Hanzi Vocabulary_10', name: 'Essential Hanzi Vocabulary_10 - Free full', premium: false, contentType: 'vocabulary', searchStrategy: 'vocabulary', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/en_td_10.txt' },
      { id: '500 example sentence(hsk1-3.0)', name: '500 Essential example sentences', premium: false, contentType: 'example-sentence', searchStrategy: 'example-sentence', url: 'https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/refs/heads/main/hk1_500cau_en.txt' },

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