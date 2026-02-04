export class Joystick {
    constructor(inputs) {
        this.inputs = inputs;
        this.active = false;
        this.center = { x: 0, y: 0 };
        this.touchId = null;

        // Create UI
        this.el = document.createElement('div');
        this.el.style.position = 'absolute';
        this.el.style.bottom = '50px';
        this.el.style.left = '50px';
        this.el.style.width = '120px';
        this.el.style.height = '120px';
        this.el.style.background = 'rgba(255, 255, 255, 0.1)';
        this.el.style.borderRadius = '50%';
        this.el.style.border = '2px solid rgba(255,255,255,0.3)';
        this.el.style.display = 'none'; // Hidden on desktop by default? Or check touch?
        // Let's show it only if touch events fire or assume mobile if tiny screen?
        // Better: Always show if requested, or CSS media query.
        this.el.id = 'virtual-joystick';
        document.body.appendChild(this.el);

        this.stick = document.createElement('div');
        this.stick.style.position = 'absolute';
        this.stick.style.top = '50%';
        this.stick.style.left = '50%';
        this.stick.style.width = '50px';
        this.stick.style.height = '50px';
        this.stick.style.background = 'rgba(255, 255, 255, 0.5)';
        this.stick.style.borderRadius = '50%';
        this.stick.style.transform = 'translate(-50%, -50%)';
        this.stick.style.pointerEvents = 'none';
        this.el.appendChild(this.stick);

        // Interaction Button
        this.btn = document.createElement('div');
        this.btn.style.position = 'absolute';
        this.btn.style.bottom = '60px';
        this.btn.style.right = '50px';
        this.btn.style.width = '80px';
        this.btn.style.height = '80px';
        this.btn.style.background = 'rgba(0, 255, 170, 0.3)';
        this.btn.style.borderRadius = '50%';
        this.btn.style.border = '2px solid #00ffaa';
        this.btn.style.display = 'flex';
        this.btn.style.justifyContent = 'center';
        this.btn.style.alignItems = 'center';
        this.btn.innerText = 'E';
        this.btn.style.color = 'white';
        this.btn.style.fontSize = '24px';
        this.btn.id = 'action-btn';
        document.body.appendChild(this.btn);

        this.el.addEventListener('touchstart', (e) => this.start(e), { passive: false });
        this.el.addEventListener('touchmove', (e) => this.move(e), { passive: false });
        this.el.addEventListener('touchend', (e) => this.end(e));

        this.btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.inputs.e = true;
            this.btn.style.background = 'rgba(0, 255, 170, 0.8)';
        });
        this.btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.inputs.e = false;
            this.btn.style.background = 'rgba(0, 255, 170, 0.3)';
        });

        // Detect touch logic
        if ('ontouchstart' in window) {
            this.el.style.display = 'block';
            this.btn.style.display = 'flex';
        } else {
            this.el.style.display = 'none';
            this.btn.style.display = 'none';
        }
    }

    start(e) {
        e.preventDefault();
        const touch = e.changedTouches[0];
        this.touchId = touch.identifier;
        this.active = true;
        const rect = this.el.getBoundingClientRect();
        this.center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        this.updateStick(touch.clientX, touch.clientY);
    }

    move(e) {
        e.preventDefault();
        if (!this.active) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === this.touchId) {
                this.updateStick(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
                break;
            }
        }
    }

    end(e) {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === this.touchId) {
                this.active = false;
                this.touchId = null;
                this.reset();
                break;
            }
        }
    }

    updateStick(x, y) {
        const dx = x - this.center.x;
        const dy = y - this.center.y;
        const angle = Math.atan2(dy, dx);
        const dist = Math.min(Math.sqrt(dx * dx + dy * dy), 40); // Max radius

        const sx = Math.cos(angle) * dist;
        const sy = Math.sin(angle) * dist;

        this.stick.style.transform = `translate(calc(-50% + ${sx}px), calc(-50% + ${sy}px))`;

        // Map to Inputs
        // Up is -Y in screen, so negative dy.
        // Left is -X.
        // We trigger W/S/A/D based on thresholds

        this.inputs.w = sy < -10;
        this.inputs.s = sy > 10;
        this.inputs.a = sx < -10;
        this.inputs.d = sx > 10;
    }

    reset() {
        this.stick.style.transform = 'translate(-50%, -50%)';
        this.inputs.w = false;
        this.inputs.s = false;
        this.inputs.a = false;
        this.inputs.d = false;
    }
}
