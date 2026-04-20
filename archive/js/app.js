// js/app.js
import bookData from './data.js';

const scrollContainer = document.getElementById('scroll-container');
const flap = document.getElementById('flap');
const leftContent = document.getElementById('content-left');
const rightContent = document.getElementById('content-right');
const flapFrontContent = document.getElementById('content-flap-front');
const flapBackContent = document.getElementById('content-flap-back');

// Spreads calculation
const numSpreads = Math.ceil(bookData.length / 2);

// Create empty sections to allow native scroll height
for (let i = 0; i < numSpreads; i++) {
    const sec = document.createElement('div');
    sec.className = 'scroll-section';
    scrollContainer.appendChild(sec);
}

// Caching current state to avoid DOM repaints
let currentSpreadIndex = -1;

function renderPage(node, pageData) {
    if (!pageData) {
        node.innerHTML = '';
        node.parentElement.classList.remove('is-cover');
        node.parentElement.style.opacity = '0'; // Hide empty pages (like back of back cover)
        return;
    }
    
    node.parentElement.style.opacity = '1';

    if (pageData.isCover) {
        node.parentElement.classList.add('is-cover');
    } else {
        node.parentElement.classList.remove('is-cover');
    }

    let html = ``;
    if (pageData.title) html += `<h2 class="page-title">${pageData.title}</h2>`;
    if (pageData.content) html += `<p class="page-body">${pageData.content}</p>`;
    if (pageData.image) html += `<div class="page-image" style="background-image: url('${pageData.image}')"></div>`;
    
    if (node.innerHTML !== html) {
        node.innerHTML = html;
    }
}

function updateBook(spreadIndex, foldProgress) {
    // Clamp values safely
    if (spreadIndex < 0) spreadIndex = 0;
    if (spreadIndex >= numSpreads - 1) {
        spreadIndex = numSpreads - 1;
        foldProgress = 0; // Last spread cannot be turned forward
    }
    
    const idxLeftFlat = spreadIndex * 2 - 1;
    const idxFlapFront = spreadIndex * 2;
    const idxFlapBack = spreadIndex * 2 + 1;
    const idxRightFlat = spreadIndex * 2 + 2;
    
    if (currentSpreadIndex !== spreadIndex) {
        renderPage(leftContent, bookData[idxLeftFlat]);
        renderPage(flapFrontContent, bookData[idxFlapFront]);
        renderPage(flapBackContent, bookData[idxFlapBack]);
        renderPage(rightContent, bookData[idxRightFlat]);
        currentSpreadIndex = spreadIndex;
    }

    const rotateY = foldProgress * -180;
    flap.style.transform = `rotateY(${rotateY}deg)`;
    
    // Dynamic lighting based on fold progress
    const shadowIntensity = Math.sin(foldProgress * Math.PI) * 40; 
    document.getElementById('flap-front').style.boxShadow = `inset 10px 0 20px rgba(0,0,0,0.05), ${-10 - (shadowIntensity)}px 0 ${15 + shadowIntensity}px rgba(0,0,0,0.2)`;
    // Back face shadow reverses direction
    document.getElementById('flap-back').style.boxShadow = `inset -10px 0 20px rgba(0,0,0,0.05), ${10 + (shadowIntensity)}px 0 ${15 + shadowIntensity}px rgba(0,0,0,0.2)`;
}

// Animation Loop Variables
let lastSt = 0;
let lastTime = performance.now();

function loop() {
    const st = scrollContainer.scrollTop;
    const height = scrollContainer.clientHeight;
    
    const rawS = st / height;
    const spreadIndex = Math.floor(rawS);
    const foldProgress = rawS % 1;
    
    updateBook(spreadIndex, foldProgress);

    // Audio Velocity firing
    const now = performance.now();
    const dt = now - lastTime;
    if (dt > 0) {
        const dy = st - lastSt;
        const velocity = Math.abs(dy / dt); // px per ms
        window.dispatchEvent(new CustomEvent('bookScrollVelocity', { detail: { velocity } }));
    }
    
    lastSt = st;
    lastTime = now;
    
    requestAnimationFrame(loop);
}

// Kickoff
requestAnimationFrame(loop);
