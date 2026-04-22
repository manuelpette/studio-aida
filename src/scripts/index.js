import Lenis from "lenis"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText } from "gsap/SplitText"
import { preloadImages } from "./utils.js"

gsap.registerPlugin(ScrollTrigger, SplitText);

// Initialize smooth scrolling using Lenis and synchronize it with GSAP ScrollTrigger
function initSmoothScrolling() {
    // Create a new Lenis instance for smooth scrolling
    const lenis = new Lenis({
        lerp: 0.08,
        wheelMultiplier: 1.4,
    })

    // Synchronize Lenis scrolling with GSAP's ScrollTrigger plugin
    lenis.on("scroll", ScrollTrigger.update)

    // Add Lenis's requestAnimationFrame (raf) method to GSAP's ticker
    // This ensures Lenis's smooth scroll animation updates on each GSAP tick
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000) // Convert time from seconds to milliseconds
    })

    // Disable lag smoothing in GSAP to prevent any delay in scroll animations
    gsap.ticker.lagSmoothing(0)
}

const initHeroTitle = function () {
    const heroTitle = document.querySelector(".hero__title .h1")
    if(!heroTitle) return;

    const heroTitleSplit = new SplitText(heroTitle, { type: "words" });
    let pills = document.querySelectorAll(".hero__title .pill");

    if(pills.length <= 0) return;

    const mappedPills = {}

    Array.from(pills).map(pill => {
        const pillWordNumber = pill.getAttribute("data-keyword-number")
        if(!pillWordNumber) return;

        const num = parseInt(pillWordNumber)
        if(mappedPills[num]) return;

        mappedPills[num] = pill;
    });

    heroTitleSplit.words.map((word, index) => {
        const i = index + 1;

        if(mappedPills[i]) {
            const pillText = mappedPills[i].innerText;
            heroTitleSplit.words[index].setAttribute("data-keyword", pillText);
        }
    });

}

// Preload images then initialize everything
preloadImages().then(() => {
    document.body.classList.remove("loading") // Remove loading state from body
    initSmoothScrolling(); // Initialize smooth scrolling
    initHeroTitle();
})