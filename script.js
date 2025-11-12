const emojiPalette = ['😀','😅','😍','😢','😡'];
const colorPalette = ['#1d1d1b','#e6007e','#ffde00','#00a19a','#36a9e1'];

let selectedMode = null;
let selectedEmoji = null;
let selectedColor = null;
let gridGenerated = false;

const modeRadios = document.querySelectorAll('input[name="mode"]');
const emojiContainer = document.querySelector('#emoji-palette .items');
const colorContainer = document.querySelector('#color-palette .items');
const generateBtn = document.getElementById('generate-btn');
const downloadBtn = document.getElementById('download-btn');
const grid = document.getElementById('grid');
const instruction = document.getElementById('instruction');
const startDateInput = document.getElementById('start-date');

function createPalette(container, items, type) {
  container.innerHTML = '';
  items.forEach(item => {
    const div = document.createElement('div');
    div.classList.add('item');
    div.innerHTML = type === 'emoji' ? item : '';
    if(type === 'color') div.style.backgroundColor = item;
    div.addEventListener('click', () => {
      container.querySelectorAll('.item').forEach(i => i.classList.remove('selected'));
      div.classList.add('selected');
      if(type === 'emoji') selectedEmoji = item;
      else selectedColor = item;
    });
    container.appendChild(div);
  });
}

modeRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    selectedMode = radio.value;
    document.getElementById('emoji-palette').classList.add('hidden');
    document.getElementById('color-palette').classList.add('hidden');
    if(selectedMode === 'emoji') {
      document.getElementById('emoji-palette').classList.remove('hidden');
      createPalette(emojiContainer, emojiPalette, 'emoji');
    } else if(selectedMode === 'color') {
      document.getElementById('color-palette').classList.remove('hidden');
      createPalette(colorContainer, colorPalette, 'color');
    } else if(selectedMode === 'both') {
      document.getElementById('emoji-palette').classList.remove('hidden');
      document.getElementById('color-palette').classList.remove('hidden');
      createPalette(emojiContainer, emojiPalette, 'emoji');
      createPalette(colorContainer, colorPalette, 'color');
    }
  });
});

function generateGrid() {
  grid.innerHTML = '';
  const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
  for(let i=0;i<21;i++){
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.dataset.index = i;
    if(startDate){
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      cell.textContent = date.toLocaleDateString('fr-FR');
    } else {
      cell.textContent = `Jour ${i+1}`;
    }
    cell.addEventListener('click', () => {
      if(!gridGenerated) return;
      if(selectedMode === 'emoji' || selectedMode === 'both') {
        cell.textContent = selectedEmoji || '';
        cell.classList.add('emoji');
      }
      if(selectedMode === 'color' || selectedMode === 'both') {
        cell.style.backgroundColor = selectedColor || '#1d1d1b';
      }
    });
    grid.appendChild(cell);
  }
  gridGenerated = true;
  instruction.classList.remove('hidden');
}

generateBtn.addEventListener('click', () => {
  generateGrid();
});

downloadBtn.addEventListener('click', () => {
  html2canvas(grid).then(canvas => {
    const link = document.createElement('a');
    link.download = 'vision21jours.png';
    link.href = canvas.toDataURL();
    link.click();
  });
});