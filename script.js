const DAYS = 21;
const emojiButtons = document.querySelectorAll('.emoji-btn');
const colorPickers = document.querySelectorAll('.color-picker');
const daysDiv = document.getElementById('days');
const emojiMenu = document.getElementById('emojiMenu');
const colorMenu = document.getElementById('colorMenu');
const generateBtn = document.getElementById('generateBtn');
const startDateInput = document.getElementById('startDate');
let currentDayBox = null;
let gridGenerated = false;

// Flatpickr init
flatpickr("#startDate", {
  dateFormat: "d/m/Y",
  allowInput: true,
  onOpen: function(selectedDates, dateStr, instance) {
      instance.calendarContainer.style.fontFamily = "Montserrat, sans-serif";
      instance.calendarContainer.style.borderRadius = "12px";
      instance.calendarContainer.style.border = "2px solid #c19751";
  }
});

// Affichage selon type choisi
document.querySelectorAll('input[name="type"]').forEach(input => {
  input.addEventListener('change', () => {
    if (input.value === 'emoji') {
      emojiMenu.classList.remove('hidden');
      colorMenu.classList.add('hidden');
    } else if (input.value === 'color') {
      colorMenu.classList.remove('hidden');
      emojiMenu.classList.add('hidden');
    } else {
      emojiMenu.classList.remove('hidden');
      colorMenu.classList.remove('hidden');
    }
  });
});

// Générer grille
generateBtn.addEventListener('click', () => {
  if (!gridGenerated) {
    daysDiv.innerHTML = '';
    let startDate = startDateInput.value ? new Date(startDateInput.value.split('/').reverse().join('-')) : null;
    for (let i = 1; i <= DAYS; i++) {
      const box = document.createElement('div');
      box.className = 'dayBox';
      let dayLabel = startDate ? new Date(startDate.getTime() + (i-1)*24*60*60*1000) : null;
      box.textContent = dayLabel ? dayLabel.toLocaleDateString('fr-FR') : `Jour ${i}`;
      box.addEventListener('click', () => {
        if (currentDayBox) currentDayBox.classList.remove('selected');
        currentDayBox = box;
        box.classList.add('selected');
      });
      daysDiv.appendChild(box);
    }
    generateBtn.textContent = 'Réinitialiser';
    gridGenerated = true;
  } else {
    if (confirm("Es-tu sûr de vouloir réinitialiser ?")) {
      daysDiv.innerHTML = '';
      generateBtn.textContent = 'Générer les 21 jours';
      gridGenerated = false;
      currentDayBox = null;
    }
  }
});

// Sélection emoji
emojiButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    if (currentDayBox) {
      currentDayBox.textContent = btn.textContent;
    }
  });
});

// Sélection couleur
colorPickers.forEach(picker => {
  picker.addEventListener('input', () => {
    if (currentDayBox) {
      currentDayBox.style.backgroundColor = picker.value;
    }
  });
});
