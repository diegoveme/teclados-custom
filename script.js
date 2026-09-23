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

// Arma las capas del teclado desarmado copiando la distribucion del teclado del hero
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

// Evita que estas teclas hagan scroll, cambien el foco o abran menus
const bloquear = ["Space", "Tab", "AltLeft", "AltRight"];

document.addEventListener("keydown", (e) => {
  const lista = teclas[e.code];
  if (!lista) return;
  if (bloquear.includes(e.code)) e.preventDefault();
  lista.forEach((tecla) => tecla.classList.add("pressed"));
});

document.addEventListener("keyup", (e) => {
  const lista = teclas[e.code];
  if (lista) lista.forEach((tecla) => tecla.classList.remove("pressed"));
});

// Si la ventana pierde el foco, suelta todas las teclas
window.addEventListener("blur", () => {
  document.querySelectorAll(".key.pressed").forEach((tecla) => tecla.classList.remove("pressed"));
});

// El teclado se inclina un poco siguiendo al mouse
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

// Al hacer scroll por la seccion de partes, las capas se separan
const seccionCapas = document.querySelector(".layers-section");
const stack = document.querySelector(".stack");
const capas = document.querySelectorAll(".layer");
const items = document.querySelectorAll(".parts li");

function actualizarCapas() {
  const caja = seccionCapas.getBoundingClientRect();
  const recorrido = caja.height - window.innerHeight;
  const avance = Math.min(Math.max(-caja.top / recorrido, 0), 1);

  // Se separan en el primer 60% del scroll y luego se quedan abiertas
  const separacion = Math.min(avance / 0.6, 1);
  const suave = 1 - Math.pow(1 - separacion, 3);
  stack.style.setProperty("--p", suave.toFixed(3));

  // Resalta una capa a la vez, desde el case hasta los keycaps
  const activa = Math.min(Math.floor(avance * capas.length), capas.length - 1);
  capas.forEach((capa, i) => capa.classList.toggle("active", i === activa));
  items.forEach((item, i) => item.classList.toggle("active", i === activa));
}

window.addEventListener("scroll", actualizarCapas, { passive: true });
window.addEventListener("resize", actualizarCapas);
actualizarCapas();
