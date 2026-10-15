/* Photo and video loader.
   Drop real files into assets/images and assets/video (names in README.md).
   Anything missing falls back to a quiet placeholder, so the page never shows a broken image. */
(function () {
  'use strict';
  document.querySelectorAll('.plate').forEach(function (fig) {
    var img = fig.querySelector('img');
    if (!img) return;
    var miss = function () { fig.classList.add('missing'); };
    if (img.complete && img.naturalWidth === 0) miss();
    img.addEventListener('error', miss);
  });
  var v = document.getElementById('heroMedia');
  if (v) {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    v.addEventListener('canplay', function () {
      v.classList.add('ready');
      if (!reduce) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    });
    v.addEventListener('error', function () { v.remove(); }, true);
    var s = v.querySelector('source');
    if (s) s.addEventListener('error', function () { v.remove(); });
  }
})();
