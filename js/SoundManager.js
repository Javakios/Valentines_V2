export class SoundManager {
    constructor() {
        this.enabled = true;
        this.sounds = {};

        // Setup AudioContext (Wait for user interaction)
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5; // 50% Volume
        this.masterGain.connect(this.ctx.destination);

        // Pre-generate Step Buffer
        this.stepBuffer = null;

        // Load Sounds
        this.loadSound('meow', 'sounds/meow.wav');
    }

    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        if (!this.stepBuffer) this.createStepBuffer();
    }

    createStepBuffer() {
        const bufferSize = this.ctx.sampleRate * 0.05;
        this.stepBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = this.stepBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5;
        }
    }

    loadSound(name, url) {
        fetch(url)
            .then(res => res.arrayBuffer())
            .then(buffer => this.ctx.decodeAudioData(buffer))
            .then(audioBuf => {
                this.sounds[name] = audioBuf;
            })
            .catch(e => console.warn("Sound load failed:", url));
    }

    play(name) {
        if (!this.enabled || !this.sounds[name]) return;
        const source = this.ctx.createBufferSource();
        source.buffer = this.sounds[name];
        source.connect(this.masterGain);
        source.start(0);
    }

    playStep() {
        if (!this.enabled) return;
        this.resume();
        if (!this.stepBuffer) return;

        const noise = this.ctx.createBufferSource();
        noise.buffer = this.stepBuffer;
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 150;

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start();
    }

    playMeow() {
        if (!this.enabled) return;
        this.resume();

        // Use Real Sound if loaded, else fallback to silence (so we don't annoy user)
        if (this.sounds['meow']) {
            this.play('meow');
        } else {
            // No more procedural beep, just wait for load
        }
    }

    // Procedural "Sound" if files missing (Fallback Beeps)
    playBeep(freq = 440, type = 'sine') {
        if (!this.enabled) return;
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }
}
