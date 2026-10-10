(function () {
  "use strict";

  function readText(bytes, start, length) {
    return String.fromCharCode.apply(null, bytes.slice(start, start + length));
  }

  function readUint32(bytes, offset) {
    return ((bytes[offset] << 24) >>> 0) + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3];
  }

  function readVariableLength(bytes, position) {
    var value = 0;
    var byte;
    do {
      byte = bytes[position.index++];
      value = (value << 7) | (byte & 0x7f);
    } while (byte & 0x80);
    return value;
  }

  function parseMidi(buffer) {
    var bytes = new Uint8Array(buffer);
    if (readText(bytes, 0, 4) !== "MThd") throw new Error("不是有效的 MIDI 文件。");

    var headerLength = readUint32(bytes, 4);
    var trackCount = (bytes[10] << 8) + bytes[11];
    var division = (bytes[12] << 8) + bytes[13];
    if (!division || (division & 0x8000)) throw new Error("该 MIDI 的时间格式暂不支持。");

    var position = 8 + headerLength;
    var events = [];
    var order = 0;

    for (var track = 0; track < trackCount && position < bytes.length; track++) {
      if (readText(bytes, position, 4) !== "MTrk") throw new Error("MIDI 音轨读取失败。");
      var trackEnd = position + 8 + readUint32(bytes, position + 4);
      position += 8;
      var tick = 0;
      var runningStatus = 0;

      while (position < trackEnd) {
        tick += readVariableLength(bytes, { get index() { return position; }, set index(value) { position = value; } });
        var status = bytes[position];
        if (status < 0x80) {
          if (!runningStatus) throw new Error("MIDI 运行状态读取失败。");
          status = runningStatus;
        } else {
          position++;
          if (status < 0xf0) runningStatus = status;
        }

        if (status === 0xff) {
          var metaType = bytes[position++];
          var metaLength = readVariableLength(bytes, { get index() { return position; }, set index(value) { position = value; } });
          if (metaType === 0x51 && metaLength === 3) {
            events.push({ type: "tempo", tick: tick, tempo: (bytes[position] << 16) + (bytes[position + 1] << 8) + bytes[position + 2], order: order++ });
          }
          position += metaLength;
          continue;
        }

        if (status === 0xf0 || status === 0xf7) {
          var systemLength = readVariableLength(bytes, { get index() { return position; }, set index(value) { position = value; } });
          position += systemLength;
          continue;
        }

        var command = status & 0xf0;
        var channel = status & 0x0f;
        var note = bytes[position++];
        var velocity = (command === 0xc0 || command === 0xd0) ? 0 : bytes[position++];

        if (command === 0x90 && velocity > 0) {
          events.push({ type: "on", tick: tick, channel: channel, note: note, velocity: velocity, order: order++ });
        } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
          events.push({ type: "off", tick: tick, channel: channel, note: note, order: order++ });
        }
      }
      position = trackEnd;
    }

    events.sort(function (a, b) { return a.tick - b.tick || a.order - b.order; });
    var currentTempo = 500000;
    var lastTick = 0;
    var seconds = 0;
    events.forEach(function (event) {
      seconds += ((event.tick - lastTick) * currentTempo) / (division * 1000000);
      event.time = seconds;
      if (event.type === "tempo") currentTempo = event.tempo;
      lastTick = event.tick;
    });

    var active = {};
    var notes = [];
    events.forEach(function (event) {
      var key = event.channel + ":" + event.note;
      if (event.type === "on") {
        active[key] = active[key] || [];
        active[key].push(event);
      } else if (event.type === "off" && active[key] && active[key].length) {
        var start = active[key].shift();
        if (event.time > start.time) notes.push({ start: start.time, end: event.time, note: start.note, velocity: start.velocity, channel: start.channel });
      }
    });

    return { notes: notes, duration: seconds };
  }

  function MidiPlayer(source) {
    this.source = source;
    this.context = null;
    this.sequence = null;
    this.loading = null;
    this.nodes = [];
    this.timer = null;
    this.isPlaying = false;
    this.onEnded = null;
  }

  MidiPlayer.prototype.activate = function () {
    if (!this.context) {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) throw new Error("此浏览器不支持网页音频播放。");
      this.context = new AudioContext();
    }
    if (this.context.state === "suspended") this.context.resume();
  };

  MidiPlayer.prototype.load = function () {
    var self = this;
    if (this.sequence) return Promise.resolve(this.sequence);
    if (!this.loading) {
      this.loading = fetch(this.source)
        .then(function (response) {
          if (!response.ok) throw new Error("音乐素材暂时无法加载。");
          return response.arrayBuffer();
        })
        .then(function (buffer) {
          self.sequence = parseMidi(buffer);
          if (!self.sequence.notes.length) throw new Error("这段 MIDI 中没有可播放的音符。");
          return self.sequence;
        });
    }
    return this.loading;
  };

  MidiPlayer.prototype.play = function () {
    var self = this;
    this.activate();
    return this.load().then(function (sequence) {
      self.stop(false);
      var context = self.context;
      var beginAt = context.currentTime + 0.06;
      sequence.notes.forEach(function (noteData) {
        var oscillator = context.createOscillator();
        var gain = context.createGain();
        var duration = Math.max(0.07, noteData.end - noteData.start);
        var startAt = beginAt + noteData.start;
        var endAt = startAt + duration;
        oscillator.type = noteData.channel === 9 ? "square" : "triangle";
        oscillator.frequency.setValueAtTime(440 * Math.pow(2, (noteData.note - 69) / 12), startAt);
        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.012, Math.min(0.09, noteData.velocity / 1450)), startAt + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(startAt);
        oscillator.stop(endAt + 0.03);
        self.nodes.push(oscillator);
      });
      self.isPlaying = true;
      self.timer = window.setTimeout(function () { self.stop(true); }, Math.ceil((sequence.duration + 0.2) * 1000));
      return sequence.duration;
    });
  };

  MidiPlayer.prototype.stop = function (notify) {
    if (this.timer) window.clearTimeout(this.timer);
    this.timer = null;
    this.nodes.forEach(function (node) { try { node.stop(); } catch (error) { /* node already ended */ } });
    this.nodes = [];
    var wasPlaying = this.isPlaying;
    this.isPlaying = false;
    if (notify && wasPlaying && typeof this.onEnded === "function") this.onEnded();
  };

  window.ProjectMidiPlayer = MidiPlayer;
})();
