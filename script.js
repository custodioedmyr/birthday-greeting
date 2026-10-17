"use strict";

/* =========================================================
   EDIT THIS PART
   Everything personal lives here, so you never have to dig
   through the rest of the code.
========================================================= */

const CONFIG = {
    friendName: "FRIEND'S NAME",
    fromName: "Your Name",

    // Each string is one paragraph of the handwritten note.
    note: [
        "Today, the person who takes care of everyone gets to be taken care of.",
        "Happy birthday, my dear friend. May God bless you more and may He grant you all the desires of your heart. 💖",
        "I wish you to be happy and healthy always! Enjoy!💖"
    ]
};


/* =========================================================
   HELPERS
========================================================= */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const pick = (list) => list[Math.floor(Math.random() * list.length)];

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const smallScreen = window.matchMedia("(max-width: 700px)");

const SCREENS = ["welcome", "vitals", "note", "wish"];


/* =========================================================
   FILL IN PERSONAL DETAILS
========================================================= */

$$("[data-friend-name]").forEach((el) => { el.textContent = CONFIG.friendName; });
$$("[data-from-name]").forEach((el) => { el.textContent = CONFIG.fromName; });



/* =========================================================
   SCREEN NAVIGATION
========================================================= */

const dots = $$("#dots span");

function goTo(id) {
    const next = document.getElementById(id);
    if (!next) return;

    stopTyping();

    $$(".screen").forEach((screen) => {
        const isNext = screen === next;
        screen.classList.toggle("active", isNext);
        screen.toggleAttribute("inert", !isNext);
        screen.setAttribute("aria-hidden", String(!isNext));
    });

    next.scrollTop = 0;

    const index = SCREENS.indexOf(id);
    dots.forEach((dot, i) => dot.classList.toggle("on", i === index));

    const heading = $("h1, h2", next);
    if (heading) heading.focus({ preventScroll: true });

    if (id === "note") {
        setTimeout(startTypewriter, 600);
    }
}

document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-go]");
    if (!trigger || trigger.disabled) return;

    if (trigger.dataset.confetti) {
        confetti(Number(trigger.dataset.confetti));
    }
    goTo(trigger.dataset.go);
});


/* =========================================================
   VITALS (tap to check, numbers count up or down)
========================================================= */

const vitals = $$(".vital");
const vitalsNext = $("#vitalsNext");

function countTo(el, from, to, duration) {
    if (reduceMotion.matches) {
        el.textContent = to + "%";
        return;
    }

    const start = performance.now();

    function tick(now) {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(from + (to - from) * eased) + "%";
        if (t < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
}

function updateVitalsButton() {
    const done = vitals.filter((v) => v.classList.contains("checked")).length;
    const total = vitals.length;

    vitalsNext.disabled = done < total;
    vitalsNext.textContent = done < total
        ? `Check all three to continue (${done}/${total})`
        : "Read your note 💌";
}

vitals.forEach((vital) => {
    vital.addEventListener("click", () => {
        if (vital.classList.contains("checked")) return;

        vital.classList.add("checked");
        vital.setAttribute("aria-pressed", "true");

        $(".vital-note", vital).textContent = vital.dataset.note;
        countTo(
            $(".vital-reading", vital),
            Number(vital.dataset.from),
            Number(vital.dataset.to),
            1100
        );

        updateVitalsButton();
    });
});

function resetVitals() {
    vitals.forEach((vital) => {
        vital.classList.remove("checked");
        vital.setAttribute("aria-pressed", "false");
        $(".vital-note", vital).textContent = "Tap to check";
        $(".vital-reading", vital).textContent = "–";
    });
    updateVitalsButton();
}


/* =========================================================
   HANDWRITTEN NOTE (typewriter)
   Every letter is placed up front and revealed one by one,
   so the card never jumps in size while it "types".
========================================================= */

const typewriter = $("#typewriter");
let letters = [];
let typingTimer = null;

function buildNote() {
    const text = CONFIG.note.join("\n\n");

    typewriter.textContent = "";
    letters = [];

    for (const char of Array.from(text)) {
        if (char === "\n") {
            typewriter.append(document.createElement("br"));
            continue;
        }

        const span = document.createElement("span");
        span.className = "ch";
        span.textContent = char;
        typewriter.append(span);
        letters.push(span);
    }

    typewriter.setAttribute("aria-label", CONFIG.note.join(" "));
}

function stopTyping() {
    clearTimeout(typingTimer);
    typingTimer = null;
}

function startTypewriter() {
    stopTyping();
    letters.forEach((l) => l.classList.remove("on"));

    if (reduceMotion.matches) {
        letters.forEach((l) => l.classList.add("on"));
        return;
    }

    let i = 0;

    function step() {
        if (i >= letters.length) {
            typingTimer = null;
            return;
        }

        const letter = letters[i++];
        letter.classList.add("on");

        const char = letter.textContent;
        const delay = /[.!?]/.test(char) ? 320 : char === "," ? 160 : 34;
        typingTimer = setTimeout(step, delay);
    }

    step();
}

buildNote();


/* =========================================================
   WISH (blow out the candle)
========================================================= */

const candle = $("#candle");
const cakeScene = $("#cakeScene");
const wishTitle = $("#wishTitle");
const wishHint = $("#wishHint");
const restartButton = $("#restartButton");

const WISH_TITLE = "Make a wish";
const WISH_HINT = "Tap the candle to blow it out.";

let blown = false;

candle.addEventListener("click", () => {
    if (blown) return;
    blown = true;

    cakeScene.classList.add("blown");
    candle.setAttribute("aria-label", "Candle blown out");
    wishTitle.textContent = "Wish made!";
    wishHint.textContent = "I hope every bit of it comes true. Happy birthday! 💖";
    restartButton.classList.remove("is-hidden");

    confetti(110);
});

function resetWish() {
    blown = false;
    cakeScene.classList.remove("blown");
    candle.setAttribute("aria-label", "Blow out the candle");
    wishTitle.textContent = WISH_TITLE;
    wishHint.textContent = WISH_HINT;
    restartButton.classList.add("is-hidden");
}

restartButton.addEventListener("click", () => {
    resetVitals();
    resetWish();
    goTo("welcome");
});


/* =========================================================
   CONFETTI
   Drawn inside the phone shell and kept lighter on phones.
========================================================= */

const confettiLayer = $("#confetti");
const CONFETTI_COLORS = ["#ff7fa8", "#ffd166", "#4fc1b8", "#cfeafb", "#c9a7ff", "#ffb3cb", "#ffffff"];
const CONFETTI_SHAPES = ["♥", "✚", "✦"];

function confetti(amount) {
    if (reduceMotion.matches) return;

    const count = Math.round(smallScreen.matches ? amount * 0.7 : amount);

    for (let i = 0; i < count; i++) {
        const piece = document.createElement("span");
        piece.className = "confetti";

        if (Math.random() < 0.22) {
            piece.textContent = pick(CONFETTI_SHAPES);
            piece.style.color = pick(CONFETTI_COLORS.slice(0, 4));
            piece.style.fontSize = 14 + Math.random() * 10 + "px";
        } else {
            piece.style.background = pick(CONFETTI_COLORS);
            piece.style.width = 6 + Math.random() * 6 + "px";
            piece.style.height = 9 + Math.random() * 9 + "px";
            if (Math.random() < 0.3) piece.style.borderRadius = "50%";
        }

        piece.style.left = Math.random() * 100 + "%";
        piece.style.setProperty("--drift", Math.random() * 120 - 60 + "px");
        piece.style.setProperty("--spin", Math.random() * 900 - 450 + "deg");
        piece.style.animationDuration = 2.4 + Math.random() * 2.2 + "s";
        piece.style.animationDelay = Math.random() * 0.4 + "s";

        confettiLayer.append(piece);
        piece.addEventListener("animationend", () => piece.remove());
    }
}


/* =========================================================
   FLOATING DECORATIONS
========================================================= */

const decoLayer = $("#deco");
const DECO_GLYPHS = ["♡", "✚", "✦", "♡", "✿"];
const DECO_COLORS = ["rgba(255,127,168,0.55)", "rgba(79,193,184,0.5)", "rgba(255,255,255,0.95)"];

function floatDecoration() {
    if (document.hidden || reduceMotion.matches) return;

    const item = document.createElement("span");
    item.className = "floaty";
    item.textContent = pick(DECO_GLYPHS);
    item.style.left = Math.random() * 100 + "%";
    item.style.color = pick(DECO_COLORS);
    item.style.fontSize = 15 + Math.random() * 18 + "px";
    item.style.animationDuration = 8 + Math.random() * 6 + "s";

    decoLayer.append(item);
    item.addEventListener("animationend", () => item.remove());
}

setInterval(floatDecoration, 1500);


/* =========================================================
   START
========================================================= */

updateVitalsButton();

// Everything except the first screen starts out of reach for keyboards and screen readers
$$(".screen:not(.active)").forEach((screen) => screen.setAttribute("inert", ""));
