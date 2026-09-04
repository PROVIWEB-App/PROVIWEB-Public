/**
 * PROVIWEB - Herramientas Musicales Profesionales
 * 1. Afinador Cromático (Pitch Detection con Web Audio API y Autocorrelación)
 * 2. Metrónomo Digital de Alta Precisión (Web Audio Lookahead Scheduler)
 */

(function(global) {
    'use strict';

    // --- 1. METRÓNOMO DIGITAL ---
    class ProviwebMetronome {
        constructor() {
            this.audioCtx = null;
            this.bpm = 120;
            this.beatsPerBar = 4;
            this.currentBeat = 0;
            this.isPlaying = false;
            this.nextNoteTime = 0.0;
            this.timerID = null;
            this.lookahead = 25.0; // ms
            this.scheduleAheadTime = 0.1; // seg
            this.onBeatChange = null;
            this.tapTimes = [];
        }

        initContext() {
            if (!this.audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioCtx = new AudioContext();
            }
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
        }

        nextNote() {
            const secondsPerBeat = 60.0 / this.bpm;
            this.nextNoteTime += secondsPerBeat;
            this.currentBeat = (this.currentBeat + 1) % this.beatsPerBar;
        }

        scheduleNote(beatNumber, time) {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            // Primer pulso acentuado (frecuencia más alta)
            if (beatNumber === 0) {
                osc.frequency.value = 1000;
                gain.gain.value = 0.9;
            } else {
                osc.frequency.value = 600;
                gain.gain.value = 0.4;
            }

            osc.start(time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
            osc.stop(time + 0.05);

            if (this.onBeatChange) {
                const delay = Math.max(0, (time - this.audioCtx.currentTime) * 1000);
                setTimeout(() => {
                    if (this.isPlaying && this.onBeatChange) {
                        this.onBeatChange(beatNumber);
                    }
                }, delay);
            }
        }

        scheduler() {
            while (this.nextNoteTime < this.audioCtx.currentTime + this.scheduleAheadTime) {
                this.scheduleNote(this.currentBeat, this.nextNoteTime);
                this.nextNote();
            }
            if (this.isPlaying) {
                this.timerID = setTimeout(() => this.scheduler(), this.lookahead);
            }
        }

        start() {
            this.initContext();
            if (this.isPlaying) return;
            this.isPlaying = true;
            this.currentBeat = 0;
            this.nextNoteTime = this.audioCtx.currentTime + 0.05;
            this.scheduler();
        }

        stop() {
            this.isPlaying = false;
            if (this.timerID) {
                clearTimeout(this.timerID);
                this.timerID = null;
            }
            if (this.onBeatChange) {
                this.onBeatChange(-1);
            }
        }

        setBpm(val) {
            this.bpm = Math.min(280, Math.max(30, Number(val) || 120));
        }

        setBeatsPerBar(val) {
            this.beatsPerBar = Number(val) || 4;
            this.currentBeat = 0;
        }

        tapTempo() {
            const now = Date.now();
            this.tapTimes.push(now);
            if (this.tapTimes.length > 4) {
                this.tapTimes.shift();
            }
            if (this.tapTimes.length >= 2) {
                const intervals = [];
                for (let i = 1; i < this.tapTimes.length; i++) {
                    intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
                }
                const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
                if (avgInterval > 200 && avgInterval < 2000) {
                    const calculatedBpm = Math.round(60000 / avgInterval);
                    this.setBpm(calculatedBpm);
                    return calculatedBpm;
                }
            }
            return this.bpm;
        }
    }

    // --- 2. AFINADOR CROMÁTICO (TUNER) ---
    const NOTE_STRINGS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

    class ProviwebTuner {
        constructor() {
            this.audioCtx = null;
            this.analyser = null;
            this.mediaStream = null;
            this.isListening = false;
            this.rafID = null;
            this.buf = new Float32Array(2048);
            this.onPitchUpdate = null;
        }

        async start() {
            if (this.isListening) return;
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
            if (this.audioCtx.state === 'suspended') {
                await this.audioCtx.resume();
            }

            this.analyser = this.audioCtx.createAnalyser();
            this.analyser.fftSize = 2048;

            try {
                this.mediaStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false
                    }
                });
                const source = this.audioCtx.createMediaStreamSource(this.mediaStream);
                source.connect(this.analyser);
                this.isListening = true;
                this.updatePitch();
            } catch (err) {
                console.error('[Tuner] No se pudo acceder al micrófono:', err);
                throw err;
            }
        }

        stop() {
            this.isListening = false;
            if (this.rafID) {
                cancelAnimationFrame(this.rafID);
                this.rafID = null;
            }
            if (this.mediaStream) {
                this.mediaStream.getTracks().forEach(t => t.stop());
                this.mediaStream = null;
            }
            if (this.audioCtx && this.audioCtx.state !== 'closed') {
                this.audioCtx.close();
                this.audioCtx = null;
            }
        }

        // Algoritmo de Autocorrelación para detección de frecuencia fundamental
        autoCorrelate(buf, sampleRate) {
            let SIZE = buf.length;
            let rms = 0;

            for (let i = 0; i < SIZE; i++) {
                const val = buf[i];
                rms += val * val;
            }
            rms = Math.sqrt(rms / SIZE);

            // Nivel de señal mínimo para evitar ruido de fondo
            if (rms < 0.015) return -1;

            let r1 = 0, r2 = SIZE - 1, thres = 0.2;
            for (let i = 0; i < SIZE / 2; i++) {
                if (Math.abs(buf[i]) < thres) { r1 = i; break; }
            }
            for (let i = 1; i < SIZE / 2; i++) {
                if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
            }

            buf = buf.slice(r1, r2);
            SIZE = buf.length;

            const c = new Array(SIZE).fill(0);
            for (let i = 0; i < SIZE; i++) {
                for (let j = 0; j < SIZE - i; j++) {
                    c[i] = c[i] + buf[j] * buf[j + i];
                }
            }

            let d = 0;
            while (c[d] > c[d + 1]) d++;
            let maxval = -1, maxpos = -1;
            for (let i = d; i < SIZE; i++) {
                if (c[i] > maxval) {
                    maxval = c[i];
                    maxpos = i;
                }
            }
            let T0 = maxpos;

            // Interpolación parabólica para mayor precisión
            const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
            const a = (x1 + x3 - 2 * x2) / 2;
            const b = (x3 - x1) / 2;
            if (a) T0 = T0 - b / (2 * a);

            return sampleRate / T0;
        }

        noteFromPitch(frequency) {
            const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
            return Math.round(noteNum) + 69;
        }

        frequencyFromNoteNumber(note) {
            return 440 * Math.pow(2, (note - 69) / 12);
        }

        centsOffFromPitch(frequency, note) {
            return Math.floor(1200 * Math.log(frequency / this.frequencyFromNoteNumber(note)) / Math.log(2));
        }

        updatePitch() {
            if (!this.isListening) return;

            this.analyser.getFloatTimeDomainData(this.buf);
            const ac = this.autoCorrelate(this.buf, this.audioCtx.sampleRate);

            if (ac === -1) {
                if (this.onPitchUpdate) {
                    this.onPitchUpdate({ active: false });
                }
            } else {
                const pitch = ac;
                const note = this.noteFromPitch(pitch);
                const noteName = NOTE_STRINGS[note % 12];
                const octave = Math.floor(note / 12) - 1;
                const cents = this.centsOffFromPitch(pitch, note);

                if (this.onPitchUpdate) {
                    this.onPitchUpdate({
                        active: true,
                        frequency: Math.round(pitch * 10) / 10,
                        noteName: noteName,
                        octave: octave,
                        cents: cents,
                        inTune: Math.abs(cents) <= 4
                    });
                }
            }

            this.rafID = requestAnimationFrame(() => this.updatePitch());
        }

        playReferenceTone(freq = 440, duration = 1.5) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.value = 0.3;

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            osc.stop(ctx.currentTime + duration);
        }
    }

    // Exponer clases
    global.ProviwebMetronome = ProviwebMetronome;
    global.ProviwebTuner = ProviwebTuner;

})(typeof window !== 'undefined' ? window : this);
