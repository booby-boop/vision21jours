const startDateInput = document.getElementById('startDate');
const paletteContainer = document.getElementById('paletteContainer');
const generateBtn = document.getElementById('generateBtn');
const gridContainer = document.getElementById('gridContainer');
const downloadBtn = document.getElementById('downloadBtn');
const instructionText = document.getElementById('instructionText');

let selectedType = null;
let paletteItems = [];
let selectedPaletteItem = null;
let gridGenerated = false;

const emojiList = ['😊','🎉','❤️','💡','🔥','✨','🌸','🌞','🌙','⭐'];
const colorList = ['#1d1d1b','#e6007e','#ffde00','#00a19a','#36a9e1'];

function createPalette(type) {
  paletteContainer.innerHTML = '';
  paletteItems = [];
  const list = type === 'emoji' ? emojiList : type === 'color' ? colorList : [...emojiList, ...colorList];
  
  list.forEach(item => {
    const div = document.createElement('div');
    div.className = 'palette-item';
    if(type === 'color' || (type === 'both' && colorList.includes(item))) {
      div.style.backgroundColor = item;
    } else {
      div.textContent = item;
    }
    div.addEventListener('click', () => {
      paletteItems.forEach(p => p.classList.remove('selected'));
      div.classList.add('selected');
      selectedPaletteItem = item;
    });
    paletteContainer.appendChild(div);
    paletteItems.push(div);
  });
}

document.querySelectorAll('input[name="typeSelect"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    selectedType = e.target.value;
    createPalette(selectedType);
  });
});

function generateGrid() {
  if(gridGenerated) return;
  let startDate = startDateInput.value ? new Date(startDateInput.value) : null;
  gridContainer.innerHTML = '';
  const today = new Date();
  
  for(let i=0;i<21;i++){
    const cell = document.createElement('div');
    cell.className = 'grid-cell';
    let displayText;
    if(startDate){
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      displayText = `${date.getDate()}/${date.getMonth()+1}`;
    } else {
      displayText = `Jour ${i+1}`;
    }
    cell.textContent = displayText;
    cell.style.fontSize = '0.8rem';
    
    cell.addEventListener('click', () => {
      if(selectedPaletteItem){
        if(typeof selectedPaletteItem === 'string' && selectedPaletteItem.startsWith('#')){
          cell.style.backgroundColor = selectedPaletteItem;
          cell.textContent = '';
        } else {
          cell.textContent = selectedPaletteItem;
          cell.style.fontSize = '24px';
        }
      }
    });
    
    gridContainer.appendChild(cell);
  }

  gridGenerated = true;
  instructionText.textContent = 'Clique sur un jour pour le sélectionner, puis clique sur une couleur et ou un emoji pour le faire apparaître.';
}

generateBtn.addEventListener('click', () => {
  if(!gridGenerated) {
    generateGrid();
    generateBtn.textContent = 'Réinitialiser';
  } else {
    if(confirm('Es-tu sûr de vouloir réinitialiser ?')){
      gridContainer.innerHTML = '';
      paletteContainer.innerHTML = '';
      instructionText.textContent = '';
      generateBtn.textContent = 'Générer les 21 jours';
      startDateInput.value = '';
      selectedPaletteItem = null;
      selectedType = null;
      gridGenerated = false;
      document.querySelectorAll('input[name="typeSelect"]').forEach(r => r.checked = false);
    }
  }
});

downloadBtn.addEventListener('click', () => {
  html2canvas(gridContainer).then(canvas => {
    const link = document.createElement('a');
    link.download = 'Vision21Jours.png';
    link.href = canvas.toDataURL();
    link.click();
  });
});