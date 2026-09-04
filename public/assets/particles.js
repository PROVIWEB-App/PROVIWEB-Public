/**
 * Particulas decorativas PROVIWEB (reactivas al movimiento del sticker en ser-aliado.html)
 * Uso: incluir <canvas id="particlesCanvas"></canvas> y este script.
 */
(function() {
    var canvas = document.getElementById('particlesCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    function resizeCanvas() {
        var dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(window.innerWidth * dpr);
        canvas.height = Math.floor(window.innerHeight * dpr);
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    var BASE_COUNT = 50;
    var particleFont = '14px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji", system-ui, sans-serif';
    var SYMBOLS = [
        '\uD83C\uDFB5', '\uD83C\uDFB6', '\uD83C\uDFBC', '\uD83C\uDFA8',
        '\uD83D\uDD8C\uFE0F', '\uD83C\uDFAD', '\uD83C\uDFA4', '\uD83C\uDFA7',
        '\uD83C\uDFB9', '\uD83C\uDFBB', '\uD83C\uDFB7', '\uD83C\uDFBA',
        '\uD83E\uDD41', '\uD83C\uDFB8', '\uD83D\uDC4F', '\u2728'
    ];

    function Particle() {
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight;
        this.speedX = (Math.random() * 0.5 + 0.15) * (Math.random() > 0.5 ? 1 : -1);
        this.speedY = (Math.random() * 0.5 + 0.15) * (Math.random() > 0.5 ? 1 : -1);
        this.opacity = Math.random() * 0.4 + 0.25;
        this.symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        this.size = Math.random() * 4 + 12;
    }

    Particle.prototype.update = function(mult, jitter) {
        this.x += this.speedX * mult + (Math.random() - 0.5) * jitter;
        this.y += this.speedY * mult + (Math.random() - 0.5) * jitter;
        if (this.x > window.innerWidth + 20 || this.x < -20) this.speedX *= -1;
        if (this.y > window.innerHeight + 20 || this.y < -20) this.speedY *= -1;
    };

    Particle.prototype.draw = function(alphaBoost) {
        ctx.globalAlpha = this.opacity;
        ctx.font = (this.size + alphaBoost * 2) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji", system-ui, sans-serif';
        ctx.fillText(this.symbol, this.x, this.y);
    };

    var particles = [];
    for (var i = 0; i < BASE_COUNT; i++) particles.push(new Particle());

    function animate() {
        while (particles.length < BASE_COUNT) particles.push(new Particle());
        while (particles.length > BASE_COUNT) particles.pop();

        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.font = particleFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 1;

        var speedMult = 1;
        var jitter = 0.05;
        var alphaBoost = 0;

        for (var i = 0; i < particles.length; i++) {
            particles[i].update(speedMult, jitter);
            particles[i].draw(alphaBoost);
        }

        ctx.globalAlpha = 1;
        var connectionDistance = 100;
        var connectionDistanceSq = connectionDistance * connectionDistance;
        var lineBaseAlpha = 0.15;

        for (var a = 0; a < particles.length; a++) {
            for (var b = a + 1; b < particles.length; b++) {
                var dx = particles[a].x - particles[b].x;
                var dy = particles[a].y - particles[b].y;
                if (dx * dx + dy * dy < connectionDistanceSq) {
                    var dist = Math.sqrt(dx * dx + dy * dy);
                    var ratio = 1 - dist / connectionDistance;
                    var blue = 235;
                    var green = 123;
                    ctx.strokeStyle = 'rgba(0,' + green + ',' + blue + ',' + (lineBaseAlpha * ratio) + ')';
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(animate);
    }

    animate();
})();
