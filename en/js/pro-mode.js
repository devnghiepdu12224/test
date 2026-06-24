/* Matrix Hanzi Pro - Pro Mode v2 (Bản Nâng Cấp Tiếng Ồn Trắng Giúp Tập Trung Cao Độ) */
(function(){
  'use strict';
  const App = window.MatrixApp;
  if (!App) throw new Error('MatrixApp core chưa được nạp.');
  const $ = id => document.getElementById(id);
  
  const state = {
    queue: [],
    currentIndex: 0,
    learned: 0,
    correct: 0,
    wrong: 0,
    startedAt: Date.now(),
    timer: null,
    animating: false,
    display: { hanzi: true, meaning: true, audio: true, music: false },
    audio: { ctx: null, sfxGain: null, musicGain: null, whiteNoiseNode: null },
    fallbackNotice: ''
  };

  function init(){
    applyTheme();
    bind();
    loadQueue();
    startTimer();
    renderAll();
    focusInput();
    if (state.display.audio) speakCurrent();
  }

  function applyTheme(){
    try {
      const t = localStorage.getItem(App.STORAGE_KEYS.theme) || 'dark';
      document.body.classList.toggle('light-mode', t === 'light');
      $('themeToggleBtn').textContent = t === 'light' ? '🌙' : '☀️';
    } catch {}
  }

  function toggleTheme(){
    const t = document.body.classList.contains('light-mode') ? 'dark' : 'light';
    document.body.classList.toggle('light-mode', t === 'light');
    try { localStorage.setItem(App.STORAGE_KEYS.theme, t); } catch {}
    $('themeToggleBtn').textContent = t === 'light' ? '🌙' : '☀️';
  }

  function bind(){
    $('backHomeBtn')?.addEventListener('click', goHome);
    $('emptyBackBtn')?.addEventListener('click', goHome);
    $('themeToggleBtn')?.addEventListener('click', toggleTheme);
    $('toggleHanzi')?.addEventListener('click', () => toggle('hanzi'));
    $('toggleMeaning')?.addEventListener('click', () => toggle('meaning'));
    $('toggleAudio')?.addEventListener('click', () => toggle('audio'));
    $('toggleMusic')?.addEventListener('click', () => toggle('music'));
    $('dictBtn')?.addEventListener('click', openDictionary);
    $('dictCloseBtn')?.addEventListener('click', closeDictionary);
    $('dictionaryOverlay')?.addEventListener('click', e => { if (e.target === $('dictionaryOverlay')) closeDictionary(); });
    $('proAnswerInput')?.addEventListener('keydown', onInputKey);
    document.addEventListener('keydown', onGlobalKey);
    window.addEventListener('resize', renderStack);
  }

  function goHome(){
    stopMusic();
    location.href = 'index.html';
  }

  function loadQueue(){
    App.restoreState();
    let view = [];
    try { view = App.getViewList() || App.state.vocabList || []; } catch { view = []; }
    state.fallbackNotice = '';
    if ((!view || !view.length) && Array.isArray(App.state.masterVocabList) && App.state.masterVocabList.length) {
      view = [...App.state.masterVocabList];
      state.fallbackNotice = 'The current review configuration has no words, Pro Mode is using the sequential list.';
    }
    state.queue = Array.isArray(view) ? [...view] : [];
    state.currentIndex = 0;
    const name = $('proListName');
    if (name) name.textContent = App.state.currentListName || 'Pro Session';
    const empty = $('emptyState'), focus = $('focusWrap'), msg = $('emptyMessage');
    if (!state.queue.length) {
      if (msg) msg.textContent = 'Please go back to the home page and select/activate a vocabulary set before opening Pro Mode.';
      empty.hidden = false;
      focus.hidden = true;
    } else {
      empty.hidden = true;
      focus.hidden = false;
    }
  }

  function startTimer(){
    updateStat();
    state.timer = setInterval(updateStat, 1000);
  }

  function updateStat(){
    const e = Math.floor((Date.now() - state.startedAt) / 1000), m = Math.floor(e / 60), s = e % 60;
    const statEl = $('sessionStat');
    if (statEl) statEl.textContent = `${state.learned} words • ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function isMobile() { return matchMedia && matchMedia('(max-width: 768px)').matches; }
  function radius() { return isMobile() ? 2 : 4; }
  function current() { return state.queue[state.currentIndex] || null; }

  function renderAll(){
    renderCurrent();
    renderStack();
    updateToggles();
  }

  function renderCurrent(){
    const it = current();
    if (!it) return;
    $('currentIndexLabel').textContent = `STT ${it.rawIndex + 1}`;
    $('currentHanzi').textContent = it.hanzi || '—';
    $('currentMeaning').textContent = it.meaning || '—';
    $('currentCard').classList.toggle('hide-hanzi', !state.display.hanzi);
    $('currentCard').classList.toggle('hide-meaning', !state.display.meaning);
    $('proAnswerInput').value = '';
    setFeedback(state.fallbackNotice || 'Enter to submit, Shift to hear pronunciation, Tab to toggle dictionary.', '');
  }

  function renderStack(){
    const stack = $('proStack');
    if (!stack) return;
    const r = radius(), gap = isMobile() ? 74 : 96;
    stack.innerHTML = '';
    for (let o = -r; o <= r; o++) {
      if (o === 0) continue;
      const it = state.queue[state.currentIndex + o];
      if (!it) continue;
      const a = Math.abs(o), opacity = Math.max(.08, .52 - a * .10), scale = Math.max(.84, .98 - a * .04), blur = Math.max(0, a - 1) * .7;
      const card = document.createElement('article');
      card.className = 'ghost-card';
      card.style.setProperty('--y', `${o * gap}px`);
      card.style.setProperty('--opacity', opacity);
      card.style.setProperty('--scale', scale);
      card.style.setProperty('--blur', `${blur}px`);
      card.innerHTML = `<div class="ghost-index">STT ${it.rawIndex + 1}</div><div class="ghost-main">${state.display.hanzi ? `<div class="ghost-hanzi">${App.escapeHtml(it.hanzi || '')}</div>` : ''}${state.display.meaning ? `<div class="ghost-meaning">${App.escapeHtml(it.meaning || '')}</div>` : ''}</div>`;
      stack.appendChild(card);
    }
  }

  function toggle(k){
    if (k === 'music') {
      state.display.music = !state.display.music;
      state.display.music ? startMusic() : stopMusic();
    } else {
      state.display[k] = !state.display[k];
      if (!state.display.hanzi && !state.display.meaning && !state.display.audio) state.display.meaning = true;
      if (k === 'audio' && state.display.audio) speakCurrent();
    }
    renderAll();
    focusInput();
  }

  function updateToggles(){
    [['toggleHanzi', 'hanzi'], ['toggleMeaning', 'meaning'], ['toggleAudio', 'audio'], ['toggleMusic', 'music']].forEach(([id, k]) => {
      $(id)?.classList.toggle('active', !!state.display[k]);
      if (k === 'music') $(id)?.classList.toggle('music-on', !!state.display[k]);
    });
  }

  function onInputKey(e){
    if (e.key === 'Enter') { e.preventDefault(); submit(); }
    else if (e.key === 'Shift') { e.preventDefault(); speakCurrent(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); moveNext({ force: true }); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); movePrev(); }
    else if (e.key === 'Tab') { e.preventDefault(); toggleDictionary(); }
  }

  function onGlobalKey(e){
    if (e.key === 'Escape') {
      if ($('dictionaryOverlay')?.classList.contains('active')) closeDictionary();
      else goHome();
    }
    if (e.key === 'Tab' && !e.target.classList?.contains('answer-input')) {
      e.preventDefault();
      toggleDictionary();
    }
  }

  function submit(){
    if (state.animating) return;
    const it = current(), input = $('proAnswerInput');
    if (!it || !input) return;
    const ans = input.value || '';
    if (!ans.trim()) {
      setFeedback('Enter your answer before pressing Enter.', 'wrong');
      playWrong();
      pulse('bad');
      return;
    }
    const ok = App.normalizeText(ans) === App.normalizeText(it.hanzi);
    if (ok) {
      App.setWrong?.(it.rawIndex, false);
      state.correct++;
      state.learned++;
      setFeedback('Correct. Keep going!', 'correct');
      playCorrect();
      pulse('ok');
      setTimeout(() => moveNext(), 135);
    } else {
      App.setWrong?.(it.rawIndex, true);
      state.wrong++;
      setFeedback('Incorrect. Try the current word again.', 'wrong');
      playWrong();
      pulse('bad');
      focusInput();
    }
    updateStat();
  }

  function moveNext(opt = {}){
    if (state.animating && !opt.force) return;
    if (state.currentIndex >= state.queue.length - 1) {
      setFeedback('You have completed the practice session.', 'correct');
      playCorrect();
      return;
    }
    state.animating = true;
    const card = $('currentCard');
    card.classList.add('slide');
    setTimeout(() => {
      state.currentIndex++;
      renderAll();
      card.classList.remove('slide', 'ok', 'bad');
      state.animating = false;
      focusInput();
      if (state.display.audio) speakCurrent();
    }, 170);
  }

  function movePrev(){
    if (state.currentIndex <= 0) return;
    state.currentIndex--;
    renderAll();
    focusInput();
    if (state.display.audio) speakCurrent();
  }

  function setFeedback(t, k){
    const f = $('feedbackText');
    if(!f) return;
    f.textContent = t || '';
    f.classList.toggle('correct', k === 'correct');
    f.classList.toggle('wrong', k === 'wrong');
  }

  function pulse(k){
    const c = $('currentCard');
    if(!c) return;
    c.classList.remove('ok', 'bad');
    void c.offsetWidth;
    c.classList.add(k);
    setTimeout(() => c.classList.remove(k), 230);
  }

  function focusInput(){
    setTimeout(() => $('proAnswerInput')?.focus(), 40);
  }

  /* =============================================================
     HỆ THỐNG ÂM THANH TYPING GAME VUI NHỘN & TIẾNG ỒN TRẮNG
     ============================================================= */
  function audioCtx() {
    if (!state.audio.ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      state.audio.ctx = new C();
      state.audio.sfxGain = state.audio.ctx.createGain();
      state.audio.sfxGain.gain.value = 0.80; // Âm lượng hiệu ứng gõ phím
      state.audio.sfxGain.connect(state.audio.ctx.destination);
    }
    if (state.audio.ctx.state === 'suspended') state.audio.ctx.resume();
    return state.audio.ctx;
  }

  // Tiếng Pop/Chíp vui nhộn khi gõ Đúng
  function playCorrect() {
    const ctx = audioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.06);
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    
    osc.connect(gainNode);
    gainNode.connect(state.audio.sfxGain || ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  // Tiếng Bụp/Tuột báo Sai
  function playWrong() {
    const ctx = audioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.16);
    
    osc.connect(gainNode);
    gainNode.connect(state.audio.sfxGain || ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  }

  // --- HÀM KHỞI TẠO TIẾNG ỒN TRẮNG (WHITE NOISE GENERATOR) ---
  function startMusic() {
    const ctx = audioCtx();
    if (!ctx || state.audio.whiteNoiseNode) return;

    state.audio.musicGain = ctx.createGain();
    state.audio.musicGain.gain.value = 0.03; // Thiết lập âm lượng tiếng ồn nền êm dịu, vừa phải
    state.audio.musicGain.connect(ctx.destination);

    // Sinh tiếng ồn trắng chuẩn bằng thuật toán ngẫu nhiên Math.random()
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true; // Lặp vô hạn

    whiteNoise.connect(state.audio.musicGain);
    whiteNoise.start();
    
    state.audio.whiteNoiseNode = whiteNoise;
  }

  function stopMusic() {
    if (state.audio.whiteNoiseNode) {
      try { state.audio.whiteNoiseNode.stop(); } catch {}
      state.audio.whiteNoiseNode = null;
    }
    state.audio.musicGain = null;
  }

  function duck(on) {
    const ctx = state.audio.ctx, g = state.audio.musicGain;
    if (!ctx || !g) return;
    g.gain.cancelScheduledValues(ctx.currentTime);
    // Tự động giảm âm lượng tiếng ồn trắng xuống 0.01 khi robot phát âm từ vựng tiếng Trung
    g.gain.linearRampToValueAtTime(on ? 0.01 : 0.03, ctx.currentTime + 0.15);
  }

  function speakCurrent(){
    const it = current();
    if (!it || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    duck(true);
    const u = new SpeechSynthesisUtterance(it.hanzi || '');
    u.lang = 'zh-CN';
    u.rate = .85;
    u.onend = () => duck(false);
    u.onerror = () => duck(false);
    speechSynthesis.speak(u);
  }

  function toggleDictionary(){ 
    $('dictionaryOverlay')?.classList.contains('active') ? closeDictionary() : openDictionary(); 
  }

  function openDictionary(){
    const it = current();
    if (!it) return;
    const url = `https://hanzii.net/search/word/${encodeURIComponent(it.hanzi || '')}?hl=vi`;
    $('dictionaryWord').textContent = it.hanzi || '—';
    $('dictionaryExternalLink').href = url;
    $('dictionaryFrame').src = url;
    $('dictionaryOverlay').classList.add('active');
    $('dictionaryOverlay').setAttribute('aria-hidden', 'false');
  }

  function closeDictionary(){
    $('dictionaryFrame').src = 'about:blank';
    $('dictionaryOverlay').classList.remove('active');
    $('dictionaryOverlay').setAttribute('aria-hidden', 'true');
    focusInput();
  }

  document.addEventListener('DOMContentLoaded', init);
})();