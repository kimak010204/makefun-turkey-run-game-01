// Gobble Dash — all artwork is drawn in code on the canvas.
// No image files, no external assets: turkey, farmer, oven, pumpkins,
// knives, corn and the autumn farm are pure canvas shapes.

(function () {
  'use strict';

  var TAU = Math.PI * 2;

  function ellipse(ctx, x, y, rx, ry) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    ctx.fill();
  }

  function circle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }

  // ---- the turkey: big, round, expressive, tail fanned like a fan ----
  function drawTurkey(ctx, x, y, scale, runPhase, opts) {
    opts = opts || {};
    var bob = Math.sin(runPhase * 2) * 3;
    var legSwing = Math.sin(runPhase) * 14;
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.scale(scale, scale);
    if (opts.flip) ctx.scale(-1, 1);

    // tail feathers, fanned
    var featherColors = ['#c0392b', '#e67e22', '#f1c40f', '#8e44ad', '#16a085'];
    for (var i = -2; i <= 2; i++) {
      ctx.save();
      ctx.translate(-34, -18);
      ctx.rotate(i * 0.42 - 0.15);
      ctx.fillStyle = featherColors[i + 2];
      ctx.beginPath();
      ctx.ellipse(0, -34, 13, 36, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.ellipse(0, -56, 5, 12, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    // legs, running
    ctx.strokeStyle = '#e67e22';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, 18);
    ctx.lineTo(-6 + legSwing, 44);
    ctx.moveTo(8, 18);
    ctx.lineTo(8 - legSwing, 44);
    ctx.stroke();
    // feet
    ctx.fillStyle = '#e67e22';
    ellipse(ctx, -6 + legSwing, 46, 9, 4);
    ellipse(ctx, 8 - legSwing, 46, 9, 4);

    // body
    ctx.fillStyle = '#7b4a21';
    ellipse(ctx, 0, 0, 42, 36);
    ctx.fillStyle = '#9c6b30';
    ellipse(ctx, 4, -6, 30, 26);

    // wing
    ctx.fillStyle = '#5d3413';
    ctx.save();
    ctx.translate(-4, -2);
    ctx.rotate(Math.sin(runPhase * 2) * 0.25 - 0.2);
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 15, -0.4, 0, TAU);
    ctx.fill();
    ctx.restore();

    // neck + head
    ctx.fillStyle = '#7b4a21';
    ctx.fillRect(26, -46, 14, 26);
    ctx.fillStyle = '#d98e4a';
    circle(ctx, 34, -52, 15);
    // wattle
    ctx.fillStyle = '#c0392b';
    ellipse(ctx, 40, -40, 5, 9);
    // beak
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.moveTo(46, -56);
    ctx.lineTo(62, -50);
    ctx.lineTo(46, -46);
    ctx.closePath();
    ctx.fill();
    // eye (wide, panicked — or determined when dashing)
    ctx.fillStyle = '#fff';
    circle(ctx, 38, -58, 6);
    ctx.fillStyle = '#111';
    circle(ctx, 40, -58, 3);
    if (opts.dashing) {
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(32, -64);
      ctx.lineTo(44, -62);
      ctx.stroke();
    }
    // snood
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(48, -52);
    ctx.quadraticCurveTo(54, -44, 50, -38);
    ctx.stroke();

    ctx.restore();
  }

  // ---- the farmer: overalls, straw hat, carving knife, furious ----
  function drawFarmer(ctx, x, y, scale, runPhase, opts) {
    opts = opts || {};
    var legSwing = Math.sin(runPhase) * 16;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // legs (blue overalls)
    ctx.strokeStyle = '#2c4a7a';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-8, -52);
    ctx.lineTo(-8 + legSwing, 0);
    ctx.moveTo(8, -52);
    ctx.lineTo(8 - legSwing, 0);
    ctx.stroke();

    // body: red shirt + overalls bib
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(-20, -108, 40, 58);
    ctx.fillStyle = '#2c4a7a';
    ctx.fillRect(-16, -92, 32, 42);
    ctx.fillStyle = '#f1c40f';
    circle(ctx, -8, -70, 3);
    circle(ctx, 8, -70, 3);

    // arm reaching forward, waving the carving knife
    var wave = Math.sin(runPhase * 1.5) * 0.3;
    ctx.save();
    ctx.translate(16, -96);
    ctx.rotate(-0.9 + wave);
    ctx.strokeStyle = '#e8b88a';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(26, 0);
    ctx.stroke();
    drawKnife(ctx, 30, 0, 1.1, 0.3);
    ctx.restore();

    // back arm pumping
    ctx.strokeStyle = '#e8b88a';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(-16, -96);
    ctx.lineTo(-30, -78 + Math.sin(runPhase) * 8);
    ctx.stroke();

    // head
    ctx.fillStyle = '#e8b88a';
    circle(ctx, 0, -124, 16);
    // moustache + angry brows
    ctx.fillStyle = '#5d3413';
    ctx.fillRect(-10, -116, 20, 5);
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-11, -134);
    ctx.lineTo(-2, -130);
    ctx.moveTo(11, -134);
    ctx.lineTo(2, -130);
    ctx.stroke();
    // eyes
    ctx.fillStyle = '#fff';
    circle(ctx, -6, -128, 4);
    circle(ctx, 6, -128, 4);
    ctx.fillStyle = '#111';
    circle(ctx, -5, -128, 2);
    circle(ctx, 7, -128, 2);
    // straw hat
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.ellipse(0, -138, 26, 7, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e6b800';
    ctx.beginPath();
    ctx.ellipse(0, -142, 14, 9, 0, Math.PI, TAU);
    ctx.fill();
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(-14, -144, 28, 5);

    ctx.restore();
  }

  // ---- a carving knife: silver blade, dark handle ----
  function drawKnife(ctx, x, y, scale, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle || 0);
    ctx.scale(scale || 1, scale || 1);
    ctx.fillStyle = '#3b2f2f';
    ctx.fillRect(-16, -4, 14, 8);
    ctx.fillStyle = '#dfe6e9';
    ctx.beginPath();
    ctx.moveTo(-2, -5);
    ctx.lineTo(34, -2);
    ctx.lineTo(40, 0);
    ctx.lineTo(34, 2);
    ctx.lineTo(-2, 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#b2bec3';
    ctx.fillRect(-2, -5, 3, 10);
    ctx.restore();
  }

  // ---- the oven: the turkey's worst nightmare, with a sign ----
  function drawOven(ctx, x, y, scale, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    // body
    ctx.fillStyle = '#4a4a55';
    ctx.fillRect(-46, -96, 92, 96);
    ctx.fillStyle = '#5d5d6b';
    ctx.fillRect(-46, -96, 92, 14);
    // door window with fire glow
    var flicker = 0.7 + Math.sin(t * 9) * 0.3;
    ctx.fillStyle = 'rgba(255,' + Math.floor(120 + 60 * flicker) + ',0,' + (0.55 + 0.3 * flicker) + ')';
    ctx.fillRect(-32, -66, 64, 40);
    ctx.fillStyle = '#2d2d33';
    ctx.fillRect(-32, -66, 64, 40);
    ctx.fillStyle = 'rgba(255,140,0,' + (0.5 + 0.4 * flicker) + ')';
    ctx.beginPath();
    ctx.moveTo(-24, -30);
    ctx.quadraticCurveTo(-18, -52, -10, -30);
    ctx.quadraticCurveTo(-4, -50, 2, -30);
    ctx.quadraticCurveTo(10, -54, 18, -30);
    ctx.quadraticCurveTo(24, -44, 26, -30);
    ctx.closePath();
    ctx.fill();
    // handle + knobs
    ctx.fillStyle = '#c0c0c8';
    ctx.fillRect(-32, -88, 64, 6);
    ctx.fillStyle = '#e74c3c';
    circle(ctx, -22, -76, 4);
    circle(ctx, 0, -76, 4);
    circle(ctx, 22, -76, 4);
    // legs
    ctx.fillStyle = '#2d2d33';
    ctx.fillRect(-42, 0, 8, 10);
    ctx.fillRect(34, 0, 8, 10);
    // sign
    ctx.fillStyle = '#f5e6c8';
    ctx.fillRect(-66, -128, 132, 26);
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 2;
    ctx.strokeRect(-66, -128, 132, 26);
    ctx.fillStyle = '#c0392b';
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('DINNER IS SERVED', 0, -110);
    ctx.restore();
  }

  // ---- a rolling pumpkin ----
  function drawPumpkin(ctx, x, y, scale, spin) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#e67e22';
    ellipse(ctx, 0, 0, 34, 30);
    ctx.fillStyle = '#d35400';
    ctx.beginPath();
    ctx.ellipse(-12, 0, 8, 28, 0.2, 0, TAU);
    ctx.ellipse(12, 0, 8, 28, -0.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(-3, -34, 6, 12);
    ctx.fillStyle = '#1e8449';
    ctx.beginPath();
    ctx.moveTo(2, -30);
    ctx.quadraticCurveTo(16, -38, 24, -28);
    ctx.quadraticCurveTo(12, -26, 2, -24);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ---- a corn cob, golden and worth 50 points ----
  function drawCorn(ctx, x, y, scale, bob) {
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 26, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e6b800';
    for (var r = -2; r <= 2; r++) {
      for (var c = -1; c <= 1; c++) {
        circle(ctx, c * 7, r * 10, 2.5);
      }
    }
    ctx.fillStyle = '#27ae60';
    ctx.beginPath();
    ctx.moveTo(-12, 8);
    ctx.quadraticCurveTo(-22, 26, -8, 34);
    ctx.quadraticCurveTo(-4, 20, -2, 10);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(12, 8);
    ctx.quadraticCurveTo(22, 26, 8, 34);
    ctx.quadraticCurveTo(4, 20, 2, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ---- autumn farm backdrop: sky, sun, hills, barn, fence, trees ----
  function drawBackground(ctx, w, h, groundY, scroll, zone) {
    // sky gradient
    var sky = ctx.createLinearGradient(0, 0, 0, groundY);
    if (zone === 'forest') {
      sky.addColorStop(0, '#7ec8e3');
      sky.addColorStop(1, '#c8ecb0');
    } else if (zone === 'kitchen') {
      sky.addColorStop(0, '#f39c12');
      sky.addColorStop(1, '#fdebd0');
    } else {
      sky.addColorStop(0, '#ff9a3c');
      sky.addColorStop(0.55, '#ffc46b');
      sky.addColorStop(1, '#ffe8a3');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, groundY + 2);

    // sun
    ctx.fillStyle = '#fff3b0';
    circle(ctx, 1080, 110, 52);
    ctx.fillStyle = 'rgba(255,243,176,0.35)';
    circle(ctx, 1080, 110, 78);

    // clouds
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    drawCloud(ctx, 220 - (scroll * 0.08 % 1400), 90);
    drawCloud(ctx, 700 - (scroll * 0.08 % 1400), 150);
    drawCloud(ctx, 1150 - (scroll * 0.08 % 1400), 70);

    // distant hills
    ctx.fillStyle = zone === 'forest' ? '#5da85d' : '#d98a3d';
    ctx.beginPath();
    ctx.moveTo(0, groundY - 60);
    for (var hx = 0; hx <= w; hx += 40) {
      ctx.lineTo(hx, groundY - 60 - Math.sin((hx + scroll * 0.2) * 0.006) * 34 - 18);
    }
    ctx.lineTo(w, groundY);
    ctx.lineTo(0, groundY);
    ctx.closePath();
    ctx.fill();

    // barn + farmhouse silhouette (parallax)
    var barnX = 980 - ((scroll * 0.35) % 1700);
    drawBarn(ctx, barnX, groundY - 58);
    var houseX = 420 - ((scroll * 0.35) % 1700);
    drawFarmhouse(ctx, houseX, groundY - 48);

    // trees
    for (var i = 0; i < 4; i++) {
      var tx = ((i * 430 + 180 - scroll * 0.5) % 1500 + 1500) % 1500 - 110;
      drawAutumnTree(ctx, tx, groundY - 40, 0.9 + (i % 2) * 0.25);
    }

    // ground
    var gnd = ctx.createLinearGradient(0, groundY, 0, h);
    gnd.addColorStop(0, '#b5772f');
    gnd.addColorStop(1, '#7a4a16');
    ctx.fillStyle = gnd;
    ctx.fillRect(0, groundY, w, h - groundY);
    ctx.fillStyle = '#8f5e24';
    ctx.fillRect(0, groundY, w, 8);

    // fence posts scrolling past
    ctx.fillStyle = '#6e4423';
    for (var fx = -((scroll * 1) % 90); fx < w; fx += 90) {
      ctx.fillRect(fx, groundY - 34, 8, 34);
    }
    ctx.fillRect(0, groundY - 30, w, 5);
    ctx.fillRect(0, groundY - 16, w, 5);
  }

  function drawCloud(ctx, x, y) {
    ctx.beginPath();
    ctx.ellipse(x, y, 46, 18, 0, 0, TAU);
    ctx.ellipse(x - 28, y + 6, 30, 14, 0, 0, TAU);
    ctx.ellipse(x + 30, y + 6, 32, 15, 0, 0, TAU);
    ctx.fill();
  }

  function drawBarn(ctx, x, y) {
    ctx.fillStyle = '#a93226';
    ctx.fillRect(x, y - 90, 130, 90);
    ctx.fillStyle = '#7b241c';
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 90);
    ctx.lineTo(x + 65, y - 132);
    ctx.lineTo(x + 138, y - 90);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f5e6c8';
    ctx.lineWidth = 4;
    ctx.strokeRect(x + 45, y - 58, 40, 58);
    ctx.beginPath();
    ctx.moveTo(x + 45, y - 58);
    ctx.lineTo(x + 85, y);
    ctx.moveTo(x + 85, y - 58);
    ctx.lineTo(x + 45, y);
    ctx.stroke();
  }

  function drawFarmhouse(ctx, x, y) {
    ctx.fillStyle = '#f5e6c8';
    ctx.fillRect(x, y - 62, 96, 62);
    ctx.fillStyle = '#7b241c';
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 62);
    ctx.lineTo(x + 48, y - 96);
    ctx.lineTo(x + 102, y - 62);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(x + 14, y - 44, 18, 18);
    ctx.fillRect(x + 62, y - 44, 18, 18);
    ctx.fillStyle = '#6e4423';
    ctx.fillRect(x + 40, y - 30, 16, 30);
  }

  function drawAutumnTree(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = '#6e4423';
    ctx.fillRect(-6, -70, 12, 70);
    var cols = ['#e67e22', '#c0392b', '#f1c40f'];
    for (var i = 0; i < 3; i++) {
      ctx.fillStyle = cols[i];
      circle(ctx, (i - 1) * 22, -86 + (i % 2) * 10, 26);
    }
    ctx.restore();
  }

  // ---- a falling leaf particle ----
  function drawLeaf(ctx, x, y, rot, scale, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 4, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  // ---- a feather particle ----
  function drawFeather(ctx, x, y, rot, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 4, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#7b4a21';
    ctx.beginPath();
    ctx.ellipse(-3, 0, 4, 2, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  window.GobbleArt = {
    drawTurkey: drawTurkey,
    drawFarmer: drawFarmer,
    drawKnife: drawKnife,
    drawOven: drawOven,
    drawPumpkin: drawPumpkin,
    drawCorn: drawCorn,
    drawBackground: drawBackground,
    drawLeaf: drawLeaf,
    drawFeather: drawFeather
  };
})();
