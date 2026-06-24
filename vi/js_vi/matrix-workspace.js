/* Matrix Hanzi Pro - Workspace Controller (Tối ưu Lazy Render) */
(function () {
  'use strict';
  const App = window.MatrixApp;
  if (!App) throw new Error('MatrixApp core chưa được nạp.');
  const { $, on, escapeHtml, normalizeText } = App;
  let readAllActive = false;
  let readAllIndex = 0;
  let imageDisplayWindow = null;
  let imageDbInstance = null;
  let imageSyncTimer = null;

  // Cấu hình Lazy Render
  const CHUNK_SIZE = 50; 
  let renderedCount = 0;
  let scrollObserver = null;

  function saveStateDebounced() { clearTimeout(saveStateTimer); saveStateTimer = setTimeout(() => { App.saveState(); }, 500); } function updateStatus() {
    const status = $('status');
    if (!status) return;
    const total = App.state.masterVocabList.length;
    const shown = App.state.vocabList.length;
    status.textContent = total ? `${App.state.currentListName || 'Danh sách'} · Mốc: ${renderedCount}/${shown}` : 'Chưa có danh sách từ vựng';
  }

  // --- RENDER BẢNG: PHIÊN BẢN TỐI ƯU MƯỢT MÀ ---
  function renderTable() {
    const tbody = document.querySelector('#vocabTable tbody');
    if (!tbody) return;
    
    App.getViewList(); // Cập nhật state.vocabList theo Range từ Home
    tbody.innerHTML = '';
    renderedCount = 0;

    if (scrollObserver) {
      scrollObserver.disconnect();
    }

    if (!App.state.vocabList.length) { 
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:40px; font-weight:bold;">Không tìm thấy dữ liệu! Hãy quay lại trang chủ chọn bộ từ.</td></tr>'; 
      updateStatus(); 
      return; 
    }

    // Render block đầu tiên
    renderNextChunk();
    setupInfiniteScroll();
  }

  function renderNextChunk() {
    const tbody = document.querySelector('#vocabTable tbody');
    const total = App.state.vocabList.length;
    if (renderedCount >= total) return;

    const start = renderedCount;
    const end = Math.min(start + CHUNK_SIZE, total);
    
    // Dùng DocumentFragment để không làm giật DOM cũ
    const fragment = document.createDocumentFragment();

    for (let i = start; i < end; i++) {
      const item = App.state.vocabList[i];
      const viewIndex = i;
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.rawIndex + 1}</td>
        <td><input type="checkbox" class="forgot-checkbox" ${item.forgotten ? 'checked' : ''}></td>
        <td>${escapeHtml(item.hanzi)}</td>
        <td>${escapeHtml(item.pinyin)}</td>
        <td>${escapeHtml(item.meaning)}</td>
        <td><input class="answer-input" data-viewindex="${viewIndex}" placeholder="Gõ lại hán tự..." value="${escapeHtml(item.userAnswer || '')}"></td>
        <td><span class="status-cell">Đáp án</span></td>
        <td><button class="speaker-icon" type="button">🔊</button></td>
        <td><button class="dict-icon" type="button">🔍</button></td>`;
      
      const input = tr.querySelector('.answer-input');
      const forgot = tr.querySelector('.forgot-checkbox');
      
      on(input, 'focus', () => { markCurrentRow(viewIndex); scheduleMobileTypingScroll(input, { reason: 'focus' }); });
      on(input, 'input', () => { item.userAnswer = input.value; App.saveAnswer(item.rawIndex, input.value); checkOne(tr, item); saveStateDebounced(); });
      on(input, 'keydown', event => handleInputKeydown(event, viewIndex));
      on(forgot, 'change', () => { item.forgotten = forgot.checked; tr.classList.toggle('forgotten-row', item.forgotten); App.setForgotten(item.rawIndex, item.forgotten); });
      on(tr.querySelector('.speaker-icon'), 'click', () => speakByMode(item));
      on(tr.querySelector('.dict-icon'), 'click', () => openDictionaryPopup(item, tr));
      tr.classList.toggle('forgotten-row', !!item.forgotten);
      
      checkOne(tr, item);
      fragment.appendChild(tr);
    }

    tbody.appendChild(fragment);
    renderedCount = end;
    
    applyColumnVisibility(); 
    updateStatus();
  }

  function setupInfiniteScroll() {
    const tbody = document.querySelector('#vocabTable tbody');
    const options = { root: document.querySelector('.table-container'), rootMargin: '300px', threshold: 0 };
    
    scrollObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && renderedCount < App.state.vocabList.length) {
        renderNextChunk();
        // Cắm lại observer vào dòng cuối mới
        scrollObserver.disconnect();
        const rows = tbody.querySelectorAll('tr');
        if (rows.length > 0) scrollObserver.observe(rows[rows.length - 1]);
      }
    }, options);

    const rows = tbody.querySelectorAll('tr');
    if (rows.length > 0) scrollObserver.observe(rows[rows.length - 1]);
  }

  function handleInputKeydown(event, viewIndex) {
    // Khi dùng Pinyin/IME, Enter có thể là phím xác nhận candidate, không nên nhảy dòng.
    if (event.isComposing || event.keyCode === 229) return;

    if (event.key === 'Enter' || event.key === 'ArrowDown') {
      event.preventDefault();
      focusInput(viewIndex + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusInput(viewIndex - 1);
    } else if (event.key === 'Shift' || event.key === 'ArrowRight') {
      const item = App.state.vocabList[viewIndex];
      if (item) speakByMode(item);
    }
  }

  function isMobileViewport() {
    return window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  }

  function scrollInputIntoTypingZone(input, options = {}) {
    if (!input || !isMobileViewport()) return;

    const container = input.closest('.table-container') || document.querySelector('.table-container');
    const row = input.closest('tr');
    if (!container || !row) return;

    const containerRect = container.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();

    const viewportTop = window.visualViewport ? window.visualViewport.offsetTop : 0;
    const viewportBottom = window.visualViewport
      ? window.visualViewport.offsetTop + window.visualViewport.height
      : window.innerHeight;

    const visibleTop = Math.max(containerRect.top, viewportTop) + 10;
    const visibleBottom = Math.min(containerRect.bottom, viewportBottom) - 14;
    const visibleHeight = Math.max(120, visibleBottom - visibleTop);

    // Safe-zone: chỉ chỉnh khi input bị quá sát mép trên hoặc sát bàn phím.
    // Nếu input ở nửa dưới và đang ổn, không kéo quá mức nữa.
    const safeTop = visibleTop + Math.min(96, visibleHeight * 0.24);
    const safeBottom = visibleBottom - Math.min(28, visibleHeight * 0.08);
    const targetInputTop = visibleTop + visibleHeight * 0.42;

    let delta = 0;

    if (inputRect.top < safeTop) {
      delta = inputRect.top - targetInputTop;
    } else if (inputRect.bottom > safeBottom) {
      delta = inputRect.bottom - safeBottom + 12;
    } else if (options.forceCenter) {
      delta = inputRect.top - targetInputTop;
    }

    if (rowRect.top < visibleTop + 6) {
      delta = Math.min(delta, rowRect.top - (visibleTop + 12));
    }

    if (Math.abs(delta) > 2) container.scrollTop += delta;
  }

  function clearMobileTypingScrollTimers() {
    if (mobileTypingScrollTimer) clearTimeout(mobileTypingScrollTimer);
    mobileTypingScrollTimer = null;
    mobileTypingScrollTimers.forEach(id => clearTimeout(id));
    mobileTypingScrollTimers = [];
  }

  function scheduleMobileTypingScroll(input, options = {}) {
    if (!isMobileViewport() || !input) return;
    clearMobileTypingScrollTimers();

    const run = () => scrollInputIntoTypingZone(input, options);

    // Android Chrome cập nhật visualViewport theo nhiều nhịp sau khi bàn phím mở.
    requestAnimationFrame(() => requestAnimationFrame(run));
    [90, 180, 320, 520].forEach(delay => {
      mobileTypingScrollTimers.push(setTimeout(run, delay));
    });
    mobileTypingScrollTimer = setTimeout(run, 760);
  }

  if (window.visualViewport && !window.__matrixTypingViewportListener) {
    window.__matrixTypingViewportListener = true;
    window.visualViewport.addEventListener('resize', () => {
      const active = document.activeElement;
      if (active?.classList?.contains('answer-input')) {
        scheduleMobileTypingScroll(active, { reason: 'viewport-resize' });
      }
    }, { passive: true });
  }

  function focusInput(index) {
    if (index >= App.state.vocabList.length || index < 0) return;

    // Nếu dòng định focus chưa được render, ép hệ thống render thêm
    while (index >= renderedCount && renderedCount < App.state.vocabList.length) {
      renderNextChunk();
      if (scrollObserver) {
        scrollObserver.disconnect();
        const rows = document.querySelectorAll('#vocabTable tbody tr');
        if (rows.length > 0) scrollObserver.observe(rows[rows.length - 1]);
      }
    }

    const next = document.querySelector(`input.answer-input[data-viewindex="${index}"]`);
    if (!next) return;

    if (isMobileViewport()) {
      try {
        next.focus({ preventScroll: true });
      } catch {
        next.focus();
      }
      scheduleMobileTypingScroll(next, { reason: 'enter' });
      return;
    }

    try { next.focus({ preventScroll: true }); }
    catch { next.focus(); }

    const container = next.closest('.table-container');
    const row = next.closest('tr');
    if (!container || !row) return;

    const containerRect = container.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const padding = 12;

    if (rowRect.bottom > containerRect.bottom - padding) {
      container.scrollTop += rowRect.bottom - containerRect.bottom + padding;
    } else if (rowRect.top < containerRect.top + padding) {
      container.scrollTop -= containerRect.top - rowRect.top + padding;
    }
  }

  function markCurrentRow(viewIndex) {
    const rows = App.qa('#vocabTable tbody tr');
    rows.forEach(row => row.classList.remove('current-row'));
    const row = rows[viewIndex]; // Có thể undefined nếu row chưa render
    if (row) row.classList.add('current-row');
    const item = App.state.vocabList[viewIndex];
    if (item) {
      App.publishCurrentVocab(item);
      if (typeof App.publishPrefetchQueue === 'function') {
        App.publishPrefetchQueue(App.state.vocabList.slice(viewIndex + 1, viewIndex + 9));
      }
      if ($('imageModalOverlay')?.classList.contains('active')) syncImageModal(item, { poll: true });
    }
  }

  // Sửa lại hàm check để nhận thẳng DOM element tr (vì querySelectorAll theo index sẽ sai khi chưa render hết)
  function checkOne(row, item) {
    if (!item || !row) return;
    const status = row.querySelector('.status-cell'); 
    const answer = row.querySelector('.answer-input')?.value || ''; 
    status.className = 'status-cell';
    if (!answer.trim()) { status.textContent = 'Đáp án'; return; }
    
    const ok = normalizeText(answer) === normalizeText(item.hanzi); 
    status.textContent = ok ? 'ĐÚNG' : 'SAI'; 
    status.classList.add(ok ? 'correct' : 'wrong'); 
    App.setWrong(item.rawIndex, !ok);
  }

  function clearAnswers() { 
    if (!confirm('Xóa toàn bộ đáp án đang nhập của danh sách hiện tại?')) return; 
    App.state.masterVocabList.forEach(item => { item.userAnswer = ''; }); 
    App.updateCurrentProgress(progress => { progress.answers = {}; progress.wrongIndexes = []; }); 
    App.saveState(); 
    renderTable(); 
  }

  function saveColumnVisibility() { const s = {}; App.qa('.toggle-col').forEach(cb => s[cb.dataset.col] = cb.checked); localStorage.setItem(App.STORAGE_KEYS.columns, JSON.stringify(s)); }
  function restoreColumnVisibility() { try { const s = JSON.parse(localStorage.getItem(App.STORAGE_KEYS.columns) || '{}'); App.qa('.toggle-col').forEach(cb => { if (Object.prototype.hasOwnProperty.call(s, cb.dataset.col)) cb.checked = !!s[cb.dataset.col]; }); } catch {} }
  function toggleColumn(columnIndex, show) { App.qa('#vocabTable tr').forEach(row => { const cell = row.children[columnIndex]; if (cell) cell.classList.toggle('hidden-col', !show); }); }
  function applyColumnVisibility() { App.qa('.toggle-col').forEach(cb => toggleColumn(Number(cb.dataset.col), cb.checked)); }

  function speak(text, lang = 'zh-CN') { if (!('speechSynthesis' in window) || !text) return; const u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = 0.85; speechSynthesis.speak(u); }
  function speakByMode(item) { if (!item) return; speechSynthesis.cancel(); speak(item.hanzi, 'zh-CN'); if (Number(App.state.speakMode) === 2 && item.meaning) setTimeout(() => speak(item.meaning, 'vi-VN'), 700); }
  
  function readAll() { if (readAllActive) return stopReadAll(); readAllActive = true; readAllIndex = 0; updateReadAllButton(); readNext(); }
  function readNext() { 
    if (!readAllActive || readAllIndex >= App.state.vocabList.length) return stopReadAll(); 
    // Nếu Auto Read chạm đáy phần chưa render, tự ép render để UI nhảy xuống
    if(readAllIndex >= renderedCount) renderNextChunk(); 
    
    markCurrentRow(readAllIndex); 
    focusInput(readAllIndex); // Auto cuộn tới dòng đang đọc
    speakByMode(App.state.vocabList[readAllIndex]); 
    readAllIndex++; 
    setTimeout(readNext, Number(App.state.speakMode) === 2 ? 1900 : 1100); 
  }
  function stopReadAll() { readAllActive = false; speechSynthesis.cancel(); updateReadAllButton(); }
  function updateReadAllButton() { const btn = $('readAllBtn'); if (btn) btn.textContent = readAllActive ? '⏹ Dừng đọc' : '🔊 Đọc toàn bộ'; }

  // --- Image Overlay / Dict Logic giữ nguyên ---
  function getCurrentImageContext() {
    const current = document.querySelector('#vocabTable tr.current-row input.answer-input');
    const idx = current ? Number(current.dataset.viewindex) : 0;
    return { idx, item: App.state.vocabList[idx] || App.state.vocabList[0] };
  }

  function openImageDisplayWindow(item, idx = 0) {
    if (!item) return false;
    App.publishCurrentVocab(item);
    if (typeof App.publishPrefetchQueue === 'function') {
      App.publishPrefetchQueue(App.state.vocabList.slice(idx + 1, idx + 9));
    }
    try {
      if (!imageDisplayWindow || imageDisplayWindow.closed) {
        imageDisplayWindow = window.open('image_display.html', 'matrixImageDisplay', 'width=980,height=720,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no');
      }
      if (imageDisplayWindow) imageDisplayWindow.focus();
      return !!imageDisplayWindow;
    } catch (err) { return false; }
  }

  function openImageModal() {
    const overlay = $('imageModalOverlay');
    if (overlay) overlay.classList.add('active');
    const { idx, item } = getCurrentImageContext();
    if (!item) return;
    markCurrentRow(idx);
    syncImageModal(item, { poll: true });
    openImageDisplayWindow(item, idx);
  }

  function closeImageModal() {
    $('imageModalOverlay')?.classList.remove('active');
    if (imageSyncTimer) { clearInterval(imageSyncTimer); imageSyncTimer = null; }
  }

  function compactImageText(text) {
    if (typeof App.compactImageText === 'function') return App.compactImageText(text);
    return String(text || '').toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim();
  }

  function getImageCacheKey(item) {
    if (!item) return '';
    return compactImageText(`${item.hanzi || item.han_tu || ''}|${item.meaning || item.nghia || ''}`);
  }

  function initImageDB() {
    return new Promise(resolve => {
      if (imageDbInstance) return resolve(imageDbInstance);
      try {
        const request = indexedDB.open('MatrixImageDB', 1);
        request.onupgradeneeded = event => { const db = event.target.result; if (!db.objectStoreNames.contains('image_cache')) { db.createObjectStore('image_cache', { keyPath: 'key' }); } };
        request.onsuccess = event => { imageDbInstance = event.target.result; resolve(imageDbInstance); };
        request.onerror = () => resolve(null);
      } catch { resolve(null); }
    });
  }

  async function getCachedImageForItem(item) {
    const key = getImageCacheKey(item);
    if (!key) return null;
    const db = await initImageDB();
    if (!db) return null;
    return new Promise(resolve => {
      try {
        const tx = db.transaction('image_cache', 'readonly');
        const req = tx.objectStore('image_cache').get(key);
        req.onsuccess = event => resolve(event.target.result || null);
        req.onerror = () => resolve(null);
      } catch { resolve(null); }
    });
  }

  function renderImageModalWaiting(item) {
    const img = $('modalImageEl'), placeholder = $('modalPlaceholder'), caption = $('modalCaptionText'), badge = $('modalSourceBadge');
    if (caption) caption.innerHTML = `STT ${item.rawIndex + 1} · <span style="color:#38bdf8">${escapeHtml(item.hanzi)}</span> · ${escapeHtml(item.meaning)}`;
    if (img) { img.style.display = 'none'; img.removeAttribute('src'); }
    if (placeholder) { placeholder.style.display = 'block'; placeholder.textContent = 'Đang chờ dữ liệu ảnh...'; }
    if (badge) badge.textContent = 'WAITING';
  }

  function renderImageModalResult(item, cached) {
    const img = $('modalImageEl'), placeholder = $('modalPlaceholder'), caption = $('modalCaptionText'), badge = $('modalSourceBadge');
    if (caption) caption.innerHTML = `STT ${item.rawIndex + 1} · <span style="color:#38bdf8">${escapeHtml(item.hanzi)}</span> · ${escapeHtml(item.meaning)}`;
    if (cached && cached.url && img) {
      if (placeholder) placeholder.style.display = 'none';
      img.onload = () => { img.style.display = 'block'; };
      img.onerror = () => { img.style.display = 'none'; if (placeholder) { placeholder.style.display = 'block'; placeholder.textContent = 'Không tải được ảnh đã cache.'; } };
      img.src = cached.url;
      img.style.display = 'block';
      if (badge) badge.textContent = `${cached.source || 'IMAGE'} · CACHED`;
      return true;
    }
    return false;
  }

  async function syncImageModal(item, options = {}) {
    if (!item) return;
    renderImageModalWaiting(item);
    const cached = await getCachedImageForItem(item);
    if (renderImageModalResult(item, cached)) return;
    if (options.poll) {
      if (imageSyncTimer) clearInterval(imageSyncTimer);
      const startedAt = Date.now();
      imageSyncTimer = setInterval(async () => {
        if (!$('imageModalOverlay')?.classList.contains('active')) { clearInterval(imageSyncTimer); imageSyncTimer = null; return; }
        const latest = await getCachedImageForItem(item);
        if (renderImageModalResult(item, latest) || Date.now() - startedAt > 20000) { clearInterval(imageSyncTimer); imageSyncTimer = null; }
      }, 900);
    }
  }

  function resetLocalImageData() { ['current_vocab', 'matrix_vocab_prefetch_queue', 'matrix_image_cache_v3_fast'].forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k); }); alert('Đã reset dữ liệu ảnh local.'); }

  function openDictionaryPopup(item, row) { 
    if (!item) return; 
    const overlay = $('dictionaryPopupOverlay'), frame = $('dictionaryPopupFrame'), word = $('dictionaryPopupWord'), external = $('dictionaryPopupExternalLink'); 
    const url = `https://hanzii.net/search/word/${encodeURIComponent(item.hanzi)}?hl=vi`; 
    if (!overlay || !frame) { window.open(url, '_blank'); return; } 
    App.qa('#vocabTable tr').forEach(r => r.classList.remove('current-row')); 
    if (row) row.classList.add('current-row'); 
    if (word) word.textContent = item.hanzi || 'Chưa chọn từ'; 
    if (external) external.href = url; frame.src = url; 
    overlay.classList.add('active'); overlay.setAttribute('aria-hidden', 'false'); 
  }
  function closeDictionaryPopup() { const overlay = $('dictionaryPopupOverlay'), frame = $('dictionaryPopupFrame'); if (frame) frame.src = 'about:blank'; if (overlay) { overlay.classList.remove('active'); overlay.setAttribute('aria-hidden', 'true'); } }

  function initMobileMenu() { const collapseMenu = $('mobileCollapseMenu'), subPanel = document.querySelector('.sub-panel'), toggleBtn = $('toggleMobileMenuBtn'); if (collapseMenu && subPanel && !collapseMenu.contains(subPanel)) { const slot = document.createElement('div'); slot.className = 'collapse-subpanel-slot'; collapseMenu.appendChild(slot); slot.appendChild(subPanel); subPanel.classList.add('inside-collapse-menu'); } on(toggleBtn, 'click', event => { event.stopPropagation(); const open = collapseMenu.classList.toggle('show'); toggleBtn.classList.toggle('active', open); toggleBtn.setAttribute('aria-expanded', String(open)); }); document.addEventListener('click', event => { if (collapseMenu && toggleBtn && collapseMenu.classList.contains('show') && !collapseMenu.contains(event.target) && !toggleBtn.contains(event.target)) { collapseMenu.classList.remove('show'); toggleBtn.classList.remove('active'); toggleBtn.setAttribute('aria-expanded', 'false'); } }); }

  function initWorkspace() {
    if (!$('workspaceScreen')) return;
    App.initTheme(); App.restoreState(); restoreColumnVisibility();
    const speakSelect = $('speakMode'); if (speakSelect) speakSelect.value = String(App.state.speakMode || 1);
    on(speakSelect, 'change', () => { App.state.speakMode = Number(speakSelect.value || 1); localStorage.setItem(App.STORAGE_KEYS.speakMode, String(App.state.speakMode)); });
    App.qa('.toggle-col').forEach(cb => on(cb, 'change', () => { applyColumnVisibility(); saveColumnVisibility(); }));
    
    initMobileMenu(); 
    renderTable(); 
    
    if (App.state.vocabList.length) setTimeout(() => markCurrentRow(0), 80);
    
    on($('backToDashBtn'), 'click', () => { stopReadAll(); window.location.href = 'index.html'; });
    on($('clearBtn'), 'click', clearAnswers); 
    on($('readAllBtn'), 'click', readAll); 
    on($('openImageDisplayBtn'), 'click', openImageModal); 
    on($('closeModalBtn'), 'click', closeImageModal); 
    on($('resetImageDataBtn'), 'click', resetLocalImageData);
    
    document.addEventListener('keydown', event => { 
      if (event.key === 'Escape') { closeDictionaryPopup(); closeImageModal(); } 
      if (event.key === 'Tab' && document.activeElement?.classList?.contains('answer-input')) { 
        event.preventDefault(); 
        const idx = Number(document.activeElement.dataset.viewindex || 0); 
        // Trỏ vào node trên DOM thay vì gọi trực tiếp index tránh lỗi element chưa có do lazy load
        const row = document.activeElement.closest('tr'); 
        openDictionaryPopup(App.state.vocabList[idx], row); 
      } 
    });
    document.addEventListener('click', event => { if (event.target?.matches?.('[data-dictionary-close], .dictionary-popup-close')) closeDictionaryPopup(); });
  }
  document.addEventListener('DOMContentLoaded', initWorkspace);
})();