// El visor del catálogo: lee catalogo.json (páginas, cursos y enlaces) y lo muestra como libro.
(async function () {
  var datos = await (await fetch("catalogo.json", { cache: "no-cache" })).json();
  var cursos = {};
  datos.categories.forEach(function (c) { cursos[c.id] = c; });
  var $ = function (id) { return document.getElementById(id); };

  $("logo").src = datos.brand.logo;
  $("nombre").textContent = datos.brand.name;
  document.title = datos.brand.name;

  // La medida de las páginas, de la primera imagen.
  var muestra = await new Promise(function (ok) {
    var im = new Image();
    im.onload = function () { ok({ w: im.naturalWidth, h: im.naturalHeight }); };
    im.onerror = function () { ok({ w: 1080, h: 1350 }); };
    im.src = datos.pages[0].image;
  });

  var libro = $("libro");
  datos.pages.forEach(function (p, i) {
    var d = document.createElement("div");
    d.className = "pagina";
    var im = document.createElement("img");
    im.src = p.image;
    im.alt = p.title || "Página " + (i + 1);
    im.loading = i < 4 ? "eager" : "lazy";
    d.appendChild(im);
    libro.appendChild(d);
  });

  var esCelular = window.matchMedia("(max-width: 760px)").matches;
  var flip = new St.PageFlip(libro, {
    width: muestra.w,
    height: muestra.h,
    size: "stretch",
    minWidth: 240,
    maxWidth: 1400,
    minHeight: 300,
    maxHeight: 2400,
    showCover: true,
    usePortrait: true,
    mobileScrollSupport: true,
    maxShadowOpacity: 0.4,
  });
  flip.loadFromHTML(libro.querySelectorAll(".pagina"));

  // Que el libro quepa en la pantalla (alto disponible).
  function ajustar() {
    var alto = window.innerHeight - (esCelular ? 250 : 220);
    var ancho = Math.min(window.innerWidth - (esCelular ? 12 : 120), alto * (muestra.w / muestra.h) * (flip.getOrientation() === "landscape" ? 2 : 1));
    libro.style.width = Math.max(240, ancho) + "px";
    flip.update();
  }
  window.addEventListener("resize", ajustar);
  ajustar();

  // La barra de compra, según el curso de la página.
  function mostrar(i) {
    var p = datos.pages[i] || datos.pages[0];
    var c = cursos[p.category];
    $("pagina-n").textContent = "Página " + (i + 1) + " de " + datos.pages.length;
    var url = new URL(location.href);
    url.searchParams.set("page", String(i + 1));
    history.replaceState(null, "", url);
    if (!c || !c.purchaseUrl) { $("compra").hidden = true; return; }
    $("compra").hidden = false;
    $("compra-curso").textContent = c.label;
    $("compra-etiqueta").textContent = c.priceLabel || "";
    $("compra-antes").textContent = c.oldPrice || "";
    $("compra-oferta").textContent = c.offerPrice || "";
    $("compra-sufijo").textContent = c.priceSuffix || "";
    $("compra-ahorro").textContent = c.savings ? "-" + c.savings : "";
    $("compra-ahorro").hidden = !c.savings;
    $("compra-boton").href = c.purchaseUrl;
    $("compra-boton").textContent = "Ver curso";
  }
  flip.on("flip", function (e) { mostrar(e.data); });

  var inicial = Math.min(Math.max(parseInt(new URL(location.href).searchParams.get("page") || "1", 10) || 1, 1), datos.pages.length) - 1;
  if (inicial > 0) flip.turnToPage(inicial);
  mostrar(inicial);

  $("anterior").onclick = function () { flip.flipPrev(); };
  $("siguiente").onclick = function () { flip.flipNext(); };
  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") flip.flipNext();
    if (e.key === "ArrowLeft") flip.flipPrev();
    if (e.key === "Escape") $("indice").hidden = true;
  });

  // «Explorar los 4 cursos»: cada curso lleva a su primera página.
  var lista = $("indice-lista");
  datos.categories.filter(function (c) { return c.purchaseUrl; }).forEach(function (c) {
    var primera = datos.pages.findIndex(function (p) { return p.category === c.id; });
    var b = document.createElement("button");
    b.type = "button";
    b.className = "curso";
    b.innerHTML = "<b></b><small></small>";
    b.querySelector("b").textContent = c.label;
    b.querySelector("small").textContent = (c.description || "") + (c.offerPrice ? " · " + c.offerPrice + (c.priceSuffix ? " " + c.priceSuffix : "") : "");
    b.onclick = function () {
      $("indice").hidden = true;
      flip.turnToPage(primera);
      mostrar(primera);
    };
    lista.appendChild(b);
  });
  $("ver-cursos").onclick = function () { $("indice").hidden = false; };
  $("cerrar-indice").onclick = function () { $("indice").hidden = true; };
  $("indice").onclick = function (e) { if (e.target === $("indice")) $("indice").hidden = true; };
})();
