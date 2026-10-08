(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ring = document.getElementById('ring');
  var panels = ring.querySelectorAll('.panel');
  var count = panels.length;

  function baseRadius() {
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ring-radius')) || 400;
  }

  function positionPanels() {
    var r = baseRadius();
    panels.forEach(function (panel, i) {
      var tilt = Math.sin((i / count) * Math.PI * 2) * 8;
      panel.style.setProperty('--ry', (360 / count) * i + 'deg');
      panel.style.setProperty('--tz', r + 'px');
      panel.style.setProperty('--rz', tilt.toFixed(2) + 'deg');
    });
  }
  positionPanels();

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(positionPanels, 200);
  });

  /* Auto-Spin & Interactive Control Config */
  var stage = document.querySelector('.stage');
  var parallax = document.querySelector('.parallax');
  var rotation = 0;
  var velocity = 0;
  var baseDrift = reduceMotion ? 0 : 0.25; // Continuous automatic spin speed on page load
  var friction = 0.94;
  var MAX_V = 8;
  var DRAG = 0.35;
  var dragging = false;
  var lastX = 0;
  var startX = 0;
  var moved = false;

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  var tX = 0, tY = 0, cX = 0, cY = 0;
  if (!reduceMotion) {
    window.addEventListener('mousemove', function (e) {
      tY = (e.clientX / window.innerWidth - 0.5) * 28;
      tX = (-(e.clientY / window.innerHeight - 0.5) * 30) + 10;
    });
  }

  /* Drag & Drag-Release Momentum */
  stage.addEventListener('pointerdown', function (e) {
    dragging = true;
    moved = false;
    lastX = startX = e.clientX;
    velocity = 0;
    stage.classList.add('dragging');
  });

  window.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    if (Math.abs(e.clientX - startX) > 6) moved = true;
    var step = (e.clientX - lastX) * DRAG;
    lastX = e.clientX;
    rotation += step;
    velocity = clamp(step, -MAX_V, MAX_V);
  });

  function endDrag() {
    dragging = false;
    stage.classList.remove('dragging');
  }
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  /* Scroll Wheel / Trackpad Control */
  window.addEventListener('wheel', function (e) {
    var delta = e.deltaY || e.deltaX;
    var scrollStep = clamp(delta * 0.05, -MAX_V, MAX_V);
    rotation += scrollStep;
    velocity = clamp(velocity + scrollStep * 0.3, -MAX_V, MAX_V);
  }, { passive: true });

  /* Snowfall Generator */
  function initSnow() {
    if (reduceMotion) return;
    var snowContainer = document.createElement('div');
    snowContainer.className = 'snow-container';
    document.body.appendChild(snowContainer);

    var flakeCount = 120;
    for (var i = 0; i < flakeCount; i++) {
      var flake = document.createElement('div');
      flake.className = 'snowflake';

      var size = (Math.random() * 4 + 2).toFixed(1);
      var left = (Math.random() * 100).toFixed(1);
      var duration = (Math.random() * 6 + 4).toFixed(1);
      var delay = (Math.random() * -10).toFixed(1);
      var opacity = (Math.random() * 0.5 + 0.5).toFixed(2);

      flake.style.width = size + 'px';
      flake.style.height = size + 'px';
      flake.style.left = left + '%';
      flake.style.animationDuration = duration + 's';
      flake.style.animationDelay = delay + 's';
      flake.style.opacity = opacity;

      snowContainer.appendChild(flake);
    }
  }
  initSnow();

  /* Background Audio Handler */
  var bgMusic = document.getElementById('bgMusic');

  function startAudio() {
    if (bgMusic && bgMusic.paused) {
      bgMusic.play().then(function () {
        window.removeEventListener('pointerdown', startAudio);
        window.removeEventListener('keydown', startAudio);
        window.removeEventListener('wheel', startAudio);
      }).catch(function (err) {
        console.log('Autoplay deferred until user interaction:', err);
      });
    }
  }

  startAudio();
  window.addEventListener('pointerdown', startAudio);
  window.addEventListener('keydown', startAudio);
  window.addEventListener('wheel', startAudio);

  /* Animation Frame Loop: Continuous Automatic Spinning */
  function frame() {
    if (!dragging) {
      rotation += baseDrift + velocity;
      velocity *= friction;
      if (Math.abs(velocity) < 0.0015) velocity = 0;
    }
    ring.style.transform = 'rotateY(' + rotation.toFixed(3) + 'deg)';

    if (!reduceMotion) {
      cX += (tX - cX) * 0.06;
      cY += (tY - cY) * 0.06;
      parallax.style.transform = 'rotateX(' + cX.toFixed(2) + 'deg) rotateY(' + cY.toFixed(2) + 'deg)';
    }
    requestAnimationFrame(frame);
  }

  // Start rotation immediately on page load
  frame();

  /* Lightbox Modal */
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lbImg');
  var lbCap = document.getElementById('lbCap');

  function openLb(panel) {
    var caption = panel.querySelector('.panel-cap');
    var name = caption ? caption.textContent.trim() : panel.getAttribute('data-name');

    lbImg.src = panel.getAttribute('data-full');
    lbImg.alt = name;
    lbCap.textContent = name;
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
  }

  function closeLb() {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
  }

  panels.forEach(function (p) {
    p.addEventListener('click', function () {
      if (!moved) openLb(p);
    });
    p.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLb(p);
      }
    });
  });

  lb.addEventListener('click', closeLb);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLb();
  });
})();