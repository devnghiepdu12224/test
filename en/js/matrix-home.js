/* Matrix Hanzi Pro - Home Controller (Bản sửa lỗi ghi nhớ lựa chọn Dropdown khi quay về trang chủ) */
(function () {
  'use strict';
  const App = window.MatrixApp;
  if (!App) throw new Error('MatrixApp core chưa được nạp.');
  const { $, on } = App;
  const LAUNCH_MODE_KEY = App.STORAGE_PREFIX + '_launch_mode';
  const VALID_LAUNCH_MODES = ['normal', 'pro', 'typing'];
  let selectedLaunchMode = localStorage.getItem(LAUNCH_MODE_KEY) || 'pro';
  if (!VALID_LAUNCH_MODES.includes(selectedLaunchMode)) selectedLaunchMode = 'pro';

  const GUIDE_SLIDES = [
        "https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/main/Engineering_Hanzi_Fluency_page-0001.jpg",
        "https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/main/Engineering_Hanzi_Fluency_page-0002.jpg",
        "https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/main/Engineering_Hanzi_Fluency_page-0003.jpg",
        "https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/main/Engineering_Hanzi_Fluency_page-0004.jpg",
        "https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/main/Engineering_Hanzi_Fluency_page-0005.jpg",
        "https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/main/Engineering_Hanzi_Fluency_page-0006.jpg",
        "https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/main/Engineering_Hanzi_Fluency_page-0007.jpg",
        "https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/main/Engineering_Hanzi_Fluency_page-0008.jpg",
        "https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/main/Engineering_Hanzi_Fluency_page-0009.jpg",
        "https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/main/Engineering_Hanzi_Fluency_page-0010.jpg",
        "https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/main/Engineering_Hanzi_Fluency_page-0011.jpg",
        "https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/main/Engineering_Hanzi_Fluency_page-0012.jpg",
        "https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/main/Engineering_Hanzi_Fluency_page-0013.jpg",
        "https://raw.githubusercontent.com/devnghiepdu12224/my_vocal_list/main/Engineering_Hanzi_Fluency_page-0014.jpg"
    ];
  const GUIDE_CACHE = [];
  let guideIndex = 0;

  // --- LOGIC PHẠM VI (RANGE) ---
  function updateHomeRangeSelector() {
    const select = $('homeRangeSelect');
    if (!select) return;
    const total = App.state.masterVocabList.length;
    select.innerHTML = '<option value="0">Total</option>';
    
    if (total > 0) {
      for (let i = 50; i < total; i += 50) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `Start from Item ${i + 1}`;
        select.appendChild(opt);
      }
    }
    
    if (App.state.range && App.state.range.start < total) {
      select.value = App.state.range.start;
    } else {
      select.value = 0;
    }
  }

  function bindHomeRange() {
    const select = $('homeRangeSelect');
    if(select) {
      on(select, 'change', (e) => {
        App.state.range = { start: Number(e.target.value), end: null };
        App.saveState();
      });
    }
  }
  // ------------------------------

  window.openConfigPanel = function openConfigPanel(panelId, btn) {
    App.qa('.config-panel').forEach(p => p.classList.remove('active'));
    App.qa('.tool-btn').forEach(b => b.classList.remove('active'));
    const panel = $(panelId);
    if (panel) panel.classList.add('active');
    if (btn) btn.classList.add('active');
  };

  window.setVisualMode = function setVisualMode(mode) {
    App.state.currentStudyMode = mode || 'normal';
    localStorage.setItem(App.STORAGE_KEYS.mode, App.state.currentStudyMode);
    ['normal', 'random', 'forgotten', 'wrong'].forEach(name => {
      const id = 'optMode' + name.charAt(0).toUpperCase() + name.slice(1);
      const el = $(id);
      if (el) el.classList.toggle('active', name === App.state.currentStudyMode);
    });
  };

  window.setLaunchMode = function setLaunchMode(mode) {
    selectedLaunchMode = VALID_LAUNCH_MODES.includes(mode) ? mode : 'pro';
    localStorage.setItem(LAUNCH_MODE_KEY, selectedLaunchMode);
    updateLaunchModeUI();
  };

  function updateLaunchModeUI() {
    const modeMap = {
      normal: $('launchModeNormal'),
      pro: $('launchModePro'),
      typing: $('launchModeTyping')
    };
    Object.entries(modeMap).forEach(([mode, el]) => {
      if (!el) return;
      const active = selectedLaunchMode === mode;
      el.classList.toggle('active', active);
      el.setAttribute('aria-pressed', String(active));
    });
    const startBtn = $('startPracticeBtn');
    if (startBtn) {
      const labelMap = {
        normal: 'Start Normal ▦',
        pro: 'Start Pro ✦',
        typing: 'Start Typing ⌨'
      };
      startBtn.textContent = labelMap[selectedLaunchMode] || labelMap.pro;
    }
  }

  window.toggleGuidePopup = function toggleGuidePopup() {
    const wrap = $('guidePopupWrap');
    if (!wrap) return;
    const active = wrap.classList.toggle('active');
    wrap.setAttribute('aria-hidden', String(!active));
    if (active) updateGuidePopup();
  };
  
  window.changeGuideSlide = function changeGuideSlide(step) {
    guideIndex = Math.max(0, Math.min(GUIDE_SLIDES.length - 1, guideIndex + Number(step || 0)));
    updateGuidePopup();
  };

  function updateGuidePopup() {
    const img = $('guideSlideImg');
    const indicator = $('guideIndicator');
    const prev = $('guidePrevBtn');
    const next = $('guideNextBtn');
    if (indicator) indicator.textContent = `${guideIndex + 1} / ${GUIDE_SLIDES.length}`;
    if (prev) prev.disabled = guideIndex <= 0;
    if (next) next.disabled = guideIndex >= GUIDE_SLIDES.length - 1;
    if (img && GUIDE_SLIDES[guideIndex]) {
      img.style.opacity = '0.35';
      img.onload = () => { img.style.opacity = '1'; };
      img.onerror = () => { img.alt = 'Image not found'; img.style.opacity = '1'; };
      img.src = GUIDE_SLIDES[guideIndex];
    }
  }

  function renderPresetSelect() {
    const select = $('presetSelect');
    const dropdown = $('customSelectDropdown');
    const text = $('customSelectText');
    if (!select || !dropdown) return;
    select.innerHTML = '';
    const groups = [
      { type: 'vocabulary', label: '📚 Vocabulary' },
      { type: 'example-sentence', label: '📝 Example Sentences' }
    ];
    groups.forEach(group => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = group.label;
      App.PRESET_SOURCES.filter(src => (src.contentType || 'vocabulary') === group.type).forEach(src => {
        const opt = document.createElement('option');
        opt.value = src.id;
        opt.textContent = src.name;
        optgroup.appendChild(opt);
      });
      if (optgroup.children.length) select.appendChild(optgroup);
    });
    dropdown.innerHTML = '';
    groups.forEach(group => {
      const items = App.PRESET_SOURCES.filter(src => (src.contentType || 'vocabulary') === group.type);
      if (!items.length) return;
      const label = document.createElement('div');
      label.className = 'custom-select-group-label';
      label.textContent = group.label;
      dropdown.appendChild(label);
      items.forEach(src => {
        const div = document.createElement('div');
        div.className = 'custom-select-option';
        div.dataset.value = src.id;
        div.textContent = src.name;
        
        div.addEventListener('click', () => {
          select.value = src.id;
          if (text) text.textContent = src.name;
          App.qa('.custom-select-option', dropdown).forEach(x => x.classList.remove('selected'));
          div.classList.add('selected');
          dropdown.classList.remove('show');
          $('customSelectTrigger')?.classList.remove('active');
          
          loadPresetSource();
        });
        dropdown.appendChild(div);
      });
    });

    // SỬA ĐỔI TẠI ĐÂY: Đọc ID bộ từ vựng đang active từ state thay vì luôn ép lấy bộ số 0
    const activeSourceId = App.state.currentSourceMeta ? App.state.currentSourceMeta.id : null;
    const savedSource = App.PRESET_SOURCES.find(x => x.id === activeSourceId) || App.PRESET_SOURCES[0];
    
    if (savedSource) {
      select.value = savedSource.id;
      if (text) text.textContent = savedSource.name;
      const matchedOption = dropdown.querySelector(`[data-value="${CSS.escape(savedSource.id)}"]`);
      if (matchedOption) matchedOption.classList.add('selected');
    }
  }

  function initCustomSelect() {
    const trigger = $('customSelectTrigger');
    const dropdown = $('customSelectDropdown');
    if (!trigger || !dropdown) return;
    trigger.addEventListener('click', event => {
      event.stopPropagation();
      dropdown.classList.toggle('show');
      trigger.classList.toggle('active', dropdown.classList.contains('show'));
    });
    document.addEventListener('click', event => {
      if (!trigger.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.classList.remove('show');
        trigger.classList.remove('active');
      }
    });
  }

  function setHomeStatus(message, isError = false) {
    const fileText = $('fileDropText');
    if (fileText) {
      fileText.textContent = message;
      fileText.style.color = isError ? 'var(--accent-red)' : 'var(--text-secondary)';
    }
  }

  async function autoLoadFirstPreset() {
    const source = App.PRESET_SOURCES[0];
    if (!source) return;
    try {
      setHomeStatus('Automatically loading default vocabulary preset...');
      const res = await fetch(source.url, { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const rawText = await res.text();
      const meta = App.normalizeSourceMeta({ ...source, type: 'preset-url' }, rawText);
      const list = App.parseVocabulary(rawText, meta);
      if (!list.length) return;
      
      App.setLoadedList(list, meta);
      updateHomeRangeSelector();
      setHomeStatus(`Loaded preset: ${meta.name} (${list.length} items)`);
    } catch (err) {
      console.error('Error loading default preset:', err);
      setHomeStatus('Cannot automatically load default vocabulary preset.', true);
    }
  }

  async function loadPresetSource() {
    const select = $('presetSelect');
    if (!select) return;
    const source = App.PRESET_SOURCES.find(x => x.id === select.value);
    if (!source) return alert('Please select a valid preset source.');
    try {
      setHomeStatus('Automatically loading system vocabulary preset...');
      const res = await fetch(source.url, { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const rawText = await res.text();
      const meta = App.normalizeSourceMeta({ ...source, type: 'preset-url' }, rawText);
      const list = App.parseVocabulary(rawText, meta);
      if (!list.length) throw new Error('System file does not contain valid data.');
      
      App.setLoadedList(list, meta);
      updateHomeRangeSelector();
      
      setHomeStatus(`Loaded: ${meta.name} (${list.length} items)`);
    } catch (err) {
      console.error(err);
      setHomeStatus('Error loading system preset: ' + err.message, true);
      alert('Failed to load system vocabulary. Please check your network connection or the source URL.');
    }
  }

  async function loadCustomUrl() {
    const input = $('customUrlInput');
    const url = input ? input.value.trim() : '';
    if (!url) return alert('Please enter a valid .txt/.csv URL.');
    try {
      setHomeStatus('Loading from custom URL...');
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const rawText = await res.text();
      const meta = App.normalizeSourceMeta({ type: 'custom-url', id: 'custom-' + App.hashText(url), name: 'Cloud riêng' }, rawText);
      const list = App.parseVocabulary(rawText, meta);
      if (!list.length) throw new Error('No valid data found.');
      
      App.setLoadedList(list, meta);
      updateHomeRangeSelector();
      
      setHomeStatus(`Loaded custom URL (${list.length} items)`);
      alert(`Successfully loaded ${list.length} items.`);
    } catch (err) {
      console.error(err);
      setHomeStatus('Error loading custom URL: ' + err.message, true);
      alert('Failed to load this URL. If the URL is from Google Drive/Dropbox, you need to use the raw/direct link.');
    }
  }

  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const rawText = String(event.target.result || '');
        const meta = App.normalizeSourceMeta({ type: 'file', id: 'file-' + App.hashText(file.name + file.size), name: file.name }, rawText);
        const list = App.parseVocabulary(rawText, meta);
        if (!list.length) throw new Error('File does not contain valid data.');
        
        App.setLoadedList(list, meta);
        updateHomeRangeSelector();

        setHomeStatus(`Loaded file: ${file.name} (${list.length} items)`);
        alert(`Successfully loaded ${list.length} items from file.`);
      } catch (err) {
        console.error(err);
        setHomeStatus('Error reading file: ' + err.message, true);
        alert('Failed to read file. Please use the format: Hanzi | Pinyin | Meaning or similar CSV/TXT format.');
      }
    };
    reader.onerror = () => alert('Failed to read file.');
    reader.readAsText(file, 'utf-8');
  }

  function renderUserLibrarySelect() {
    const select = $('userLibrarySelect');
    if (!select) return;
    const library = App.getUserLibrary();
    select.innerHTML = library.length ? '' : '<option value="">(Empty - No saved lists)</option>';
    library.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = `${item.name} (${item.totalWords || 0} items)`;
      select.appendChild(opt);
    });
  }

  function saveCurrentListToLibrary() {
    App.restoreState();
    if (!App.state.masterVocabList.length) return alert('No vocabulary list to save.');
    const name = prompt('Enter a name for this vocabulary list:', App.state.currentListName || 'Personal Vocabulary List');
    if (!name) return;
    const library = App.getUserLibrary();
    const id = 'user-' + Date.now();
    library.push({ id, name, createdAt: new Date().toISOString(), totalWords: App.state.masterVocabList.length, sourceMeta: { ...App.state.currentSourceMeta, id, name, type: 'library' }, vocabList: App.state.masterVocabList });
    App.setUserLibrary(library);
    renderUserLibrarySelect();
    alert('Successfully saved to personal library.');
  }

  function loadUserListFromLibrary() {
    const select = $('userLibrarySelect');
    if (!select || !select.value) return;
    const item = App.getUserLibrary().find(x => x.id === select.value);
    if (!item) return;
    
    App.setLoadedList(item.vocabList || [], { ...(item.sourceMeta || {}), id: item.id, name: item.name, type: 'library' });
    updateHomeRangeSelector();

    alert(`Loaded ${item.name}. You can now click START.`);
  }

  function deleteUserListFromLibrary() {
    const select = $('userLibrarySelect');
    if (!select || !select.value) return;
    if (!confirm('Delete this saved vocabulary list?')) return;
    App.setUserLibrary(App.getUserLibrary().filter(x => x.id !== select.value));
    renderUserLibrarySelect();
  }

  function bindFileDropzone() {
    const input = $('fileInput');
    const zone = $('dropZoneContainer');
    if (!input || !zone) return;
    on(input, 'change', event => handleFile(event.target.files && event.target.files[0]));
    on(zone, 'click', () => input && input.click());
    on(zone, 'dragover', event => { event.preventDefault(); zone.style.borderColor = 'var(--accent-neon)'; });
    on(zone, 'dragleave', () => { zone.style.borderColor = 'var(--border-color)'; });
    on(zone, 'drop', event => { event.preventDefault(); zone.style.borderColor = 'var(--border-color)'; handleFile(event.dataTransfer.files && event.dataTransfer.files[0]); });
  }

  function startPractice() {
    App.restoreState();
    if (!App.state.masterVocabList.length) return alert('Please select a vocabulary set, enter a link, or upload a file first.');
    App.saveState(); 
    const launchRoutes = {
      normal: 'normal.html',
      pro: 'pro-mode.html',
      typing: 'typing-mode/index.html'
    };
    window.location.href = launchRoutes[selectedLaunchMode] || launchRoutes.pro;
  }

  async function initHome() {
    if (!$('dashboardScreen')) return;
    App.initTheme();
    App.initCustomerName();
    App.restoreState();
    
    GUIDE_SLIDES.forEach((src, index) => {
      const img = new Image();
      img.decoding = 'async';
      img.loading = 'eager';
      img.src = src;
      GUIDE_CACHE[index] = img;
    });

    updateGuidePopup();
    renderPresetSelect();
    initCustomSelect();
    renderUserLibrarySelect();
    window.setVisualMode(App.state.currentStudyMode || 'normal');
    updateLaunchModeUI();
    ['launchModeNormal', 'launchModePro', 'launchModeTyping'].forEach(id => {
      const el = $(id);
      if (!el) return;
      on(el, 'keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          el.click();
        }
      });
    });
    bindFileDropzone();

    updateHomeRangeSelector();
    bindHomeRange();
    
    if (!App.state.masterVocabList || App.state.masterVocabList.length === 0) {
      await autoLoadFirstPreset();
    }
    
    const loadPresetBtn = $('loadPresetBtn');
    if (loadPresetBtn) on(loadPresetBtn, 'click', loadPresetSource);
    
    const loadCustomUrlBtn = $('loadCustomUrlBtn');
    if (loadCustomUrlBtn) on(loadCustomUrlBtn, 'click', loadCustomUrl);
    
    const saveCurrentListBtn = $('saveCurrentListBtn');
    if (saveCurrentListBtn) on(saveCurrentListBtn, 'click', saveCurrentListToLibrary);
    
    const loadUserListBtn = $('loadUserListBtn');
    if (loadUserListBtn) on(loadUserListBtn, 'click', loadUserListFromLibrary);
    
    const deleteUserListBtn = $('deleteUserListBtn');
    if (deleteUserListBtn) on(deleteUserListBtn, 'click', deleteUserListFromLibrary);
    
    const startPracticeBtn = $('startPracticeBtn');
    if (startPracticeBtn) on(startPracticeBtn, 'click', startPractice);
  }
  
  document.addEventListener('DOMContentLoaded', initHome);
})();