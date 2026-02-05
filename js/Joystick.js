export class Joystick {
    constructor(options) {
        this.maxRadius = options.maxRadius || 40;
        this.onMove = options.onMove || (() => { });

        // Create DOM Elements
        this.dom = document.createElement('div');
        this.dom.style.cssText = `
            position: absolute;
            bottom: 50px; left: 50px;
            width: 100px; height: 100px;
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            touch-action: none;
            display: none; /* Hidden by default on Desktop */
        `;

        this.stick = document.createElement('div');
        this.stick.style.cssText = `
            position: absolute;
            top: 50%; left: 50%;
            width: 40px; height: 40px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
        `;

        this.dom.appendChild(this.stick);
        document.body.appendChild(this.dom);

        // Events
        this.active = false;
        this.origin = { x: 0, y: 0 };
        this.current = { x: 0, y: 0 };

        this.dom.addEventListener('pointerdown', this.onDown.bind(this));
        document.addEventListener('pointermove', this.onMoveEvent.bind(this));
        document.addEventListener('pointerup', this.onUp.bind(this));

        // Auto-show on Touch
        if ('ontouchstart' in window) {
            this.dom.style.display = 'block';
        }
    }

    onDown(e) {
        this.active = true;
        this.origin.x = e.clientX;
        this.origin.y = e.clientY;
        this.stick.style.transition = 'none';

        // Only capture simple press
        this.current.x = 0;
        this.current.y = 0;
    }

    onMoveEvent(e) {
        if (!this.active) return;

        const dx = e.clientX - this.origin.x;
        const dy = e.clientY - this.origin.y;

        const dist = Math.sqrt(dx * dx + dy * dy);
        const force = Math.min(dist, this.maxRadius);
        const angle = Math.atan2(dy, dx);

        this.current.x = Math.cos(angle) * force;
        this.current.y = Math.sin(angle) * force;

        this.stick.style.transform = `translate(calc(-50% + ${this.current.x}px), calc(-50% + ${this.current.y}px))`;

        // Normalize -1 to 1
        const normX = this.current.x / this.maxRadius;
        const normY = this.current.y / this.maxRadius;

        this.onMove({ x: normX, y: normY });
    }

    onUp() {
        this.active = false;
        this.current = { x: 0, y: 0 };
        this.stick.style.transition = '0.2s';
        this.stick.style.transform = `translate(-50%, -50%)`;
        this.onMove({ x: 0, y: 0 });
    }
}
