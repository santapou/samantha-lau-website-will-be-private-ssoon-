
// java script does look confusing as hell
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        const offset = document.getElementById('navbar').offsetHeight;
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset - 20, behavior: 'smooth' });
    });
});

const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
});

const revealTargets = ['.album-card', '.member-card', '.lyric-card', '.about-text p', '.stat', '.section-header'];
revealTargets.forEach(selector => {
    document.querySelectorAll(selector).forEach((el, i) => {
        el.classList.add('reveal');
        el.style.transitionDelay = `${i * 0.08}s`;
    });
});

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

function openSpotify(card) {
    const url = card.dataset.spotify;
    if (url) {
        card.style.transform = 'scale(0.97)';
        setTimeout(() => {
            card.style.transform = '';
            window.open(url, '_blank', 'noopener,noreferrer');
        }, 150);
    }
}

function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    for (let i = 0; i < 40; i++) {
        const dot = document.createElement('div');
        dot.style.cssText = `
            position:absolute; border-radius:50%;
            background:rgba(147,197,253,${Math.random() * 0.15 + 0.02});
            width:${Math.random() * 4 + 1}px; height:${Math.random() * 4 + 1}px;
            left:${Math.random() * 100}%; top:${Math.random() * 100}%;
            animation:floatParticle ${Math.random() * 20 + 15}s ease-in-out infinite;
            animation-delay:-${Math.random() * 20}s;
        `;
        container.appendChild(dot);
    }
    const s = document.createElement('style');
    s.textContent = `@keyframes floatParticle {
        0%,100%{transform:translateY(0) translateX(0);opacity:.3}
        25%{transform:translateY(-40px) translateX(20px);opacity:.6}
        50%{transform:translateY(-70px) translateX(-15px);opacity:.2}
        75%{transform:translateY(-30px) translateX(30px);opacity:.5}
    }`;
    document.head.appendChild(s);
}
createParticles();

(function () {
    const canvas = document.getElementById('spectrumCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const BAR_COUNT = 80;
    const INNER_R   = 118;
    const MAX_BAR_H = 58;
    const MIN_BAR_H = 3;
    const BAR_WIDTH = 2.8;
    const CX = canvas.width  / 2;
    const CY = canvas.height / 2;

    const NEON_COLORS = [
        { r: 255, g:  50, b: 180 },
        { r: 255, g:   0, b: 255 },
        { r: 100, g:   0, b: 255 },
        { r:   0, g: 150, b: 255 },
        { r:   0, g: 255, b: 220 },
        { r:   0, g: 255, b: 100 },
        { r: 180, g: 255, b:   0 },
        { r: 255, g: 200, b:   0 },
        { r: 255, g:  80, b:   0 },
        { r: 255, g:  20, b: 100 },
    ];

    function lerpColor(a, b, t) {
        return {
            r: Math.round(a.r + (b.r - a.r) * t),
            g: Math.round(a.g + (b.g - a.g) * t),
            b: Math.round(a.b + (b.b - a.b) * t),
        };
    }

    function getColor(position) {
        const n = NEON_COLORS.length;
        const scaled = position * n;
        const idx = Math.floor(scaled) % n;
        const t = scaled - Math.floor(scaled);
        return lerpColor(NEON_COLORS[idx], NEON_COLORS[(idx + 1) % n], t);
    }

    const phases = Array.from({ length: BAR_COUNT }, () => ({
        phase  : Math.random() * Math.PI * 2,
        speed  : 0.018 + Math.random() * 0.025,
        amp    : 0.3  + Math.random() * 0.7,
        offset : Math.random() * 0.4
    }));

    let breathPhase = 0;
    let analyser = null;
    let freqData = null;

    document.getElementById('vinyl')?.addEventListener('click', () => {
        if (!navigator.mediaDevices?.getUserMedia) return;
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const source   = audioCtx.createMediaStreamSource(stream);
                analyser       = audioCtx.createAnalyser();
                analyser.fftSize = 256;
                source.connect(analyser);
                freqData = new Uint8Array(analyser.frequencyBinCount);
            })
            .catch(() => {});
    }, { once: true });

    function drawBar(angle, height, colorPos, alpha) {
        const innerX = CX + Math.cos(angle) * INNER_R;
        const innerY = CY + Math.sin(angle) * INNER_R;
        const outerX = CX + Math.cos(angle) * (INNER_R + height);
        const outerY = CY + Math.sin(angle) * (INNER_R + height);
        const c = getColor(colorPos);

        ctx.save();
        ctx.lineCap   = 'round';
        ctx.lineWidth = BAR_WIDTH;

        const norm = (height - MIN_BAR_H) / MAX_BAR_H;
        ctx.shadowColor = `rgba(${c.r},${c.g},${c.b},${0.7 + norm * 0.3})`;
        ctx.shadowBlur  = 6 + norm * 18;

        const grad = ctx.createLinearGradient(innerX, innerY, outerX, outerY);
        grad.addColorStop(0,   `rgba(${c.r},${c.g},${c.b},${alpha * 0.5})`);
        grad.addColorStop(0.5, `rgba(${c.r},${c.g},${c.b},${alpha})`);
        grad.addColorStop(1,   `rgba(255,255,255,${alpha * 0.9})`);

        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(innerX, innerY);
        ctx.lineTo(outerX, outerY);
        ctx.stroke();
        ctx.restore();
    }

    function draw() {
        requestAnimationFrame(draw);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        breathPhase += 0.008;
        const breathMod = 0.55 + 0.45 * Math.sin(breathPhase);

        for (let i = 0; i < BAR_COUNT; i++) {
            const p = phases[i];
            p.phase += p.speed;

            let height;
            if (analyser && freqData) {
                analyser.getByteFrequencyData(freqData);
                const bin = Math.floor((i / BAR_COUNT) * freqData.length);
                height = MIN_BAR_H + (freqData[bin] / 255) * MAX_BAR_H;
            } else {
                const w1  = Math.sin(p.phase) * 0.5 + 0.5;
                const w2  = Math.sin(p.phase * 1.7 + p.offset) * 0.3 + 0.3;
                const w3  = Math.sin(p.phase * 0.5) * 0.2 + 0.2;
                const raw = (w1 * 0.5 + w2 * 0.3 + w3 * 0.2) * p.amp * breathMod;
                height = MIN_BAR_H + raw * MAX_BAR_H;
            }

            const angle    = (i / BAR_COUNT) * Math.PI * 2 - Math.PI / 2;
            const colorPos = i / BAR_COUNT;
            const norm     = (height - MIN_BAR_H) / MAX_BAR_H;
            const alpha    = 0.5 + norm * 0.5;

            drawBar(angle, height, colorPos, alpha);
        }
    }

    requestAnimationFrame(draw);
})();

const sections  = document.querySelectorAll('section[id], header[id]');
const navLinks  = document.querySelectorAll('.nav-links a');
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navLinks.forEach(link => {
                link.style.color = link.getAttribute('href') === `#${id}` ? 'var(--blue-light)' : '';
            });
        }
    });
}, { threshold: 0.4 });
sections.forEach(s => sectionObserver.observe(s));

document.getElementById('vinyl')?.addEventListener('mouseenter', () => {
    document.getElementById('vinyl').style.animationDuration = '4s';
});
document.getElementById('vinyl')?.addEventListener('mouseleave', () => {
    document.getElementById('vinyl').style.animationDuration = '20s';
});

const fanTextarea = document.getElementById('fan-message');
const charCount   = document.getElementById('charCount');
if (fanTextarea) {
    fanTextarea.addEventListener('input', () => {
        const len = fanTextarea.value.length;
        charCount.textContent = len;
        charCount.style.color = len > 260 ? 'rgb(239,68,68)' : 'var(--text-dim)';
    });
}

function formatDate() {
    return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const avatarPool = ['🌊','🌿','☁️','🎵','🌙','✨','🍃','🌸','🎸','💙','🌅','🎶'];

function submitComment() {
    const nameInput = document.getElementById('fan-name');
    const msgInput  = document.getElementById('fan-message');
    const wall      = document.getElementById('fanWall');
    const name      = nameInput.value.trim() || 'anonymous';
    const message   = msgInput.value.trim();

    if (!message) {
        msgInput.style.borderColor = 'rgba(239,68,68,0.8)';
        msgInput.focus();
        setTimeout(() => { msgInput.style.borderColor = ''; }, 1500);
        return;
    }

    const avatar = avatarPool[Math.floor(Math.random() * avatarPool.length)];
    const card   = document.createElement('div');
    card.className = 'fan-card new-card reveal';
    card.innerHTML = `
        <div class="fan-card-header">
            <span class="fan-avatar">${avatar}</span>
            <div>
                <span class="fan-name">${escapeHTML(name)}</span>
                <span class="fan-time">${formatDate()}</span>
            </div>
        </div>
        <p class="fan-message">${escapeHTML(message)}</p>
    `;

    wall.insertBefore(card, wall.firstChild);
    requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('visible')));
    setTimeout(() => card.classList.remove('new-card'), 3000);

    nameInput.value = '';
    msgInput.value  = '';
    charCount.textContent = '0';
    charCount.style.color = '';
}

document.getElementById('fan-message')?.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') submitComment();
});

function escapeHTML(str) {
    return str
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
        .replace(/'/g,'&#039;');
}
