// Asistente de Mi Malla UP: burbuja de chat.
// Se agrega con una sola línea en index.html, justo antes de </body>:
// <script src="chat-widget.js" defer></script>
// Toma los colores y tipografías de la página (variables --brand, --surface, --ink…),
// así que cambia solo con el modo oscuro.
(() => {
  // ===================== CONFIGURA AQUÍ =====================
  const WORKER_URL = "https://mi-malla-chatbot.alvarocondoriespinal.workers.dev";
  // ==========================================================

  const TITULO = "Asistente de Mi Malla UP";
  const BIENVENIDA =
    "¡Hola! Te ayudo a usar Mi Malla UP: marcar tus cursos, armar tu próximo ciclo, ver cuándo egresarías y qué te falta. ¿Qué quieres saber?";
  const SUGERENCIAS = ["¿Cómo empiezo?", "¿Qué plan me corresponde?", "¿Qué es un bloque?", "¿Cuándo egreso?"];
  const AVISO = "Asistente con IA, no oficial. Confirma requisitos y matrícula con DAAR. No compartas datos personales.";
  const MSG_ERROR = "Ahora mismo no puedo responder. Inténtalo de nuevo en un momento.";

  const historial = [];
  let ocupado = false;

  const estilos = document.createElement("style");
  estilos.textContent = `
  .cw{--cw-brand:var(--brand,#0F4C81);--cw-brand-ink:var(--brand-ink,#fff);--cw-surface:var(--surface,#fff);--cw-bg:var(--bg,#F3F6FB);--cw-ink:var(--ink,#12233D);--cw-muted:var(--muted,#55647A);--cw-line:var(--line,#DCE3EE);--cw-body:var(--body,"Segoe UI",system-ui,sans-serif);--cw-display:var(--display,var(--cw-body));--cw-shadow:var(--shadow,0 10px 28px rgba(18,35,61,.18))}
  .cw-boton{position:fixed;right:max(16px,env(safe-area-inset-right,0px));bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:9000;display:flex;align-items:center;gap:8px;height:50px;padding:0 18px 0 14px;border:none;border-radius:999px;background:var(--cw-brand);color:var(--cw-brand-ink);font:600 15px var(--cw-display);box-shadow:var(--cw-shadow);cursor:pointer}
  .cw-boton svg{width:22px;height:22px;flex:none}
  .cw-boton[aria-expanded="true"]{display:none}
  .cw-panel{position:fixed;right:max(16px,env(safe-area-inset-right,0px));bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:9001;width:380px;max-width:calc(100vw - 32px);height:560px;max-height:calc(100dvh - 32px);display:none;flex-direction:column;background:var(--cw-surface);color:var(--cw-ink);border:1px solid var(--cw-line);border-radius:18px;box-shadow:var(--cw-shadow);overflow:hidden;font:400 15px/1.45 var(--cw-body)}
  .cw-panel.cw-abierto{display:flex}
  .cw-cabecera{background:var(--cw-brand);color:var(--cw-brand-ink);padding:12px 14px 12px 16px;display:flex;justify-content:space-between;align-items:center;gap:10px}
  .cw-cabecera b{font:600 16px var(--cw-display)}
  .cw-cerrar{background:none;border:none;color:inherit;font-size:26px;line-height:1;padding:2px 6px;cursor:pointer;border-radius:8px}
  .cw-mensajes{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:14px;display:flex;flex-direction:column;gap:8px;background:var(--cw-bg)}
  .cw-msg{max-width:88%;padding:9px 12px;border-radius:14px;white-space:pre-wrap;overflow-wrap:anywhere}
  .cw-bot{align-self:flex-start;background:var(--cw-surface);border:1px solid var(--cw-line);border-bottom-left-radius:4px}
  .cw-bot a{color:var(--cw-brand);font-weight:600}
  .cw-user{align-self:flex-end;background:var(--cw-brand);color:var(--cw-brand-ink);border-bottom-right-radius:4px}
  .cw-escribiendo{color:var(--cw-muted);font-style:italic}
  .cw-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 12px;background:var(--cw-bg)}
  .cw-chip{border:1px solid var(--cw-brand);color:var(--cw-brand);background:var(--cw-surface);border-radius:999px;padding:6px 12px;font:500 13px var(--cw-body);cursor:pointer}
  .cw-form{display:flex;gap:8px;padding:10px;border-top:1px solid var(--cw-line);background:var(--cw-surface)}
  .cw-input{flex:1;min-width:0;border:1px solid var(--cw-line);border-radius:12px;padding:10px 12px;background:var(--cw-surface);color:var(--cw-ink);font:inherit}
  .cw-input:focus{outline:2px solid var(--cw-brand);outline-offset:0}
  .cw-enviar{border:none;background:var(--cw-brand);color:var(--cw-brand-ink);border-radius:12px;padding:0 16px;font:600 14px var(--cw-display);cursor:pointer}
  .cw-enviar:disabled{opacity:.5;cursor:default}
  .cw-aviso{font-size:11.5px;line-height:1.35;color:var(--cw-muted);text-align:center;padding:0 12px 10px;background:var(--cw-surface)}
  @media (max-width:520px){
    .cw-boton{height:52px;width:52px;padding:0;justify-content:center}
    .cw-boton span{display:none}
    .cw-panel{inset:0;width:100vw;max-width:100vw;height:100dvh;max-height:100dvh;border-radius:0;border:none;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
  }
  @media print{.cw-boton,.cw-panel{display:none!important}}
  `;
  document.head.appendChild(estilos);

  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "cw cw-boton";
  boton.setAttribute("aria-label", "Abrir el asistente de Mi Malla UP");
  boton.setAttribute("aria-expanded", "false");
  boton.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg><span>¿Dudas? Pregúntame</span>';

  const panel = document.createElement("div");
  panel.className = "cw cw-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", TITULO);
  panel.innerHTML = `
    <div class="cw-cabecera"><b></b><button class="cw-cerrar" type="button" aria-label="Cerrar el asistente">×</button></div>
    <div class="cw-mensajes" role="log" aria-live="polite"></div>
    <div class="cw-chips"></div>
    <form class="cw-form">
      <input class="cw-input" type="text" maxlength="500" placeholder="Escribe tu pregunta…" aria-label="Tu pregunta" autocomplete="off" />
      <button class="cw-enviar" type="submit">Enviar</button>
    </form>
    <div class="cw-aviso"></div>`;
  document.body.append(boton, panel);

  const $ = (s) => panel.querySelector(s);
  $(".cw-cabecera b").textContent = TITULO;
  $(".cw-aviso").textContent = AVISO;
  const lista = $(".cw-mensajes");
  const chips = $(".cw-chips");
  const form = $(".cw-form");
  const input = $(".cw-input");
  const enviar = $(".cw-enviar");

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

  function agregar(texto, quien) {
    const div = document.createElement("div");
    div.className = `cw-msg cw-${quien}`;
    if (quien === "bot") pintar(div, texto);
    else div.textContent = texto;
    lista.appendChild(div);
    lista.scrollTop = lista.scrollHeight;
    return div;
  }

  function abrir(si) {
    panel.classList.toggle("cw-abierto", si);
    boton.setAttribute("aria-expanded", String(si));
    if (si) {
      if (!matchMedia("(pointer:coarse)").matches) input.focus(); // en celular no abre el teclado de golpe
    } else {
      boton.focus();
    }
  }

  boton.addEventListener("click", () => abrir(true));
  $(".cw-cerrar").addEventListener("click", () => abrir(false));
  panel.addEventListener("keydown", (e) => {
    if (e.key === "Escape") abrir(false);
  });

  SUGERENCIAS.forEach((t) => {
    const c = document.createElement("button");
    c.type = "button";
    c.className = "cw-chip";
    c.textContent = t;
    c.addEventListener("click", () => preguntar(t));
    chips.appendChild(c);
  });

  agregar(BIENVENIDA, "bot");

  async function preguntar(texto) {
    texto = texto.trim();
    if (!texto || ocupado) return;
    ocupado = true;
    enviar.disabled = true;
    chips.hidden = true;
    agregar(texto, "user");
    input.value = "";

    const escribiendo = agregar("Escribiendo…", "bot");
    escribiendo.classList.add("cw-escribiendo");

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
      respuesta = "No pude conectarme con el asistente. Revisa tu conexión e inténtalo de nuevo.";
    }

    escribiendo.remove();
    agregar(respuesta, "bot");
    ocupado = false;
    enviar.disabled = false;
    if (!matchMedia("(pointer:coarse)").matches) input.focus();
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    preguntar(input.value);
  });
})();
