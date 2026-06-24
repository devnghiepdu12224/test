import { SYSTEM_TEXTS } from "./data.js";

const KEYS = { theme: "matrixhanzi_theme", custom: "matrixhanzi_custom_texts", history: "matrixhanzi_history", session: "matrixhanzi_current_session" };
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const readJSON = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const writeJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const isHanzi = char => /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(char);

function applyTheme(theme = localStorage.getItem(KEYS.theme) || "light") {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(KEYS.theme, theme);
  $$('[data-theme-toggle]').forEach(btn => btn.textContent = theme === "dark" ? "Sáng" : "Tối");
}
function bindTheme() { applyTheme(); $$('[data-theme-toggle]').forEach(btn => btn.addEventListener("click", () => applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"))); }
function formatDate(ts) { const d = new Date(ts); const pad = n => String(n).padStart(2, "0"); return `${pad(d.getHours())}:${pad(d.getMinutes())} - ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; }
function escapeHTML(value = "") { return String(value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])); }
function startSession(item) { writeJSON(KEYS.session, { id: item.id || `custom-${Date.now()}`, title: item.title || "Không có tiêu đề", text: item.text || "", source: item.source || "system" }); window.location.href = "workspace.html"; }

function initHome() { bindTabs(); renderLibrary(); bindCustomForm(); renderCustomTexts(); renderHistory(); }
function bindTabs() { $$('.tab').forEach(tab => tab.addEventListener('click', () => { $$('.tab').forEach(t => t.classList.remove('active')); $$('.panel').forEach(p => p.classList.remove('active')); tab.classList.add('active'); $(`#${tab.dataset.tab}`).classList.add('active'); })); }
function renderLibrary(activeCategory = "Tất cả") {
  const filters = $('#categoryFilters'); const list = $('#libraryList'); if (!filters || !list) return;
  const categories = ["Tất cả", ...new Set(SYSTEM_TEXTS.map(item => item.category))];
  filters.innerHTML = categories.map(cat => `<button class="filter ${cat === activeCategory ? 'active' : ''}" data-category="${cat}" type="button">${cat}</button>`).join("");
  const items = activeCategory === "Tất cả" ? SYSTEM_TEXTS : SYSTEM_TEXTS.filter(item => item.category === activeCategory);
  list.innerHTML = items.map(item => `<article class="entry" data-id="${item.id}" tabindex="0" role="button" aria-label="Bắt đầu ${escapeHTML(item.title)}"><h2 class="entry-title">${escapeHTML(item.title)}</h2><p class="hanzi-preview">${escapeHTML(item.text)}</p>${item.pinyin ? `<p class="muted">${escapeHTML(item.pinyin)}</p>` : ""}${item.translation ? `<p class="muted">${escapeHTML(item.translation)}</p>` : ""}</article>`).join("");
  $$('.filter', filters).forEach(btn => btn.addEventListener('click', () => renderLibrary(btn.dataset.category)));
  $$('.entry', list).forEach(entry => { const open = () => startSession(SYSTEM_TEXTS.find(item => item.id === entry.dataset.id)); entry.addEventListener('click', open); entry.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } }); });
}
function bindCustomForm() {
  const form = $('#customForm'); const text = $('#customText'); const count = $('#customCount'); const warning = $('#customWarning'); if (!form || !text) return;
  const showWarning = message => { warning.textContent = message; warning.classList.add('show'); };
  text.addEventListener('input', () => count.textContent = text.value.length);
  form.addEventListener('submit', event => { event.preventDefault(); warning.classList.remove('show'); const title = $('#customTitle').value.trim() || "Bài tập không tên"; const value = text.value.trim(); const custom = readJSON(KEYS.custom, []); if (!value) return showWarning("Vui lòng nhập văn bản Hán tự trước khi lưu."); if (value.length > 500) return showWarning("Mục này vượt quá 500 ký tự. Vui lòng làm ngắn lại."); if (custom.length >= 30) return showWarning("Bạn đã có 30 mục được lưu. Hãy xóa các văn bản cũ trước khi thêm văn bản mới."); custom.unshift({ id: `custom-${Date.now()}`, title, text: value, createdAt: Date.now(), source: "custom" }); writeJSON(KEYS.custom, custom); form.reset(); count.textContent = "0"; renderCustomTexts(); });
  $('#clearCustom')?.addEventListener('click', () => { if (confirm('Xóa tất cả văn bản tùy chỉnh đã lưu?')) { writeJSON(KEYS.custom, []); renderCustomTexts(); } });
}
function renderCustomTexts() {
  const list = $('#customList'); if (!list) return; const custom = readJSON(KEYS.custom, []);
  if (!custom.length) { list.innerHTML = `<p class="empty">Chưa có văn bản tùy chỉnh nào được lưu.</p>`; return; }
  list.innerHTML = custom.map(item => `<article class="saved-item"><div class="item-top"><div><strong>${escapeHTML(item.title)}</strong><div class="date">${formatDate(item.createdAt)}</div></div><div><button class="ghost-btn start-custom" data-id="${item.id}" type="button">Luyện tập</button><button class="danger-btn delete-custom" data-id="${item.id}" type="button">Xóa</button></div></div><div class="snippet">${escapeHTML(item.text.slice(0, 80))}${item.text.length > 80 ? '…' : ''}</div></article>`).join("");
  $$('.start-custom', list).forEach(btn => btn.addEventListener('click', () => startSession(custom.find(item => item.id === btn.dataset.id))));
  $$('.delete-custom', list).forEach(btn => btn.addEventListener('click', () => { writeJSON(KEYS.custom, custom.filter(item => item.id !== btn.dataset.id)); renderCustomTexts(); }));
}
function renderHistory() {
  const list = $('#historyList'); if (!list) return; const history = readJSON(KEYS.history, []);
  list.innerHTML = history.length ? history.map(item => `<article class="history-grid history-item"><span class="date">${formatDate(item.timestamp)}</span><strong>${escapeHTML(item.title)}</strong><span class="stat">${item.wpm ?? item.cpm ?? 0}</span><span class="stat">${item.accuracy}%</span><span class="stat">${item.errors}</span></article>`).join("") : `<p class="empty">Chưa có phiên gõ nào.</p>`;
  $('#clearHistory')?.addEventListener('click', () => { if (confirm('Xóa lịch sử gõ?')) { writeJSON(KEYS.history, []); renderHistory(); } }, { once: true });
}

function initWorkspace() {
  const session = readJSON(KEYS.session, null); if (!session?.text) { window.location.href = "index.html"; return; }
  const textEl = $('#typingText'), input = $('#hiddenInput'), area = $('#typingArea'), stage = $('#workspaceStage'), caret = $('#caret'), timer = $('#timer');
  const chars = Array.from(session.text); const states = Array(chars.length).fill(null);
  let index = 0, typed = 0, startedAt = null, timerId = null, complete = false, active = false, composing = false, justCommittedComposition = false, currentResult = null;
  textEl.innerHTML = chars.map((ch, i) => `<span class="char pending ${i === 0 ? 'active' : ''}" data-index="${i}">${escapeHTML(ch)}</span>`).join("");
  const spans = $$('.char', textEl);
  const focusInput = () => setTimeout(() => input.focus({ preventScroll: true }), 0);
  area.addEventListener('click', focusInput); document.addEventListener('visibilitychange', () => { if (!document.hidden && !complete) focusInput(); }); focusInput();
  function startTimer() { if (startedAt) return; startedAt = performance.now(); active = true; timerId = setInterval(updateTimer, 250); }
  function updateTimer() { const elapsed = Math.max(0, performance.now() - startedAt); const totalSeconds = Math.floor(elapsed / 1000); timer.textContent = `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`; }
  function setActiveChar() { spans.forEach(s => s.classList.remove('active')); if (spans[index]) spans[index].classList.add('active'); moveCaret(); }
  function moveCaret() { requestAnimationFrame(() => { const target = spans[index] || spans[spans.length - 1]; if (!target) return; const areaRect = area.getBoundingClientRect(); const stageRect = stage.getBoundingClientRect(); const rect = target.getBoundingClientRect(); const caretLeft = index >= spans.length ? rect.right - areaRect.left + 2 : rect.left - areaRect.left - 3; caret.style.left = `${caretLeft}px`; caret.style.top = `${rect.top - areaRect.top + rect.height * .16}px`; caret.style.height = `${rect.height * .72}px`; const safeX = Math.min(Math.max(rect.left, 16), window.innerWidth - 32); const safeY = Math.min(Math.max(rect.bottom + 12, 16), window.innerHeight - 64); input.style.left = `${safeX - stageRect.left}px`; input.style.top = `${safeY - stageRect.top}px`; }); }
  function handleChar(typedChar) { if (complete || !typedChar || index >= chars.length) return; startTimer(); const expected = chars[index]; const span = spans[index]; span.classList.remove('pending', 'active'); typed++; if (typedChar === expected) { states[index] = 'correct'; span.classList.add('correct'); } else { states[index] = 'incorrect'; span.classList.add('incorrect'); } index++; setActiveChar(); if (index >= chars.length) finish(); }
  function handleBackspace() { if (complete || index <= 0) return; index--; typed = Math.max(0, typed - 1); states[index] = null; const span = spans[index]; span.classList.remove('correct', 'incorrect', 'active'); span.classList.add('pending', 'active'); setActiveChar(); }
  function commitCharacters(value) { for (const ch of Array.from(value || '')) { if (index >= chars.length || complete) break; handleChar(ch); } }
  function getHanziStats() { const totalHanzi = chars.filter(isHanzi).length; let correctHanzi = 0, hanziErrors = 0; chars.forEach((char, i) => { if (!isHanzi(char)) return; if (states[i] === 'correct') correctHanzi++; if (states[i] === 'incorrect') hanziErrors++; }); return { totalHanzi, correctHanzi, hanziErrors }; }
  input.addEventListener('compositionstart', () => { composing = true; });
  input.addEventListener('compositionend', e => { composing = false; justCommittedComposition = true; commitCharacters(e.data || input.value); input.value = ''; focusInput(); setTimeout(() => { justCommittedComposition = false; }, 0); });
  input.addEventListener('keydown', e => { if (complete) return; if (composing || e.isComposing || e.key === 'Process') return; if (e.key === 'Backspace') { e.preventDefault(); handleBackspace(); input.value = ''; return; } if (e.key.length === 1) { e.preventDefault(); commitCharacters(e.key); input.value = ''; } });
  input.addEventListener('input', () => { if (composing) return; if (justCommittedComposition) { input.value = ''; return; } if (input.value) { commitCharacters(input.value); input.value = ''; } });
  function finish() { complete = true; active = false; clearInterval(timerId); updateTimer(); 
  const elapsedMs =
  performance.now() - startedAt;

const elapsedSeconds =
  elapsedMs / 1000;

const elapsedMinutes =
  elapsedMs / 60000;

const {
  totalHanzi,
  correctHanzi,
  hanziErrors
} = getHanziStats();

let wpm;

if (elapsedSeconds < 30) {
  wpm = correctHanzi;
} else {
  wpm = Math.round(
    correctHanzi / elapsedMinutes
  );
}

  const accuracy = totalHanzi ? Math.round((correctHanzi / totalHanzi) * 100) : 0; currentResult = { title: session.title, wpm, accuracy, errors: hanziErrors, correct: correctHanzi, total: totalHanzi, timestamp: Date.now() }; const history = readJSON(KEYS.history, []); history.unshift(currentResult); writeJSON(KEYS.history, history.slice(0, 200)); $('#resultSubtitle').textContent = session.title; $('#resultWpm').textContent = wpm; $('#resultAccuracy').textContent = `${accuracy}%`; $('#resultErrors').textContent = hanziErrors; $('#resultChars').textContent = `${correctHanzi}/${totalHanzi}`; $('#resultOverlay').classList.add('show'); }
  $('#backHome').addEventListener('click', () => { if (active && !complete && !confirm('Phiên hiện tại của bạn sẽ bị hủy. Quay lại trang chủ?')) return; window.location.href = 'index.html'; });
  $('#homeBtn').addEventListener('click', () => window.location.href = 'index.html'); $('#retryBtn').addEventListener('click', () => window.location.reload()); $('#shareBtn').addEventListener('click', () => shareResult(currentResult)); window.addEventListener('resize', moveCaret); window.addEventListener('scroll', moveCaret, { passive: true }); setActiveChar();
}

function shareResult(result) {
  if (!result) return;
  const W = 1400, H = 900, canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f7f0df'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#1f1b17'; ctx.font = '700 76px Inter, Segoe UI, sans-serif'; ctx.fillText('MatrixHanzi', 120, 135);
  ctx.fillStyle = '#7b6d5d'; ctx.font = '400 34px Inter, Segoe UI, sans-serif'; ctx.fillText('Kết quả luyện gõ nhớ Hán tự', 120, 185);
  ctx.fillStyle = '#2a241f'; ctx.font = '700 58px Inter, Segoe UI, sans-serif'; ctx.fillText(result.title || 'Phiên gõ', 120, 285);
  const drawMetric = (x, y, label, value) => { ctx.fillStyle = '#fffaf0'; roundRect(ctx, x, y, 500, 170, 34); ctx.fill(); ctx.strokeStyle = 'rgba(80,70,58,.16)'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#8b5e3c'; ctx.font = '700 24px Inter, Segoe UI, sans-serif'; ctx.fillText(label, x + 42, y + 56); ctx.fillStyle = '#1f1b17'; ctx.font = '800 66px Consolas, Menlo, monospace'; ctx.fillText(String(value), x + 42, y + 126); };
  drawMetric(120, 350, 'WPM', result.wpm); drawMetric(780, 350, 'ĐỘ CHÍNH XÁC', `${result.accuracy}%`); drawMetric(120, 570, 'LỖI HÁN TỰ', result.errors); drawMetric(780, 570, 'HÁN TỰ ĐÚNG / TỔNG SỐ', `${result.correct}/${result.total}`);
  ctx.fillStyle = '#8b5e3c'; ctx.font = '500 28px Inter, Segoe UI, sans-serif'; ctx.fillText('matrixhanzi.online', 120, 815);
  canvas.toBlob(blob => { const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'matrixhanzi-typing-result.png'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }, 'image/png');
}
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

bindTheme();
if (document.body.dataset.page === "home") initHome();
if (document.body.dataset.page === "workspace") initWorkspace();