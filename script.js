document.addEventListener('DOMContentLoaded', () => {
  const DAYS = 21;
  const startDateEl = document.getElementById('startDate');
  const configForm = document.getElementById('configForm');
  const daysContainer = document.getElementById('daysContainer');
  const generateBtn = document.getElementById('generateBtn');
  const captureBtn = document.getElementById('captureBtn');
  const instructionP = document.querySelector('.instruction');

  const radioEls = Array.from(document.querySelectorAll('input[name="mode"]'));
  let emojiEditor = document.getElementById('emojiEditor');
  let colorEditor = document.getElementById('colorEditor');

  // initial node lists (on load)
  let emojiInputs = Array.from(document.querySelectorAll('.emoji-input'));
  let colorPickers = Array.from(document.querySelectorAll('.color-picker'));

  let dayBoxes = [];
  let currentDay = null;
  let gridGenerated = false;

  // --- flatpickr ---
  if (typeof flatpickr === 'function') {
    flatpickr(startDateEl, {
      dateFormat: "d/m/Y",
      allowInput: true,
      defaultDate: null,
      onClose: fp => fp.close(),
      onChange: fp => fp.close(),
      onReady: (selectedDates, dateStr, fp) => {
        if (fp && fp.calendarContainer) {
          fp.calendarContainer.style.fontFamily = "Montserrat, sans-serif";
          fp.calendarContainer.style.borderRadius = "12px";
          fp.calendarContainer.style.border = "2px solid #c19751";
          fp.calendarContainer.style.background = "#fff";
          fp.calendarContainer.querySelectorAll('.flatpickr-day').forEach(d => d.style.color = '#00008B');
        }
      }
    });
  }

  // --- helpers pour garder les nodeLists à jour ---
  function refreshPaletteReferences() {
    emojiInputs = Array.from(document.querySelectorAll('.emoji-input'));
    colorPickers = Array.from(document.querySelectorAll('.color-picker'));
  }

  // --- Affichage éditeurs ---
  function showEditors() {
    const mode = document.querySelector('input[name="mode"]:checked')?.value || '';
    // si l'éditeur original a été remplacé par un overlay, on laisse le comportement existant
    if (emojiEditor) emojiEditor.classList.toggle('hidden', !(mode === 'emoji' || mode === 'both'));
    if (colorEditor) colorEditor.classList.toggle('hidden', !(mode === 'color' || mode === 'both'));
  }
  radioEls.forEach(r => r.addEventListener('change', showEditors));
  showEditors();

  // --- Mise à jour apparence d'une box ---
  function updateBoxAppearance(box) {
    const contentEl = box.querySelector('.mainContent');
    const emoji = box.dataset.emoji || '';
    const color = box.dataset.color || '';

    if (contentEl) {
      contentEl.textContent = emoji;
      const isEmoji = emoji.length > 0;
      contentEl.style.fontSize = isEmoji ? '34px' : '14px';
      contentEl.style.lineHeight = isEmoji ? '1' : '1.1';
      contentEl.style.display = 'block';
      contentEl.style.textAlign = 'center';
      contentEl.style.width = '100%';
    }

    // appliquer la couleur (ou blanc par défaut)
    box.style.background = color || 'white';

    if (color && color.toLowerCase() !== 'white' && color !== '#ffffff') {
      box.classList.add('colored');
      box.style.color = '#fff';
    } else {
      box.classList.remove('colored');
      box.style.color = '#1d1d1d';
    }
  }

  function isPaletteFilled() {
    refreshPaletteReferences();
    return emojiInputs.some(i => i.value.trim() !== '') || colorPickers.some(c => c.value.trim() !== '');
  }

  // --- Création grille ---
  function createGrid(savedData = null) {
    if (!isPaletteFilled() && !savedData) return alert("Tu dois choisir au moins un emoji ou une couleur avant de générer la grille !");

    // reset
    daysContainer.innerHTML = '';
    dayBoxes = [];
    currentDay = null;

    // --- restaurer date ---
    let startDate = null;
    if (savedData?.startDate) {
      startDate = parseDate(savedData.startDate);
      if (startDate) startDateEl.value = formatDateForInput(startDate);
    } else if (startDateEl.value) {
      startDate = parseDate(startDateEl.value);
    }

    // if saved palettes exist, restore them into editors BEFORE creating overlays
    if (savedData) {
      // Ensure we still have original editors in DOM before setting values
      // (some code paths may have replaced them)
      // If editors were replaced, try to re-insert original DOM from current page (we assume initial HTML present)
      // For robustness, just write values to any matching inputs on page.
      const savedEmojis = savedData.emojiInputs || [];
      const savedColors = savedData.colorPickers || [];
      refreshPaletteReferences();
      emojiInputs.forEach((inp, idx) => { inp.value = savedEmojis[idx] ?? inp.value; });
      colorPickers.forEach((p, idx) => { p.value = savedColors[idx] ?? p.value; });

      // re-refresh refs in case DOM changed
      refreshPaletteReferences();
    }

    for (let i = 0; i < DAYS; i++) {
      const box = document.createElement('div');
      box.className = 'dayBox';

      const contentEl = document.createElement('div');
      contentEl.className = 'mainContent';
      box.appendChild(contentEl);

      const dateEl = document.createElement('div');
      dateEl.className = 'dateLabel';
      box.appendChild(dateEl);

      if (startDate) {
        const d = new Date(startDate.getTime() + i * 24 * 3600 * 1000);
        const label = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        dateEl.textContent = label;
        box.dataset.label = label;
        box.dataset.date = d.toISOString();
      } else {
        const label = `Jour ${i + 1}`;
        dateEl.textContent = label;
        box.dataset.label = label;
      }

      // restaurer données sauvegardées
      if (savedData?.days?.[i]) {
        const dayData = savedData.days[i];
        box.dataset.emoji = dayData.emoji || '';
        box.dataset.color = dayData.color || '';
        // update immédiatement pour que l'apparence prenne en compte couleur+emoji
        updateBoxAppearance(box);
      }

      box.addEventListener('click', () => {
        if (!isPaletteFilled()) return alert("Choisis au moins un emoji ou une couleur avant de sélectionner un jour !");
        dayBoxes.forEach(b => b.classList.remove('selected'));
        box.classList.add('selected');
        currentDay = box;
      });

      daysContainer.appendChild(box);
      dayBoxes.push(box);
      updateBoxAppearance(box);
    }

    gridGenerated = true;
    captureBtn.classList.remove('hidden');
    instructionP.classList.remove('hidden');

    // --- désactiver radios après génération ---
    radioEls.forEach(r => r.disabled = true);

    removeOverlays();

    // --- restaurer palettes personnalisées & rebuild overlays from current inputs ---
    refreshPaletteReferences();

    const mode = savedData?.mode || document.querySelector('input[name="mode"]:checked')?.value || '';
    if (mode === 'emoji' || mode === 'both') overlayEmoji();
    if (mode === 'color' || mode === 'both') overlayColor();

    // attacher listeners (emojis editors + color editors)
    attachInputListeners();
    attachPaletteEditListeners(); // pour sauvegarder quand on modifie une palette

    generateBtn.textContent = 'Réinitialiser';

    saveToLocalStorage(mode);
  }

  // --- Overlay emojis ---
  function overlayEmoji() {
    // create overlay with responsive sizing and centered content
    const overlay = document.createElement('div');
    overlay.id = 'emojiPaletteOverlay';
    overlay.className = 'editor-row';

    refreshPaletteReferences();
    emojiInputs.forEach(inp => {
      if (!inp.value) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'emoji-btn quick-palette';
      // responsive sizing: based on viewport width, but capped
      const base = Math.max(34, Math.min(48, Math.floor(window.innerWidth * 0.08)));
      btn.style.width = '68px';
      btn.style.height = '68px';
      btn.style.minWidth = '48px';
      btn.style.borderRadius = '12px';
      btn.style.border = '4px solid transparent';
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.style.fontSize = `${base}px`;
      btn.style.lineHeight = '1';
      btn.textContent = inp.value;
      btn.addEventListener('click', () => {
        if (!currentDay) return alert('Clique d\'abord sur un jour.');
        currentDay.dataset.emoji = btn.textContent;
        updateBoxAppearance(currentDay);
        saveToLocalStorage(document.querySelector('input[name="mode"]:checked')?.value || 'both');
      });
      overlay.appendChild(btn);
    });

    // if original emojiEditor exists in DOM, replace it, else append near top of form
    if (emojiEditor && emojiEditor.parentNode) {
      emojiEditor.replaceWith(overlay);
    } else {
      // fallback: try to insert after configForm actions
      const actions = configForm.querySelector('.actions');
      if (actions) actions.insertAdjacentElement('afterend', overlay);
    }
    emojiEditor = document.getElementById('emojiPaletteOverlay');
  }

  // --- Overlay couleurs ---
  function overlayColor() {
    const overlay = document.createElement('div');
    overlay.id = 'colorPaletteOverlay';
    overlay.className = 'editor-row';

    refreshPaletteReferences();
    colorPickers.forEach(p => {
      if (!p.value) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'color-btn quick-palette';
      btn.style.width = '68px';
      btn.style.height = '68px';
      btn.style.minWidth = '48px';
      btn.style.borderRadius = '12px';
      btn.style.border = '4px solid transparent';
      btn.style.background = p.value;
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.addEventListener('click', () => {
        if (!currentDay) return alert('Clique d\'abord sur un jour.');
        currentDay.dataset.color = p.value;
        updateBoxAppearance(currentDay);
        saveToLocalStorage(document.querySelector('input[name="mode"]:checked')?.value || 'both');
      });
      overlay.appendChild(btn);
    });

    if (colorEditor && colorEditor.parentNode) {
      colorEditor.replaceWith(overlay);
    } else {
      const actions = configForm.querySelector('.actions');
      if (actions) actions.insertAdjacentElement('afterend', overlay);
    }
    colorEditor = document.getElementById('colorPaletteOverlay');
  }

  function removeOverlays() {
    const oldEmojiOverlay = document.getElementById('emojiPaletteOverlay');
    if (oldEmojiOverlay) oldEmojiOverlay.remove();
    const oldColorOverlay = document.getElementById('colorPaletteOverlay');
    if (oldColorOverlay) oldColorOverlay.remove();
    // try to reset references back to originals if they exist in DOM
    emojiEditor = document.getElementById('emojiEditor') || emojiEditor;
    colorEditor = document.getElementById('colorEditor') || colorEditor;
    refreshPaletteReferences();
  }

  // --- Capture ---
  async function captureGrid() {
    if (!gridGenerated) return alert('Génère la grille d\'abord.');
    try {
      dayBoxes.forEach(b => b.classList.remove('selected'));
      const canvas = await html2canvas(daysContainer, { backgroundColor: null, useCORS: true, scale: 2 });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = 'vision-21-jours.png';
      link.click();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la capture. Réessaie.');
    }
  }

  // --- Réinitialisation ---
  function resetApp() {
    localStorage.removeItem('vision21Data');
    location.reload();
  }

  configForm.addEventListener('submit', ev => {
    ev.preventDefault();
    if (!gridGenerated) {
      createGrid();
    } else {
      if (!confirm("Es-tu sûr de vouloir réinitialiser ?")) return;
      resetApp();
    }
  });

  // --- Inputs directs sur la grille (emoji inputs & color pickers) ---
  function attachInputListeners() {
    // refresh references before attaching
    refreshPaletteReferences();

    // remove previous listeners by cloning nodes (cheap way) to avoid duplicates
    emojiInputs = emojiInputs.map(inp => {
      const clone = inp.cloneNode(true);
      inp.parentNode.replaceChild(clone, inp);
      return clone;
    });

    colorPickers = colorPickers.map(p => {
      const clone = p.cloneNode(true);
      p.parentNode.replaceChild(clone, p);
      return clone;
    });

    // attach event listeners that set the currently selected day content/color
    emojiInputs.forEach(inp => {
      inp.addEventListener('input', ev => {
        if (!currentDay) return;
        currentDay.dataset.emoji = ev.target.value || '';
        updateBoxAppearance(currentDay);
        saveToLocalStorage(document.querySelector('input[name="mode"]:checked')?.value || 'both');
      });
    });

    colorPickers.forEach(p => {
      p.addEventListener('input', ev => {
        if (!currentDay) return;
        currentDay.dataset.color = ev.target.value || '';
        updateBoxAppearance(currentDay);
        saveToLocalStorage(document.querySelector('input[name="mode"]:checked')?.value || 'both');
      });
    });
  }

  // --- Sauvegarder quand on modifie la palette elle-même (éditeur) ---
  function attachPaletteEditListeners() {
    refreshPaletteReferences();
    // palette edits: save emoji editor inputs and color pickers values to localStorage
    emojiInputs.forEach(i => {
      // ensure we don't double attach
      i.removeEventListener('change', onPaletteEdit);
      i.addEventListener('change', onPaletteEdit);
      i.removeEventListener('input', onPaletteEdit);
      i.addEventListener('input', onPaletteEdit);
    });
    colorPickers.forEach(c => {
      c.removeEventListener('change', onPaletteEdit);
      c.addEventListener('change', onPaletteEdit);
      c.removeEventListener('input', onPaletteEdit);
      c.addEventListener('input', onPaletteEdit);
    });
    function onPaletteEdit() {
      // simply persist palettes + current days
      saveToLocalStorage(document.querySelector('input[name="mode"]:checked')?.value || 'both');
    }
  }

  // --- LocalStorage ---
  function saveToLocalStorage(mode = null) {
    refreshPaletteReferences();
    const data = {
      startDate: startDateEl.value || null,
      days: dayBoxes.map(b => ({ emoji: b.dataset.emoji || '', color: b.dataset.color || '' })),
      emojiInputs: emojiInputs.map(i => i.value),
      colorPickers: colorPickers.map(c => c.value),
      mode: mode || document.querySelector('input[name="mode"]:checked')?.value || 'both'
    };
    localStorage.setItem('vision21Data', JSON.stringify(data));
  }

  function loadFromLocalStorage() {
    const data = localStorage.getItem('vision21Data');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        createGrid(parsed);
      } catch (e) {
        console.error('Erreur parse localStorage', e);
      }
    }
  }

  // --- Utils ---
  function formatDateForInput(date) {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function parseDate(input) {
    if (!input) return null;
    // try ISO parse first
    let d = new Date(input);
    if (!isNaN(d.getTime())) return d;
    // try dd/mm/yyyy
    const parts = input.split('/');
    if (parts.length === 3) {
      d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  }

  // initial load
  loadFromLocalStorage();

  // ensure palettes editors listen to changes even before grid generation
  attachPaletteEditListeners();
});