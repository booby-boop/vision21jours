const DAYS = 21;
const daysDiv = document.getElementById('days');
const generateBtn = document.getElementById('generateBtn');
const startDateInput = document.getElementById('startDate');
const colorMenu = document.getElementById('colorMenu');
const emojiMenu = document.getElementById('emojiMenu');
const chooseColors = document.getElementById('chooseColors');
const chooseEmojis = document.getElementById('chooseEmojis');

let currentDayBox = null;
let selectedColor = null;
let selectedEmoji = null;

// Affichage palettes selon choix
chooseColors.addEventListener('change', () => {
  colorMenu.classList.toggle('hidden', !chooseColors.checked);
});

chooseEmojis.addEventListener('change', () => {
  emojiMenu.classList.toggle('hidden', !chooseEmojis.checked);
});

// Sélection couleur
document.querySelectorAll('.color-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedColor = btn.style.backgroundColor;
  });
});

// Sélection emoji
document.querySelectorAll('.emoji-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedEmoji = btn.textContent;
  });
});

// Générer 21 jours
generateBtn.addEventListener('click', () => {
  const startDate = startDateInput.value;
  if (!startDate) {
    alert("Merci de renseigner une date de départ !");
    return;
  }

  daysDiv.innerHTML = '';
  let date = new Date(startDate);

  for (let i = 0; i < DAYS; i++) {
    const box = document.createElement('div');
    box.className = 'dayBox';
    box.textContent = `${date.getDate()}/${date.getMonth()+1}`;
    box.addEventListener('click', () => {
      currentDayBox = box;
      if (chooseColors.checked) colorMenu.classList.remove('hidden');
      if (chooseEmojis.checked) emojiMenu.classList.remove('hidden');
    });
    daysDiv.appendChild(box);
    date.setDate(date.getDate() + 1);
  }
});

// Appliquer couleur
document.querySelectorAll('.color-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (currentDayBox && chooseColors.checked) {
      currentDayBox.style.backgroundColor = btn.style.backgroundColor;
    }
  });
});

// Appliquer emoji
document.querySelectorAll('.emoji-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (currentDayBox && chooseEmojis.checked) {
      currentDayBox.textContent = btn.textContent;
    }
  });
});
