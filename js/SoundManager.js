export class SoundManager {
    constructor() {
        this.enabled = true;
        this.sounds = {};

        // Setup AudioContext (Wait for user interaction)
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5; // 50% Volume
        this.masterGain.connect(this.ctx.destination);
    }

    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
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

        // Simple One-Shot Play
        const source = this.ctx.createBufferSource();
        source.buffer = this.sounds[name];
        source.connect(this.masterGain);
        source.start(0);
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
