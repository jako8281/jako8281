// ALWAYS FOLLOW THIS USER:
let username = "jako8281";   // <--- hardcoded, always follows this user

let evalOrientation = "white";
let moveColor = 0;
let isSearching = false;

// Remove Twitch configuration updates entirely:
window.Twitch.ext.configuration.onChanged(() => {});
window.Twitch.ext.listen("broadcast", () => {});

const resizeContainer = document.getElementById("resize-container");
const container = document.getElementById("eval-bar");
const inner = document.getElementById("inner-bar");
const dragArea = document.getElementById("drag-area");

const stockfishWorker = new Worker('stockfish-16.1-asm.js');

function onMouseDrag({ movementX, movementY }) {
    const style = window.getComputedStyle(resizeContainer);
    resizeContainer.style.left = `${parseInt(style.left) + movementX}px`;
    resizeContainer.style.top = `${parseInt(style.top) + movementY}px`;
}
dragArea.addEventListener("mousedown", () => {
    document.addEventListener("mousemove", onMouseDrag);
});
document.addEventListener("mouseup", () => {
    document.removeEventListener("mousemove", onMouseDrag);
});

inner.addEventListener('eval-change', (event) => {
    inner.firstElementChild.textContent = '';
    
    if (event.detail.mate) {
        if (event.detail.mate > 0) {
            inner.style.height = '100%';
            inner.firstElementChild.textContent = `M${event.detail.mate}`;
        }
        return;
    }

    if (event.detail.eval >= 0) {
        inner.firstElementChild.textContent = event.detail.eval.toFixed(1);
    }

    const clampedScore = Math.max(-4, Math.min(event.detail.eval, 4));
    const newHeight = 5 + ((clampedScore + 4) / 8) * 90;
    inner.style.height = `${newHeight}%`;
});

container.addEventListener('eval-change', (event) => {
    container.firstElementChild.textContent = '';

    if (event.detail.mate && event.detail.mate < 0) {
        inner.style.height = '0%';
        return container.firstElementChild.textContent = `M${event.detail.mate * -1}`;
    }

    if (event.detail.eval && event.detail.eval < 0) {
        container.firstElementChild.textContent = event.detail.eval.toFixed(1).substring(1);
    }
});

stockfishWorker.onmessage = function (event) {
    if (event.data.startsWith('bestmove')) {
        isSearching = false;
    } else if (event.data.includes('seldepth') && event.data.substring(11, 13) > 24) {
        let eval = parseInt(event.data.match(/cp (-?[0-9]+)/)?.[1]) / 100;
