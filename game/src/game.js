// Gobble Dash — game logic: states, physics, farmer chase, hazards,
// corn, HUD, particles, speech bubbles and deterministic screenshot shots.

(function () {
  'use strict';

  var W = 1280;
  var H = 720;
  var GROUND = 600;
  var WIN_DISTANCE = 1000; // metres to the safe forest
  var LEAF_COLORS = ['#e67e22', '#c0392b', '#f1c40f', '#d35400'];

  var Game = {
    state: 'title', // title | playing | caught | escaped
    time: 0,
    score: 0,
    distance: 0,
    lives: 3,
    best: 0,
    speed: 0,
    scroll: 0,
    shake: 0,
    turkey: null,
    farmerGap: 190, // pixels between turkey and farmer; 0 = caught
    dashTimer: 0,
    dashCooldown: 0,
    obstacles: [],
    corns: [],
    particles: [],
    leaves: [],
    bubbles: [],
    spawnTimer: 0,
    cornTimer: 0,
    gobbleTimer: 0,
    flashTimer: 0,
    endStats: null,
    buttons: []
  };

  function resetTurkey() {
    Game.turkey = {
      x: 330,
      y: GROUND - 46,
      vy: 0,
      onGround: true,
      runPhase: 0,
      dashing: false
    };
  }

  function resetRun() {
    Game.state = 'playing';
    Game.time = 0;
    Game.score = 0;
    Game.distance = 0;
    Game.lives = 3;
    Game.speed = 340;
    Game.scroll = 0;
    Game.shake = 0;
    Game.farmerGap = 190;
    Game.dashTimer = 0;
    Game.dashCooldown = 0;
    Game.obstacles = [];
    Game.corns = [];
    Game.particles = [];
    Game.bubbles = [];
    Game.spawnTimer = 1.1;
    Game.cornTimer = 0.6;
    Game.gobbleTimer = 2.5;
    Game.flashTimer = 0;
    Game.endStats = null;
    resetTurkey();
    sayTurkey('GOBBLE! NOT TODAY!', 2.2);
    sayFarmer('GET BACK HERE!', 2.2);
  }

  function sayTurkey(text, dur) {
    Game.bubbles.push({ who: 'turkey', text: text, t: dur, max: dur });
  }

  function sayFarmer(text, dur) {
    Game.bubbles.push({ who: 'farmer', text: text, t: dur, max: dur });
  }

  // ---- spawning ----

  function spawnObstacle() {
    var roll = Math.random();
    var kind;
    if (Game.distance < 120) kind = 'pumpkin';
    else if (roll < 0.38) kind = 'oven';
    else if (roll < 0.7) kind = 'pumpkin';
    else kind = 'knife';
    var ob = {
      kind: kind,
      x: W + 80,
      y: GROUND,
      w: kind === 'oven' ? 92 : kind === 'pumpkin' ? 68 : 44,
      h: kind === 'oven' ? 128 : kind === 'pumpkin' ? 60 : 26,
      spin: 0,
      passed: false
    };
    if (kind === 'knife') ob.y = GROUND - 4;
    Game.obstacles.push(ob);
  }

  function spawnCorn() {
    var n = 2 + Math.floor(Math.random() * 3);
    var baseY = GROUND - 90 - Math.random() * 120;
    for (var i = 0; i < n; i++) {
      Game.corns.push({ x: W + 60 + i * 52, y: baseY, taken: false, phase: Math.random() * 6 });
    }
  }

  // ---- particles ----

  function burstFeathers(x, y, n) {
    for (var i = 0; i < n; i++) {
      Game.particles.push({
        kind: 'feather',
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 30,
        vx: -120 - Math.random() * 160,
        vy: -60 - Math.random() * 120,
        rot: Math.random() * 6.28,
        vr: (Math.random() - 0.5) * 8,
        scale: 0.7 + Math.random() * 0.7,
        life: 0.9 + Math.random() * 0.5,
        max: 1.4
      });
    }
  }

  function burstStars(x, y, n) {
    for (var i = 0; i < n; i++) {
      Game.particles.push({
        kind: 'star',
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 260,
        vy: (Math.random() - 0.5) * 260 - 60,
        rot: 0,
        vr: 0,
        scale: 1,
        life: 0.5 + Math.random() * 0.3,
        max: 0.8
      });
    }
  }

  function spawnLeaf() {
    Game.leaves.push({
      x: Math.random() * W,
      y: -12,
      vy: 34 + Math.random() * 40,
      sway: Math.random() * 6.28,
      rot: Math.random() * 6.28,
      scale: 0.7 + Math.random() * 0.8,
      color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)]
    });
  }

  // ---- actions ----

  function jump() {
    var t = Game.turkey;
    if (Game.state !== 'playing' || !t.onGround) return;
    t.vy = -760;
    t.onGround = false;
    window.GobbleAudio.jump();
  }

  function dash() {
    if (Game.state !== 'playing' || Game.dashCooldown > 0) return;
    Game.dashTimer = 0.45;
    Game.dashCooldown = 2.2;
    Game.turkey.dashing = true;
    Game.farmerGap = Math.min(320, Game.farmerGap + 55);
    window.GobbleAudio.dash();
    burstFeathers(Game.turkey.x - 20, Game.turkey.y, 6);
    sayTurkey('ZOOM!', 1.0);
  }

  function takeHit(ob) {
    Game.lives--;
    Game.shake = 16;
    Game.flashTimer = 0.25;
    Game.farmerGap = Math.max(30, Game.farmerGap - 70);
    burstFeathers(Game.turkey.x, Game.turkey.y - 20, 14);
    window.GobbleAudio.hit();
    if (Math.random() < 0.6) sayFarmer('ALMOST HAD YA!', 1.6);
    if (Game.lives <= 0) {
      endRun(false);
    } else {
      sayTurkey('OUCH! MY FEATHERS!', 1.4);
    }
  }

  function endRun(escaped) {
    Game.state = escaped ? 'escaped' : 'caught';
    Game.endStats = {
      score: Math.floor(Game.score),
      distance: Math.floor(Game.distance),
      corns: Game.cornCount || 0
    };
    if (Game.score > Game.best) Game.best = Math.floor(Game.score);
    if (escaped) {
      window.GobbleAudio.win();
      sayTurkey('FREEDOM!', 3);
    } else {
      window.GobbleAudio.caught();
      burstFeathers(Game.turkey.x, Game.turkey.y - 20, 24);
    }
  }

  // ---- update ----

  function update(dt) {
    Game.time += dt;
    // ambient falling leaves everywhere
    if (Math.random() < dt * 6) spawnLeaf();
    for (var i = Game.leaves.length - 1; i >= 0; i--) {
      var lf = Game.leaves[i];
      lf.y += lf.vy * dt;
      lf.sway += dt * 2;
      lf.x += Math.sin(lf.sway) * 30 * dt;
      lf.rot += dt * 1.5;
      if (lf.y > H + 20) Game.leaves.splice(i, 1);
    }
    // particles
    for (var p = Game.particles.length - 1; p >= 0; p--) {
      var pt = Game.particles[p];
      pt.life -= dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 260 * dt;
      pt.rot += pt.vr * dt;
      if (pt.life <= 0) Game.particles.splice(p, 1);
    }
    // speech bubbles
    for (var b = Game.bubbles.length - 1; b >= 0; b--) {
      Game.bubbles[b].t -= dt;
      if (Game.bubbles[b].t <= 0) Game.bubbles.splice(b, 1);
    }
    if (Game.shake > 0) Game.shake = Math.max(0, Game.shake - dt * 40);
    if (Game.flashTimer > 0) Game.flashTimer -= dt;

    if (Game.state !== 'playing') {
      // idle animation on title/end screens
      if (Game.turkey) Game.turkey.runPhase += dt * 6;
      return;
    }

    var t = Game.turkey;
    // speed ramps up with distance
    Game.speed = 340 + Math.min(260, Game.distance * 0.35);
    var curSpeed = Game.speed;
    if (Game.dashTimer > 0) {
      Game.dashTimer -= dt;
      curSpeed *= 1.7;
      if (Game.dashTimer <= 0) t.dashing = false;
    }
    if (Game.dashCooldown > 0) Game.dashCooldown -= dt;

    Game.distance += (curSpeed * dt) / 14; // ~14 px per metre
    Game.scroll += curSpeed * dt;
    Game.score += curSpeed * dt * 0.06;

    // turkey physics
    t.vy += 2400 * dt;
    t.y += t.vy * dt;
    if (t.y >= GROUND - 46) {
      t.y = GROUND - 46;
      t.vy = 0;
      t.onGround = true;
    }
    t.runPhase += dt * (10 + Game.speed / 60);

    // the farmer never gives up: he closes in slowly, faster after a hit
    Game.farmerGap -= dt * (6 + Game.distance * 0.012);
    if (Game.farmerGap <= 0) {
      endRun(false);
      return;
    }

    // gobble now and then
    Game.gobbleTimer -= dt;
    if (Game.gobbleTimer <= 0) {
      Game.gobbleTimer = 3 + Math.random() * 4;
      window.GobbleAudio.gobble();
      var lines = ['GOBBLE GOBBLE!', 'NOT TODAY, FARMER!', 'MY FEATHERS, MY RULES!', 'RUN, TURKEY, RUN!'];
      sayTurkey(lines[Math.floor(Math.random() * lines.length)], 1.6);
    }

    // spawning
    Game.spawnTimer -= dt;
    if (Game.spawnTimer <= 0) {
      spawnObstacle();
      var gap = Math.max(0.85, 1.9 - Game.distance * 0.0009);
      Game.spawnTimer = gap * (0.8 + Math.random() * 0.5);
    }
    Game.cornTimer -= dt;
    if (Game.cornTimer <= 0) {
      spawnCorn();
      Game.cornTimer = 2.2 + Math.random() * 1.6;
    }

    // obstacles
    for (var o = Game.obstacles.length - 1; o >= 0; o--) {
      var ob = Game.obstacles[o];
      ob.x -= curSpeed * dt;
      if (ob.kind === 'pumpkin') ob.spin += dt * 4;
      if (ob.kind === 'knife') ob.x -= 60 * dt; // knives slide toward the turkey
      if (ob.x < -120) {
        Game.obstacles.splice(o, 1);
        continue;
      }
      // collision: turkey box vs obstacle box
      var tx0 = t.x - 34, tx1 = t.x + 40;
      var ty0 = t.y - 66, ty1 = t.y + 46;
      var ox0 = ob.x - ob.w / 2, ox1 = ob.x + ob.w / 2;
      var oy0 = ob.y - ob.h, oy1 = ob.y;
      if (tx1 > ox0 && tx0 < ox1 && ty1 > oy0 && ty0 < oy1) {
        Game.obstacles.splice(o, 1);
        takeHit(ob);
        if (Game.state !== 'playing') return;
        continue;
      }
      if (!ob.passed && ob.x + ob.w / 2 < t.x - 34) {
        ob.passed = true;
        Game.score += 25;
      }
    }

    // corn
    for (var c = Game.corns.length - 1; c >= 0; c--) {
      var corn = Game.corns[c];
      corn.x -= curSpeed * dt;
      corn.phase += dt * 4;
      if (corn.x < -40) {
        Game.corns.splice(c, 1);
        continue;
      }
      var dx = corn.x - t.x;
      var dy = corn.y - (t.y - 10);
      if (dx * dx + dy * dy < 58 * 58) {
        Game.corns.splice(c, 1);
        Game.score += 50;
        Game.cornCount = (Game.cornCount || 0) + 1;
        Game.farmerGap = Math.min(320, Game.farmerGap + 12);
        burstStars(corn.x, corn.y, 8);
        window.GobbleAudio.pickup();
      }
    }

    // win!
    if (Game.distance >= WIN_DISTANCE) {
      endRun(true);
    }
  }

  // ---- deterministic screenshot shots (?shot=start|play|action|end) ----

  function applyShot(shot) {
    if (shot === 'start') {
      Game.state = 'title';
      resetTurkey();
      Game.distance = 0;
      Game.score = 0;
      Game.lives = 3;
      Game.farmerGap = 190;
      Game.obstacles = [];
      Game.corns = [];
      Game.bubbles = [{ who: 'turkey', text: 'GOBBLE! NOT TODAY!', t: 99, max: 99 }];
      Game.scroll = 400;
    } else if (shot === 'play') {
      resetRun();
      Game.distance = 412;
      Game.score = 2350;
      Game.cornCount = 6;
      Game.farmerGap = 95; // farmer right on the turkey's tail
      Game.obstacles = [
        { kind: 'oven', x: 880, y: GROUND, w: 92, h: 128, spin: 0, passed: false },
        { kind: 'knife', x: 620, y: GROUND - 4, w: 44, h: 26, spin: 0, passed: false },
        { kind: 'pumpkin', x: 1150, y: GROUND, w: 68, h: 60, spin: 0.6, passed: false }
      ];
      Game.corns = [
        { x: 520, y: GROUND - 150, taken: false, phase: 1 },
        { x: 572, y: GROUND - 150, taken: false, phase: 2 },
        { x: 720, y: GROUND - 210, taken: false, phase: 3 }
      ];
      Game.turkey.y = GROUND - 46;
      Game.bubbles = [
        { who: 'turkey', text: 'NOT TODAY, FARMER!', t: 99, max: 99 },
        { who: 'farmer', text: 'GET BACK HERE!', t: 99, max: 99 }
      ];
      Game.scroll = 5200;
      // NOTE: main.js freezes ?shot= presets (the update loop is skipped),
      // so this staged frame stays exactly as set for the screenshot.
    } else if (shot === 'action') {
      resetRun();
      Game.distance = 768;
      Game.score = 4890;
      Game.cornCount = 14;
      Game.farmerGap = 150;
      Game.dashTimer = 0.3;
      Game.dashCooldown = 1.2;
      Game.turkey.dashing = true;
      Game.turkey.vy = -420;
      Game.turkey.onGround = false;
      Game.turkey.y = GROUND - 170;
      Game.obstacles = [
        { kind: 'oven', x: 700, y: GROUND, w: 92, h: 128, spin: 0, passed: false },
        { kind: 'pumpkin', x: 1080, y: GROUND, w: 68, h: 60, spin: 1.2, passed: false }
      ];
      Game.corns = [
        { x: 760, y: GROUND - 260, taken: false, phase: 0 },
        { x: 812, y: GROUND - 260, taken: false, phase: 1 }
      ];
      burstFeathers(300, GROUND - 160, 16);
      Game.bubbles = [{ who: 'turkey', text: 'ZOOM!', t: 99, max: 99 }];
      Game.scroll = 9800;
    } else if (shot === 'end') {
      resetRun();
      Game.distance = WIN_DISTANCE;
      Game.score = 9120;
      Game.cornCount = 21;
      Game.state = 'escaped';
      Game.endStats = { score: 9120, distance: 1000, corns: 21 };
      Game.best = 9120;
      Game.scroll = 14000;
      Game.bubbles = [{ who: 'turkey', text: 'FREEDOM!', t: 99, max: 99 }];
    }
  }

  window.GobbleGame = {
    Game: Game,
    W: W,
    H: H,
    GROUND: GROUND,
    WIN_DISTANCE: WIN_DISTANCE,
    resetRun: resetRun,
    resetTurkey: resetTurkey,
    jump: jump,
    dash: dash,
    update: update,
    applyShot: applyShot,
    sayTurkey: sayTurkey,
    sayFarmer: sayFarmer
  };
})();
