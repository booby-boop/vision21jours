const DAYS = 21;
const daysDiv = document.getElementById('days');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const startDateInput = document.getElementById('startDate');

const useEmojis = document.getElementById('useEmojis');
const useColors = document.getElementById('useColors');
const emojiMenu = document.getElementById('emojiMenu');
const colorMenu = document.getElementById('colorMenu');

let currentDayBox = null;
let dayBoxes = [];

// Emoji et couleurs
const EMOJIS = ["🏆","🌞","❤️","🌩️","⭐"];
const COLORS = ["#1d1d1b","#e6007e","#ffde00","#00a19a","#36a9e1"];

document.querySelectorAll('.emoji-btn').forEach((btn, idx) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    currentDayBox.textContent = EMOJIS[idx];
  });
});

document.querySelectorAll('.color-btn').forEach((btn, idx) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    currentDayBox.style.background = COLORS[idx];
  });
});

// Afficher menus selon sélection
useEmojis.addEventListener('change', () => {
  emojiMenu.classList.toggle('hidden', !useEmojis.checked);
});

useColors.addEventListener('change', () => {
  colorMenu.classList.toggle('hidden', !useColors.checked);
});

// Génération des jours
generateBtn.addEventListener('click', () => {
  daysDiv.innerHTML = '';
  dayBoxes = [];
  let startDate = startDateInput.value ? new Date(startDateInput.value) : null;

  for(let i=0; i<DAYS; i++) {
    const box = document.createElement('div');
    box.className = 'dayBox';

    if(startDate) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      box.textContent = d.toLocaleDateString('fr-FR');
    } else {
      box.textContent = `Jour ${i+1}`;
    }

    box.addEventListener('click', () => {
      currentDayBox = box;
      if(useEmojis.checked) emojiMenu.classList.remove('hidden');
      if(useColors.checked) colorMenu.classList.remove('hidden');
    });

    daysDiv.appendChild(box);
    dayBoxes.push(box);
  }

  generateBtn.textContent = 'Réinitialiser';
  generateBtn.onclick = () => {
    if(confirm("Es-tu sûr de vouloir réinitialiser ?")) {
      location.reload();
    }
  };

  downloadBtn.classList.remove('hidden');
  downloadBtn.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    dayBoxes.forEach((box, idx) => {
      doc.setFillColor(box.style.background || 255,255,255);
      doc.rect(20, 20 + idx*10, 30, 10, 'F');
      doc.text(box.textContent, 55, 25 + idx*10);
    });
    doc.save("vision21.pdf");
  });
});
