// Gobble Dash — synthesized sound effects (WebAudio only, no audio files).
// Every sound is built from oscillators and noise buffers at run time.

(function () {
  'use strict';

  var audioCtx = null;
  var masterGain = null;
  var muted = false;

  // Lazily create the audio context on the first user gesture, so browsers
  // that block autoplay still let the game sing once play starts.
  function ensureAudio() {
    if (audioCtx) {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.35;
    masterGain.connect(audioCtx.destination);
    return audioCtx;
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return;
    var ctx = ensureAudio();
    if (!ctx) return;
    var t = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t + dur);
    gain.gain.setValueAtTime(vol || 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function noiseBurst(dur, vol, lowpass) {
    if (muted) return;
    var ctx = ensureAudio();
    if (!ctx) return;
    var t = ctx.currentTime;
    var len = Math.floor(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass || 1200;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(vol || 0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    src.start(t);
  }

  // A turkey gobble: three fast descending "gob" syllables.
  function gobble() {
    if (muted) return;
    var ctx = ensureAudio();
    if (!ctx) return;
    var base = ctx.currentTime;
    for (var i = 0; i < 3; i++) {
      (function (k) {
        var t = base + k * 0.09;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(320 - k * 40, t);
        osc.frequency.exponentialRampToValueAtTime(140, t + 0.08);
        gain.gain.setValueAtTime(0.16, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(t);
        osc.stop(t + 0.1);
      })(i);
    }
  }

  var sfx = {
    ensure: ensureAudio,
    jump: function () { tone(280, 0.18, 'sine', 0.22, 620); },
    dash: function () { noiseBurst(0.22, 0.2, 2400); tone(180, 0.2, 'sawtooth', 0.08, 520); },
    pickup: function () { tone(880, 0.09, 'triangle', 0.22); setTimeout(function () { tone(1320, 0.12, 'triangle', 0.2); }, 70); },
    hit: function () { noiseBurst(0.25, 0.35, 700); tone(120, 0.3, 'sawtooth', 0.25, 55); },
    caught: function () { tone(392, 0.25, 'sawtooth', 0.2, 196); setTimeout(function () { tone(262, 0.5, 'sawtooth', 0.2, 98); }, 220); },
    win: function () {
      var notes = [523, 659, 784, 1047];
      notes.forEach(function (f, i) {
        setTimeout(function () { tone(f, 0.35, 'triangle', 0.22); }, i * 130);
      });
    },
    gobble: gobble,
    click: function () { tone(660, 0.06, 'square', 0.12); },
    toggleMute: function () {
      muted = !muted;
      return muted;
    },
    isMuted: function () { return muted; }
  };

  window.GobbleAudio = sfx;
})();
