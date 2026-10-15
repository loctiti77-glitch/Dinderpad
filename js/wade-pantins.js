// Wade and Friends : les animatroniques en marionnettes articulees.
//
// Les rendus de l'auteur restent les images de reference ; on ne les
// remplace pas, on les fait bouger. Chaque rendu est pose sur un maillage
// fin, rattache a huit os (le corps, le torse, la tete, la machoire, les
// deux bras et les deux avant-bras). Le maillage se deforme sans jamais
// se dechirer : une machoire qui s'ouvre etire la gueule deja ouverte du
// rendu, un bras qui se leve entraine l'epaule avec lui.
//
// La tete tourne "en 3D" : ses points sont projetes sur une sphere, et
// tournent avec elle. L'eclairage de la piece, la teinte de l'eau, la
// lueur des yeux : tout se fait au rendu, en WebGL, puis l'image est
// reprise par la toile du jeu.
(function () {

  // ==========================================================
  //  Les squelettes
  //  En pixels des rendus de 800 x 1200 (assets/games/wade). tete : le
  //  centre et le rayon du crane, cou : son pivot ; machoire : la zone
  //  qui descend (son bord haut passe au milieu de la gueule), son pivot,
  //  l'angle et la descente quand elle est grande ouverte.
  // ==========================================================

  function rig(o) {
    o.bassin = o.bassin || [400, 700];
    o.bras = o.bras || 70;
    return o;
  }

  var WADE = {
    tete: [342, 175, 150], cou: [345, 305],
    machoire: { zone: [288, 246, 412, 330], pivot: [345, 232], rot: 0, drop: 30 },
    epaules: [[225, 345], [495, 335]], coudes: [[165, 500], [650, 455]], mains: [[75, 690], [690, 620]],
    bassin: [350, 720], bras: 72, oeil: '255,226,120'
  };
  var STEPHEN = {
    tete: [345, 168, 160], cou: [370, 300],
    machoire: { zone: [262, 216, 422, 300], pivot: [415, 205], rot: -0.32, drop: 10 },
    epaules: [[286, 386], [543, 318]], coudes: [[214, 432], [643, 432]], mains: [[86, 457], [643, 471]],
    bassin: [400, 643], bras: 66, oeil: '200,240,255'
  };
  var FAITH = {
    tete: [312, 162, 135], cou: [332, 300],
    machoire: { zone: [222, 236, 338, 278], pivot: [338, 214], rot: -0.34, drop: 6 },
    epaules: [[214, 357], [571, 343]], coudes: [[143, 571], [671, 543]], mains: [[121, 714], [629, 714]],
    bassin: [393, 686], bras: 92, oeil: '255,248,210'
  };
  var CHARLIE = {
    tete: [343, 168, 148], cou: [345, 298],
    machoire: { zone: [282, 238, 412, 302], pivot: [345, 228], rot: 0, drop: 26 },
    epaules: [[186, 329], [543, 329]], coudes: [[157, 471], [643, 457]], mains: [[100, 657], [671, 643]],
    bassin: [350, 700], bras: 78, oeil: '255,170,70'
  };

  function variante(base, yeux, haut) {
    var o = JSON.parse(JSON.stringify(base));
    o.yeux = yeux;
    if (haut) o.machoire.zone[1] = haut;
    return rig(o);
  }

  var RIGS = {
    'wade-horror':    variante(WADE, [[300, 169], [379, 164]]),
    'wade-base':      variante(WADE, [[296, 149], [369, 144]], 240),
    'stephen-horror': variante(STEPHEN, [[354, 136]]),
    'stephen-base':   variante(STEPHEN, [[354, 139]]),
    'faith-horror':   variante(FAITH, [[321, 136]]),
    'faith-base':     variante(FAITH, [[343, 150]]),
    'charlie-horror': variante(CHARLIE, [[264, 114], [379, 107]]),
    'charlie-base':   variante(CHARLIE, [[264, 114], [379, 107]], 250),
    'stephen-endo': rig({
      tete: [329, 160, 130], cou: [371, 286],
      machoire: { zone: [248, 210, 378, 268], pivot: [378, 200], rot: -0.32, drop: 8 },
      epaules: [[221, 336], [557, 307]], coudes: [[176, 470], [690, 450]], mains: [[129, 671], [714, 686]],
      bassin: [407, 571], bras: 60, oeil: '200,240,255', yeux: [[350, 136]]
    }),
    'wade-endo': rig({
      tete: [300, 160, 115], cou: [350, 272],
      machoire: { zone: [252, 214, 362, 276], pivot: [305, 205], rot: 0, drop: 22 },
      epaules: [[221, 336], [479, 280]], coudes: [[171, 557], [643, 500]], mains: [[121, 743], [629, 643]],
      bassin: [386, 600], bras: 55, oeil: '255,226,120', yeux: [[264, 136], [336, 136]]
    }),
    'faith-endo': rig({
      tete: [321, 145, 122], cou: [357, 272],
      machoire: { zone: [220, 222, 336, 268], pivot: [336, 205], rot: -0.32, drop: 6 },
      epaules: [[221, 336], [500, 272]], coudes: [[171, 557], [657, 543]], mains: [[121, 743], [643, 714]],
      bassin: [386, 586], bras: 55, oeil: '255,248,210', yeux: [[336, 129]]
    }),
    'charlie-endo': rig({
      tete: [320, 158, 140], cou: [340, 300],
      machoire: { zone: [248, 244, 382, 292], pivot: [320, 236], rot: 0, drop: 22 },
      epaules: [[221, 336], [479, 307]], coudes: [[150, 500], [660, 480]], mains: [[107, 743], [700, 743]],
      bassin: [414, 636], bras: 62, oeil: '255,200,60', yeux: [[257, 121], [364, 114]]
    })
  };

  var IW = 800, IH = 1200;

  // ==========================================================
  //  Les poids
  //  Pour chaque sommet : combien il suit chacun des huit os.
  // ==========================================================

  function lisse(a, b, x) {
    var t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }
  function dSeg(p, a, b) {
    var vx = b[0] - a[0], vy = b[1] - a[1];
    var t = Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / (vx * vx + vy * vy)));
    var x = a[0] + vx * t - p[0], y = a[1] + vy * t - p[1];
    return Math.sqrt(x * x + y * y);
  }

  function poids(R, p) {
    var t = R.tete, j = R.machoire.zone, F = 14;
    var dt = Math.sqrt((p[0] - t[0]) * (p[0] - t[0]) + (p[1] - t[1]) * (p[1] - t[1]));
    var tete = (1 - lisse(t[2] * 0.78, t[2] * 1.08, dt)) * (1 - lisse(R.cou[1] - 10, R.cou[1] + 45, p[1]));
    var mach = lisse(j[0] - F, j[0] + F, p[0]) * (1 - lisse(j[2] - F, j[2] + F, p[0])) *
               lisse(j[1] - F * 0.6, j[1] + F * 0.6, p[1]) * (1 - lisse(j[3] - F, j[3] + F, p[1]));
    mach *= tete;
    tete -= mach;
    var reste = 1 - tete - mach;
    var bras = [0, 0, 0, 0];
    for (var s = 0; s < 2; s++) {
      var dU = dSeg(p, R.epaules[s], R.coudes[s]), dF = dSeg(p, R.coudes[s], R.mains[s]);
      var w = (1 - lisse(R.bras * 0.7, R.bras * 1.25, Math.min(dU, dF))) * reste;
      var av = w * Math.max(0, Math.min(1, (dU - dF) / 50 + 0.5));
      bras[s * 2] = w - av; bras[s * 2 + 1] = av;
    }
    var b = bras[0] + bras[1] + bras[2] + bras[3];
    if (b > reste) { var k = reste / b; bras = bras.map(function (v) { return v * k; }); b = reste; }
    reste -= b;
    var torse = reste * (1 - lisse(R.bassin[1] - 40, R.bassin[1] + 70, p[1]));
    var racine = reste - torse;
    return [racine, torse, tete, mach, bras[0], bras[1], bras[2], bras[3]];
  }

  // ==========================================================
  //  Les os : des transformations affines, [a, b, c, d, e, f]
  //  (x' = a x + c y + e ; y' = b x + d y + f)
  // ==========================================================

  function mul(A, B) {
    return [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1],
            A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3],
            A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
  }
  function T(x, y) { return [1, 0, 0, 1, x, y]; }
  function autour(p, M) { return mul(T(p[0], p[1]), mul(M, T(-p[0], -p[1]))); }
  function rot(p, a) { var c = Math.cos(a), s = Math.sin(a); return autour(p, [c, s, -s, c, 0, 0]); }
  function ech(p, sx, sy) { return autour(p, [sx, 0, 0, sy, 0, 0]); }
  function app(M, p) { return [M[0] * p[0] + M[2] * p[1] + M[4], M[1] * p[0] + M[3] * p[1] + M[5]]; }

  // La pose : des angles en radians, la machoire de 0 (fermee) a 1.
  // bras et avant-bras : positif, le membre se leve vers l'exterieur.
  function os(R, q) {
    var pied = [R.bassin[0], IH - 10];
    var racine = mul(T(q.dx || 0, q.dy || 0), ech(pied, q.ech || 1, q.ech || 1));
    var s = q.souffle || 0;
    var torse = mul(racine, mul(rot(R.bassin, q.torse || 0), ech(R.bassin, 1 + s * 0.008, 1 + s * 0.014)));
    var tete = mul(torse, mul(T(0, -s * 5), rot(R.cou, q.tete || 0)));
    var m = R.machoire, j = q.jaw || 0;
    var mach = mul(tete, mul(rot(m.pivot, j * m.rot), T(0, j * m.drop)));
    var bG = mul(torse, rot(R.epaules[0], q.brasG || 0));
    var aG = mul(bG, rot(R.coudes[0], q.avG || 0));
    var bD = mul(torse, rot(R.epaules[1], -(q.brasD || 0)));
    var aD = mul(bD, rot(R.coudes[1], -(q.avD || 0)));
    return [racine, torse, tete, mach, bG, aG, bD, aD];
  }

  // La tete qui tourne : le point, pose sur une sphere, tourne avec elle.
  function tourner(R, p, yaw, pitch) {
    var t = R.tete, u = (p[0] - t[0]) / t[2], v = (p[1] - t[1]) / t[2];
    var z = Math.sqrt(Math.max(0, 1 - u * u - v * v));
    return [t[0] + t[2] * (u * Math.cos(yaw) + z * Math.sin(yaw) * 0.85),
            t[1] + t[2] * (v * Math.cos(pitch) - z * Math.sin(pitch) * 0.6)];
  }

  // ==========================================================
  //  WebGL
  // ==========================================================

  var VS = [
    'attribute vec2 aUV; attribute vec4 aW0; attribute vec4 aW1;',
    'uniform mat3 uM0, uM1, uM2, uM3, uM4, uM5, uM6, uM7, uVue;',
    'uniform vec3 uTete; uniform vec2 uRot;',
    'varying vec2 vUV;',
    'void main() {',
    '  vec2 p = aUV * vec2(' + IW + '.0, ' + IH + '.0);',
    '  vec2 d = (p - uTete.xy) / uTete.z;',
    '  float z = sqrt(max(0.0, 1.0 - dot(d, d)));',
    '  vec2 q = uTete.xy + uTete.z * vec2(d.x * cos(uRot.x) + z * sin(uRot.x) * 0.85,',
    '                                     d.y * cos(uRot.y) - z * sin(uRot.y) * 0.6);',
    '  vec3 P = vec3(p, 1.0), Q = vec3(q, 1.0);',
    '  vec2 r = aW0.x * (uM0 * P).xy + aW0.y * (uM1 * P).xy + aW0.z * (uM2 * Q).xy + aW0.w * (uM3 * Q).xy',
    '         + aW1.x * (uM4 * P).xy + aW1.y * (uM5 * P).xy + aW1.z * (uM6 * P).xy + aW1.w * (uM7 * P).xy;',
    '  gl_Position = vec4((uVue * vec3(r, 1.0)).xy, 0.0, 1.0);',
    '  vUV = aUV;',
    '}'
  ].join('\n');

  var FS = [
    'precision mediump float;',
    'uniform sampler2D uTex; uniform vec3 uT0, uT1, uT2, uEau;',
    'uniform float uLum, uDesat, uContraste, uEauK, uAlpha;',
    'varying vec2 vUV;',
    'void main() {',
    '  vec4 c = texture2D(uTex, vUV);',
    '  if (c.a < 0.004) discard;',
    '  vec3 t = vUV.y < 0.55 ? mix(uT0, uT1, smoothstep(0.08, 0.55, vUV.y))',
    '                        : mix(uT1, uT2, smoothstep(0.55, 1.0, vUV.y));',
    '  vec3 rgb = c.rgb * t * uLum;',
    '  float l = dot(rgb, vec3(0.3, 0.59, 0.11));',
    '  rgb = mix(rgb, vec3(l), uDesat);',
    '  rgb = (rgb - 0.5 * c.a) * uContraste + 0.5 * c.a;',
    '  rgb = mix(rgb, uEau * (l * 1.6 + 0.08 * c.a), uEauK);',
    '  rgb = clamp(rgb, 0.0, c.a);',
    '  gl_FragColor = vec4(rgb, c.a) * uAlpha;',
    '}'
  ].join('\n');

  var gl = null, cv = null, prog = null, U = {}, A = {}, MAILLES = {}, TEX = {}, echec = false;
  var NX = 34, NY = 50;

  function init() {
    if (gl || echec) return !!gl;
    cv = document.createElement('canvas');
    cv.width = 512; cv.height = 512;
    var o = { premultipliedAlpha: true, alpha: true, preserveDrawingBuffer: true, antialias: true };
    gl = cv.getContext('webgl2', o) || cv.getContext('webgl', o);
    if (!gl) { echec = true; return false; }
    function sh(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (e) { echec = true; gl = null; return false; }
    gl.useProgram(prog);
    ['uM0', 'uM1', 'uM2', 'uM3', 'uM4', 'uM5', 'uM6', 'uM7', 'uVue', 'uTete', 'uRot', 'uTex',
     'uT0', 'uT1', 'uT2', 'uEau', 'uLum', 'uDesat', 'uContraste', 'uEauK', 'uAlpha'].forEach(function (k) {
      U[k] = gl.getUniformLocation(prog, k);
    });
    ['aUV', 'aW0', 'aW1'].forEach(function (k) { A[k] = gl.getAttribLocation(prog, k); });
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    return true;
  }

  // Le maillage d'un squelette : une grille sur tout le rendu, et ses poids.
  function squelette(k) { return RIGS[String(k).split('#')[0]]; }

  function maille(k) {
    k = String(k).split('#')[0];
    if (MAILLES[k]) return MAILLES[k];
    var R = RIGS[k];
    var n = (NX + 1) * (NY + 1);
    var uv = new Float32Array(n * 2), w0 = new Float32Array(n * 4), w1 = new Float32Array(n * 4);
    for (var y = 0; y <= NY; y++) {
      for (var x = 0; x <= NX; x++) {
        var i = y * (NX + 1) + x;
        uv[i * 2] = x / NX; uv[i * 2 + 1] = y / NY;
        var w = poids(R, [x / NX * IW, y / NY * IH]);
        for (var c = 0; c < 4; c++) { w0[i * 4 + c] = w[c]; w1[i * 4 + c] = w[c + 4]; }
      }
    }
    var idx = new Uint16Array(NX * NY * 6), m = 0;
    for (y = 0; y < NY; y++) {
      for (x = 0; x < NX; x++) {
        var a = y * (NX + 1) + x, b = a + 1, c2 = a + NX + 1, d = c2 + 1;
        idx[m++] = a; idx[m++] = b; idx[m++] = c2;
        idx[m++] = b; idx[m++] = d; idx[m++] = c2;
      }
    }
    function tampon(data, cible) {
      var bu = gl.createBuffer();
      gl.bindBuffer(cible || gl.ARRAY_BUFFER, bu);
      gl.bufferData(cible || gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      return bu;
    }
    MAILLES[k] = { uv: tampon(uv), w0: tampon(w0), w1: tampon(w1),
                   idx: tampon(idx, gl.ELEMENT_ARRAY_BUFFER), n: idx.length };
    return MAILLES[k];
  }

  function texture(k, im) {
    if (TEX[k]) return TEX[k];
    var t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // Les mipmaps lissent les personnages vus de loin ; WebGL 1 ne les
    // fait pas sur une image de 800 x 1200.
    if (window.WebGL2RenderingContext && gl instanceof window.WebGL2RenderingContext) {
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    TEX[k] = t;
    return t;
  }

  function mat3(M) { return new Float32Array([M[0], M[1], 0, M[2], M[3], 0, M[4], M[5], 1]); }

  // Dessine la marionnette k (son image im) dans ctx.
  // c : { s, tx, ty } place l'image (pixel du rendu -> pixel de ctx),
  //     relativement au coin (x, y) d'une zone de vw x vh dans ctx.
  // o : { ecl: [haut, milieu, bas], lum, desat, contraste, eau, alpha, yeux }
  function dessiner(ctx, k, im, q, c, o) {
    if (!init() || !squelette(k)) return false;
    o = o || {};
    var vw = Math.max(1, Math.ceil(c.vw)), vh = Math.max(1, Math.ceil(c.vh));
    if (vw > cv.width || vh > cv.height) {
      cv.width = Math.min(2560, Math.max(cv.width, vw));
      cv.height = Math.min(2560, Math.max(cv.height, vh));
    }
    vw = Math.min(vw, cv.width); vh = Math.min(vh, cv.height);
    var R = squelette(k);
    gl.viewport(0, 0, vw, vh);
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(0, 0, vw, vh);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.SCISSOR_TEST);

    var M = maille(k);
    gl.bindBuffer(gl.ARRAY_BUFFER, M.uv);
    gl.enableVertexAttribArray(A.aUV); gl.vertexAttribPointer(A.aUV, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, M.w0);
    gl.enableVertexAttribArray(A.aW0); gl.vertexAttribPointer(A.aW0, 4, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, M.w1);
    gl.enableVertexAttribArray(A.aW1); gl.vertexAttribPointer(A.aW1, 4, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, M.idx);

    var O = os(R, q);
    for (var i = 0; i < 8; i++) gl.uniformMatrix3fv(U['uM' + i], false, mat3(O[i]));
    gl.uniformMatrix3fv(U.uVue, false, new Float32Array([
      2 * c.s / vw, 0, 0, 0, -2 * c.s / vh, 0, 2 * c.tx / vw - 1, 1 - 2 * c.ty / vh, 1]));
    gl.uniform3f(U.uTete, R.tete[0], R.tete[1], R.tete[2]);
    gl.uniform2f(U.uRot, q.yaw || 0, q.pitch || 0);
    var e = o.ecl || [[1, 1, 1], [1, 1, 1], [1, 1, 1]];
    gl.uniform3fv(U.uT0, e[0]); gl.uniform3fv(U.uT1, e[1]); gl.uniform3fv(U.uT2, e[2]);
    gl.uniform3fv(U.uEau, o.eau || [0, 0, 0]);
    gl.uniform1f(U.uEauK, o.eau ? 0.45 : 0);
    gl.uniform1f(U.uLum, o.lum == null ? 1 : o.lum);
    gl.uniform1f(U.uDesat, o.desat == null ? 0.22 : o.desat);
    gl.uniform1f(U.uContraste, o.contraste || 1.12);
    gl.uniform1f(U.uAlpha, o.alpha == null ? 1 : o.alpha);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture(k, im));
    gl.uniform1i(U.uTex, 0);
    gl.drawElements(gl.TRIANGLES, M.n, gl.UNSIGNED_SHORT, 0);

    var x0 = c.x || 0, y0 = c.y || 0;
    ctx.drawImage(cv, 0, cv.height - vh, vw, vh, x0, y0, vw, vh);

    // Les yeux : un point blanc au fond des orbites, et un halo de leur
    // couleur. Ils suivent la tete.
    var f = o.yeux || 0;
    if (f > 0.01 && R.yeux) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      R.yeux.forEach(function (p) {
        var t = app(O[2], tourner(R, p, q.yaw || 0, q.pitch || 0));
        var X = x0 + c.tx + t[0] * c.s, Y = y0 + c.ty + t[1] * c.s;
        var r = Math.max(1.2, 9 * c.s) * (o.taillesYeux || 1);
        var g = ctx.createRadialGradient(X, Y, 0, X, Y, r * 4);
        g.addColorStop(0, 'rgba(255,255,255,' + f + ')');
        g.addColorStop(0.18, 'rgba(' + R.oeil + ',' + (f * 0.85).toFixed(2) + ')');
        g.addColorStop(0.45, 'rgba(' + R.oeil + ',' + (f * 0.22).toFixed(2) + ')');
        g.addColorStop(1, 'rgba(' + R.oeil + ',0)');
        ctx.fillStyle = g;
        ctx.fillRect(X - r * 4, Y - r * 4, r * 8, r * 8);
      });
      ctx.restore();
    }
    return true;
  }

  // Ou se trouve un point du rendu une fois la pose appliquee (pour y
  // accrocher quelque chose : la tete, par exemple).
  function point(k, q, p) {
    var R = squelette(k);
    return app(os(R, q)[2], tourner(R, p || [R.tete[0], R.tete[1]], q.yaw || 0, q.pitch || 0));
  }

  // ==========================================================
  //  Les comportements
  //  Chaque instance a son etat (st) : depuis quand on la regarde, ses
  //  tics a venir. poser() rend la pose du moment.
  // ==========================================================

  function bruit(t, g) {
    return Math.sin(t * 1.7 + g) * 0.5 + Math.sin(t * 3.1 + g * 2.3) * 0.3 + Math.sin(t * 7.3 + g * 0.7) * 0.2;
  }
  function hasard(a, b) { return a + Math.random() * (b - a); }
  function vers(v, cible, k) { return v + (cible - v) * Math.min(1, k); }

  function etat() {
    return { g: Math.random() * 100, vu: 0, tic: null, prochainTic: hasard(1.5, 4),
             yaw0: (Math.random() < 0.5 ? -1 : 1) * hasard(0.35, 0.6), tilt: hasard(-0.16, 0.16),
             delai: hasard(0.5, 1.8), regard: 0, yaw: 0, jaw: 0, tete: 0, servo: 0 };
  }

  // Un tic : une secousse breve, la tete qui part d'un coup, un bras qui
  // claque. Rien de plus derangeant qu'une machine qui sursaute.
  function tics(st, dt, q, force, son) {
    st.prochainTic -= dt;
    if (!st.tic && st.prochainTic <= 0) {
      st.tic = { reste: hasard(0.07, 0.2), tete: hasard(-0.32, 0.32) * force, yaw: hasard(-0.3, 0.3) * force,
                 bras: hasard(-0.35, 0.35) * force, jaw: Math.random() < 0.4 ? hasard(0.3, 0.8) : 0,
                 dx: hasard(-8, 8) * force };
      st.prochainTic = hasard(1.4, 5);
      if (son) son('servo');
    }
    if (st.tic) {
      st.tic.reste -= dt;
      q.tete += st.tic.tete; q.yaw += st.tic.yaw; q.brasG += st.tic.bras; q.brasD -= st.tic.bras * 0.6;
      q.jaw = Math.max(q.jaw, st.tic.jaw); q.dx += st.tic.dx;
      if (st.tic.reste <= 0) st.tic = null;
    }
  }

  function vide() {
    return { dx: 0, dy: 0, ech: 1, souffle: 0, torse: 0, tete: 0, yaw: 0, pitch: 0, jaw: 0,
             brasG: 0, avG: 0, brasD: 0, avD: 0, yeux: 0 };
  }

  // quoi : 'scene', 'cam', 'porte', 'peur', 'panne', 'course', 'nage',
  // 'vitre', 'endo', 'vision'. t : l'horloge ; regarde : la camera est
  // braquee sur lui ; son : rappel d'un bruit de servomoteur.
  function poser(quoi, st, t, dt, regarde, son) {
    var q = vide(), g = st.g;
    st.vu = regarde ? st.vu + dt : 0;
    var b = Math.sin(t * 1.5 + g) * 0.5 + 0.5;

    if (quoi === 'scene') {
      // Sur scene, ils attendent le spectacle. Mais si on les regarde trop
      // longtemps, ils tournent la tete vers la camera, et la bouche
      // s'entrouvre.
      q.souffle = b * 0.6;
      q.torse = Math.sin(t * 0.45 + g) * 0.015;
      var fixe = st.vu > 4.5;
      if (fixe && st.regard < 0.5 && son) son('regard');
      st.regard = vers(st.regard, fixe ? 1 : 0, dt * (fixe ? 1.4 : 0.4));
      q.tete = Math.sin(t * 0.6 + g) * 0.035 * (1 - st.regard) + st.regard * 0.08;
      q.yaw = Math.sin(t * 0.25 + g) * 0.18 * (1 - st.regard);
      q.pitch = -0.12 * st.regard;
      q.jaw = Math.max(0, (st.vu - 7) * 0.08);
      q.jaw = Math.min(0.45, q.jaw);
      tics(st, dt, q, 0.25, null);
    } else if (quoi === 'cam') {
      // Ailleurs, on les surprend la tete tournee... et ils la tournent
      // vers nous, d'un coup de servo. Les yeux s'allument.
      q.souffle = b;
      q.torse = Math.sin(t * 0.5 + g) * 0.02;
      var vise = st.vu > st.delai;
      if (vise && st.regard < 0.1 && son) son('regard');
      st.regard = vers(st.regard, vise ? 1 : 0, dt * (vise ? 9 : 1));
      q.yaw = st.yaw0 * (1 - st.regard) + bruit(t * 0.3, g) * 0.05;
      q.tete = st.tilt + bruit(t * 0.4, g) * 0.04;
      q.pitch = -0.08 * st.regard;
      q.yeux = st.regard * (0.75 + Math.random() * 0.25);
      // La machoire, qui s'ouvre lentement pendant qu'il fixe, et claque.
      var cycle = (st.vu * 0.35 + g) % 3;
      q.jaw = st.regard * (cycle < 2.4 ? cycle / 2.4 * 0.6 : 0.05);
      q.brasG = 0.05 + Math.sin(t * 0.7 + g) * 0.02;
      q.brasD = 0.05;
      tics(st, dt, q, 1, son);
    } else if (quoi === 'porte') {
      // Dans l'embrasure : il respire fort, la tete penchee, la machoire
      // qui tremble, et il se rapproche tant qu'on ne referme pas.
      q.souffle = Math.sin(t * 2.1 + g) * 0.5 + 0.5;
      q.ech = 1 + Math.min(0.22, st.vu * 0.014);
      q.dy = -Math.min(30, st.vu * 2);
      q.torse = 0.03 * Math.sin(t * 0.4 + g);
      q.tete = 0.16 + Math.sin(t * 0.5 + g) * 0.08;
      q.yaw = Math.sin(t * 0.33 + g) * 0.1;
      q.pitch = -0.1;
      q.jaw = 0.18 + Math.abs(bruit(t * 6, g)) * 0.22;
      q.yeux = 0.9 + Math.random() * 0.1;
      q.brasG = 0.18 + Math.sin(t * 0.8) * 0.04;
      q.brasD = 0.22 + Math.sin(t * 0.9 + 1) * 0.04;
      q.avG = 0.2; q.avD = 0.25;
      st.fixe = (st.fixe || 0) - dt;
      if (st.fixe < -hasard(4, 8)) { st.fixe = hasard(1.2, 2.2); if (son) son('regard'); }
      if (st.fixe > 0) { q.tete = 0.02; q.yaw = 0; q.pitch = -0.14; q.jaw = Math.max(q.jaw, 0.35); }
      tics(st, dt, q, 0.8, son);
    } else if (quoi === 'peur') {
      // Le jumpscare : il se jette en avant, la gueule grande ouverte,
      // les bras leves, et toute la machine tremble.
      var u = st.vu;
      var k = Math.min(1, u / 0.18);
      k = 1 - Math.pow(1 - k, 3);
      q.ech = 1;
      // La gueule : grande ouverte d'un coup, puis elle claque et mord.
      q.jaw = Math.min(1, u / 0.09) * (u < 0.45 ? 1 : 0.7 + Math.abs(Math.sin(u * 15)) * 0.3);
      // La tete se debat, de plus en plus fort.
      var force = 0.08 + Math.min(1, u / 0.6) * 0.12;
      q.tete = bruit(u * 16, g) * force + Math.sin(u * 31) * 0.03;
      q.yaw = bruit(u * 12, g + 3) * force;
      q.pitch = -0.16 + bruit(u * 10, g) * 0.06;
      // Les bras qui se levent et viennent vers nous.
      q.brasG = 1.15 * k + bruit(u * 13, g) * 0.12;
      q.brasD = 1.15 * k + bruit(u * 13, g + 1) * 0.12;
      q.avG = 0.9 * k + Math.sin(u * 9) * 0.15; q.avD = 0.9 * k + Math.sin(u * 9 + 1) * 0.15;
      q.torse = bruit(u * 8, g + 5) * 0.06;
      q.dx = bruit(u * 27, g) * 10; q.dy = bruit(u * 25, g + 2) * 8;
      q.souffle = 1;
      q.yeux = 1;
    } else if (quoi === 'panne') {
      // Wade, pendant la panne : il chante son air, la machoire en mesure.
      q.souffle = b;
      q.jaw = Math.abs(Math.sin(t * Math.PI / 0.34)) * 0.5;
      q.tete = Math.sin(t * 1.1) * 0.1;
      q.yaw = Math.sin(t * 0.7) * 0.12;
      q.yeux = 1;
    } else if (quoi === 'course') {
      var c = Math.sin(t * 13);
      q.torse = 0.1;
      q.brasG = 0.15 + c * 0.55; q.brasD = 0.15 - c * 0.55;
      q.avG = 0.5; q.avD = 0.5;
      q.dy = -Math.abs(c) * 14;
      q.jaw = 0.75 + Math.sin(t * 20) * 0.15;
      q.tete = -0.06 + Math.sin(t * 13) * 0.05;
      q.yeux = 1;
      q.souffle = 1;
    } else if (quoi === 'nage') {
      q.torse = Math.sin(t * 0.8 + g) * 0.06;
      q.brasG = 0.15 + Math.sin(t * 1.1) * 0.25; q.brasD = 0.15 + Math.sin(t * 1.1 + 1) * 0.25;
      q.avG = 0.2; q.avD = 0.2;
      q.dy = Math.sin(t * 1.3) * 10;
      q.dx = Math.sin(t * 0.6) * 24;
      q.tete = Math.sin(t * 0.9 + g) * 0.06;
      q.yaw = Math.sin(t * 0.4) * 0.25;
      q.jaw = 0.15 + Math.max(0, Math.sin(t * 0.7)) * 0.25;
    } else if (quoi === 'vitre') {
      // Le museau contre la vitre : il mord dans le vide.
      q.jaw = Math.sin(t * 2.4 + g) > 0.55 ? 0.9 : 0.12;
      q.tete = Math.sin(t * 0.7) * 0.05;
      q.dx = Math.sin(t * 0.5) * 10;
      q.dy = Math.sin(t * 1.1) * 6;
      q.yeux = 0.9;
      tics(st, dt, q, 0.6, son);
    } else if (quoi === 'endo') {
      // Les endosquelettes de l'atelier : immobiles. Presque.
      q.yaw = st.yaw0 * 0.4;
      q.tete = st.tilt * 0.5;
      tics(st, dt, q, 0.5, null);
    } else if (quoi === 'endoProche') {
      q.yaw = 0; q.pitch = -0.1; q.tete = 0.12;
      q.jaw = 0.3 + Math.abs(bruit(t * 5, g)) * 0.2;
      q.yeux = 1;
      tics(st, dt, q, 0.7, son);
    } else if (quoi === 'vision') {
      q.jaw = 1; q.tete = bruit(t * 20, g) * 0.15; q.yaw = bruit(t * 17, g) * 0.15;
      q.yeux = 1; q.souffle = 1;
    }
    return q;
  }

  window.WADE_PANTINS = {
    RIGS: RIGS, squelette: squelette, pret: init, dessiner: dessiner, poser: poser, etat: etat, point: point
  };
})();
