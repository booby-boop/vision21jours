document.addEventListener('DOMContentLoaded', () => {
  const DAYS = 21;
  const startDateEl = document.getElementById('startDate');
  const configForm = document.getElementById('configForm');
  const emojiEditor = document.getElementById('emojiEditor');
  const colorEditor = document.getElementById('colorEditor');
  const daysContainer = document.getElementById('daysContainer');
  const generateBtn = document.getElementById('generateBtn');
  const captureBtn = document.getElementById('captureBtn');
  const instructionText = document.getElementById('instructionText');

  const radioEls = Array.from(document.querySelectorAll('input[name="mode"]'));
  const emojiInputs = Array.from(document.querySelectorAll('.emoji-input'));
  const colorPickers = Array.from(document.querySelectorAll('.color-picker'));

  let dayBoxes = [];
  let currentDay = null;
  let gridGenerated = false;

  // flatpickr init
  if (typeof flatpickr === 'function') {
    flatpickr(startDateEl, { dateFormat: "d/m/Y", allowInput: true, defaultDate: null });
  }

  function showEditors() {
    const mode = document.querySelector('input[name="mode"]:checked')?.value;
    emojiEditor.classList.toggle('hidden', !(mode==='emoji'||mode==='both'));
    colorEditor.classList.toggle('hidden', !(mode==='color'||mode==='both'));
  }

  radioEls.forEach(r => r.addEventListener('change', showEditors));
  showEditors();

  function updateBoxAppearance(box) {
    const txt = (box.textContent || '').trim();
    const isEmoji = /\p{Emoji}/u.test(txt) || (txt.length <= 2 && /[^\w\d\s]/u.test(txt));
    box.style.fontSize = isEmoji ? '34px' : '18px';
    box.style.lineHeight = isEmoji ? '1' : '1.1';
    if (box.style.background && box.style.background !== 'white' && box.style.background !== '#ffffff') {
      box.classList.add('colored'); box.style.color = '#fff';
    } else { box.classList.remove('colored'); box.style.color = '#1d1d1d'; }
  }

  function createGrid() {
    daysContainer.innerHTML = '';
    dayBoxes = [];
    instructionText.classList.remove('hidden');
    let startDate = null;
    if (startDateEl.value) {
      const parts = startDateEl.value.split('/');
      startDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      if (isNaN(startDate)) startDate = null;
    }

    for (let i=0;i<DAYS;i++){
      const box = document.createElement('div'); box.className='dayBox';
      if (startDate){
        const d = new Date(startDate.getTime() + i*24*3600*1000);
        const label = d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'});
        box.textContent=label;
        box.dataset.label=label;
        box.dataset.date=d.toISOString();
      } else { box.textContent=`Jour ${i+1}`; box.dataset.label=`Jour ${i+1}`; }

      box.addEventListener('click',()=>{ dayBoxes.forEach(b=>b.classList.remove('selected')); box.classList.add('selected'); currentDay=box; });
      daysContainer.appendChild(box); dayBoxes.push(box); updateBoxAppearance(box);
    }

    gridGenerated=true; captureBtn.classList.remove('hidden');
    emojiInputs.forEach(i=>i.disabled=true); colorPickers.forEach(p=>p.disabled=true);
    createPaletteOverlays();
  }

  function createPaletteOverlays(){
    const existingEmojiOverlay=document.getElementById('emojiPaletteOverlay');
    if(existingEmojiOverlay) existingEmojiOverlay.remove();
    const existingColorOverlay=document.getElementById('colorPaletteOverlay');
    if(existingColorOverlay) existingColorOverlay.remove();

    const emojiOverlay=document.createElement('div'); emojiOverlay.id='emojiPaletteOverlay'; emojiOverlay.className='editor-row';
    emojiInputs.forEach(inp=>{
      const b=document.createElement('button'); b.type='button'; b.className='emoji-btn quick-palette';
      b.style.width='68px'; b.style.height='68px'; b.style.borderRadius='12px'; b.style.border='4px solid transparent';
      b.style.fontSize='34px'; b.textContent=inp.value;
      b.addEventListener('click',()=>{
        if(!currentDay){ alert('Clique d\'abord sur un jour.'); return; }
        currentDay.textContent=b.textContent || currentDay.dataset.label; currentDay.dataset.type='emoji'; currentDay.dataset.value=b.textContent;
        updateBoxAppearance(currentDay);
      });
      emojiOverlay.appendChild(b);
    });

    const colorOverlay=document.createElement('div'); colorOverlay.id='colorPaletteOverlay'; colorOverlay.className='editor-row';
    colorPickers.forEach(p=>{
      const b=document.createElement('button'); b.type='button'; b.className='color-btn quick-palette';
      b.style.width='68px'; b.style.height='68px'; b.style.borderRadius='12px'; b.style.border='4px solid transparent';
      b.style.background=p.value;
      b.addEventListener('click',()=>{
        if(!currentDay){ alert('Clique d\'abord sur un jour.'); return; }
        currentDay.style.background=p.value; currentDay.dataset.type='color'; currentDay.dataset.value=p.value;
        updateBoxAppearance(currentDay);
      });
      colorOverlay.appendChild(b);
    });

    emojiEditor.after(emojiOverlay); colorEditor.after(colorOverlay);
    emojiOverlay.classList.remove('hidden'); colorOverlay.classList.remove('hidden');
  }

  async function captureGrid(){
    if(!gridGenerated) return alert('Génère la grille d\'abord.');
    dayBoxes.forEach(b=>b.classList.remove('selected'));
    const canvas = await html2canvas(daysContainer,{ backgroundColor:null,useCORS:true, scale:2 });
    const link=document.createElement('a'); link.href=canvas.toDataURL('image/png'); link.download='vision-21-jours.png'; link.click();
  }

  configForm.addEventListener('submit',ev=>{
    ev.preventDefault();
    if(!gridGenerated){ createGrid(); generateBtn.textContent='Réinitialiser'; }
    else{
      if(!confirm("Es-tu sûr de vouloir réinitialiser ?")) return;
      daysContainer.innerHTML=''; dayBoxes=[]; gridGenerated=false; currentDay=null; generateBtn.textContent='Générer les 21 jours'; captureBtn.classList.add('hidden');
      const eo=document.getElementById('emojiPaletteOverlay'); if(eo) eo.remove();
      const co=document.getElementById('colorPaletteOverlay'); if(co) co.remove();
      emojiInputs.forEach(i=>i.disabled=false); colorPickers.forEach(p=>p.disabled=false);
      instructionText.classList.add('hidden'); showEditors();
    }
  });

  // enforce single emoji character
  emojiInputs.forEach(inp=>{
    inp.addEventListener('input',()=>{
      if(inp.value.length>2) inp.value=Array.from(inp.value)[0];
      if(currentDay && !gridGenerated){ currentDay.textContent=inp.value || currentDay.dataset.label; updateBoxAppearance(currentDay); }
    });
  });

  colorPickers.forEach(p=>{
    p.addEventListener('input',()=>{
      if(currentDay && !gridGenerated){ currentDay.style.background=p.value; updateBoxAppearance(currentDay); }
    });
  });

  captureBtn.addEventListener('click',captureGrid);
});