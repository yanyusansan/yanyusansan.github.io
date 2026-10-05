/* ==========================================================================
   胶体量子点发光二极管发光机理研究 · 交互脚本（原生 JS，无依赖）
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- 首屏 canvas */
  function heroCanvas() {
    var cv = document.getElementById('hero-canvas');
    if (!cv) return;
    var ctx = cv.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, dots = [], photons = [];

    var palette = [
      [47, 123, 255], [49, 208, 255], [53, 224, 138], [255, 196, 94], [255, 95, 126]
    ];

    function resize() {
      var r = cv.getBoundingClientRect();
      w = r.width; h = r.height;
      cv.width = Math.floor(w * dpr);
      cv.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function seed() {
      dots = [];
      var n = Math.max(26, Math.min(58, Math.round(w * h / 26000)));
      for (var i = 0; i < n; i++) {
        var c = palette[Math.floor(Math.random() * palette.length)];
        dots.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 1.6 + Math.random() * 3.4,
          vx: (Math.random() - 0.5) * 0.16,
          vy: (Math.random() - 0.5) * 0.16,
          ph: Math.random() * Math.PI * 2,
          col: c
        });
      }
      photons = [];
    }

    function step(t) {
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        d.x += d.vx; d.y += d.vy;
        if (d.x < -20) d.x = w + 20; if (d.x > w + 20) d.x = -20;
        if (d.y < -20) d.y = h + 20; if (d.y > h + 20) d.y = -20;

        var pulse = 0.55 + 0.45 * Math.sin(t / 1400 + d.ph);
        var g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 9);
        g.addColorStop(0, 'rgba(' + d.col.join(',') + ',' + (0.5 * pulse).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(' + d.col.join(',') + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r * 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,' + (0.55 + 0.35 * pulse).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r * 0.55, 0, Math.PI * 2);
        ctx.fill();

        if (!reduceMotion && Math.random() < 0.0025 && photons.length < 70) {
          var a = Math.random() * Math.PI * 2;
          photons.push({ x: d.x, y: d.y, vx: Math.cos(a) * 1.5, vy: Math.sin(a) * 1.5, life: 1, col: d.col });
        }
      }

      for (var k = photons.length - 1; k >= 0; k--) {
        var p = photons[k];
        p.x += p.vx; p.y += p.vy; p.life -= 0.012;
        if (p.life <= 0) { photons.splice(k, 1); continue; }
        ctx.strokeStyle = 'rgba(' + p.col.join(',') + ',' + (p.life * 0.8).toFixed(3) + ')';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 5, p.y - p.vy * 5);
        ctx.stroke();
      }

      if (!reduceMotion) requestAnimationFrame(step);
    }

    resize();
    window.addEventListener('resize', debounce(resize, 200));
    if (reduceMotion) { step(0); } else { requestAnimationFrame(step); }
  }

  function debounce(fn, ms) {
    var id;
    return function () {
      clearTimeout(id);
      id = setTimeout(fn, ms);
    };
  }

  /* ---------------------------------------------------------------- 导航与进度 */
  function nav() {
    var navEl = document.getElementById('nav');
    var bar = document.getElementById('progress');
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
    var sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });

    function onScroll() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var p = max > 0 ? (window.scrollY / max) : 0;
      bar.style.width = (p * 100).toFixed(2) + '%';
      navEl.classList.toggle('solid', window.scrollY > 40);

      var active = -1;
      for (var i = 0; i < sections.length; i++) {
        if (sections[i] && sections[i].getBoundingClientRect().top <= 140) active = i;
      }
      links.forEach(function (a, i) { a.classList.toggle('active', i === active); });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------------------------- 滚动揭示 */
  function reveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    function all() {
      items.forEach(function (el) { el.classList.add('in'); });
    }
    if (!('IntersectionObserver' in window)) { all(); return; }
    var fired = false;
    var io = new IntersectionObserver(function (entries) {
      fired = true;
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
    /* 兜底：若观察器始终未回调（打印、爬虫、异常环境），1.5 s 后直接显示全部内容 */
    setTimeout(function () { if (!fired) all(); }, 1500);
  }

  /* ---------------------------------------------------------------- 数据条动画 */
  function bars() {
    var fills = document.querySelectorAll('.bar-fill');
    if (!fills.length) return;
    function run(el) { el.style.width = (el.getAttribute('data-w') || 0) + '%'; }
    function all() { fills.forEach(run); }
    if (!('IntersectionObserver' in window)) { all(); return; }
    var fired = false;
    var io = new IntersectionObserver(function (entries) {
      fired = true;
      entries.forEach(function (e) {
        if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    fills.forEach(function (el) { io.observe(el); });
    setTimeout(function () { if (!fired) all(); }, 1500);
  }

  /* ---------------------------------------------------------------- 波长 → 颜色 */
  function wavelengthToRGB(l) {
    var r = 0, g = 0, b = 0;
    if (l >= 380 && l < 440) { r = -(l - 440) / 60; b = 1; }
    else if (l < 490) { g = (l - 440) / 50; b = 1; }
    else if (l < 510) { g = 1; b = -(l - 510) / 20; }
    else if (l < 580) { r = (l - 510) / 70; g = 1; }
    else if (l < 645) { r = 1; g = -(l - 645) / 65; }
    else if (l <= 780) { r = 1; }
    var f = 1;
    if (l > 700) f = 0.3 + 0.7 * (780 - l) / 80;
    else if (l < 420) f = 0.3 + 0.7 * (l - 380) / 40;
    function q(c) { return Math.round(255 * Math.pow(Math.max(0, c) * f, 0.8)); }
    return [q(r), q(g), q(b)];
  }

  function colorName(l) {
    if (l < 465) return '深蓝光';
    if (l < 495) return '蓝青光';
    if (l < 545) return '绿光';
    if (l < 585) return '黄绿光';
    if (l < 620) return '橙黄光';
    return '红光';
  }

  /* ---------------------------------------------------------------- 尺寸调色盘 */
  function qdLab() {
    var range = document.getElementById('qd-range');
    var dot = document.getElementById('qd-dot');
    var outSize = document.getElementById('qd-size');
    var outWl = document.getElementById('qd-wl');
    var outColor = document.getElementById('qd-color');
    var marker = document.getElementById('spec-marker');
    var curve = document.getElementById('spec-curve');
    if (!range || !dot) return;

    var table = [[2, 450], [2.5, 470], [3, 490], [3.5, 510], [4, 530], [5, 560], [6, 590], [7, 615], [8, 635], [9, 650], [10, 660]];

    function wlOf(size) {
      for (var i = 0; i < table.length - 1; i++) {
        if (size >= table[i][0] && size <= table[i + 1][0]) {
          var t = (size - table[i][0]) / (table[i + 1][0] - table[i][0]);
          return table[i][1] + t * (table[i + 1][1] - table[i][1]);
        }
      }
      return size <= table[0][0] ? table[0][1] : table[table.length - 1][1];
    }

    var xOf = function (l) { return (l - 400) / 300 * 600; };

    function specPath(peak) {
      var d = '', first = true;
      for (var l = 400; l <= 700; l += 4) {
        var x = xOf(l);
        var s = Math.exp(-Math.pow((l - peak) / 32, 2));
        var y = 88 - 74 * s;
        d += (first ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
        first = false;
      }
      return d;
    }

    function update() {
      var size = parseFloat(range.value);
      var wl = wlOf(size);
      var rgb = wavelengthToRGB(wl);
      var css = 'rgb(' + rgb.join(',') + ')';
      dot.style.setProperty('--dot-color', css);
      dot.style.setProperty('--dot-glow', 'rgba(' + rgb.join(',') + ',0.55)');
      dot.style.width = dot.style.height = (72 + size * 6) + 'px';
      outSize.textContent = size.toFixed(1);
      outWl.textContent = Math.round(wl);
      outColor.textContent = colorName(wl);
      if (marker) {
        var x = xOf(wl);
        marker.setAttribute('x1', x); marker.setAttribute('x2', x);
      }
      if (curve) curve.setAttribute('d', specPath(wl));
    }

    range.addEventListener('input', update);
    update();
  }

  /* ---------------------------------------------------------------- 器件分层 */
  var LAYERS = {
    cathode: {
      k: 'CATHODE', h: '阴极 Al（100 nm）',
      p: '电子从这一侧注入器件。铝的功函数较低，与电子传输层形成良好接触。',
      li: ['电子经阴极进入 ZnO/ZnMgO 层，再注入量子点，注入势垒很小', '脉冲测试中电子在 &lt;100 ns 内完成注入', '金属电极也是探测光的反射镜，使探测光两次穿过量子点层']
    },
    etl: {
      k: 'ETL', h: '电子传输层 ZnO / ZnMgO（50–55 nm）',
      p: '由 3–6 nm 的 ZnO/ZnMgO 纳米颗粒构成，电子迁移率高，与量子点导带能级相差较小，因此该结在小电压下即被"击穿"注入电子。',
      li: ['量子点漂白信号在电压刚超过 0 V 就出现，说明电子注入近乎无势垒', '纳米颗粒表面悬空键多、近乎非晶，是器件一致性问题的来源之一', '正向电容主要由 HTL/QD 异质结决定，而非 ETL/QD 结']
    },
    eml: {
      k: 'EML', h: '量子点发光层（单层密堆积约 32 nm）',
      p: 'CdSe 基梯度合金量子点，PLQY 可接近 100%。电子与空穴在这里相遇形成激子并辐射复合发光；量子点是分散的发光中心，载流子难以横向迁移。',
      li: ['决定发光的是激子生成概率，因此 R = r·k·n·p 而非经典 R = k·n·p', '发光线宽窄、色彩饱和度高，波长由粒径与组分决定', '单层大尺寸全梯度合金量子点可提高带电率与准费米能级劈裂']
    },
    htl: {
      k: 'HTL', h: '空穴传输层 TFB / PFDP（18–25 nm）',
      p: '有机高分子空穴传输层。其 HOMO 与量子点价带间存在约 0.5–1.3 eV 的注入势垒，空穴必须在界面累积后靠热辅助越过，因而成为决定发光启亮延时的"慢组分"。',
      li: ['空穴注入延时 ≈600 ns，稳定约 3 µs，是器件工作速度的瓶颈', 'C–N / C–S / C–P 键在带负电时键能变弱、易断裂', '泄漏进来的高能电子会在此产生俘获空穴的缺陷态，导致蓝光器件退化']
    },
    hil: {
      k: 'HIL', h: '空穴注入层 PEDOT:PSS（18–35 nm）',
      p: '导电聚合物，用于改善 ITO 与有机空穴传输层之间的能级匹配与浸润性，降低空穴注入势垒。',
      li: ['常见器件结构中与 ITO 一起被视为一个整体电极', '厚度在本文器件中为 35 nm（第 3 章）或 18 nm（第 5 章）']
    },
    anode: {
      k: 'ANODE', h: '阳极 ITO / 玻璃基底（75 nm）',
      p: '透明导电氧化物，既作为空穴注入电极，也作为底发射器件的出光窗口。',
      li: ['器件为底发射结构，光从玻璃一侧出射', '外耦合效率受折射率与各层厚度强烈影响，可用传递矩阵法优化']
    }
  };

  function deviceStack() {
    var stack = document.getElementById('stack');
    var info = document.getElementById('layer-info');
    if (!stack || !info) return;
    var layers = stack.querySelectorAll('.layer');

    function show(key) {
      var d = LAYERS[key];
      if (!d) return;
      info.innerHTML = '<div class="li-k">' + d.k + '</div><h3>' + d.h + '</h3><p>' + d.p + '</p><ul>' +
        d.li.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
      layers.forEach(function (l) { l.classList.toggle('on', l.getAttribute('data-layer') === key); });
    }

    layers.forEach(function (l) {
      l.addEventListener('click', function () { show(l.getAttribute('data-layer')); });
      l.addEventListener('mouseenter', function () {
        layers.forEach(function (x) { x.classList.remove('on'); });
        l.classList.add('on');
      });
    });
    show('eml');
    layers.forEach(function (l) { l.classList.toggle('on', l.getAttribute('data-layer') === 'eml'); });
  }

  /* ---------------------------------------------------------------- 机理 tabs */
  function tabs() {
    var wrap = document.getElementById('mech-tabs');
    if (!wrap) return;
    var buttons = wrap.querySelectorAll('.tab');
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-tab');
        buttons.forEach(function (x) { x.classList.toggle('on', x === b); });
        document.querySelectorAll('.tab-panel').forEach(function (p) {
          p.classList.toggle('on', p.id === id);
        });
      });
    });
  }

  /* ---------------------------------------------------------------- 图表 */
  var INK = '#eaf1ff', DIM = '#6f7d96', LINE = 'rgba(255,255,255,.12)';

  function setupCanvas(cv) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cssH = parseInt(cv.getAttribute('height'), 10) || 240;
    var cssW = cv.parentNode.clientWidth - 44;
    if (cssW < 200) cssW = 200;
    cv.style.height = cssH + 'px';
    cv.width = Math.floor(cssW * dpr);
    cv.height = Math.floor(cssH * dpr);
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: cssW, h: cssH };
  }

  function animate(cv, draw) {
    var started = false;
    function start() {
      if (started) return;
      started = true;
      var rafRan = false;
      var t0 = null;
      var dur = reduceMotion ? 0 : 850;
      function frame(ts) {
        rafRan = true;
        if (t0 === null) t0 = ts;
        var p = dur === 0 ? 1 : Math.min(1, (ts - t0) / dur);
        p = 1 - Math.pow(1 - p, 3);
        var env = setupCanvas(cv);
        env.ctx.clearRect(0, 0, env.w, env.h);
        draw(env.ctx, env.w, env.h, p);
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
      /* 兜底：若 rAF 始终不回调（异常环境），直接绘制终态 */
      setTimeout(function () {
        if (rafRan) return;
        var env = setupCanvas(cv);
        env.ctx.clearRect(0, 0, env.w, env.h);
        draw(env.ctx, env.w, env.h, 1);
      }, 600);
    }
    if (!('IntersectionObserver' in window)) { start(); return; }
    var fired = false;
    var io = new IntersectionObserver(function (es) {
      fired = true;
      es.forEach(function (e) { if (e.isIntersecting) { start(); io.unobserve(e.target); } });
    }, { threshold: 0.25 });
    io.observe(cv);
    setTimeout(function () { if (!fired) start(); }, 1500);
  }

  function axisText(ctx, txt, x, y, color, size, align) {
    ctx.fillStyle = color || DIM;
    ctx.font = (size || 11.5) + 'px "Segoe UI","Microsoft YaHei",sans-serif';
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(txt, x, y);
  }

  /* 通用条形图（支持线性/对数刻度） */
  function barChart(cv, opt) {
    animate(cv, function (ctx, w, h, p) {
      var padL = opt.padL || 118, padR = 66, padT = 14, padB = 26;
      var iw = w - padL - padR, ih = h - padT - padB;
      var base = opt.log ? Math.log10(opt.min) : 0;
      var top = opt.log ? Math.log10(opt.max) : opt.max;
      var span = top - base;
      var n = opt.items.length;
      var rowH = ih / n;
      var barH = Math.min(22, rowH * 0.52);

      /* 网格 */
      var ticks = opt.log ? opt.ticks : opt.ticks;
      ticks.forEach(function (tk) {
        var v = opt.log ? (Math.log10(tk) - base) / span : tk / top;
        var x = padL + iw * v;
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, padT);
        ctx.lineTo(x, padT + ih);
        ctx.stroke();
        axisText(ctx, opt.tickFmt ? opt.tickFmt(tk) : tk, x, padT + ih + 13, DIM, 11, 'center');
      });

      opt.items.forEach(function (it, i) {
        var y = padT + rowH * i + rowH / 2;
        axisText(ctx, it.label, padL - 12, y, '#a7b4cc', 12.5, 'right');
        var v = opt.log ? (Math.log10(Math.max(it.value, opt.min)) - base) / span : it.value / top;
        v *= p;
        var bw = Math.max(2, iw * v);
        var g = ctx.createLinearGradient(padL, 0, padL + bw, 0);
        g.addColorStop(0, it.c1 || '#2f7bff');
        g.addColorStop(1, it.c2 || '#31d0ff');
        ctx.fillStyle = g;
        roundRect(ctx, padL, y - barH / 2, bw, barH, barH / 2);
        ctx.fill();
        axisText(ctx, it.display, padL + bw + 10, y, INK, 12.5, 'left');
      });
    });
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, h / 2, w / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* 分组柱状图：温升对比 */
  function tempChart(cv) {
    animate(cv, function (ctx, w, h, p) {
      var padL = 44, padR = 16, padT = 30, padB = 46;
      var iw = w - padL - padR, ih = h - padT - padB;
      var maxV = 22;
      [0, 5, 10, 15, 20].forEach(function (v) {
        var y = padT + ih - ih * v / maxV;
        ctx.strokeStyle = LINE; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + iw, y); ctx.stroke();
        axisText(ctx, v + '°C', padL - 8, y, DIM, 11, 'right');
      });

      var groups = [
        { name: '1000 cd m⁻²', vals: [0.05, 0.8, 0.5], disp: ['≈0', '0.8', '0.5'] },
        { name: '6000 cd m⁻²', vals: [1, 19.9, 18.9], disp: ['1', '19.9', '18.9'] }
      ];
      var colors = [['#35e08a', '#31d0ff'], ['#ff5f7e', '#ffc45e'], ['#9b7bff', '#2f7bff']];
      var gw = iw / groups.length;

      groups.forEach(function (grp, gi) {
        var x0 = padL + gw * gi + gw * 0.16;
        var bw = (gw * 0.68) / 3 - 6;
        grp.vals.forEach(function (v, vi) {
          var bh = ih * (v / maxV) * p;
          var x = x0 + vi * (bw + 6);
          var y = padT + ih - bh;
          var g = ctx.createLinearGradient(0, y, 0, padT + ih);
          g.addColorStop(0, colors[vi][1]);
          g.addColorStop(1, colors[vi][0]);
          ctx.fillStyle = g;
          roundRect(ctx, x, y, bw, Math.max(bh, 2), 4);
          ctx.fill();
          if (p > 0.9) axisText(ctx, grp.disp[vi], x + bw / 2, y - 10, INK, 11.5, 'center');
        });
        axisText(ctx, grp.name, padL + gw * gi + gw / 2, padT + ih + 18, DIM, 12, 'center');
      });

      var names = ['大尺寸 FCG-QD', '单层常规 QD', '三层常规 QD'];
      names.forEach(function (nm, i) {
        var x = padL + 10 + i * 96;
        ctx.fillStyle = colors[i][1];
        roundRect(ctx, x, 12, 10, 10, 3); ctx.fill();
        axisText(ctx, nm, x + 15, 17, '#a7b4cc', 11.5, 'left');
      });
    });
  }

  /* 对数坐标散点/拟合线：T95 与初始亮度 */
  function t95Chart(cv) {
    animate(cv, function (ctx, w, h, p) {
      var padL = 52, padR = 58, padT = 26, padB = 40;
      var iw = w - padL - padR, ih = h - padT - padB;
      var x0 = Math.log10(900), x1 = Math.log10(20000);
      var y0 = Math.log10(20), y1 = Math.log10(120000);
      function X(v) { return padL + iw * (Math.log10(v) - x0) / (x1 - x0); }
      function Y(v) { return padT + ih - ih * (Math.log10(v) - y0) / (y1 - y0); }

      var xTicks = [1000, 2000, 5000, 10000, 20000];
      var yTicks = [100, 1000, 10000, 100000];
      xTicks.forEach(function (v) {
        ctx.strokeStyle = LINE; ctx.beginPath();
        ctx.moveTo(X(v), padT); ctx.lineTo(X(v), padT + ih); ctx.stroke();
        axisText(ctx, v >= 1000 ? (v / 1000) + 'k' : v, X(v), padT + ih + 14, DIM, 11, 'center');
      });
      yTicks.forEach(function (v) {
        ctx.strokeStyle = LINE; ctx.beginPath();
        ctx.moveTo(padL, Y(v)); ctx.lineTo(padL + iw, Y(v)); ctx.stroke();
        axisText(ctx, v >= 1000 ? (v / 1000) + 'k' : v, padL - 8, Y(v), DIM, 11, 'right');
      });
      axisText(ctx, '初始亮度 L₀ (cd m⁻²)', padL + iw / 2, h - 8, DIM, 11.5, 'center');
      ctx.save();
      ctx.translate(12, padT + ih / 2);
      ctx.rotate(-Math.PI / 2);
      axisText(ctx, 'T95 (h)', 0, 0, DIM, 11.5, 'center');
      ctx.restore();

      var series = [
        { name: '大尺寸 FCG-QD', c: '#35e08a', hi: [11249, 780], lo: [1000, 48000] },
        { name: '单层常规 QD', c: '#ff5f7e', hi: [10433, 48], lo: [1000, 2500] },
        { name: '三层常规 QD', c: '#ffc45e', hi: [10041, 57], lo: [1000, 3100] }
      ];

      series.forEach(function (s) {
        var ax = X(s.hi[0]), ay = Y(s.hi[1]);
        var bx = X(s.lo[0]), by = Y(s.lo[1]);
        ctx.strokeStyle = s.c;
        ctx.globalAlpha = 0.55;
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax + (bx - ax) * p, ay + (by - ay) * p);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        ctx.fillStyle = s.c;
        ctx.beginPath(); ctx.arc(ax, ay, 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#05070e'; ctx.lineWidth = 1.6; ctx.stroke();

        if (p > 0.75) {
          ctx.strokeStyle = s.c;
          ctx.globalAlpha = 0.9;
          ctx.beginPath(); ctx.arc(bx, by, 4.5, 0, Math.PI * 2); ctx.stroke();
          ctx.globalAlpha = 1;
        }
      });

      /* 图例：避免标签压到坐标轴上 */
      series.forEach(function (s, i) {
        var lx = padL + 4 + i * Math.min(126, (iw - 20) / 3);
        ctx.strokeStyle = s.c;
        ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(lx, 16); ctx.lineTo(lx + 16, 16); ctx.stroke();
        ctx.fillStyle = s.c;
        ctx.beginPath(); ctx.arc(lx + 8, 16, 3.4, 0, Math.PI * 2); ctx.fill();
        axisText(ctx, s.name, lx + 22, 16, '#a7b4cc', 11.5, 'left');
      });
      axisText(ctx, '实心：实测点　空心：按加速因子外推', padL + iw, 16, DIM, 10.5, 'right');
    });
  }

  function charts() {
    document.querySelectorAll('canvas[data-chart]').forEach(function (cv) {
      var kind = cv.getAttribute('data-chart');
      if (kind === 'temp') tempChart(cv);
      else if (kind === 't95') t95Chart(cv);
      else if (kind === 'blue') {
        barChart(cv, {
          log: true, min: 1000, max: 200000,
          ticks: [1000, 10000, 100000],
          tickFmt: function (v) { return v >= 1000 ? (v / 1000) + 'k' : v; },
          items: [
            { label: '文献蓝光器件', value: 80377, display: '80 377 h', c1: '#6f7d96', c2: '#a7b4cc' },
            { label: 'CdZnS/ZnS 器件', value: 10000, display: '> 10 000 h', c1: '#2f7bff', c2: '#31d0ff' },
            { label: 'PBO 中间层器件', value: 41022, display: '41 022 h', c1: '#31d0ff', c2: '#35e08a' },
            { label: 'CdSeS 量子点器件', value: 95161, display: '95 161 h', c1: '#35e08a', c2: '#9bffd0' }
          ]
        });
      } else if (kind === 'eqe') {
        barChart(cv, {
          min: 0, max: 30, ticks: [0, 10, 20, 30],
          tickFmt: function (v) { return v + '%'; },
          items: [
            { label: '单层常规 QD', value: 14.5, display: '14.5%', c1: '#6f7d96', c2: '#a7b4cc' },
            { label: '单层大尺寸 FCG-QD', value: 23.8, display: '23.8%', c1: '#2f7bff', c2: '#31d0ff' },
            { label: 'PBO 纯蓝器件', value: 23, display: '23%', c1: '#31d0ff', c2: '#35e08a' },
            { label: 'CdSeS 纯蓝器件', value: 25, display: '25%', c1: '#35e08a', c2: '#9bffd0' }
          ]
        });
      }
    });
  }

  /* ---------------------------------------------------------------- 图片灯箱 */
  function lightbox() {
    var box = document.getElementById('lightbox');
    var img = document.getElementById('lb-img');
    var cap = document.getElementById('lb-cap');
    var close = document.getElementById('lb-close');
    if (!box) return;

    document.querySelectorAll('figure.fig').forEach(function (f) {
      f.addEventListener('click', function () {
        var src = f.querySelector('img').getAttribute('src');
        var figcap = f.querySelector('figcaption');
        var text = f.getAttribute('data-cap') || (figcap ? figcap.textContent : '');
        img.setAttribute('src', src);
        cap.textContent = text;
        box.classList.add('on');
        document.body.style.overflow = 'hidden';
      });
    });

    function hide() {
      box.classList.remove('on');
      document.body.style.overflow = '';
      img.setAttribute('src', '');
    }
    close.addEventListener('click', hide);
    box.addEventListener('click', function (e) { if (e.target === box) hide(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
  }

  /* ---------------------------------------------------------------- 启动 */
  document.addEventListener('DOMContentLoaded', function () {
    heroCanvas();
    nav();
    reveal();
    bars();
    qdLab();
    deviceStack();
    tabs();
    charts();
    lightbox();
  });
})();
