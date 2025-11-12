const emojis = ['😀','😅','😎','😍','😴'];
const colors = ['#1d1d1b','#e6007e','#ffde00','#00a19a','#36a9e1'];
let selectedEmojis = [];
let selectedColors = [];
let gridData = [];
let choice = null;

const paletteContainer = document.getElementById('paletteContainer');
const startDateInput = document.getElementById('startDate');
const gridContainer = document.getElementById('gridContainer');
const instructionsText = document.getElementById('instructionsText');

// Boutons radio
document.querySelectorAll('input[name="choice"]').forEach(radio => {
  radio.addEventListener('change', (e)=>{
    choice = e.target.value;
    renderPalette();
  });
});

function renderPalette(){
  paletteContainer.innerHTML = '';
  if(choice==='emoji' || choice==='both'){
    emojis.forEach(e=>{
      const div = document.createElement('div');
      div.className='emoji-square';
      div.textContent=e;
      div.addEventListener('click', ()=> selectItem(div, e, 'emoji'));
      paletteContainer.appendChild(div);
    });
  }
  if(choice==='color' || choice==='both'){
    colors.forEach(c=>{
      const div = document.createElement('div');
      div.className='color-square';
      div.style.backgroundColor = c;
      div.addEventListener('click', ()=> selectItem(div, c, 'color'));
      paletteContainer.appendChild(div);
    });
  }
}

function selectItem(div, value, type){
  if(type==='emoji'){
    selectedEmojis = [value];
  }else{
    selectedColors = [value];
  }
  document.querySelectorAll('.emoji-square, .color-square').forEach(d=>d.classList.remove('selected'));
  div.classList.add('selected');
}

// Générer la grille
document.getElementById('generateBtn').addEventListener('click', ()=>{
  gridContainer.innerHTML='';
  gridData = [];
  const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
  for(let i=0;i<21;i++){
    const div = document.createElement('div');
    div.className='grid-square';
    let dateText = startDate ? new Date(startDate.getTime()+i*24*60*60*1000).toLocaleDateString('fr-FR') : `Jour ${i+1}`;
    div.textContent = dateText;
    div.addEventListener('click', ()=>{
      if(selectedEmojis.length>0) {
        div.textContent = selectedEmojis[0];
        div.classList.add('emoji');
      }
      if(selectedColors.length>0) {
        div.style.backgroundColor = selectedColors[0];
      }
    });
    gridContainer.appendChild(div);
  }
  instructionsText.textContent = 'Clique sur un jour pour le sélectionner, puis clique sur une couleur et/ou un emoji pour le faire apparaître.';
});

// Réinitialiser
document.getElementById('resetBtn').addEventListener('click', ()=>{
  if(confirm('Es-tu sûr de vouloir réinitialiser ?')){
    location.reload();
  }
});

// Télécharger (capture simple)
document.getElementById('downloadBtn').addEventListener('click', ()=>{
  html2canvas(gridContainer).then(canvas=>{
    const link = document.createElement('a');
    link.download = 'vision21jours.png';
    link.href = canvas.toDataURL();
    link.click();
  });
});