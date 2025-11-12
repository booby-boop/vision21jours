/* Final Vision 21 Jours - Claire Sulpice spec
   - Flatpickr calendar (styled)
   - Emoji inputs editable BEFORE generation (cursor visible)
   - Color pickers styled, rounded, no inner black border
   - Generate 21-day grid (dates if provided, or "Jour X" if not)
   - Click a day => selects it (gold liseré)
   - After generation: palettes are frozen (disabled) but can be used to assign values to days
   - Save/load grid to localStorage until reset
   - Capture grid as PNG via html2canvas
*/

(() => {
  const DAYS = 21;
  const LS_KEY = 'vision21_state_v1';

  // DOM
  const startDateEl = document.getElementById('startDate');
  const configForm = document.getElementById('configForm');
  const emojiEditor = document.getElementById('emojiEditor');
  const colorEditor = document.getElementById('colorEditor');
  const daysContainer = document.getElementById('daysContainer');
  const generateBtn = document.getElementById('generateBtn');
  const captureBtn = document.getElementById('captureBtn');

  const radioModes = Array.from(document.querySelectorAll('input[name="mode"]'));
  const emojiInputs = Array.from(document.querySelectorAll('.emoji-input'));
  const colorPickers = Array.from(document.querySelectorAll('.color-picker'));

  let currentDayBox = null;
  let dayBoxes = [];
  let gridGenerated = false;

  // Default palettes (if user doesn't change)
  let EMOJIS = emojiInputs.map(i => i.value || '');
  let COLORS = colorPickers.map(p => p.value || '#ffffff');

  /* ---------- Flatpickr init ---------- */
  flatpickr(startDateEl, {
    dateFormat: "d/m/Y",
    allowInput: true,
    defaultDate: null,
    onReady: function(selectedDates, dateStr, fp) {
      fp.calendarContainer.style.fontFamily = "Montserrat, sans-serif";
      fp.calendarContainer.style.borderRadius = "12px";
      fp.calendarContainer.style.border = "2px solid #c19751";
      fp.calendarContainer.style.background = "#2b2f5a";
      fp.calendarContainer.style.color = "#fff";
      // style selected
      fp.calendarContainer.querySelectorAll('.flatpickr-day').forEach(d => d.style.color = '#fff');
    },
    onOpen: function(selectedDates, dateStr, fp){
      // set selection color to gold
      fp.calendarContainer.querySelectorAll('.flatpickr-day').forEach(d => {
        d.style.color = '#fff';
      });
    }
  });

  /* ---------- Helpers: load/save localStorage ---------- */
  function saveState() {
    const state = {
      startDate: startDateEl.value || null,
      mode: document.querySelector('input[name="mode"]:checked').value,
      emojis: emojiInputs.map(i => i.value || ''),
      colors: colorPickers.map(p => p.value || ''),
      days: dayBoxes.map(b => ({
        label: b.dataset.label || null,
        content: b.dataset.type === 'color' ? b.dataset.value : b.textContent,
        type: b.dataset.type || null,
        background: b.style.background || null
      }))
    };
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }

  function loadState() {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch(e){ return null; }
  }

  function clearState() { localStorage.removeItem(LS_KEY); }

  /* ---------- Show/hide editors according to radio selection ---------- */
  function showEditorsForMode() {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    if (mode === 'emoji') {
      emojiEditor.classList.remove('hidden'); colorEditor.classList.add('hidden');
    } else if (mode === 'color') {
      colorEditor.classList.remove('hidden'); emojiEditor.classList.add('hidden');
    } else {
      emojiEditor.classList.remove('hidden'); colorEditor.classList.remove('hidden');
    }
  }
  radioModes.forEach(r => r.addEventListener('change', showEditorsForMode));
  showEditorsForMode();

  /* ---------- Emoji inputs: editable BEFORE generation ---------- */
  emojiInputs.forEach((inp, idx) => {
    inp.addEventListener('input', () => {
      EMOJIS[idx] = inp.value;
      // live preview: if a day selected and NOT locked, update it
      if (currentDayBox && !currentDayBox.dataset.frozen) {
        currentDayBox.textContent = inp.value || currentDayBox.dataset.label || '';
        updateBoxAppearance(currentDayBox);
      }
      saveState();
    });
    // allow Enter to apply too
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (currentDayBox && !currentDayBox.dataset.frozen) {
          currentDayBox.textContent = inp.value || currentDayBox.dataset.label || '';
          updateBoxAppearance(currentDayBox);
          saveState();
        }
      }
    });
  });

  /* ---------- Color pickers ---------- */
  colorPickers.forEach((picker, idx) => {
    picker.addEventListener('input', () => {
      COLORS[idx] = picker.value;
      // live preview if a day is selected and not frozen
      if (currentDayBox && !currentDayBox.dataset.frozen) {
        currentDayBox.style.background = picker.value;
        currentDayBox.classList.add('colored');
        currentDayBox.dataset.type = 'color';
        currentDayBox.dataset.value = picker.value;
        updateBoxAppearance(currentDayBox);
        saveState();
      }
    });
  });

  /* ---------- Utility: detect if a string looks like an emoji (simple heuristic) ---------- */
  function isEmoji(s) {
    if (!s) return false;
    // check for non-digit and length small
    return /\p{Emoji}/u.test(s) || s.length <= 3 && /[^\w\d\s]/u.test(s);
  }

  function updateBoxAppearance(box) {
    // if box has a background color set (style.background), mark colored
    if (box.style.background && box.style.background !== 'white' && box.style.background !== '#ffffff') {
      box.classList.add('colored');
    } else {
      box.classList.remove('colored');
      box.style.color = '#2b2f5a';
    }
    // font-size: emoji big, dates smaller
    const txt = (box.textContent || '').trim();
    if (isEmoji(txt)) {
      box.style.fontSize = '34px';
      box.style.lineHeight = '1';
      box.style.color = box.classList.contains('colored') ? '#fff' : '#2b2f5a';
    } else {
      box.style.fontSize = '14px';
      box.style.lineHeight = '1.1';
      box.style.color = box.classList.contains('colored') ? '#fff' : '#2b2f5a';
    }
  }

  /* ---------- Generate grid ---------- */
  function generateGrid(fromState) {
    daysContainer.innerHTML = '';
    dayBoxes = [];
    const state = fromState || loadState();
    let startDateObj = null;
    if (state && state.startDate) {
      // try parse d/m/Y or ISO
      const raw = state.startDate;
      const parsed = raw.includes('/') ? raw.split('/').reverse().join('-') : raw;
      startDateObj = new Date(parsed);
      if (isNaN(startDateObj.getTime())) startDateObj = null;
    } else {
      // if input value present and no state
      if (startDateEl.value) {
        const raw = startDateEl.value;
        const parsed = raw.includes('/') ? raw.split('/').reverse().join('-') : raw;
        startDateObj = new Date(parsed);
        if (isNaN(startDateObj.getTime())) startDateObj = null;
      }
    }

    for (let i=0;i<DAYS;i++){
      const box = document.createElement('div');
      box.className = 'dayBox';
      // default label
      if (startDateObj) {
        const d = new Date(startDateObj.getTime() + i*24*60*60*1000);
        const label = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        box.textContent = label;
        box.dataset.label = label;
        box.dataset.date = d.toISOString();
      } else {
        const label = `Jour ${i+1}`;
        box.textContent = label;
        box.dataset.label = label;
      }

      // If fromState has content for this day, restore
      if (state && state.days && state.days[i]) {
        const sd = state.days[i];
        if (sd.type === 'color') {
          box.style.background = sd.content;
          box.dataset.type = 'color';
          box.dataset.value = sd.content;
        } else if (sd.type === 'emoji') {
          box.textContent = sd.content;
          box.dataset.type = 'emoji';
        }
      }

      // click selects (and opens editors depending on mode), but after generation palettes are frozen (can't edit palette inputs)
      box.addEventListener('click', () => {
        // deselect others
        dayBoxes.forEach(b=>b.classList.remove('selected'));
        box.classList.add('selected');
        currentDayBox = box;
        // show editors only if mode allows and palettes are present; palette inputs are disabled after generation, but clicking a palette item applies it
        const mode = document.querySelector('input[name="mode"]:checked').value;
        if (mode === 'emoji') {
          emojiEditor.classList.remove('hidden');
          colorEditor.classList.add('hidden');
        } else if (mode === 'color') {
          colorEditor.classList.remove('hidden');
          emojiEditor.classList.add('hidden');
        } else {
          emojiEditor.classList.remove('hidden');
          colorEditor.classList.remove('hidden');
        }
      });

      daysContainer.appendChild(box);
      dayBoxes.push(box);
      updateBoxAppearance(box);
    }
    gridGenerated = true;
    captureBtn.classList.remove('hidden');
    // Save current config/palettes
    saveState();
  }

  /* ---------- Apply palette items to selected day (after generation) ---------- */
  // Clicking an emoji input (not editing) should apply that emoji to selected day.
  // To avoid confusion: after generation, palette inputs are disabled (so users cannot change palette),
  // but clicking the visible palette boxes (we'll make small clickable overlays) will apply values.

  // We'll create small clickable overlays for emoji palette and color palette (read-only after generation).
  function createPaletteOverlays() {
    // create overlays container under editors to show clickable palette after generation
    // first remove existing overlays if any
    const existing1 = document.getElementById('emojiPaletteOverlay');
    if (existing1) existing1.remove();
    const existing2 = document.getElementById('colorPaletteOverlay');
    if (existing2) existing2.remove();

    const emojiOverlay = document.createElement('div');
    emojiOverlay.id = 'emojiPaletteOverlay';
    emojiOverlay.className = 'editor-row';
    emojiInputs.forEach((inp, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'emoji-btn quick-palette';
      b.style.width = '68px';
      b.style.height = '68px';
      b.style.borderRadius = '12px';
      b.style.border = '4px solid transparent';
      b.style.fontSize = '34px';
      b.textContent = inp.value || '';
      b.addEventListener('click', () => {
        if (!currentDayBox) return alert("Clique d'abord sur un jour.");
        // apply emoji
        currentDayBox.textContent = b.textContent || currentDayBox.dataset.label || '';
        currentDayBox.dataset.type = 'emoji';
        currentDayBox.dataset.value = b.textContent || '';
        updateBoxAppearance(currentDayBox);
        saveState();
      });
      emojiOverlay.appendChild(b);
    });

    const colorOverlay = document.createElement('div');
    colorOverlay.id = 'colorPaletteOverlay';
    colorOverlay.className = 'editor-row';
    colorPickers.forEach((p, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'color-btn quick-palette';
      b.style.width = '68px';
      b.style.height = '68px';
      b.style.borderRadius = '12px';
      b.style.border = '4px solid transparent';
      b.style.background = p.value;
      b.addEventListener('click', () => {
        if (!currentDayBox) return alert("Clique d'abord sur un jour.");
        currentDayBox.style.background = p.value;
        currentDayBox.classList.add('colored');
        currentDayBox.dataset.type = 'color';
        currentDayBox.dataset.value = p.value;
        updateBoxAppearance(currentDayBox);
        saveState();
      });
      colorOverlay.appendChild(b);
    });

    // attach overlays below editors
    emojiEditor.after(emojiOverlay);
    colorEditor.after(colorOverlay);
    // style overlays so selection border looks gold on hover/active via CSS (we rely on CSS class quick-palette)
    // Make them visible after generation only
    emojiOverlay.classList.add('hidden');
    colorOverlay.classList.add('hidden');
  }

  /* ---------- Toggle palette overlays visibility (frozen palette available to apply) ---------- */
  function setPaletteOverlaysVisible(visible) {
    const e = document.getElementById('emojiPaletteOverlay');
    const c = document.getElementById('colorPaletteOverlay');
    if (e) e.classList.toggle('hidden', !visible);
    if (c) c.classList.toggle('hidden', !visible);
  }

  /* ---------- On form submit: generate or reset ---------- */
  configForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (!gridGenerated) {
      // freeze palettes: disable inputs so they can't be edited after generation
      EMOJIS = emojiInputs.map(i=>i.value);
      COLORS = colorPickers.map(p=>p.value);
      // disable palette inputs to prevent editing after generation
      emojiInputs.forEach(i => i.disabled = true);
      colorPickers.forEach(p => p.disabled = true);
      // generate grid
      generateGrid({
        startDate: startDateEl.value || null,
        emojis: EMOJIS,
        colors: COLORS
      });
      // create overlays and show them (palettes are now fixed and clickable)
      createPaletteOverlays();
      setPaletteOverlaysVisible(true);
      // change button behavior to reset
      generateBtn.textContent = 'Réinitialiser';
      // Save full state
      saveState();
    } else {
      // reset flow: confirm
      if (!confirm("Es-tu sûr de vouloir réinitialiser ta Vision 21 Jours ?")) return;
      // clear everything
      dayBoxes = [];
      daysContainer.innerHTML = '';
      gridGenerated = false;
      currentDayBox = null;
      generateBtn.textContent = 'Générer les 21 jours';
      captureBtn.classList.add('hidden');
      // enable palette inputs again
      emojiInputs.forEach(i => { i.disabled = false; });
      colorPickers.forEach(p => { p.disabled = false; });
      // remove overlays
      const emoO = document.getElementById('emojiPaletteOverlay');
      if (emoO) emoO.remove();
      const colO = document.getElementById('colorPaletteOverlay');
      if (colO) colO.remove();
      clearState();
      showEditorsForMode();
    }
  });

  /* ---------- Capture grid as PNG ---------- */
  captureBtn.addEventListener('click', async () => {
    if (!gridGenerated) return alert("Génère la grille d'abord.");
    try {
      // temporarily remove selection highlight for clean capture
      dayBoxes.forEach(b => b.classList.remove('selected'));
      // capture only the grid element
      const canvas = await html2canvas(daysContainer, { backgroundColor: null, useCORS: true, scale: 2 });
      const link = document.createElement('a');
      link.download = 'vision-21-jours.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      // reapply nothing selected
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la capture. Réessaie.");
    }
  });

  /* ---------- Load previous state on init (if present) ---------- */
  (function initFromStorage(){
    const st = loadState();
    if (!st) return;
    // restore palettes
    if (st.emojis && st.emojis.length) {
      emojiInputs.forEach((i, idx) => { if (st.emojis[idx]) i.value = st.emojis[idx]; });
    }
    if (st.colors && st.colors.length) {
      colorPickers.forEach((p, idx) => { if (st.colors[idx]) p.value = st.colors[idx]; });
    }
    // restore selected mode
    if (st.mode) {
      const r = document.querySelector(`input[name="mode"][value="${st.mode}"]`);
      if (r) r.checked = true;
    }
    showEditorsForMode();
    // if there was a saved grid, regenerate it
    if (st.days && st.days.length) {
      // disable palette editing (palettes were already set earlier)
      emojiInputs.forEach(i=>i.disabled=true);
      colorPickers.forEach(p=>p.disabled=true);
      generateGrid(st);
      createPaletteOverlays();
      setPaletteOverlaysVisible(true);
      generateBtn.textContent = 'Réinitialiser';
    }
  })();

})();