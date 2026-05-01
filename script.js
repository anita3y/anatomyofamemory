// ============================================
// ANATOMY OF A MEMORY — script.js
// No conditionals. Pure 16-state lookup.
// Audio: Web Audio API with GainNode for
// per-layer boost + volume control.
// ============================================

// --- STATE ---
const state = {
  atmosphere: false,
  food: false,
  people: false,
  music: false,
};

// --- IMAGE MAP: A F P M → filename ---
const IMAGE_MAP = {
  '0000': 'state_0000.png',
  '1000': 'state_1000.png',
  '0100': 'state_0100.png',
  '0010': 'state_0010.png',
  '0001': 'state_0001.png',
  '1100': 'state_1100.png',
  '1010': 'state_1010.png',
  '1001': 'state_1001.png',
  '0110': 'state_0110.png',
  '0101': 'state_0101.png',
  '0011': 'state_0011.png',
  '1110': 'state_1110.png',
  '1101': 'state_1101.png',
  '1011': 'state_1011.png',
  '0111': 'state_0111.png',
  '1111': 'state_1111.png',
};

// --- AUDIO SETUP via Web Audio API ---
// gainBoost: multiplier beyond 1.0 (e.g. 2.5 = 2.5× louder)
// sliderVolume: 0–1 (user-controlled, remembered between toggles)

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// --- CLICK SOUND (plays on every checkbox toggle) ---
const clickSound = new Audio('./audio-click.wav');
clickSound.volume = 0.6;

function playClick() {
  // Clone so rapid clicks don't cut off
  const clone = clickSound.cloneNode();
  clone.volume = 0.6;
  clone.play().catch(() => {});
}

function buildAudioLayer(elementId, gainBoost = 1.0) {
  const el = document.getElementById(elementId);
  if (!el) return null;

  const source = audioCtx.createMediaElementSource(el);
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = gainBoost; // base boost (fixed)
  source.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  return {
    el,
    gainNode,
    boost: gainBoost,
    sliderVolume: 1.0,  // 0–1, user-adjustable
  };
}

const audioLayers = {
  atmosphere: buildAudioLayer('audio-atmosphere', 1.0),
  food:       buildAudioLayer('audio-food',       4.0),   // boost quiet file
  people:     buildAudioLayer('audio-people',     5.0),   // boost quiet m4a
  music:      buildAudioLayer('audio-music',      1.0),
};

// Apply slider volume to gain (boost × sliderVolume)
function applyVolume(layer) {
  const al = audioLayers[layer];
  if (!al) return;
  al.gainNode.gain.value = al.boost * al.sliderVolume;
}

// Set initial volume on all elements (el.volume = 1 always, gain handles level)
Object.values(audioLayers).forEach(al => {
  if (al && al.el) al.el.volume = 1.0;
});

// Wire volume sliders
document.querySelectorAll('.toggle-row').forEach(row => {
  const layerName = row.dataset.layer;
  if (!layerName || layerName === 'set-table') return;

  const slider = row.querySelector('.vol-slider');
  if (!slider || !audioLayers[layerName]) return;

  const al = audioLayers[layerName];
  slider.value = al.sliderVolume;

  slider.addEventListener('input', () => {
    al.sliderVolume = parseFloat(slider.value);
    applyVolume(layerName);
  });
});

// --- CAPTION SYSTEM ---
const captionEl = document.getElementById('caption');
let captionTimer = null;

function getCaption(lastToggled) {
  const { atmosphere, food, people, music } = state;
  // Priority order: most specific first
  if (atmosphere && food && people && music) return 'now it feels complete.';
  
  // Only show captions when specifically toggled ON
  if (lastToggled === 'music' && music)      return 'it\'s been so long since i\'ve heard that tune.';
  if (lastToggled === 'people' && people)    return 'you\'re not alone anymore.';
  if (lastToggled === 'food' && food && !people) return 'dinner is served. but where are those to share the taste?';
  if (lastToggled === 'atmosphere' && atmosphere) return 'the room comes back.';

  return null;
}

function showCaption(lastToggled) {
  const text = getCaption(lastToggled);

  // Clear any pending fade-out
  if (captionTimer) { clearTimeout(captionTimer); captionTimer = null; }

  if (!text) {
    // No caption — fade out
    captionEl.classList.remove('visible');
    return;
  }

  // Set new text and fade in
  captionEl.textContent = text;
  // Force reflow so transition fires even if text changes
  captionEl.classList.remove('visible');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    captionEl.classList.add('visible');
    // Fade out after 4s
    captionTimer = setTimeout(() => {
      captionEl.classList.remove('visible');
    }, 4000);
  }));
}

// --- IMAGE PAINT ---
function getKey() {
  return (state.atmosphere ? '1' : '0')
       + (state.food       ? '1' : '0')
       + (state.people     ? '1' : '0')
       + (state.music      ? '1' : '0');
}

function paint() {
  document.getElementById('main-image').src = './' + IMAGE_MAP[getKey()];
}

// --- AUDIO CONTROL ---
function setAudio(layer, isOn) {
  const al = audioLayers[layer];
  if (!al || !al.el) return;

  // Resume AudioContext (browsers require user gesture)
  if (audioCtx.state === 'suspended') audioCtx.resume();

  if (isOn) {
    applyVolume(layer);
    al.el.play().catch(() => {});
  } else {
    al.el.pause();
    // Keep currentTime so it resumes from same position
  }
}

// --- TOGGLE HANDLERS ---
['atmosphere', 'food', 'people', 'music'].forEach(layer => {
  const cb = document.getElementById('cb-' + layer);
  cb.addEventListener('change', () => {
    playClick();
    state[layer] = cb.checked;

    if (layer === 'atmosphere') {
      document.body.classList.toggle('atmosphere-on', cb.checked);
    }

    if (layer === 'music') {
      const notes = document.getElementById('music-notes');
      if (notes) notes.classList.toggle('visible', cb.checked);
    }

    setAudio(layer, cb.checked);
    paint();
    showCaption(cb.checked ? layer : null);
  });
});

// Set the table locked ON
document.getElementById('cb-set-table').addEventListener('change', e => {
  playClick();
  e.target.checked = true;
});

// --- LANDING → EXPERIENCE TRANSITION ---
document.getElementById('enter-btn').addEventListener('click', () => {
  playClick();
  const landing = document.getElementById('landing');
  const experience = document.getElementById('experience');

  // Resume AudioContext (requires user gesture — clicking enter satisfies this)
  if (audioCtx.state === 'suspended') audioCtx.resume();

  // Fade out landing
  landing.classList.add('fade-out');

  // After transition, remove landing and show experience
  setTimeout(() => {
    landing.style.display = 'none';
    experience.classList.remove('hidden');
    // Force reflow then fade in
    requestAnimationFrame(() => experience.classList.add('visible'));
  }, 900);
});

// --- INIT ---
// Ensure music notes are hidden on load
document.getElementById('music-notes').classList.remove('visible');
paint();
