/* =========================================================
   CPPEM · Operação Black · Assinatura Até a Farda
   CTA → checkout direto, sem formulário intermediário.
   ========================================================= */
(function () {
  "use strict";

  var CONFIG = {
    pagina: "operacao_black_ate_a_farda",
    checkout: "https://checkout.cppem.com.br/pay/assinatura-ate-a-farda",

    /* Fim da oferta (horário de Brasília). Até lá os botões levam ao
       checkout; depois, "Oferta encerrada". */
    fim: "2026-11-20T23:59:59-03:00",

    valor: 747,

    /* Id da regra de CLIQUE do painel PixelX (TRACKING.md §8). Preencha
       quando a regra for criada: ele vai para o botão do hero. Só pode
       existir UMA vez na página. */
    clickRuleId: "",

    utmFallback: {
      utm_source:   "site",
      utm_medium:   "organico",
      utm_campaign: "operacao_black",
      utm_content:  "cppem",
      utm_term:     "lp_ate_a_farda"
    }
  };

  var PASSTHROUGH = [
    "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
    "fbclid", "gclid", "ttclid", "sck", "src", "xcod", "ref"
  ];
  var REDIRECT_DELAY_MS = 600; // §7.6 — dá tempo da tag disparar antes de sair

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var rand = function (a, b) { return a + Math.random() * (b - a); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  var Store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  function track(evento, dados) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: evento, pagina: CONFIG.pagina }, dados || {}));
  }

  /* =========================================================
     CHECKOUT — UTMs, sck/external_id e cookies do Meta
     ========================================================= */
  function getCookie(nome) {
    var m = document.cookie.match(new RegExp("(^|;\\s*)" + nome + "=([^;]*)"));
    return m ? decodeURIComponent(m[2]) : "";
  }

  function visitorId() {
    var KEY = "cppem_visitor_id";
    var id = Store.get(KEY);
    if (!id) {
      id = (window.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : "v-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
      Store.set(KEY, id);
    }
    return id;
  }

  /* Origem gravada na primeira visita: quem volta pelo histórico não
     chega ao checkout sem UTM. */
  function origem() {
    var KEY = "cppem_origem_" + CONFIG.pagina;
    var url = new URLSearchParams(location.search), atual = {};
    PASSTHROUGH.forEach(function (k) { var v = url.get(k); if (v) atual[k] = v; });
    if (Object.keys(atual).length) { Store.set(KEY, JSON.stringify(atual)); return atual; }
    try {
      var salvo = JSON.parse(Store.get(KEY) || "{}");
      if (Object.keys(salvo).length) return salvo;
    } catch (e) {}
    return Object.assign({}, CONFIG.utmFallback);
  }

  function checkoutURL() {
    var url = new URL(CONFIG.checkout), o = origem(), id = visitorId();
    Object.keys(o).forEach(function (k) { url.searchParams.set(k, o[k]); });
    if (!url.searchParams.get("sck")) url.searchParams.set("sck", id);
    url.searchParams.set("external_id", id);
    var fbp = getCookie("_fbp"), fbc = getCookie("_fbc");
    if (fbp) url.searchParams.set("fbp", fbp);
    if (fbc) url.searchParams.set("fbc", fbc);
    return url.toString();
  }
  window.checkoutURL = checkoutURL;

  /* =========================================================
     FASES DA OFERTA + RELÓGIO
     ========================================================= */
  var T_FIM = new Date(CONFIG.fim).getTime();
  var faseAtual = null;

  function fase() { return Date.now() >= T_FIM ? "encerrada" : "aberta"; }

  var ctas = $$("[data-checkout]");
  ctas.forEach(function (b) {
    var l = $(".cta__label", b), s = $("[data-cta-sub]", b);
    b.dataset.labelOrig = l ? l.textContent : "";
    b.dataset.subOrig = s ? s.textContent : "";
  });

  function aplicarFase(f) {
    if (f === faseAtual) return;
    faseAtual = f;
    document.documentElement.dataset.fase = f;
    var txt = f === "aberta" ? "A oferta encerra em" : "Operação encerrada";
    $$("[data-fase-txt]").forEach(function (el) { el.textContent = txt; });

    ctas.forEach(function (b) {
      var l = $(".cta__label", b), s = $("[data-cta-sub]", b);
      if (f === "aberta") {
        b.removeAttribute("aria-disabled");
        if (l) l.textContent = b.dataset.labelOrig;
        if (s) s.textContent = b.dataset.subOrig;
      } else {
        b.setAttribute("aria-disabled", "true");
        if (l) l.textContent = "Oferta encerrada";
        if (s) s.textContent = "A Operação Black terminou em 20/11";
      }
    });
  }

  var relogios = $$("[data-relogio]");
  function dois(n) { return (n < 10 ? "0" : "") + n; }
  function tique() {
    var f = fase();
    aplicarFase(f);
    var resta = Math.max(0, T_FIM - Date.now());
    var d = Math.floor(resta / 864e5), h = Math.floor(resta / 36e5) % 24,
        m = Math.floor(resta / 6e4) % 60, s = Math.floor(resta / 1e3) % 60;
    var texto = f === "encerrada" ? "00:00:00" : (d > 0 ? d + "d " : "") + dois(h) + ":" + dois(m) + ":" + dois(s);
    relogios.forEach(function (el) { el.textContent = texto; });
  }
  tique();
  setInterval(tique, 1000);

  /* =========================================================
     CLIQUE NOS CTAs
     ========================================================= */
  if (CONFIG.clickRuleId) {
    var principal = $("[data-cta-principal]");
    if (principal) principal.id = CONFIG.clickRuleId;
  }

  var indo = false;
  ctas.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      if (faseAtual !== "aberta") {
        track("cta_travado", { fase: faseAtual, cta: btn.dataset.cta });
        return;
      }
      if (indo) return;
      indo = true;
      document.documentElement.setAttribute("data-indo-checkout", "1"); // exit-popup.js não interrompe
      var destino = checkoutURL();
      track("iniciar_checkout", { valor: CONFIG.valor, moeda: "BRL", produto: "assinatura_ate_a_farda", cta: btn.dataset.cta || "desconhecido" });
      var l = $(".cta__label", btn);
      if (l) l.textContent = "Abrindo checkout...";
      setTimeout(function () { location.href = destino; }, REDIRECT_DELAY_MS);
      setTimeout(function () { // rede lenta não pode deixar o botão morto
        indo = false;
        document.documentElement.removeAttribute("data-indo-checkout");
        if (l) l.textContent = btn.dataset.labelOrig;
      }, REDIRECT_DELAY_MS + 6000);
    });
  });

  /* =========================================================
     REVEAL AO ROLAR (+ ficha item a item, contadores)
     ========================================================= */
  $$("[data-ficha] li").forEach(function (li, i) { li.style.setProperty("--i", i); });

  function contar(el) {
    var fim = +el.dataset.conta, pre = el.dataset.prefixo || "";
    if (reduced) { el.textContent = pre + fim.toLocaleString("pt-BR"); return; }
    var t0 = performance.now(), dur = 1800;
    (function passo(t) {
      var k = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 4);
      el.textContent = pre + Math.round(fim * e).toLocaleString("pt-BR");
      if (k < 1) requestAnimationFrame(passo);
    })(t0);
  }

  (function reveal() {
    var itens = $$("[data-reveal], [data-ficha], .cofre");
    if (!("IntersectionObserver" in window) || reduced) {
      itens.forEach(function (el) { el.classList.add("is-in"); });
      $$("[data-conta]").forEach(contar);
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        $$("[data-conta]", e.target).forEach(contar);
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: .15 });
    itens.forEach(function (el) {
      // irmãos lado a lado entram em cascata
      var irmaos = el.parentElement ? $$(":scope > [data-reveal]", el.parentElement) : [];
      var i = irmaos.indexOf(el);
      if (i > 0) el.style.transitionDelay = (i * .1) + "s";
      io.observe(el);
    });
  })();

  /* faixas infinitas: duplica o conteúdo para o loop em -50% não ter emenda */
  $$("[data-duplicar], .mural__faixa").forEach(function (ul) {
    $$(":scope > li", ul).forEach(function (li) {
      var c = li.cloneNode(true);
      c.setAttribute("aria-hidden", "true");
      $$("img", c).forEach(function (img) { img.alt = ""; });
      ul.appendChild(c);
    });
  });

  /* =========================================================
     HERO — parallax leve do leão no mouse
     ========================================================= */
  (function parallax() {
    var hero = $(".hero");
    if (!hero || reduced || !window.matchMedia("(pointer: fine)").matches) return;
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty("--px", ((e.clientX - r.left) / r.width - .5).toFixed(3));
      hero.style.setProperty("--py", ((e.clientY - r.top) / r.height - .5).toFixed(3));
    });
  })();

  /* barra fixa de compra: aparece depois do hero, some na oferta */
  (function barra() {
    var b = $("[data-barra-compra]"), hero = $(".hero"), oferta = $("#oferta");
    if (!b || !("IntersectionObserver" in window)) return;
    var passouHero = false, naOferta = false;
    function upd() {
      var on = passouHero && !naOferta;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-hidden", on ? "false" : "true");
      var a = $("a", b); if (a) a.tabIndex = on ? 0 : -1;
    }
    new IntersectionObserver(function (e) { passouHero = !e[0].isIntersecting; upd(); }, { threshold: 0 }).observe(hero);
    new IntersectionObserver(function (e) { naOferta = e[0].isIntersecting; upd(); }, { threshold: .1 }).observe(oferta);
  })();

  /* =========================================================
     2 · O CAMINHO
     A trilha corre da esquerda para a direita, numa faixa no alto do palco.
     O "mundo" (rota, marcos, viajante) desliza para a esquerda enquanto o
     viajante anda; a farda fica PARADA no horizonte, sempre à frente.
     O viajante para em 86% da rota — nesse ponto o fim da rota encosta na
     farda e o resto vira um fluxo de luz: o trecho que a gente faz junto.
     ========================================================= */
  (function caminho() {
    var sec = $("#caminho");
    if (!sec) return;
    var svg = $(".caminho__mapa", sec);
    var NS = "http://www.w3.org/2000/svg";
    var mundo = $("[data-mundo]", svg), rota = $("[data-rota]", svg), andado = $("[data-andado]", svg),
        glow = $("[data-andado-glow]", svg), fluxo = $("[data-fluxo]", svg),
        gMarcos = $("[data-marcos]", svg), farda = $("[data-farda]", svg),
        sol = $("[data-sol]", svg), viajante = $("[data-viajante]", svg), mira = $("[data-mira]", svg);
    var etapas = $$(".etapa", sec), barra = $("[data-passo-barra]", sec), passoLbl = $("[data-passo-label]", sec);
    // tela da plataforma: qual ferramenta leva você em cada trecho
    var tela = $("[data-tela]", sec), telaImgs = $$("[data-tela-img]", sec), telaTit = $("[data-tela-titulo]", sec);
    var TELAS = { 1: "Plataforma CPPEM · Todos os dispositivos", 2: "Plataforma CPPEM · Missão do dia", 3: "Plataforma CPPEM · Rendimento", 4: "Mentoria semanal · Prof. Everton Mota" };

    var F = [0, .17, .36, .54, .72, .86];      // onde cada etapa acontece na rota
    var PARA = F[F.length - 1];
    var ROTULOS = ["Você", "CPPEM", "Missão diária", "Evolução", "Mentoria"];
    var N = etapas.length;
    var L = 0, marcos = [], cam = 0, alvoX = 0, alvoY = 0, escMira = 1;

    function ponto(f) { return rota.getPointAtLength(clamp(f, 0, 1) * L); }

    /* Catmull-Rom → Bézier: curva suave passando por todos os pontos */
    function suave(p) {
      var d = "M" + p[0][0] + " " + p[0][1];
      for (var i = 0; i < p.length - 1; i++) {
        var a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c;
        d += " C" + (b[0] + (c[0] - a[0]) / 6).toFixed(1) + " " + (b[1] + (c[1] - a[1]) / 6).toFixed(1) +
             " " + (c[0] - (e[0] - b[0]) / 6).toFixed(1) + " " + (c[1] - (e[1] - b[1]) / 6).toFixed(1) +
             " " + c[0].toFixed(1) + " " + c[1].toFixed(1);
      }
      return d;
    }

    function montar() {
      var r = svg.getBoundingClientRect(), W = r.width, H = r.height;
      if (!W || !H) return;
      var estreita = W < 760;
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);

      // faixa da trilha: no alto, deixando a metade de baixo para o cartão
      var faixaY = H * (estreita ? .17 : .27);
      var amp    = H * (estreita ? .055 : .1);
      var x0     = W * (estreita ? .1 : .08);
      var fardaX = W * (estreita ? .8 : .86);
      var mundoW = W * (estreita ? 3.4 : 3);

      var pts = [], n = 9;
      for (var i = 0; i < n; i++) {
        var onda = (i === 0 || i === n - 1) ? 0 : (i % 2 ? -1 : 1) * (i === 1 ? .5 : 1);
        pts.push([x0 + (mundoW - x0) * i / (n - 1), faixaY + amp * onda]);
      }
      var d = suave(pts);
      [rota, andado, glow].forEach(function (p) { p.setAttribute("d", d); });
      L = rota.getTotalLength();
      [andado, glow].forEach(function (p) { p.style.strokeDasharray = L + " " + L; });

      // câmera: no fim (viajante em 86%) o fim da rota fica embaixo da farda
      cam = mundoW - fardaX;

      var fl = [];
      for (var k = 0; k <= 30; k++) { var q = ponto(PARA + (1 - PARA) * k / 30); fl.push(q.x.toFixed(1) + " " + q.y.toFixed(1)); }
      fluxo.setAttribute("d", "M" + fl.join(" L"));

      var esc = estreita ? .46 : .9;
      alvoX = fardaX; alvoY = faixaY; escMira = esc;
      farda.setAttribute("transform", "translate(" + fardaX + " " + faixaY + ") scale(" + esc + ")");
      sol.setAttribute("cx", fardaX); sol.setAttribute("cy", faixaY);
      sol.setAttribute("r", estreita ? 170 : 280);
      var some = $("[data-some]", svg), someRect = $("[data-some-rect]", svg);
      some.setAttribute("x1", fardaX - (estreita ? 70 : 120));
      some.setAttribute("x2", fardaX - (estreita ? 25 : 40));
      someRect.setAttribute("width", W); someRect.setAttribute("height", H);

      gMarcos.innerHTML = "";
      marcos = ROTULOS.map(function (rot, i) {
        var p = ponto(F[i]), g = document.createElementNS(NS, "g");
        g.setAttribute("class", "marco");
        g.setAttribute("transform", "translate(" + p.x.toFixed(1) + " " + p.y.toFixed(1) + ")");
        var c = document.createElementNS(NS, "circle"); c.setAttribute("r", i === 0 ? 7 : 10);
        var t = document.createElementNS(NS, "text");
        // rótulo sempre embaixo: em cima fica o leão que anda com o viajante
        t.setAttribute("x", 0); t.setAttribute("y", 34);
        t.setAttribute("text-anchor", "middle");
        t.textContent = rot;
        g.appendChild(c); g.appendChild(t); gMarcos.appendChild(g);
        return g;
      });
      ultimaEtapa = -1;
      atualizar();
    }

    var ultimaEtapa = -1;
    function atualizar() {
      if (!L) return;
      var r = sec.getBoundingClientRect();
      var total = sec.offsetHeight - window.innerHeight;
      var p = clamp(-r.top / (total || 1), 0, 1);

      // etapa k vale em [k/N, (k+1)/N); dentro dela o viajante vai de F[k] a F[k+1]
      var k = Math.min(N - 1, Math.floor(p * N));
      var local = clamp(p * N - k, 0, 1);
      var e = local < .5 ? 2 * local * local : 1 - Math.pow(-2 * local + 2, 2) / 2;
      var f = k < N - 1 ? F[k] + (F[k + 1] - F[k]) * e : PARA;

      mundo.setAttribute("transform", "translate(" + (-cam * f / PARA).toFixed(1) + " 0)");
      var off = L * (1 - f);
      andado.style.strokeDashoffset = off;
      glow.style.strokeDashoffset = off;
      var v = ponto(f);
      viajante.setAttribute("transform", "translate(" + v.x.toFixed(1) + " " + v.y.toFixed(1) + ")");
      sol.style.opacity = (.2 + p * .7).toFixed(3);

      // reta final: a mira nasce no viajante e corre até a farda, onde trava
      if (k === N - 1) {
        var ida = clamp(local / .55, 0, 1), ei = 1 - Math.pow(1 - ida, 3);
        var mx = v.x - cam + (alvoX - (v.x - cam)) * ei, my = v.y + (alvoY - v.y) * ei;
        mira.setAttribute("transform", "translate(" + mx.toFixed(1) + " " + my.toFixed(1) + ") scale(" + escMira + ")");
        mira.classList.toggle("is-travada", ida >= 1);
      } else {
        mira.classList.remove("is-travada");
      }

      marcos.forEach(function (m, i) { m.classList.toggle("is-on", f >= F[i] - .001); });
      sec.classList.toggle("tem-leao", k >= 1);
      sec.classList.toggle("is-final", k === N - 1);
      if (barra) barra.style.transform = "scaleX(" + p.toFixed(3) + ")";

      if (k !== ultimaEtapa) {
        etapas.forEach(function (el, i) {
          el.classList.toggle("is-on", i === k);
          el.classList.toggle("is-passou", i < k);
          el.setAttribute("aria-hidden", i === k ? "false" : "true");
          $$("a", el).forEach(function (a) { a.tabIndex = i === k ? 0 : -1; });
        });
        if (passoLbl) passoLbl.textContent = k === N - 1 ? "∞" : dois(k + 1);
        if (tela) {
          tela.classList.toggle("is-on", !!TELAS[k]);
          tela.classList.toggle("is-live", k === 4);
          if (TELAS[k]) telaTit.textContent = TELAS[k];
          telaImgs.forEach(function (im) { im.classList.toggle("is-on", +im.dataset.telaImg === k); });
        }
        if (ultimaEtapa !== -1) track("caminho_etapa", { etapa: k });
        ultimaEtapa = k;
      }
    }

    var pedido = false;
    function agendar() { if (!pedido) { pedido = true; requestAnimationFrame(function () { pedido = false; atualizar(); }); } }
    var redim;
    window.addEventListener("scroll", agendar, { passive: true });
    window.addEventListener("resize", function () { clearTimeout(redim); redim = setTimeout(montar, 120); });
    montar();
  })();

  /* =========================================================
     ATMOSFERA — fumaça e brasas em canvas
     ========================================================= */
  if (reduced) return;

  function sprite(tam, desenhar) {
    var c = document.createElement("canvas");
    c.width = c.height = tam;
    desenhar(c.getContext("2d"), tam);
    return c;
  }

  /* nuvem de fumaça: dezenas de bolhas suaves sobrepostas, tom quente
     (a fumaça da arte do leão é marrom-dourada, não cinza) */
  var SPRITE_FUMACA = sprite(256, function (g, s) {
    for (var i = 0; i < 46; i++) {
      var a = Math.random() * Math.PI * 2, d = Math.random() * s * .26;
      var x = s / 2 + Math.cos(a) * d, y = s / 2 + Math.sin(a) * d * .7, r = rand(s * .12, s * .3);
      var gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, "rgba(190,145,90,.10)");
      gr.addColorStop(.5, "rgba(140,100,60,.05)");
      gr.addColorStop(1, "rgba(120,85,50,0)");
      g.fillStyle = gr;
      g.fillRect(0, 0, s, s);
    }
  });

  var SPRITE_BRASA = sprite(32, function (g, s) {
    var gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, "rgba(255,240,200,1)");
    gr.addColorStop(.25, "rgba(255,170,70,.9)");
    gr.addColorStop(.6, "rgba(255,90,20,.25)");
    gr.addColorStop(1, "rgba(255,60,0,0)");
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
  });

  var estreita = window.innerWidth < 760;
  var intensidade = 1; // sobe perto da oferta e do fecho: "fogo"

  (function fogoPerto() {
    if (!("IntersectionObserver" in window)) return;
    var dentro = {};
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { dentro[e.target.id || e.target.className] = e.isIntersecting; });
      intensidade = Object.keys(dentro).some(function (k) { return dentro[k]; }) ? 2.2 : 1;
    }, { threshold: .05 });
    $$("#oferta, .fecho, #bonus").forEach(function (el) { io.observe(el); });
  })();

  /* ---------- fumaça: canvas em meia resolução (fumaça é borrada mesmo) ---------- */
  (function fumaca() {
    var cv = $("#fumaca");
    if (!cv) return;
    var ctx = cv.getContext("2d"), ESC = .5, W, H, nuvens = [], ultimoY = window.scrollY;
    function medir() {
      W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.round(W * ESC); cv.height = Math.round(H * ESC);
    }
    function nova(espalhada) {
      var t = rand(.6, 1.4) * Math.max(W, H) * (estreita ? .9 : .6);
      return {
        x: rand(-.2, 1.1) * W, y: espalhada ? rand(.1, 1.1) * H : H + t * .3,
        t: t, vx: rand(4, 14) * (Math.random() < .5 ? -1 : 1), vy: -rand(2, 7),
        rot: rand(0, 6.28), vr: rand(-.03, .03), a: rand(.35, .8), prof: rand(.08, .3)
      };
    }
    medir();
    var qtd = estreita ? 6 : 10;
    for (var i = 0; i < qtd; i++) nuvens.push(nova(true));

    var ativo = false, ultimo = 0;
    function passo(ts) {
      var dt = Math.min((ts - ultimo) / 1000, .05); ultimo = ts;
      var dy = window.scrollY - ultimoY; ultimoY = window.scrollY;
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (var i = 0; i < nuvens.length; i++) {
        var n = nuvens[i];
        n.x += n.vx * dt; n.y += n.vy * dt - dy * n.prof; n.rot += n.vr * dt;
        // saiu da tela: renasce do lado oposto
        if (n.x < -n.t) n.x = W + n.t * .4; else if (n.x > W + n.t) n.x = -n.t * .4;
        if (n.y < -n.t) n.y = H + n.t * .4; else if (n.y > H + n.t) n.y = -n.t * .4;
        ctx.save();
        ctx.globalAlpha = n.a * (intensidade > 1 ? 1.25 : 1);
        ctx.translate(n.x * ESC, n.y * ESC); ctx.rotate(n.rot);
        var s = n.t * ESC;
        ctx.drawImage(SPRITE_FUMACA, -s / 2, -s / 2, s, s);
        ctx.restore();
      }
      if (!document.hidden) requestAnimationFrame(passo); else ativo = false;
    }
    function ligar() { if (ativo) return; ativo = true; ultimo = performance.now(); requestAnimationFrame(passo); }
    ligar();
    window.addEventListener("resize", medir);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) ligar(); });
  })();

  /* ---------- brasas subindo pela página (mesmo motor da captura) ---------- */
  (function brasas() {
    var cv = $("#brasas");
    if (!cv) return;
    var ctx = cv.getContext("2d"), W, H, base, lista = [], ultimo = 0, ativo = false;
    function medir() {
      W = window.innerWidth; H = window.innerHeight;
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      base = W < 760 ? 12 : 26;
    }
    function nova(espalhada) {
      return { x: Math.random() * W, y: espalhada ? Math.random() * H : H + 12,
        vx: rand(-5, 5), vy: -rand(18, 48), r: rand(.9, 2.3), vida: 0, max: rand(6, 13), fase: Math.random() * 6.28 };
    }
    function passo(ts) {
      var dt = Math.min((ts - ultimo) / 1000, .05), t = ts / 1000; ultimo = ts;
      var alvo = Math.round(base * intensidade);
      if (lista.length < alvo && Math.random() < .5) lista.push(nova(false));
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      for (var i = lista.length - 1; i >= 0; i--) {
        var q = lista[i];
        q.vida += dt;
        q.x += (q.vx + Math.sin(t * 1.3 + q.fase) * 14) * dt;
        q.y += q.vy * dt * (intensidade > 1 ? 1.3 : 1);
        if (q.vida >= q.max || q.y < -20 || (lista.length > alvo && q.vida > q.max * .5)) { lista.splice(i, 1); continue; }
        var k = q.vida / q.max;
        ctx.globalAlpha = Math.max(0, Math.sin(k * Math.PI) * (.5 + .3 * Math.sin(t * 7 + q.fase * 3)));
        var rb = q.r * 5;
        ctx.drawImage(SPRITE_BRASA, q.x - rb, q.y - rb, rb * 2, rb * 2);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      if (!document.hidden) requestAnimationFrame(passo); else ativo = false;
    }
    function ligar() { if (ativo) return; ativo = true; ultimo = performance.now(); requestAnimationFrame(passo); }
    medir();
    for (var i = 0; i < base; i++) lista.push(nova(true));
    ligar();
    window.addEventListener("resize", medir);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) ligar(); });
  })();
})();
