// Asistente de Mi Malla UP: burbuja de chat.
// Se agrega con una sola línea en index.html, justo antes de </body>:
// <script src="chat-widget.js" defer></script>
// Toma los colores y tipografías de la página (variables --brand, --surface, --ink…),
// así que cambia solo con el modo oscuro.
// Computadora: ventana flotante que esquiva el recuadro «Sigamos», el aviso de «Deshacer» y el botón «?».
// Celular: hoja que sube desde abajo, se cierra deslizándola hacia abajo y sube con el teclado.
(() => {
  // ===================== CONFIGURA AQUÍ =====================
  const WORKER_URL = "https://mi-malla-chatbot.alvarocondoriespinal.workers.dev";
  // ==========================================================

  const TITULO = "Asistente de Mi Malla UP";
  const BIENVENIDA =
    "¡Hola! Te ayudo a usar Mi Malla UP: marcar tus cursos, armar tu próximo ciclo, ver cuándo egresarías y qué te falta. ¿Qué quieres saber?";
  const SUGERENCIAS = ["¿Cómo empiezo?", "¿Qué plan me corresponde?", "¿Qué es un bloque?", "¿Cuándo egreso?"];
  const AVISO = "Asistente con IA, no oficial: confirma requisitos y matrícula con DAAR. No compartas datos personales.";
  const MSG_ERROR = "Ahora mismo no puedo responder. Inténtalo de nuevo en un momento.";
  const MSG_RED = "No pude conectarme con el asistente. Revisa tu conexión e inténtalo de nuevo.";

  const historial = [];
  let ocupado = false;
  let abierto = false;

  const ICONO_CHAT =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>';
  const ICONO_ENVIAR =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>';

  const estilos = document.createElement("style");
  estilos.textContent = `
  .cw{--cw-brand:var(--brand,#0F4C81);--cw-brand-ink:var(--brand-ink,#fff);--cw-surface:var(--surface,#fff);--cw-bg:var(--bg,#F3F6FB);--cw-ink:var(--ink,#12233D);--cw-muted:var(--muted,#55647A);--cw-line:var(--line,#DCE3EE);--cw-body:var(--body,"Segoe UI",system-ui,sans-serif);--cw-display:var(--display,var(--cw-body));--cw-shadow:var(--shadow,0 10px 28px rgba(18,35,61,.18));--cw-scrim:var(--scrim,rgba(8,18,34,.55));--cw-ease:cubic-bezier(0.23,1,0.32,1);--cw-sheet:cubic-bezier(0.32,0.72,0,1);--cw-lift:0px}
  .cw button{touch-action:manipulation;-webkit-user-select:none;user-select:none}

  /* Botón flotante */
  .cw-boton{position:fixed;right:max(16px,env(safe-area-inset-right,0px));bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:9000;display:flex;align-items:center;gap:8px;height:48px;padding:0 18px 0 14px;border:none;border-radius:999px;background:var(--cw-brand);color:var(--cw-brand-ink);font:600 15px var(--cw-display);box-shadow:var(--cw-shadow);cursor:pointer;transform:translateY(calc(-1 * var(--cw-lift)));transition:transform .2s var(--cw-ease),opacity .15s var(--cw-ease),visibility 0s}
  .cw-boton svg{width:22px;height:22px;flex:none}
  .cw-boton:active{transform:translateY(calc(-1 * var(--cw-lift))) scale(.97)}
  .cw-boton.cw-fuera{opacity:0;visibility:hidden;pointer-events:none;transition:transform .2s var(--cw-ease),opacity .12s var(--cw-ease),visibility 0s linear .12s}

  /* Ventana (computadora) */
  .cw-panel{position:fixed;right:max(16px,env(safe-area-inset-right,0px));bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:9002;width:380px;max-width:calc(100vw - 32px);height:var(--cw-h,560px);display:flex;flex-direction:column;background:var(--cw-surface);color:var(--cw-ink);border:1px solid var(--cw-line);border-radius:16px;box-shadow:var(--cw-shadow);overflow:hidden;font:400 15px/1.45 var(--cw-body);transform-origin:100% 100%;
    opacity:0;visibility:hidden;pointer-events:none;transform:translateY(calc(8px - var(--cw-lift))) scale(.98);transition:transform .15s var(--cw-ease),opacity .15s var(--cw-ease),visibility 0s linear .15s}
  .cw-panel.cw-abierto{opacity:1;visibility:visible;pointer-events:auto;transform:translateY(calc(-1 * var(--cw-lift)));transition:transform .2s var(--cw-ease),opacity .2s var(--cw-ease),visibility 0s}
  .cw-velo{display:none}

  .cw-asa{display:none}
  .cw-cabecera{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 6px 8px 16px;border-bottom:1px solid var(--cw-line);background:var(--cw-surface)}
  .cw-titulo{font:600 16px var(--cw-display);color:var(--cw-brand);margin:0;outline:none}
  .cw-cerrar{flex:none;width:40px;height:40px;display:grid;place-items:center;background:none;border:none;color:var(--cw-muted);font-size:24px;line-height:1;border-radius:10px;cursor:pointer}
  @media (hover:hover) and (pointer:fine){.cw-cerrar:hover{background:var(--cw-bg);color:var(--cw-ink)}.cw-chip:hover{background:var(--cw-bg)}}

  .cw-mensajes{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:14px;display:flex;flex-direction:column;gap:8px;background:var(--cw-bg)}
  .cw-msg{max-width:88%;padding:9px 12px;border-radius:14px;white-space:pre-wrap;overflow-wrap:anywhere}
  .cw-bot{align-self:flex-start;background:var(--cw-surface);border:1px solid var(--cw-line);border-bottom-left-radius:4px}
  .cw-bot a{color:var(--cw-brand);font-weight:600}
  .cw-user{align-self:flex-end;background:var(--cw-brand);color:var(--cw-brand-ink);border-bottom-right-radius:4px}
  .cw-nuevo{animation:cw-entra .16s var(--cw-ease) both}
  @keyframes cw-entra{from{opacity:0;transform:translateY(4px)}}
  .cw-escribiendo{color:var(--cw-muted);font-style:italic}

  .cw-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 12px;background:var(--cw-bg)}
  .cw-chips[hidden]{display:none}
  .cw-chip{border:1px solid var(--cw-line);color:var(--cw-ink);background:var(--cw-surface);border-radius:999px;padding:6px 12px;min-height:34px;font:500 13.5px var(--cw-body);cursor:pointer}

  .cw-form{display:flex;gap:8px;padding:10px 10px 6px;border-top:1px solid var(--cw-line);background:var(--cw-surface)}
  .cw-input{flex:1;min-width:0;min-height:42px;border:1px solid var(--cw-line);border-radius:12px;padding:9px 12px;background:var(--cw-surface);color:var(--cw-ink);font:inherit}
  .cw-input:focus{outline:2px solid var(--cw-brand);outline-offset:0;border-color:transparent}
  .cw-enviar{flex:none;display:flex;align-items:center;justify-content:center;gap:6px;min-height:42px;border:none;background:var(--cw-brand);color:var(--cw-brand-ink);border-radius:12px;padding:0 16px;font:600 14px var(--cw-display);cursor:pointer;transition:transform .12s var(--cw-ease)}
  .cw-enviar svg{display:none;width:20px;height:20px}
  .cw-enviar:active:not(:disabled){transform:scale(.97)}
  .cw-enviar:disabled{opacity:.5;cursor:default}
  .cw-aviso{font-size:12px;line-height:1.35;color:var(--cw-muted);text-align:center;padding:0 14px 10px;background:var(--cw-surface)}
  .cw-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

  /* Ocultar el botón en la guía de bienvenida y con el panel de un curso abierto */
  body.touring .cw-boton,body.panel-open .cw-boton{opacity:0;visibility:hidden;pointer-events:none}

  /* Celular: hoja desde abajo */
  @media (max-width:640px){
    .cw-boton{width:52px;height:52px;padding:0;justify-content:center}
    .cw-boton .cw-texto{display:none}
    .cw-velo{display:block;position:fixed;inset:0;z-index:9001;background:var(--cw-scrim);touch-action:none;opacity:0;visibility:hidden;transition:opacity .15s var(--cw-ease),visibility 0s linear .15s}
    .cw-velo.cw-abierto{opacity:1;visibility:visible;transition:opacity .2s var(--cw-ease),visibility 0s}
    .cw-panel{left:0;right:0;bottom:var(--cw-kb,0px);width:auto;max-width:none;height:var(--cw-h,88dvh);border:none;border-radius:18px 18px 0 0;
      opacity:1;transform:translateY(100%);transition:transform .15s var(--cw-sheet),visibility 0s linear .15s}
    .cw-panel.cw-abierto{transform:translateY(0);transition:transform .2s var(--cw-sheet),visibility 0s}
    .cw-asa{display:block;position:relative;height:20px;flex:none;touch-action:none;cursor:grab}
    .cw-asa::before{content:"";position:absolute;left:50%;top:8px;width:40px;height:5px;margin-left:-20px;border-radius:3px;background:var(--cw-line)}
    .cw-cabecera{padding-top:0;touch-action:none}
    .cw-cerrar{width:44px;height:44px}
    .cw-chip{min-height:40px}
    .cw-input{font-size:16px;min-height:44px}
    .cw-enviar{width:48px;min-height:44px;padding:0}
    .cw-enviar svg{display:block}
    .cw-enviar .cw-etq{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
    .cw-aviso{padding-bottom:calc(10px + env(safe-area-inset-bottom,0px))}
    .cw-panel.cw-teclado .cw-aviso{padding-bottom:8px}
  }
  @media (prefers-reduced-motion:reduce){
    .cw-boton,.cw-boton.cw-fuera{transition:opacity .15s ease,visibility 0s}
    .cw-panel,.cw-panel.cw-abierto{transform:translateY(calc(-1 * var(--cw-lift)));transition:opacity .15s ease,visibility 0s linear .15s}
    .cw-panel.cw-abierto{transition:opacity .15s ease,visibility 0s}
    .cw-boton:active,.cw-enviar:active:not(:disabled){transform:none}
    .cw-nuevo{animation:cw-aparece .15s ease both}
    @keyframes cw-aparece{from{opacity:0}}
  }
  @media (prefers-reduced-motion:reduce) and (max-width:640px){
    .cw-panel,.cw-panel.cw-abierto{transform:none}
    .cw-panel{opacity:0}
    .cw-panel.cw-abierto{opacity:1}
  }
  @media print{.cw-boton,.cw-panel,.cw-velo{display:none!important}}
  `;
  document.head.appendChild(estilos);

  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "cw cw-boton";
  boton.setAttribute("aria-label", "Abrir el asistente de Mi Malla UP");
  boton.setAttribute("aria-expanded", "false");
  boton.setAttribute("aria-controls", "cw-panel");
  boton.innerHTML = ICONO_CHAT + '<span class="cw-texto">¿Dudas? Pregúntame</span>';

  const velo = document.createElement("div");
  velo.className = "cw cw-velo";
  velo.setAttribute("aria-hidden", "true");

  const panel = document.createElement("div");
  panel.className = "cw cw-panel";
  panel.id = "cw-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-labelledby", "cw-titulo");
  panel.inert = true;
  panel.innerHTML = `
    <div class="cw-asa" aria-hidden="true"></div>
    <div class="cw-cabecera"><h2 class="cw-titulo" id="cw-titulo" tabindex="-1"></h2><button class="cw-cerrar" type="button" aria-label="Cerrar el asistente">×</button></div>
    <div class="cw-mensajes" role="log" aria-live="polite"></div>
    <div class="cw-chips" role="group" aria-label="Preguntas sugeridas"></div>
    <form class="cw-form">
      <input class="cw-input" type="text" maxlength="500" placeholder="Escribe tu pregunta…" aria-label="Tu pregunta" autocomplete="off" enterkeyhint="send" />
      <button class="cw-enviar" type="submit">${ICONO_ENVIAR}<span class="cw-etq">Enviar</span></button>
    </form>
    <div class="cw-aviso"></div>`;
  document.body.append(boton, velo, panel);

  const $ = (s) => panel.querySelector(s);
  $(".cw-titulo").textContent = TITULO;
  $(".cw-aviso").textContent = AVISO;
  const lista = $(".cw-mensajes");
  const chips = $(".cw-chips");
  const form = $(".cw-form");
  const input = $(".cw-input");
  const enviar = $(".cw-enviar");
  const esCelular = matchMedia("(max-width:640px)");
  const tactil = matchMedia("(pointer:coarse)");

  // Escribe el texto sin interpretar HTML; solo convierte en enlace las direcciones web y los correos.
  function pintar(div, texto) {
    texto = texto.replace(/\*\*(.+?)\*\*/g, "$1"); // por si el modelo usa negritas de Markdown
    const re = /https?:\/\/[^\s)»"]+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
    let ultimo = 0;
    for (const m of texto.matchAll(re)) {
      const enlace = m[0].replace(/[.,;:]+$/, "");
      div.append(texto.slice(ultimo, m.index));
      const a = document.createElement("a");
      a.href = enlace.startsWith("http") ? enlace : "mailto:" + enlace;
      a.textContent = enlace;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      div.append(a);
      ultimo = m.index + enlace.length;
    }
    div.append(texto.slice(ultimo));
  }

  function agregar(texto, quien, animar) {
    const div = document.createElement("div");
    div.className = `cw-msg cw-${quien}` + (animar ? " cw-nuevo" : "");
    if (quien === "bot") pintar(div, texto);
    else div.textContent = texto;
    lista.appendChild(div);
    lista.scrollTop = lista.scrollHeight;
    return div;
  }

  // ---------- Ubicación: esquivar «Sigamos», el aviso de «Deshacer», el botón «?» y el teclado ----------
  const visible = (el) => {
    if (!el || el.hidden || !el.isConnected) return false;
    if (el.classList.contains("tucked")) return false;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const cruzan = (a, b) => a.left < b.right && b.left < a.right;

  function ubicar() {
    const vh = innerHeight;
    const base = parseFloat(getComputedStyle(boton).bottom) || 16;
    // Lo que ocupa la esquina: la ventana si está abierta (computadora) o el botón
    const zona = (abierto && !esCelular.matches ? panel : boton).getBoundingClientRect();
    let lift = 0;
    for (const id of ["guide", "toast"]) {
      const el = document.getElementById(id);
      if (!visible(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.bottom < vh - 220 || !cruzan(r, zona)) continue; // solo lo que está abajo y en la misma columna
      lift = Math.max(lift, vh - r.top + 12 - base);
    }
    boton.style.setProperty("--cw-lift", lift + "px");
    if (esCelular.matches) {
      panel.style.removeProperty("--cw-lift");
      ajustarHoja();
      return;
    }
    panel.style.setProperty("--cw-lift", lift + "px");
    // Alto: que no tape las pestañas ni el botón «?»
    let tope = 0;
    const pestanas = document.getElementById("tabband");
    if (pestanas) tope = Math.max(tope, pestanas.getBoundingClientRect().bottom);
    const ayuda = document.getElementById("tour-open");
    if (visible(ayuda)) {
      const r = ayuda.getBoundingClientRect();
      if (r.bottom > 0) tope = Math.max(tope, r.bottom);
    }
    const disponible = vh - base - lift - Math.max(16, tope + 12);
    panel.style.setProperty("--cw-h", Math.max(300, Math.min(560, Math.floor(disponible))) + "px");
  }

  // Celular: la hoja ocupa el 88 % de la pantalla y sube con el teclado.
  function ajustarHoja() {
    if (!esCelular.matches) return;
    const vv = window.visualViewport;
    const alto = vv ? vv.height : innerHeight;
    const teclado = vv ? Math.max(0, Math.round(innerHeight - vv.height - vv.offsetTop)) : 0;
    const conTeclado = teclado > 80;
    panel.classList.toggle("cw-teclado", conTeclado);
    panel.style.setProperty("--cw-kb", (conTeclado ? teclado : 0) + "px");
    panel.style.setProperty("--cw-h", Math.round(conTeclado ? alto - 8 : Math.min(alto * 0.88, alto - 24)) + "px");
    if (conTeclado && abierto) lista.scrollTop = lista.scrollHeight;
  }

  let pendiente = false;
  function pedirUbicar() {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => {
      pendiente = false;
      ubicar();
    });
  }
  addEventListener("resize", pedirUbicar);
  addEventListener("scroll", pedirUbicar, { passive: true });
  if (window.visualViewport) {
    visualViewport.addEventListener("resize", pedirUbicar);
    visualViewport.addEventListener("scroll", pedirUbicar);
  }
  const vigia = new MutationObserver(() => {
    if (abierto && document.body.classList.contains("touring")) abrir(false);
    pedirUbicar();
  });
  vigia.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  const vigilar = () => {
    for (const id of ["guide", "toast"]) {
      const el = document.getElementById(id);
      if (el && !el.dataset.cwVigilado) {
        el.dataset.cwVigilado = "1";
        vigia.observe(el, { attributes: true, attributeFilter: ["hidden", "class", "style"], childList: true });
      }
    }
  };
  vigilar();
  ubicar();
  setTimeout(() => { vigilar(); ubicar(); }, 1500); // la página crea la guía al cargar los datos

  // ---------- Abrir y cerrar ----------
  function abrir(si) {
    if (si === abierto) return;
    abierto = si;
    limpiarArrastre();
    boton.setAttribute("aria-expanded", String(si));
    boton.setAttribute("aria-label", si ? "Asistente abierto" : "Abrir el asistente de Mi Malla UP");
    panel.setAttribute("aria-modal", String(si && esCelular.matches));
    panel.inert = !si;
    if (si) ubicar();
    panel.classList.toggle("cw-abierto", si);
    velo.classList.toggle("cw-abierto", si && esCelular.matches);
    boton.classList.toggle("cw-fuera", si);
    if (si) {
      lista.scrollTop = lista.scrollHeight;
      // En celular no se abre el teclado de golpe: el enfoque va al título.
      if (tactil.matches || esCelular.matches) $(".cw-titulo").focus({ preventScroll: true });
      else input.focus({ preventScroll: true });
    } else {
      if (panel.contains(document.activeElement)) boton.focus({ preventScroll: true });
      ubicar();
    }
  }

  boton.addEventListener("click", () => abrir(true));
  $(".cw-cerrar").addEventListener("click", () => abrir(false));
  velo.addEventListener("click", () => abrir(false));
  panel.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      abrir(false);
      return;
    }
    // En celular la hoja es modal: el tabulador no sale de ella.
    if (e.key === "Tab" && esCelular.matches) {
      const f = [...panel.querySelectorAll("button:not([disabled]):not([hidden]),input,a[href]")].filter((x) => x.offsetParent);
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) {
        e.preventDefault();
        f[f.length - 1].focus();
      } else if (!e.shiftKey && i === f.length - 1) {
        e.preventDefault();
        f[0].focus();
      }
    }
  });
  esCelular.addEventListener("change", () => {
    if (abierto) abrir(false);
    panel.style.removeProperty("--cw-h");
    ubicar();
  });

  // ---------- Celular: deslizar la hoja hacia abajo para cerrar ----------
  let arrastre = null;
  function limpiarArrastre() {
    arrastre = null;
    panel.style.transition = "";
    panel.style.transform = "";
    velo.style.opacity = "";
  }
  function empezar(e) {
    if (!esCelular.matches || !abierto || e.button > 0) return;
    if (e.target.closest(".cw-cerrar")) return;
    arrastre = { id: e.pointerId, y0: e.clientY, dy: 0, alto: panel.offsetHeight, muestras: [{ y: e.clientY, t: e.timeStamp }] };
    panel.style.transition = "none";
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  }
  function mover(e) {
    if (!arrastre || e.pointerId !== arrastre.id) return;
    let dy = e.clientY - arrastre.y0;
    if (dy < 0) dy = -Math.sqrt(-dy) * 2; // hacia arriba ofrece resistencia
    arrastre.dy = dy;
    arrastre.muestras.push({ y: e.clientY, t: e.timeStamp });
    if (arrastre.muestras.length > 6) arrastre.muestras.shift();
    panel.style.transform = `translateY(${dy}px)`;
    velo.style.opacity = String(Math.max(0, 1 - Math.max(0, dy) / arrastre.alto));
  }
  function soltar(e) {
    if (!arrastre || e.pointerId !== arrastre.id) return;
    const m = arrastre.muestras;
    const a = m[0], b = m[m.length - 1];
    const velocidad = b.t > a.t ? (b.y - a.y) / (b.t - a.t) : 0; // px por ms
    const cerrar = arrastre.dy > arrastre.alto * 0.3 || (velocidad > 0.5 && arrastre.dy > 10);
    arrastre = null;
    // Sin transición en línea, la hoja termina el movimiento desde donde la soltaste.
    panel.style.transition = "";
    velo.style.opacity = "";
    if (cerrar) {
      panel.style.transform = "";
      abrir(false);
    } else {
      panel.style.transform = "";
    }
  }
  for (const zona of [$(".cw-asa"), $(".cw-cabecera")]) {
    zona.addEventListener("pointerdown", empezar);
    zona.addEventListener("pointermove", mover);
    zona.addEventListener("pointerup", soltar);
    zona.addEventListener("pointercancel", soltar);
  }

  // ---------- Conversación ----------
  SUGERENCIAS.forEach((t) => {
    const c = document.createElement("button");
    c.type = "button";
    c.className = "cw-chip";
    c.textContent = t;
    c.addEventListener("click", () => preguntar(t));
    chips.appendChild(c);
  });

  agregar(BIENVENIDA, "bot", false);

  async function preguntar(texto) {
    texto = texto.trim();
    if (!texto || ocupado) return;
    ocupado = true;
    enviar.disabled = true;
    chips.hidden = true;
    agregar(texto, "user", false);
    input.value = "";

    const escribiendo = agregar("Escribiendo…", "bot", false);
    escribiendo.classList.add("cw-escribiendo");
    lista.setAttribute("aria-busy", "true");

    let respuesta = MSG_ERROR;
    try {
      const res = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: texto, history: historial.slice(-8) }),
      });
      const data = await res.json();
      if (data.reply) respuesta = data.reply;
      if (data.reply && !data.error) {
        historial.push({ role: "user", text: texto }, { role: "model", text: data.reply });
      }
    } catch {
      respuesta = MSG_RED;
    }

    escribiendo.remove();
    lista.removeAttribute("aria-busy");
    agregar(respuesta, "bot", true);
    ocupado = false;
    enviar.disabled = false;
    if (!tactil.matches && abierto) input.focus({ preventScroll: true });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    preguntar(input.value);
  });
})();
