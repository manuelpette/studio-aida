class LetterScramble extends HTMLElement {
  static get observedAttributes() {
    return ["sentence", "lock-after", "font-size", "letter-opacity"];
  }

  constructor() {
    super();
    this._raf = null;
    this._lockTimer = null;
    this._ro = null;
  }

  connectedCallback() {
    this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
      canvas {
        display: block;
        width: 100%;
        height: 100%;
      }
    `;

    this._canvas = document.createElement("canvas");
    this._ctx = this._canvas.getContext("2d");

    this.shadowRoot.append(style, this._canvas);

    this._init();

    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(this);

    this._canvas.addEventListener("mousemove", (e) => {
      const rect = this._canvas.getBoundingClientRect();
      this._targetMouse.x = e.clientX - rect.left;
      this._targetMouse.y = e.clientY - rect.top;
    });

    this._canvas.addEventListener("mouseleave", () => {
      this._targetMouse = { x: -999, y: -999 };
    });

    this._resize();
    this._animate();
  }

  disconnectedCallback() {
    cancelAnimationFrame(this._raf);
    clearTimeout(this._lockTimer);
    this._ro?.disconnect();
  }

  attributeChangedCallback() {
    if (this._canvas) {
      this._resize();
    }
  }

  // ─── Config ────────────────────────────────────────────────────────────────

  get _sentence() {
    return this.getAttribute("sentence") ?? "WE ARE AIDA";
  }

  get _lockAfter() {
    return parseInt(this.getAttribute("lock-after") ?? "5000", 10);
  }

  get _fontSize() {
    return parseInt(this.getAttribute("font-size") ?? "20", 10);
  }

  get _letterOpacity() {
    return parseFloat(this.getAttribute("letter-opacity") ?? "0.1");
  }

  // ─── Internal state ────────────────────────────────────────────────────────

  _init() {
    this._letters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
      "abcdefghijklmnopqrstuvwxyz" +
      "0123456789" +
      "!@#$%^&*()-_=+[]{}|;:,.<>/?~";

    this._grid = [];
    this._width = 0;
    this._height = 0;
    this._cols = 0;
    this._rows = 0;
    this._lockReached = false;
    this._lockedCellsNum = 0;
    this._targetMouse = { x: -999, y: -999 };
    this._currentMouse = { x: -999, y: -999 };
  }

  // ─── Grid ──────────────────────────────────────────────────────────────────

  _randomLetter() {
    return this._letters[Math.floor(Math.random() * this._letters.length)];
  }

  _buildGrid() {
    const { _cols: cols, _rows: rows, _fontSize: fontSize, _sentence: sentence } = this;
    const centerRow = Math.floor(rows / 2);
    const startCol = Math.floor((cols - sentence.length) / 2);
    const result = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let target = null;
        let locked = false;
        let char = this._randomLetter();

        if (r === centerRow && c >= startCol && c < startCol + sentence.length) {
          target = sentence[c - startCol];
          if (target === " ") {
            char = " ";
            locked = true;
          }
        }

        result.push({ x: c * fontSize, y: r * fontSize, char, target, locked });
      }
    }

    return result;
  }

  // ─── Resize ────────────────────────────────────────────────────────────────

  _resize() {
    const fontSize = this._fontSize;
    this._width = this._canvas.width = this.offsetWidth;
    this._height = this._canvas.height = this.offsetHeight;
    this._cols = Math.floor((this._width + fontSize * 2) / fontSize);
    this._rows = Math.floor((this._height + fontSize * 2) / fontSize);

    this._targetMouse = { x: -999, y: -999 };
    this._currentMouse = { x: -999, y: -999 };
    this._lockedCellsNum = 0;
    this._lockReached = false;

    this._grid.length = 0;
    this._grid.push(...this._buildGrid());

    clearTimeout(this._lockTimer);
    this._lockTimer = setTimeout(() => {
      this._lockReached = true;
    }, this._lockAfter);
  }

  // ─── Animation loop ────────────────────────────────────────────────────────

  _animate() {
    this._raf = requestAnimationFrame(() => this._animate());

    if (Math.random() < 0.04) {          // 2% chance per frame to trigger
        this._glitch = {
            offsetX: (Math.random() - 0.5) * 12,
            offsetY: (Math.random() - 0.5) * 4,
            ttl: 5 + Math.floor(Math.random() * 6)  // lasts 3-8 frames
        };
    }

    if (this._glitch) {
        if (--this._glitch.ttl <= 0) this._glitch = null;
    }

    const gx = this._glitch?.offsetX ?? 0;
    const gy = this._glitch?.offsetY ?? 0;

    const {
      _ctx: ctx,
      _width: width,
      _height: height,
      _grid: grid,
      _fontSize: fontSize,
    } = this;

    const strippedSentence = this._sentence.replace(/ /g, "");
    let found = false;

    ctx.clearRect(0, 0, width, height);

    // Mouse easing
    const tm = this._targetMouse;
    const cm = this._currentMouse;

    if (cm.x === -999 && tm.x !== -999) {
      cm.x = tm.x;
      cm.y = tm.y;
    } else if (tm.x !== -999) {
      cm.x += (tm.x - cm.x) * 0.1;
      cm.y += (tm.y - cm.y) * 0.1;
    } else {
      cm.x = -999;
      cm.y = -999;
    }

    ctx.font = `${fontSize}px "Roboto Mono", monospace`;
    ctx.textBaseline = "top";

    const radius = 100;

    for (const cell of grid) {
      const dx = cell.x - cm.x;
      const dy = cell.y - cm.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let offsetX = 0;
      let offsetY = 0;

      if (dist < radius && dist > 0) {
        const force = (radius - dist) / radius;
        offsetX = (dx / dist) * force * 20;
        offsetY = (dy / dist) * force * 20;
      }

      // Scramble non-target cells
      if (!cell.target || (!cell.locked && cell.target !== " ")) {
        if (Math.random() < 0.02) cell.char = this._randomLetter();
      }

      // Lock sentence letters one per frame
      if (cell.target && !cell.locked && cell.target !== " ") {
        if (!found && this._lockReached && this._lockedCellsNum < strippedSentence.length) {
          found = true;
          cell.char = cell.target;
        }

        if (cell.char === cell.target && !cell.locked) {
          this._lockedCellsNum++;
          cell.locked = true;
        } else if (Math.random() < 0.08) {
          cell.char = this._randomLetter();
        }
      }

      // Opacity
      let letterOpacity = this._letterOpacity;
      if (dist > 0 && dist < radius) {
        const minOpacity = this._letterOpacity;
        const maxOpacity = this._letterOpacity + 0.15;
        letterOpacity = parseFloat(
          (minOpacity + (maxOpacity - minOpacity) * (1 - dist / radius)).toFixed(2)
        );
      }


      /* ctx.fillStyle = cell.locked ? "white" : `rgba(255,255,255,${letterOpacity})`;
      ctx.fillText(cell.char, cell.x + offsetX, cell.y + offsetY); */

      if (cell.locked) {
        const shift = this._glitch ? 4 + Math.random() * 6 : 1.5;

        // Red channel — shifted left
        ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
        ctx.fillText(cell.char, cell.x + offsetX + gx - shift, cell.y + offsetY  + gy);

        // Blue channel — shifted right
        ctx.fillStyle = "rgba(0, 0, 255, 0.5)";
        ctx.fillText(cell.char, cell.x + offsetX + gx + shift, cell.y + offsetY + gy);

        // Green channel — center (or use white for the base)
        ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
        ctx.fillText(cell.char, cell.x - offsetX - gx + shift, cell.y - offsetY - gy);

        ctx.fillStyle = "rgba(255, 255, 255, 1)";
        ctx.fillText(cell.char, cell.x + offsetX + gx, cell.y + offsetY + gy);

        } else {
        ctx.fillStyle = `rgba(255,255,255,${letterOpacity})`;
        ctx.fillText(cell.char, cell.x + offsetX, cell.y + offsetY);
        }
    }
  }
}

customElements.define("letter-scramble", LetterScramble);