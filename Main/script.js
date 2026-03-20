const musicToggle = document.querySelector("#music-toggle");
const dojoForm = document.querySelector("#dojo-form");
const fighterNameInput = document.querySelector("#fighter-name");
const dojoResult = document.querySelector("#dojo-result");

const slogans = [
  "frappe le destin avant qu'il ne trouve tes lunettes miroir",
  "hurle plus fort que les synths de supermarche",
  "fais pleurer les neon jusqu'a l'aube",
  "deviens la legende du dojo moquette edition",
  "gagne avec panache puis abandonne completement le panache"
];

let audioContext;
let musicInterval;
let currentStep = 0;
let isPlaying = false;

const noteMap = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33
};

const leadSequence = [
  "E4", "G4", "A4", "G4",
  "E4", "G4", "B4", "A4",
  "E4", "G4", "A4", "C5",
  "B4", "A4", "G4", "D5"
];

const bassSequence = [
  "E4", null, "E4", null,
  "C4", null, "D4", null,
  "E4", null, "G4", null,
  "D4", null, "C4", null
];

function ensureAudioContext() {
  if (!audioContext) {
    audioContext = new window.AudioContext();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function playTone(frequency, startTime, duration, type, volume) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(volume, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

function scheduleStep() {
  const stepDuration = 0.2;
  const now = audioContext.currentTime;
  const leadNote = leadSequence[currentStep % leadSequence.length];
  const bassNote = bassSequence[currentStep % bassSequence.length];

  playTone(noteMap[leadNote], now, stepDuration * 0.9, "square", 0.05);

  if (bassNote) {
    playTone(noteMap[bassNote] / 2, now, stepDuration, "sawtooth", 0.03);
  }

  currentStep += 1;
}

function startMusic() {
  ensureAudioContext();
  scheduleStep();
  musicInterval = window.setInterval(scheduleStep, 200);
  isPlaying = true;
  musicToggle.textContent = "Couper la cassette 8-bit";
}

function stopMusic() {
  window.clearInterval(musicInterval);
  isPlaying = false;
  musicToggle.textContent = "Relancer la cassette 8-bit";
}

musicToggle.addEventListener("click", () => {
  if (isPlaying) {
    stopMusic();
    return;
  }

  startMusic();
});

dojoForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const fighterName = fighterNameInput.value.trim() || "Cobra inconnu";
  const slogan = slogans[Math.floor(Math.random() * slogans.length)];
  dojoResult.textContent = `${fighterName}, ${slogan}. Bienvenue dans le dojo turbo.`;
});
