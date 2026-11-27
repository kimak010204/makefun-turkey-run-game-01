// Gobble Dash — bootstrap: canvas setup, rendering, input and the loop.
// Renders the title screen, the run with its HUD, and the caught/escaped
// end screens; keyboard (arrows/WASD/Space/Shift/Enter) and mouse both play.

(function () {
  'use strict';

  var G = window.GobbleGame;
  var Art = window.GobbleArt;
  var Audio = window.GobbleAudio;
  var Game = G.Game;
  var W = G.W;
  var H = G.H;
  var GROUND = G.GROUND;

  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var lastTime = 0;

  function fitCanvas() {
    var scale = Math.min(window.innerWidth / W, window.innerHeight / H);
    canvas.style.width = Math.floor(W * scale) + 'px';
    canvas.style.height = Math.floor(H * scale) + 'px';
  }
  window.addEventListener('resize', fitCanvas);
  fitCanvas();

  // ---- text helpers ----

  function centerText(text, x, y, font, color, stroke) {
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (stroke) {
      ctx.lineWidth = 8;
      ctx.strokeStyle = stroke;
      ctx.strokeText(text, x, y);
    }
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  function leftText(text, x, y, font, color, stroke) {
    ctx.font = font;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    if (stroke) {
      ctx.lineWidth = 4;
      ctx.strokeStyle = stroke;
      ctx.strokeText(text, x, y);
    }
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawButton(label, x, y, w, h, hot) {
    ctx.save();
    ctx.fillStyle = hot ? '#e67e22' : '#c0392b';
    roundRect(x, y, w, h, 14);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    centerText(label, x + w / 2, y + h / 2 + 1, 'bold 30px Georgia, serif', '#fff');
    ctx.restore();
    return { x: x, y: y, w: w, h: h };
  }

  function drawBubble(text, x, y, flip) {
    ctx.save();
    ctx.font = 'bold 22px Georgia, serif';
    var tw = ctx.measureText(text).width + 30;
    var bx = flip ? x - tw : x;
    ctx.fillStyle = '#fff';
    roundRect(bx, y, tw, 40, 18);
    ctx.fill();
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    if (flip) {
      ctx.moveTo(bx + tw - 18, y + 40);
      ctx.lineTo(bx + tw - 34, y + 58);
      ctx.lineTo(bx + tw - 40, y + 40);
    } else {
      ctx.moveTo(bx + 18, y + 40);
      ctx.lineTo(bx + 34, y + 58);
      ctx.lineTo(bx + 40, y + 40);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#7b241c';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, bx + tw / 2, y + 21);
    ctx.restore();
  }

  // ---- HUD ----

  function drawHUD() {
    // top bar
    ctx.fillStyle = 'rgba(43,22,8,0.72)';
    roundRect(16, 12, 1248, 64, 14);
    ctx.fill();

    leftText('SCORE  ' + Math.floor(Game.score), 40, 44, 'bold 30px Georgia, serif', '#ffd54f');
    centerText('DISTANCE  ' + Math.floor(Game.distance) + ' m  /  ' + G.WIN_DISTANCE + ' m', 640, 44, 'bold 28px Georgia, serif', '#fff');

    // lives as hearts
    ctx.font = '30px Georgia, serif';
    ctx.textAlign = 'right';
    for (var i = 0; i < 3; i++) {
      ctx.fillStyle = i < Game.lives ? '#e74c3c' : 'rgba(255,255,255,0.25)';
      ctx.fillText('♥', 1210 - i * 38, 44);
    }

    // progress bar to the forest
    var px = 40, pw = 1200, py = 88;
    ctx.fillStyle = 'rgba(43,22,8,0.6)';
    roundRect(px, py, pw, 14, 7);
    ctx.fill();
    var frac = Math.min(1, Game.distance / G.WIN_DISTANCE);
    var grad = ctx.createLinearGradient(px, 0, px + pw, 0);
    grad.addColorStop(0, '#f39c12');
    grad.addColorStop(1, '#27ae60');
    ctx.fillStyle = grad;
    if (frac > 0.005) {
      roundRect(px, py, Math.max(14, pw * frac), 14, 7);
      ctx.fill();
    }
    // forest flag at the end
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(px + pw - 4, py - 16, 4, 20);
    ctx.beginPath();
    ctx.moveTo(px + pw, py - 16);
    ctx.lineTo(px + pw + 22, py - 11);
    ctx.lineTo(px + pw, py - 6);
    ctx.closePath();
    ctx.fill();

    // dash cooldown meter
    var dfrac = Game.dashCooldown > 0 ? 1 - Game.dashCooldown / 2.2 : 1;
    ctx.fillStyle = 'rgba(43,22,8,0.6)';
    roundRect(40, 116, 180, 16, 8);
    ctx.fill();
    ctx.fillStyle = dfrac >= 1 ? '#2ecc71' : '#f39c12';
    if (dfrac > 0.01) {
      roundRect(40, 116, 180 * dfrac, 16, 8);
      ctx.fill();
    }
    leftText(dfrac >= 1 ? 'DASH READY  [SHIFT]' : 'DASH...', 230, 124, 'bold 16px Georgia, serif', '#fff');

    // speed readout — dark outline so it stays legible over the pale sun
    leftText('SPEED ' + Math.round(Game.speed / 14) + ' km/h', 1080, 124, 'bold 16px Georgia, serif', '#fff', '#2b1608');
  }

  // ---- screens ----

  function zoneFor() {
    if (Game.state === 'escaped') return 'forest';
    if (Game.distance > 700) return 'kitchen';
    return 'farm';
  }

  function drawWorld() {
    var zone = zoneFor();
    Art.drawBackground(ctx, W, H, GROUND, Game.scroll, zone);

    // corn
    for (var i = 0; i < Game.corns.length; i++) {
      var corn = Game.corns[i];
      Art.drawCorn(ctx, corn.x, corn.y, 1, Math.sin(corn.phase) * 5);
    }
    // obstacles
    for (var o = 0; o < Game.obstacles.length; o++) {
      var ob = Game.obstacles[o];
      if (ob.kind === 'oven') Art.drawOven(ctx, ob.x, ob.y, 1, Game.time);
      else if (ob.kind === 'pumpkin') Art.drawPumpkin(ctx, ob.x, ob.y, 1, ob.spin);
      else Art.drawKnife(ctx, ob.x, ob.y - 12, 1.8, -0.55 + Math.sin(Game.time * 6 + ob.x) * 0.08);
    }
    // farmer (behind the turkey)
    var farmerX = Game.turkey.x - Game.farmerGap;
    Art.drawFarmer(ctx, farmerX, GROUND, 1.05, Game.time * 9, {});
    // turkey
    var t = Game.turkey;
    Art.drawTurkey(ctx, t.x, t.y, 1.15, t.runPhase, { dashing: t.dashing });

    // speech bubbles
    for (var b = 0; b < Game.bubbles.length; b++) {
      var bub = Game.bubbles[b];
      if (bub.who === 'turkey') drawBubble(bub.text, t.x - 40, t.y - 150, false);
      else drawBubble(bub.text, farmerX + 40, GROUND - 240, true);
    }
  }

  function drawTitle() {
    Game.buttons = [];
    // backdrop: farm at dawn with the two rivals facing off at the edges
    Art.drawBackground(ctx, W, H, GROUND, Game.scroll, 'farm');
    Art.drawFarmer(ctx, 175, GROUND, 1.35, Game.time * 5, {});
    Art.drawTurkey(ctx, 1115, GROUND - 46, 1.5, Game.time * 5, {});
    drawBubble('GOBBLE! NOT TODAY!', 1150, GROUND - 300, true);
    drawBubble('DINNER TIME!', 60, GROUND - 310, false);

    // title banner
    ctx.fillStyle = 'rgba(43,22,8,0.55)';
    roundRect(190, 56, 900, 190, 24);
    ctx.fill();
    centerText('GOBBLE DASH', 640, 130, 'bold 92px Georgia, serif', '#ffd54f', '#7b241c');
    centerText('★ THE GREAT TURKEY ESCAPE ★', 640, 200, 'bold 30px Georgia, serif', '#fff');
    centerText('Outrun the farmer. Dodge the oven. Duck the carving knife.', 640, 232, 'italic 22px Georgia, serif', '#ffe8a3');

    // start button
    var btn = drawButton('▶  RUN FOR YOUR LIFE', 440, 300, 400, 72, true);
    Game.buttons.push({ rect: btn, action: 'start' });
    centerText('or press ENTER', 640, 396, 'bold 18px Georgia, serif', '#5d3413', '#fff');

    // controls card
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    roundRect(340, 430, 600, 150, 16);
    ctx.fill();
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 3;
    ctx.stroke();
    centerText('HOW TO PLAY', 640, 458, 'bold 22px Georgia, serif', '#7b241c');
    leftText('↑ / SPACE / CLICK — jump over ovens & pumpkins', 370, 492, '20px Georgia, serif', '#333');
    leftText('SHIFT — dash away from the farmer', 370, 522, '20px Georgia, serif', '#333');
    leftText('Grab corn (+50) • Reach the forest at 1000 m • 3 lives', 370, 552, '20px Georgia, serif', '#333');
    if (Game.best > 0) centerText('BEST SCORE: ' + Math.floor(Game.best), 640, 620, 'bold 22px Georgia, serif', '#ffd54f', '#7b241c');
    centerText('M — mute sound', 640, 668, 'bold 16px Georgia, serif', '#5d3413');
  }

  function drawEnd() {
    var escaped = Game.state === 'escaped';
    Game.buttons = [];
    // hide the in-world speech bubbles: the panel speaks here instead
    var savedBubbles = Game.bubbles;
    Game.bubbles = [];
    drawWorld();
    Game.bubbles = savedBubbles;
    // dim + panel
    ctx.fillStyle = escaped ? 'rgba(20,80,30,0.45)' : 'rgba(60,10,10,0.5)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(43,22,8,0.9)';
    roundRect(290, 110, 700, 420, 24);
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = escaped ? '#2ecc71' : '#e74c3c';
    ctx.stroke();

    if (escaped) {
      centerText('🎉 ESCAPED! 🎉', 640, 180, 'bold 64px Georgia, serif', '#2ecc71', '#145a32');
      centerText('You made it to the safe forest!', 640, 240, '26px Georgia, serif', '#fff');
      centerText('No Thanksgiving dinner for you, farmer.', 640, 276, 'italic 22px Georgia, serif', '#ffe8a3');
    } else {
      centerText('CAUGHT!', 640, 180, 'bold 72px Georgia, serif', '#e74c3c', '#641e16');
      centerText('The farmer got his Thanksgiving dinner...', 640, 240, '26px Georgia, serif', '#fff');
      centerText('So close! The forest was ' + Math.max(0, G.WIN_DISTANCE - Game.endStats.distance) + ' m away.', 640, 276, 'italic 22px Georgia, serif', '#ffe8a3');
    }
    var s = Game.endStats || { score: 0, distance: 0, corns: 0 };
    centerText('SCORE  ' + Math.floor(s.score), 640, 330, 'bold 30px Georgia, serif', '#ffd54f');
    centerText('DISTANCE  ' + s.distance + ' m    •    CORN  ' + s.corns, 640, 366, '22px Georgia, serif', '#fff');
    centerText('BEST SCORE: ' + Math.floor(Game.best), 640, 400, '22px Georgia, serif', '#fff');
    var btn = drawButton('↻  RUN AGAIN', 470, 420, 340, 68, true);
    Game.buttons.push({ rect: btn, action: 'start' });
    centerText('or press ENTER', 640, 512, '18px Georgia, serif', '#fff');
    // the triumphant (or sheepish) turkey, visible beside the panel
    if (escaped) {
      Art.drawTurkey(ctx, 1135, GROUND - 46, 1.3, Game.time * 5, {});
      drawBubble('FREEDOM!', 1000, GROUND - 290, false);
    }
  }

  function drawPlaying() {
    Game.buttons = [];
    drawWorld();
    drawHUD();
    if (Game.flashTimer > 0) {
      ctx.fillStyle = 'rgba(231,76,60,' + (Game.flashTimer * 1.6) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    // danger vignette when the farmer is close
    if (Game.farmerGap < 110) {
      var pulse = 0.25 + Math.sin(Game.time * 8) * 0.12;
      var vg = ctx.createRadialGradient(640, 360, 300, 640, 360, 720);
      vg.addColorStop(0, 'rgba(231,76,60,0)');
      vg.addColorStop(1, 'rgba(231,76,60,' + pulse + ')');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
      centerText('⚠ HE IS RIGHT BEHIND YOU! ⚠', 640, 170, 'bold 30px Georgia, serif', '#e74c3c', '#fff');
    }
  }

  // ---- render ----

  function render() {
    ctx.save();
    if (Game.shake > 0) {
      ctx.translate((Math.random() - 0.5) * Game.shake, (Math.random() - 0.5) * Game.shake);
    }
    if (Game.state === 'title') drawTitle();
    else if (Game.state === 'playing') drawPlaying();
    else drawEnd();
    // leaves drift over everything
    for (var i = 0; i < Game.leaves.length; i++) {
      var lf = Game.leaves[i];
      Art.drawLeaf(ctx, lf.x, lf.y, lf.rot, lf.scale, lf.color);
    }
    // particles
    for (var p = 0; p < Game.particles.length; p++) {
      var pt = Game.particles[p];
      if (pt.kind === 'feather') Art.drawFeather(ctx, pt.x, pt.y, pt.rot, pt.scale);
      else {
        ctx.fillStyle = 'rgba(241,196,15,' + Math.max(0, pt.life / pt.max) + ')';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // ---- input ----

  function startGame() {
    Audio.ensure();
    Audio.click();
    G.resetRun();
  }

  function canvasPos(evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: (evt.clientX - rect.left) * (W / rect.width),
      y: (evt.clientY - rect.top) * (H / rect.height)
    };
  }

  canvas.addEventListener('click', function (evt) {
    var pos = canvasPos(evt);
    for (var i = 0; i < Game.buttons.length; i++) {
      var r = Game.buttons[i].rect;
      if (pos.x >= r.x && pos.x <= r.x + r.w && pos.y >= r.y && pos.y <= r.y + r.h) {
        if (Game.buttons[i].action === 'start') startGame();
        return;
      }
    }
    if (Game.state === 'playing') G.jump();
  });

  window.addEventListener('keydown', function (evt) {
    var k = evt.key;
    if (k === 'ArrowUp' || k === ' ' || k === 'w' || k === 'W') {
      evt.preventDefault();
      if (Game.state === 'playing') G.jump();
      else if (Game.state === 'title' || Game.state === 'caught' || Game.state === 'escaped') startGame();
    } else if (k === 'Enter') {
      if (Game.state !== 'playing') startGame();
    } else if (k === 'Shift') {
      if (Game.state === 'playing') G.dash();
    } else if (k === 'ArrowDown' || k === 's' || k === 'S') {
      if (Game.state === 'playing') G.dash();
    } else if (k === 'm' || k === 'M') {
      Audio.toggleMute();
    }
  });

  // ---- screenshot shots ----

  var params = new URLSearchParams(window.location.search);
  var shot = params.get('shot');
  if (shot) {
    G.applyShot(shot);
  } else {
    G.resetTurkey();
    Game.state = 'title';
    Game.farmerGap = 190;
    Game.bubbles = [];
    Game.scroll = 400;
  }

  // ---- loop ----

  // A ?shot= preset is a staged still: render the staged frame and never
  // advance the simulation, so the shot is stable indefinitely.
  var frozen = !!shot;

  function frame(now) {
    var dt = Math.min(0.05, (now - lastTime) / 1000 || 0.016);
    lastTime = now;
    if (!frozen) G.update(dt);
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
