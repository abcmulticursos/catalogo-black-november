// El visor del catálogo: lee catalogo.json (páginas, cursos y enlaces) y lo muestra como el original.
(async function () {
  var datos = await (await fetch("catalogo.json", { cache: "no-cache" })).json();
  var $ = function (id) { return document.getElementById(id); };
  var cursos = {};
  datos.categories.forEach(function (c) { cursos[c.id] = c; });
  var total = datos.pages.length;
  var esc = function (t) { var d = document.createElement("div"); d.textContent = t == null ? "" : String(t); return d.innerHTML; };

  $("logo").src = datos.brand.logo;
  $("nombre").textContent = datos.brand.name;

  var ICONO = {
    reloj: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16.5 12"/></svg>',
    bolsa: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
    flecha: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
    chat: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
  };

  // Las páginas del libro.
  var libro = $("book");
  datos.pages.forEach(function (p, i) {
    var a = document.createElement("article");
    a.className = "catalog-page";
    if (i === 0 || i === total - 1) a.setAttribute("data-density", "hard");
    var im = document.createElement("img");
    im.src = p.image;
    im.alt = p.title || "Página " + (i + 1);
    im.decoding = "async";
    im.loading = i < 4 ? "eager" : "lazy";
    a.appendChild(im);
    libro.appendChild(a);
  });

  var esCelular = window.matchMedia("(max-width: 760px)").matches;
  var flip = new St.PageFlip(libro, {
    width: 620,
    height: 880,
    size: "stretch",
    minWidth: 200,
    maxWidth: 2400,
    minHeight: 142,
    maxHeight: 3407,
    drawShadow: true,
    flippingTime: 700,
    usePortrait: esCelular,
    showCover: true,
    mobileScrollSupport: true,
  });
  flip.loadFromHTML(libro.querySelectorAll(".catalog-page"));

  // El contador («6-7 / 37») y la barra de precio del curso de la página.
  function paginasVisibles(i) {
    if (flip.getOrientation() !== "landscape" || i === 0) return [i];
    var izq = i % 2 === 1 ? i : i - 1;
    return izq + 1 < total ? [izq, izq + 1] : [izq];
  }
  var actual = 0;
  function mostrar(i) {
    actual = i;
    var vis = paginasVisibles(i);
    $("contador").textContent = vis.map(function (n) { return n + 1; }).join("-") + " / " + total;
    var url = new URL(location.href);
    url.searchParams.set("page", String(i + 1));
    history.replaceState(null, "", url);
    // El curso: el de la página derecha si es de un curso; si no, el de la izquierda.
    var c = null;
    vis.slice().reverse().forEach(function (n) { if (!c) { var x = cursos[datos.pages[n].category]; if (x && x.purchaseUrl) c = x; } });
    pintarOferta(c);
    pintarMenu();
  }
  function pintarOferta(c) {
    if (!c) { $("oferta").innerHTML = ""; return; }
    $("oferta").innerHTML =
      '<a class="bn-floating-offer" href="' + esc(c.purchaseUrl) + '" target="_blank" rel="noopener" aria-label="Ver ' + esc(c.label) + ': ' + esc(c.offerPrice) + '">' +
      '<span class="bn-offer-brand">' + ICONO.reloj + "<strong>" + esc(c.priceLabel || "BLACK NOVEMBER") + "</strong></span>" +
      '<span class="bn-offer-prices">' + (c.oldPrice ? "<s>" + esc(c.oldPrice) + "</s>" : "") + "<strong>" + esc(c.offerPrice) + "</strong>" + (c.priceSuffix ? "<small>" + esc(c.priceSuffix) + "</small>" : "") + "</span>" +
      (c.savings ? '<span class="bn-offer-save"><small>Ahorras</small><strong>' + esc(c.savings) + "</strong></span>" : "") +
      '<span class="bn-offer-action">' + ICONO.bolsa + "<strong>Ver curso</strong>" + ICONO.flecha + "</span></a>";
  }

  // «Elige tu curso»: portada y los 4 cursos; el actual con su precio y «Ver curso».
  var secciones = [{ id: "portada", label: "Portada", pagina: 0 }];
  datos.categories.forEach(function (c) {
    if (c.id === "portada") return;
    var primera = datos.pages.findIndex(function (p) { return p.category === c.id; });
    if (primera >= 0) secciones.push({ id: c.id, label: c.label, pagina: primera, curso: c });
  });
  function pintarMenu() {
    var cat = datos.pages[actual].category;
    $("lista-cursos").innerHTML = secciones.map(function (s, k) {
      var c = s.curso;
      var esActual = s.id === cat;
      var extra = esActual && c
        ? "<p>" + esc(c.description) + "</p>" +
          '<div class="course-nav-actions"><a class="course-buy" href="' + esc(c.purchaseUrl) + '" target="_blank" rel="noopener">' + ICONO.bolsa + "Ver curso</a>" +
          '<a class="course-message" href="https://walink.co/jqg0nf" target="_blank" rel="noopener">' + ICONO.chat + "Habla con tu asesor</a></div>"
        : "";
      return '<section class="course-nav-card' + (esActual ? " is-current" : "") + '">' +
        '<button class="course-nav-main" data-pagina="' + s.pagina + '"><span class="course-nav-number">' + String(k).padStart(2, "0") + "</span>" +
        "<span><strong>" + esc(s.label) + "</strong>" + (c && c.offerPrice ? "<small>" + esc(c.offerPrice) + (c.priceSuffix ? " " + esc(c.priceSuffix) : "") + "</small>" : "") + "</span>" + ICONO.flecha + "</button>" +
        extra + "</section>";
    }).join("");
  }

  // Búsqueda por título, módulo, descripción y palabras clave.
  var sinTildes = function (t) { return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  $("busqueda").addEventListener("input", function () {
    var q = sinTildes(this.value.trim());
    if (!q) { $("resultados").innerHTML = '<p class="empty-message">Escribe una palabra para encontrar una hoja.</p>'; return; }
    var hall = datos.pages.map(function (p, i) { return { p: p, i: i }; }).filter(function (x) {
      return sinTildes([x.p.title, x.p.module, x.p.description].concat(x.p.keywords || []).join(" ")).indexOf(q) !== -1;
    });
    $("resultados").innerHTML = hall.length
      ? hall.map(function (x) { return '<button class="result-item" data-pagina="' + x.i + '"><strong>' + esc(x.p.title) + "</strong><small>Página " + (x.i + 1) + " · " + esc(x.p.module) + "</small></button>"; }).join("")
      : '<p class="empty-message">No encontré hojas con esa palabra.</p>';
  });

  // Paneles.
  function abrir(panel) {
    $("menu").classList.toggle("is-open", panel === "menu");
    $("buscador").classList.toggle("is-open", panel === "buscar");
    $("fondo").classList.toggle("is-visible", !!panel);
    if (panel === "buscar") setTimeout(function () { $("busqueda").focus(); }, 50);
  }
  function irA(i) {
    abrir(null);
    flip.turnToPage(i);
    mostrar(i);
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-accion], [data-pagina]");
    if (!b) return;
    if (b.hasAttribute("data-pagina")) return irA(parseInt(b.getAttribute("data-pagina"), 10));
    var a = b.getAttribute("data-accion");
    if (a === "anterior") flip.flipPrev();
    else if (a === "siguiente") flip.flipNext();
    else if (a === "menu") abrir($("menu").classList.contains("is-open") ? null : "menu");
    else if (a === "buscar") abrir($("buscador").classList.contains("is-open") ? null : "buscar");
    else if (a === "cerrar") abrir(null);
  });
  $("ir-portada").onclick = function () { irA(0); };
  document.addEventListener("keydown", function (e) {
    if (e.target && e.target.tagName === "INPUT") { if (e.key === "Escape") abrir(null); return; }
    if (e.key === "ArrowRight") flip.flipNext();
    if (e.key === "ArrowLeft") flip.flipPrev();
    if (e.key === "Escape") abrir(null);
  });

  flip.on("flip", function (e) { mostrar(e.data); });
  flip.on("changeOrientation", function () { mostrar(actual); });
  var inicial = Math.min(Math.max(parseInt(new URL(location.href).searchParams.get("page") || "1", 10) || 1, 1), total) - 1;
  if (inicial > 0) flip.turnToPage(inicial);
  mostrar(inicial);
})();
