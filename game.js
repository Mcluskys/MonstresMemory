"use strict";

const MAX_VICTORIES = 4;
const SEQUENCE_LENGTH = 3;
const START_DELAY = 700;
const BETWEEN_SOUNDS = 500;
const AFTER_SEQUENCE_DELAY = 900;
const ERROR_DURATION = 1500;

const monsters = {
  sorciere: { sound: "assets/audio/sorciere.wav", label: "Sorcière" },
  vampire: { sound: "assets/audio/vampire.wav", label: "Vampire" },
  yeti: { sound: "assets/audio/yeti.wav", label: "Yéti" },
  zombie: { sound: "assets/audio/zombie.wav", label: "Zombie" },
  fantome: { sound: "assets/audio/fantome.wav", label: "Fantôme" },
};

const ui = {
  score: document.querySelector("#scoreValue"),
  title: document.querySelector("#titleText"),
  status: document.querySelector("#statusText"),
  mainButton: document.querySelector("#mainButton"),
  replayButton: document.querySelector("#replayButton"),
  messageBar: document.querySelector("#messageBar"),
  monsterGrid: document.querySelector("#monsterGrid"),
  monsters: [...document.querySelectorAll(".monster")],
  error: document.querySelector("#errorOverlay"),
  victory: document.querySelector("#victoryOverlay"),
  soundToggle: document.querySelector("#soundToggle"),
};

const audio = {
  monster: Object.fromEntries(Object.entries(monsters).map(([name, data]) => [name, new Audio(data.sound)])),
  boo: new Audio("assets/audio/boo.wav"),
  clap: new Audio("assets/audio/clap.wav"),
};
Object.values(audio.monster).forEach(a => { a.preload = "auto"; });
audio.boo.preload = "auto";
audio.clap.preload = "auto";

let state = "menu"; // menu | listen | showSequence | playerTurn | error | victory
let victories = 0;
let sequence = [];
let playerSequence = [];
let muted = false;
let activeAudio = null;
let runToken = 0;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function setState(next) {
  state = next;
  const playable = next === "listen" || next === "playerTurn";
  ui.monsterGrid.classList.toggle("is-locked", !playable);
  ui.monsters.forEach(btn => btn.disabled = !playable);

  ui.mainButton.hidden = next !== "listen";
  ui.error.hidden = next !== "error";
  ui.victory.hidden = next !== "victory";

  if (next === "menu") {
    ui.title.textContent = "Mémoire des Cris de Monstres";
    ui.status.textContent = "Écoute les monstres puis reproduis la séquence.";
    ui.mainButton.hidden = false;
    ui.mainButton.textContent = "Jouer";
    ui.messageBar.textContent = "Touchez Jouer pour commencer.";
  } else if (next === "listen") {
    ui.title.textContent = "Écoute les monstres";
    ui.status.textContent = "Tu peux tester chaque cri avant de commencer la manche.";
    ui.mainButton.textContent = "Débuter";
    ui.messageBar.textContent = "Touchez un monstre pour entendre son cri.";
  } else if (next === "showSequence") {
    ui.title.textContent = "Mémorise la séquence";
    ui.status.textContent = "Écoute bien les 3 cris dans l'ordre.";
    ui.messageBar.textContent = "Mémorise la séquence…";
  } else if (next === "playerTurn") {
    ui.title.textContent = "À toi de jouer !";
    ui.status.textContent = "Reproduis les 3 cris dans le même ordre.";
    ui.messageBar.textContent = "Choisis les monstres dans le bon ordre.";
  }
  updateScore();
}

function updateScore() {
  ui.score.textContent = `${victories} / ${MAX_VICTORIES}`;
}

function stopAudio() {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
  [...Object.values(audio.monster), audio.boo, audio.clap].forEach(a => {
    if (!a.paused) { a.pause(); a.currentTime = 0; }
  });
}

async function playAudio(element, maxMs = null) {
  stopAudio();
  if (muted) return;
  activeAudio = element;
  element.currentTime = 0;

  let timer;
  await new Promise(resolve => {
    const done = () => {
      clearTimeout(timer);
      element.removeEventListener("ended", done);
      if (activeAudio === element) activeAudio = null;
      resolve();
    };
    element.addEventListener("ended", done, { once: true });
    if (maxMs) timer = setTimeout(() => {
      element.pause();
      element.currentTime = 0;
      done();
    }, maxMs);
    const p = element.play();
    if (p && typeof p.catch === "function") p.catch(() => done());
  });
}

async function playMonster(name, visual = true) {
  const button = ui.monsters.find(btn => btn.dataset.monster === name);
  if (visual && button) button.classList.add("is-active");
  // Le jeu Python coupait volontairement le zombie à 1,5 s : on conserve ce comportement.
  await playAudio(audio.monster[name], name === "zombie" ? 1500 : null);
  if (button) button.classList.remove("is-active");
}

function randomSequence() {
  const names = Object.keys(monsters);
  for (let i = names.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [names[i], names[j]] = [names[j], names[i]];
  }
  return names.slice(0, SEQUENCE_LENGTH);
}

async function startRound() {
  runToken += 1;
  const token = runToken;
  stopAudio();
  sequence = randomSequence();
  playerSequence = [];
  setState("showSequence");
  await sleep(START_DELAY);

  for (const name of sequence) {
    if (token !== runToken || state !== "showSequence") return;
    await playMonster(name, true);
    await sleep(BETWEEN_SOUNDS);
  }

  if (token !== runToken || state !== "showSequence") return;
  await sleep(AFTER_SEQUENCE_DELAY);
  if (token === runToken) setState("playerTurn");
}

async function handleMonster(name, button) {
  if (state !== "listen" && state !== "playerTurn") return;

  if (state === "listen") {
    await playMonster(name, true);
    return;
  }

  if (playerSequence.length >= SEQUENCE_LENGTH) return;
  const index = playerSequence.length;
  playerSequence.push(name);
  button.classList.add("is-active");
  void playMonster(name, false).finally(() => button.classList.remove("is-active"));

  if (name !== sequence[index]) {
    await showError();
    return;
  }

  button.classList.add("is-correct");
  setTimeout(() => button.classList.remove("is-correct"), 500);

  if (playerSequence.length === sequence.length) {
    victories += 1;
    updateScore();
    await sleep(350);
    if (victories >= MAX_VICTORIES) showVictory();
    else startRound();
  } else {
    ui.messageBar.textContent = `${playerSequence.length} / ${SEQUENCE_LENGTH} — continue !`;
  }
}

async function showError() {
  runToken += 1;
  setState("error");
  stopAudio();
  if (!muted) {
    audio.boo.currentTime = 0;
    audio.boo.play().catch(() => {});
  }
  await sleep(ERROR_DURATION);
  audio.boo.pause();
  audio.boo.currentTime = 0;
  playerSequence = [];
  setState("listen");
}

function showVictory() {
  runToken += 1;
  stopAudio();
  setState("victory");
  ui.messageBar.textContent = "Bravo ! Victoire !";
  if (!muted) audio.clap.play().catch(() => {});
}

function resetGame() {
  runToken += 1;
  stopAudio();
  victories = 0;
  sequence = [];
  playerSequence = [];
  updateScore();
  setState("listen");
}

ui.mainButton.addEventListener("click", () => {
  if (state === "menu") {
    setState("listen");
  } else if (state === "listen") {
    startRound();
  }
});

ui.replayButton.addEventListener("click", resetGame);

ui.monsters.forEach(button => {
  button.addEventListener("click", () => handleMonster(button.dataset.monster, button));
});

ui.soundToggle.addEventListener("click", () => {
  muted = !muted;
  ui.soundToggle.textContent = muted ? "🔇" : "🔊";
  ui.soundToggle.setAttribute("aria-pressed", String(muted));
  ui.soundToggle.setAttribute("aria-label", muted ? "Activer le son" : "Couper le son");
  ui.soundToggle.title = muted ? "Activer le son" : "Couper le son";
  if (muted) stopAudio();
});

// Empêche les doubles-taps de zoomer sur certains navigateurs mobiles tout en gardant l'accessibilité clavier.
document.addEventListener("dblclick", e => e.preventDefault(), { passive: false });

// PWA : fonctionnement hors-ligne après la première visite (GitHub Pages compatible).
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}

setState("menu");
