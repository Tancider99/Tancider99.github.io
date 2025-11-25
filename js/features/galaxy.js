// --- Galaxy Explorer Logic ---

const gOverlay = document.getElementById('galaxy-overlay');
const gUniverse = document.getElementById('galaxy-universe');
const gNodesContainer = document.getElementById('galaxy-nodes');
const gLines = document.getElementById('galaxy-lines');

let isInitialized = false;
let nodesData = [];
let viewState = { 
    scale: 0.35, panX: 0, panY: 0, 
    isDragging: false, lastX: 0, lastY: 0, 
    isPinching: false, pinchStartDist: 0, pinchStartScale: 1,
    suppressClick: false
};
const MAX_SCALE = 1.2; const MIN_SCALE = 0.35;

const CATEGORY_CENTERS = { 'tot': { x: 0, y: 0 }, 'std': { x: 0, y: -450 }, 'bat': { x: 800, y: 0 }, 'pit': { x: -800, y: 0 }, 'fld': { x: 0, y: 650 } };
const extraRelations = {
    'avg': ['obp', 'slg', 'ops', 'babip', 'woba'], 'obp': ['avg', 'slg', 'ops', 'bb_pct', 'isod', 'woba'], 'slg': ['avg', 'obp', 'ops', 'iso', 'hr_ab', 'woba'],
    'ops': ['avg', 'obp', 'slg', 'woba', 'wrc_plus'], 'woba': ['ops', 'wrc_plus', 'wrc', 'wraa', 'xwoba'], 'wrc_plus': ['woba', 'wraa', 'war'],
    'war': ['wraa', 'uzr', 'wsb', 'bsr', 'fip', 'pit_war'], 'bb_pct': ['k_pct', 'bb_k', 'isod'], 'k_pct': ['bb_pct', 'bb_k'],
    'era': ['fip', 'xfip', 'siera', 'ra9'], 'fip': ['era', 'xfip', 'siera', 'k_pct_pit'], 'xfip': ['fip', 'siera', 'gb_pct'], 'siera': ['fip', 'xfip'],
    'uzr': ['drs', 'oaa', 'rngr'], 'drs': ['uzr', 'oaa'], 'oaa': ['uzr', 'drs']
};
const gIcons = {
    bat: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M2 17 17 2"/><path d="m2 2 20 20"/><path d="m19 2 2 2"/><path d="m2 19 2 2"/><path d="m10 2 2 2"/><path d="m2 10 2 2"/></svg>`,
    pit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/></svg>`,
    fld: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>`,
    tot: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    std: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="2" y2="22"/><line x1="2" x2="22" y1="12" y2="12"/></svg>`
};

function initGalaxy() {
    if (isInitialized) return;
    terms.forEach(t => {
        if(!t.related) t.related = [];
        if(extraRelations[t.id]) extraRelations[t.id].forEach(rid => { if(!t.related.includes(rid)) t.related.push(rid); });
    });
    terms.forEach(t => {
        t.related.forEach(rid => {
            const target = terms.find(x => x.id === rid);
            if(target && (!target.related || !target.related.includes(t.id))) {
                if(!target.related) target.related = []; target.related.push(t.id);
            }
        });
    });

    nodesData = terms.map(t => {
        const center = CATEGORY_CENTERS[t.category] || {x:0, y:0};
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 320;
        return { ...t, x: center.x + Math.cos(angle)*dist, y: center.y + Math.sin(angle)*dist, links: t.related||[] };
    });

    const NODE_RADIUS = 140;
    for(let k=0; k<50; k++){
        for(let i=0; i<nodesData.length; i++){
            for(let j=i+1; j<nodesData.length; j++){
                const n1 = nodesData[i], n2 = nodesData[j];
                const dx = n1.x - n2.x, dy = n1.y - n2.y;
                const d = Math.sqrt(dx*dx+dy*dy);
                if(d < NODE_RADIUS){
                    const f = (NODE_RADIUS - d)/(d||1)*0.5;
                    const mx = dx*f, my = dy*f;
                    n1.x+=mx; n1.y+=my; n2.x-=mx; n2.y-=my;
                }
            }
        }
    }

    renderLines();
    nodesData.forEach(node => createNodeElement(node));
    isInitialized = true;
}

function renderLines() {
    const pairs = new Set(); let html = '';
    nodesData.forEach(source => {
        if(!source.links) return;
        source.links.forEach(targetId => {
            const target = nodesData.find(n => n.id === targetId);
            if(target){
                const pairId = [source.id, target.id].sort().join('-');
                if(!pairs.has(pairId)){
                    const x1=5000+source.x, y1=5000+source.y, x2=5000+target.x, y2=5000+target.y;
                    html += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="g-line" data-src="${source.id}" data-tgt="${target.id}" />`;
                    pairs.add(pairId);
                }
            }
        });
    });
    gLines.innerHTML = html;
}

function createNodeElement(node) {
    const el = document.createElement('div');
    el.className = `g-node g-cat-${node.category}`;
    el.id = `g-node-${node.id}`;
    el.style.left = `${node.x}px`;
    el.style.top = `${node.y}px`;
    el.style.animationDelay = `${Math.random() * 0.8 + 0.1}s`;

    const iconSvg = gIcons[node.category] || gIcons.std;
    
    el.innerHTML = `
        <div class="g-content-normal"><div class="icon-normal">${iconSvg}</div><div>${node.title}</div></div>
        <div class="g-content-focus">
            <div class="gf-icon">${iconSvg}</div>
            <div class="gf-title">${node.title}</div>
            <div class="gf-full">${node.full}</div>
            <div class="gf-desc">${node.short || '...'}</div>
            <button class="gf-btn" onclick="closeMindMap(); openModal('${node.id}')">詳細・計算</button>
        </div>
    `;

    const handleTap = (e) => {
        if (e.target.closest('.gf-btn')) return; 
        if(viewState.isDragging || viewState.suppressClick) return;
        e.stopPropagation();
        if(e.type === 'touchend') e.preventDefault();
        activateNode(node);
    };
    el.onclick = handleTap;
    el.ontouchend = handleTap;
    gNodesContainer.appendChild(el);
}

function activateNode(node) {
    resetFocus();
    const currentId = node.id;
    const relatedIds = node.links || [];
    
    document.querySelectorAll('.g-node').forEach(el => {
        const elId = el.id.replace('g-node-', '');
        if(elId === currentId) el.classList.add('is-focused');
        else if(relatedIds.includes(elId)) el.classList.add('is-related');
        else el.classList.add('is-dimmed');
    });

    document.querySelectorAll('.g-line').forEach(line => {
        const src = line.getAttribute('data-src'), tgt = line.getAttribute('data-tgt');
        if((src===currentId && relatedIds.includes(tgt)) || (tgt===currentId && relatedIds.includes(src))) line.classList.add('is-related');
        else line.classList.add('is-dimmed');
    });

    animateView(-node.x, -node.y, MAX_SCALE);
}

function resetFocus() {
    document.querySelectorAll('.g-node').forEach(el => el.classList.remove('is-focused', 'is-related', 'is-dimmed'));
    document.querySelectorAll('.g-line').forEach(el => el.classList.remove('is-related', 'is-dimmed'));
}

gOverlay.addEventListener('click', (e) => {
    if(viewState.isDragging || viewState.suppressClick) return;
    if(e.target.closest('.g-node') || e.target.closest('.galaxy-controls')) return;
    resetFocus();
});

function animateView(targetX, targetY, targetScale) {
    gUniverse.classList.add('is-interacting');
    gUniverse.style.transition = 'transform 0.6s cubic-bezier(0.19, 1, 0.22, 1)';
    viewState.panX = targetX; viewState.panY = targetY; viewState.scale = targetScale;
    updateTransform();
    setTimeout(() => { 
        gUniverse.style.transition = 'none'; 
        gUniverse.classList.remove('is-interacting');
    }, 600);
}

function openMindMap() {
    initGalaxy();
    gOverlay.classList.add('active');
    gOverlay.classList.add('launching');
    document.querySelectorAll('.g-node').forEach(el => { el.style.animationPlayState = 'running'; });
    fitToScreen();
    setTimeout(() => { gOverlay.classList.remove('launching'); }, 1500);
}

function closeMindMap() { gOverlay.classList.remove('active'); resetFocus(); }

function updateTransform() { gUniverse.style.transform = `translate(${viewState.panX}px, ${viewState.panY}px) scale(${viewState.scale})`; }

function fitToScreen() {
    viewState.panX = 0; viewState.panY = 0;
    const minDim = Math.min(window.innerWidth, window.innerHeight);
    viewState.scale = Math.max(minDim / 1500, MIN_SCALE);
    gUniverse.style.transition = 'transform 0.6s ease';
    updateTransform();
    setTimeout(() => { gUniverse.style.transition = 'none'; }, 600);
    resetFocus();
}
function zoomIn() { viewState.scale = Math.min(viewState.scale * 1.3, MAX_SCALE); animateView(viewState.panX, viewState.panY, viewState.scale); }
function zoomOut() { viewState.scale = Math.max(viewState.scale / 1.3, MIN_SCALE); animateView(viewState.panX, viewState.panY, viewState.scale); }

const startInteraction = () => { gUniverse.style.transition = 'none'; gUniverse.classList.add('is-interacting'); };
const endInteraction = () => { setTimeout(() => { gUniverse.classList.remove('is-interacting'); }, 100); };

function getDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX, dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx*dx + dy*dy);
}
gOverlay.addEventListener('wheel', (e) => { 
    e.preventDefault(); startInteraction();
    const delta = e.deltaY * -0.001; 
    viewState.scale = Math.min(Math.max(MIN_SCALE, viewState.scale+delta), MAX_SCALE); 
    updateTransform();
    clearTimeout(window.wheelTimer); window.wheelTimer = setTimeout(endInteraction, 150);
}, {passive:false});

const handleStart = (x, y) => { if(viewState.isPinching)return; viewState.isDragging = false; viewState.lastX = x; viewState.lastY = y; startInteraction(); };
const handleMove = (x, y) => {
    if(viewState.isPinching)return;
    const dx = x - viewState.lastX, dy = y - viewState.lastY;
    if(Math.abs(dx)>3 || Math.abs(dy)>3) viewState.isDragging = true;
    if(viewState.isDragging){ viewState.panX += dx; viewState.panY += dy; updateTransform(); }
    viewState.lastX = x; viewState.lastY = y;
};

gOverlay.addEventListener('mousedown', (e) => { if(e.target.closest('.galaxy-controls'))return; handleStart(e.clientX, e.clientY); gOverlay.style.cursor = 'grabbing'; });
window.addEventListener('mousemove', (e) => { if(gOverlay.style.cursor === 'grabbing') handleMove(e.clientX, e.clientY); });
window.addEventListener('mouseup', () => { gOverlay.style.cursor = 'grab'; endInteraction(); setTimeout(()=>viewState.isDragging=false, 50); });

gOverlay.addEventListener('touchstart', (e) => {
    if(e.target.closest('.galaxy-controls'))return;
    if(e.touches.length===2){ viewState.isPinching=true; viewState.pinchStartDist=getDistance(e.touches); viewState.pinchStartScale=viewState.scale; startInteraction(); }
    else if(e.touches.length===1){ viewState.isPinching=false; handleStart(e.touches[0].clientX, e.touches[0].clientY); }
}, {passive:false});
window.addEventListener('touchmove', (e) => {
    if(e.touches.length===2 && viewState.isPinching){
        const dist = getDistance(e.touches); const scaleChange = dist/viewState.pinchStartDist;
        viewState.scale = Math.min(Math.max(MIN_SCALE, viewState.pinchStartScale*scaleChange), MAX_SCALE);
        updateTransform(); e.preventDefault();
    } else if(e.touches.length===1 && !viewState.isPinching) handleMove(e.touches[0].clientX, e.touches[0].clientY);
}, {passive:false});
window.addEventListener('touchend', (e) => {
    if(e.touches.length<2) { if(viewState.isPinching) { viewState.suppressClick = true; setTimeout(() => { viewState.suppressClick = false; }, 300); } viewState.isPinching=false; }
    endInteraction(); setTimeout(()=>viewState.isDragging=false, 50);
});

function drawStars() {
    const cvs = document.getElementById('starfield-canvas'), ctx = cvs.getContext('2d');
    const setSize = () => { cvs.width = window.innerWidth; cvs.height = window.innerHeight; render(); };
    window.addEventListener('resize', setSize);
    const stars = []; const numStars = window.innerWidth < 768 ? 60 : 150;
    for(let i=0; i<numStars; i++) stars.push({ x: Math.random()*window.innerWidth, y: Math.random()*window.innerHeight, r: Math.random()*1.5, a: Math.random() });
    setSize();
    function render() {
        ctx.clearRect(0,0,cvs.width,cvs.height); ctx.fillStyle = "white";
        stars.forEach(s => { ctx.globalAlpha = s.a; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill(); });
    }
}

// Initial draw
drawStars();
