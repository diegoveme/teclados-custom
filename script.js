// Codigos de tecla (KeyboardEvent.code) en el mismo orden que las teclas del HTML
const codigos = [
  ["Escape", "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9", "Digit0", "Backspace"],
  ["Tab", "KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU", "KeyI", "KeyO", "KeyP", "Backslash"],
  ["CapsLock", "KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL", "Enter"],
  ["ShiftLeft", "KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM", "Comma", "Period", "ShiftRight"],
  ["ControlLeft", "AltLeft", "Space", "AltRight", "ControlRight"]
];

const anchos = ["wide", "w15", "w175", "w225", "w275", "space"];
const filasHero = document.querySelectorAll(".keyboard .row");

// ---------- Capas del teclado desarmado ----------

// Arma cada capa copiando la distribucion del teclado del hero
function armarCapa(capa, crearCelda) {
  filasHero.forEach((filaHero) => {
    const fila = document.createElement("div");
    fila.className = "row";
    filaHero.querySelectorAll(".key").forEach((tecla) => {
      const celda = crearCelda(tecla);
      anchos.forEach((a) => {
        if (tecla.classList.contains(a)) celda.classList.add(a);
      });
      fila.appendChild(celda);
    });
    capa.appendChild(fila);
  });
}

function celdaVacia(tipo) {
  return () => {
    const celda = document.createElement("span");
    celda.className = `cell ${tipo}`;
    return celda;
  };
}

armarCapa(document.querySelector(".l-plate"), celdaVacia("hole"));
armarCapa(document.querySelector(".l-switches"), celdaVacia("sw"));
armarCapa(document.querySelector(".l-keycaps"), (tecla) => tecla.cloneNode(true));

// Cada codigo apunta a su tecla en el hero y en la capa de keycaps
const teclas = {};

document.querySelectorAll(".keyboard, .l-keycaps").forEach((contenedor) => {
  contenedor.querySelectorAll(".row").forEach((fila, i) => {
    fila.querySelectorAll(".key").forEach((tecla, j) => {
      (teclas[codigos[i][j]] ??= []).push(tecla);
    });
  });
});

// ---------- Sonido de tecla (sintetizado, sin archivos) ----------

const botonSonido = document.querySelector(".sound-toggle");
let sonidoActivo = true;
let audio = null;
let ruido = null;

try {
  sonidoActivo = localStorage.getItem("sonido") !== "off";
} catch (e) {}
botonSonido.setAttribute("aria-pressed", sonidoActivo);

botonSonido.addEventListener("click", () => {
  sonidoActivo = !sonidoActivo;
  botonSonido.setAttribute("aria-pressed", sonidoActivo);
  try {
    localStorage.setItem("sonido", sonidoActivo ? "on" : "off");
  } catch (e) {}
});

function sonarTecla(grave) {
  if (!sonidoActivo) return;
  if (!audio) {
    audio = new AudioContext();
    ruido = audio.createBuffer(1, audio.sampleRate * 0.08, audio.sampleRate);
    const datos = ruido.getChannelData(0);
    for (let i = 0; i < datos.length; i++) datos[i] = Math.random() * 2 - 1;
  }

  const t = audio.currentTime;

  // Golpe corto de ruido filtrado: el "clack"
  const fuente = audio.createBufferSource();
  fuente.buffer = ruido;
  const filtro = audio.createBiquadFilter();
  filtro.type = "bandpass";
  filtro.frequency.value = (grave ? 900 : 1800) + Math.random() * 600;
  const volumen = audio.createGain();
  volumen.gain.setValueAtTime(0.5, t);
  volumen.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  fuente.connect(filtro).connect(volumen).connect(audio.destination);
  fuente.start(t);

  // Tono grave muy corto: el "thock"
  const tono = audio.createOscillator();
  tono.frequency.setValueAtTime(grave ? 110 : 160, t);
  tono.frequency.exponentialRampToValueAtTime(60, t + 0.05);
  const volTono = audio.createGain();
  volTono.gain.setValueAtTime(0.35, t);
  volTono.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  tono.connect(volTono).connect(audio.destination);
  tono.start(t);
  tono.stop(t + 0.07);
}

// ---------- Pantalla donde aparece lo que escribes ----------

const pantalla = document.querySelector(".typed");
const maxLetras = 26;

function escribir(e) {
  if (e.code === "Backspace") {
    pantalla.textContent = pantalla.textContent.slice(0, -1);
  } else if (e.code === "Enter" || e.code === "Escape") {
    pantalla.textContent = "";
  } else if (e.key.length === 1) {
    pantalla.textContent = (pantalla.textContent + e.key).slice(-maxLetras);
  }
}

// ---------- Presionar teclas ----------

function onda(tecla) {
  const anillo = document.createElement("span");
  anillo.className = "ripple";
  anillo.addEventListener("animationend", () => anillo.remove());
  tecla.appendChild(anillo);
}

function presionar(code) {
  const lista = teclas[code];
  if (!lista) return false;
  lista.forEach((tecla) => {
    tecla.classList.add("pressed");
    onda(tecla);
  });
  return true;
}

function soltar(code) {
  const lista = teclas[code];
  if (lista) lista.forEach((tecla) => tecla.classList.remove("pressed"));
}

// Evita que estas teclas hagan scroll, cambien el foco o abran menus
const bloquear = ["Space", "Tab", "AltLeft", "AltRight"];

document.addEventListener("keydown", (e) => {
  detenerDemo();
  if (e.repeat) return;
  if (bloquear.includes(e.code)) e.preventDefault();
  escribir(e);
  if (presionar(e.code)) sonarTecla(e.code === "Space" || e.code === "Enter");
});

document.addEventListener("keyup", (e) => soltar(e.code));

// Clic con el mouse sobre una tecla dibujada
document.querySelectorAll(".key").forEach((tecla) => {
  tecla.addEventListener("mousedown", () => {
    detenerDemo();
    onda(tecla);
    sonarTecla(false);
  });
});

// Si la ventana pierde el foco, suelta todas las teclas
window.addEventListener("blur", () => {
  document.querySelectorAll(".key.pressed").forEach((tecla) => tecla.classList.remove("pressed"));
});

// ---------- Demo: el teclado se escribe solo hasta que el usuario toca algo ----------

const textoDemo = "hola keylab";
let demoActiva = true;
let demoTimer = null;

function codigoDeLetra(letra) {
  return letra === " " ? "Space" : `Key${letra.toUpperCase()}`;
}

function correrDemo(i = 0) {
  if (!demoActiva) return;
  if (i === 0) pantalla.textContent = "";

  if (i < textoDemo.length) {
    const code = codigoDeLetra(textoDemo[i]);
    presionar(code);
    pantalla.textContent += textoDemo[i];
    setTimeout(() => soltar(code), 110);
    demoTimer = setTimeout(() => correrDemo(i + 1), 160 + Math.random() * 120);
  } else {
    demoTimer = setTimeout(() => correrDemo(0), 2500);
  }
}

function detenerDemo() {
  if (!demoActiva) return;
  demoActiva = false;
  clearTimeout(demoTimer);
  pantalla.textContent = "";
  Object.keys(teclas).forEach(soltar);
}

// ---------- Onda de luz inicial en el teclado ----------

filasHero.forEach((fila, i) => {
  fila.querySelectorAll(".key").forEach((tecla, j) => {
    tecla.style.setProperty("--delay", `${0.6 + (i + j) * 0.04}s`);
    tecla.classList.add("boot");
  });
});

setTimeout(() => correrDemo(), 2200);

// ---------- Colorways ----------

const swatches = document.querySelectorAll(".swatch");

function aplicarTema(tema) {
  document.documentElement.dataset.theme = tema;
  swatches.forEach((s) => s.classList.toggle("active", s.dataset.theme === tema));
}

swatches.forEach((s) => {
  s.addEventListener("click", () => {
    aplicarTema(s.dataset.theme);
    try {
      localStorage.setItem("tema", s.dataset.theme);
    } catch (e) {}
  });
});

try {
  const guardado = localStorage.getItem("tema");
  if (guardado) aplicarTema(guardado);
} catch (e) {}

// ---------- Inclinacion del teclado siguiendo al mouse ----------

const teclado = document.querySelector(".keyboard");
const hero = document.querySelector(".hero");

hero.addEventListener("mousemove", (e) => {
  const x = e.clientX / window.innerWidth - 0.5;
  const y = e.clientY / window.innerHeight - 0.5;
  teclado.style.setProperty("--rx", `${42 - y * 16}deg`);
  teclado.style.setProperty("--rz", `${-12 + x * 16}deg`);
});

hero.addEventListener("mouseleave", () => {
  teclado.style.removeProperty("--rx");
  teclado.style.removeProperty("--rz");
});

// ---------- Luz que sigue al mouse en las tarjetas ----------

document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const caja = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - caja.left}px`);
    card.style.setProperty("--my", `${e.clientY - caja.top}px`);
  });
});

// ---------- Contadores del hero ----------

document.querySelectorAll("[data-count]").forEach((el) => {
  const final = Number(el.dataset.count);
  const inicio = performance.now() + 700;
  const duracion = 1400;

  function paso(ahora) {
    const t = Math.min(Math.max((ahora - inicio) / duracion, 0), 1);
    el.textContent = Math.round(final * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(paso);
  }
  requestAnimationFrame(paso);
});

// ---------- Elementos que aparecen al entrar en pantalla ----------

const observador = new IntersectionObserver((entradas) => {
  entradas.forEach((entrada) => {
    if (entrada.isIntersecting) {
      entrada.target.classList.add("visible");
      observador.unobserve(entrada.target);
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll(".reveal").forEach((el) => observador.observe(el));

// ---------- Scroll: barra de progreso, link activo y capas ----------

const barra = document.querySelector(".progress");
const links = document.querySelectorAll(".navbar nav a");
const seccionCapas = document.querySelector(".layers-section");
const stack = document.querySelector(".stack");
const capas = document.querySelectorAll(".layer");
const items = document.querySelectorAll(".parts li");
const progresoCapas = document.querySelector(".layer-progress");

function alHacerScroll() {
  const total = document.documentElement.scrollHeight - window.innerHeight;
  barra.style.setProperty("--scroll", (window.scrollY / total).toFixed(4));

  // Resalta en el menu la seccion en la que estas
  links.forEach((link) => {
    const seccion = document.querySelector(link.getAttribute("href"));
    const caja = seccion.getBoundingClientRect();
    link.classList.toggle("current", caja.top <= 120 && caja.bottom > 120);
  });

  // Separa las capas segun cuanto avanzaste en la seccion de partes
  const caja = seccionCapas.getBoundingClientRect();
  const recorrido = caja.height - window.innerHeight;
  const avance = Math.min(Math.max(-caja.top / recorrido, 0), 1);

  const separacion = Math.min(avance / 0.6, 1);
  const suave = 1 - Math.pow(1 - separacion, 3);
  stack.style.setProperty("--p", suave.toFixed(3));
  progresoCapas.style.setProperty("--lp", avance.toFixed(3));

  const activa = Math.min(Math.floor(avance * capas.length), capas.length - 1);
  capas.forEach((capa, i) => capa.classList.toggle("active", i === activa));
  items.forEach((item, i) => item.classList.toggle("active", i === activa));
}

window.addEventListener("scroll", alHacerScroll, { passive: true });
window.addEventListener("resize", alHacerScroll);
alHacerScroll();
