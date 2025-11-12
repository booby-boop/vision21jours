const DAYS = 21;
const daysDiv = document.getElementById('days');
const emojiMenu = document.getElementById('emojiMenu');
const setupForm = document.getElementById('setupForm');
const dateError = document.getElementById('dateError');
let currentDayBox = null;

// Validation du formulaire
setupForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const startDate = document.getElementById('startDate').value;

  if (!startDate) {
    dateError.textContent = "Merci de sélectionner une date avant de commencer ✨";
    return;
  }

  setupForm.classList.add('hidden');
  daysDiv.classList.remove('hidden');
  createDays();
});

// Création des 21 jours
function createDays() {
  for (let i = 1; i <= DAYS; i++) {
    const box = document.createElement('div');
    box.className = 'dayBox';
    box.textContent = `Jour ${i}`;
    box.addEventListener('click', () => {
      currentDayBox = box;
      emojiMenu.classList.remove('hidden');
    });
    daysDiv.appendChild(box);
  }
}

// Sélection d’un émoji
document.querySelectorAll('.emoji-grid button').forEach(btn => {
  btn.addEventListener('click', () => {
    if (currentDayBox) currentDayBox.textContent = btn.textContent;
    emojiMenu.classList.add('hidden');
  });
});

// Sélection d’une couleur
document.querySelectorAll('.color-grid button').forEach(btn => {
  btn.addEventListener('click', () => {
    if (currentDayBox) {
      currentDayBox.style.background = btn.style.background;
      currentDayBox.textContent = '';
    }
    emojiMenu.classList.add('hidden');
  });
});
