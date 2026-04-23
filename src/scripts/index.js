/** @format */

import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { preloadImages } from "./utils.js";

gsap.registerPlugin(ScrollTrigger, SplitText);

const lerp = (start, end, t) => start + (end - start) * t;
// Initialize smooth scrolling using Lenis and synchronize it with GSAP ScrollTrigger
function initSmoothScrolling() {
  // Create a new Lenis instance for smooth scrolling
  const lenis = new Lenis({
    lerp: 0.08,
    wheelMultiplier: 1.4,
  });

  // Synchronize Lenis scrolling with GSAP's ScrollTrigger plugin
  lenis.on("scroll", ScrollTrigger.update);

  // Add Lenis's requestAnimationFrame (raf) method to GSAP's ticker
  // This ensures Lenis's smooth scroll animation updates on each GSAP tick
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000); // Convert time from seconds to milliseconds
  });

  // Disable lag smoothing in GSAP to prevent any delay in scroll animations
  gsap.ticker.lagSmoothing(0);
}

const initHeroTitle = function () {
  const heroTitle = document.querySelector(".hero__title .h1");
  if (!heroTitle) return;

  const pills = document.querySelectorAll(".hero__title .pill");
  const hello = document.querySelector(".hero__contact");

  if (pills.length <= 0 && !hello) return;

  SplitText.create(heroTitle, {
    type: "words,lines",
    autoSplit: true,
    onSplit(self) {
      const mappedPills = {};
      const pillsInWords = [];
      const tl = gsap.timeline();

      // Mappa pills
      Array.from(pills).forEach((pill) => {
        const pillWordNumber = pill.getAttribute("data-keyword-number");
        if (!pillWordNumber) return;

        const num = parseInt(pillWordNumber, 10);
        if (mappedPills[num]) return;

        mappedPills[num] = pill;
      });

      // Append pills alle parole corrette
      self.words.forEach((word, index) => {
        const i = index + 1;

        if (mappedPills[i]) {
          const pill = mappedPills[i].cloneNode(true);
          pill.setAttribute("data-nosnippet", "");
          pill.classList.remove("sr-only");
          word.appendChild(pill);

          pillsInWords.push(pill);
        }
      });

      // Animazione lines
      tl.fromTo(
        self.lines,
        {
          y: "120%",
          opacity: 0,
          rotation: 3,
          filter: "blur(10px)",
        },
        {
          y: 0,
          opacity: 1,
          rotation: 0,
          filter: "blur(0px)",
          ease: "power2.out",
          duration: 1.8,
          stagger: {
            each: 0.1,
          },
        }
      );

      // Trigger parole con pill
      if (pillsInWords.length) {
        tl.fromTo(
          pillsInWords,
          {
            y: "50%",
            scale: 0.95,
            opacity: 0,
          },
          {
            y: 0,
            scale: 1,
            opacity: 1,
            duration: 0.6,
            ease: "elastic.out(1,0.75)",
            stagger: {
              each: 0.2
            }
        },
          `-=${tl.duration() / 2}`
        );
      }

      // Animazione contact
      if (hello) {
        tl.fromTo(
          hello,
          {
            y: "100px",
            opacity: 0,
            rotation: 7,
          },
          {
            y: 0,
            opacity: 1,
            rotation: 0,
            duration: 2.8,
            ease: "elastic.out(1,0.75)",
          },
          `-=0.2`
        );
      }

      return tl;
    },
  });
};

const animateFavicon = function () {
  const favFrames = [
    "/favicons/fav-s.jpg",
    "/favicons/fav-t.jpg",
    "/favicons/fav-u.jpg",
    "/favicons/fav-d.jpg",
    "/favicons/fav-i.jpg",
    "/favicons/fav-o.jpg",
    "/favicons/fav-a.jpg",
    "/favicons/fav-ib.jpg",
    "/favicons/fav-db.jpg",
    "/favicons/fav-a.jpg",
  ];

  const favicons = document.querySelectorAll(".favicon");
  const defaultFavicon = favicons[0]?.href;

  let i = 0;
  let lastTime = 0;
  const interval = 300;
  let running = false;

  function setFavicon(src) {
    favicons.forEach((favicon) => {
      favicon.href = src;
    });
  }

  function loop(now) {
    if (!running) return;

    if (now - lastTime >= interval) {
      lastTime = now;

      if (favicons.length > 0) {
        setFavicon(favFrames[i]);
        i = (i + 1) % favFrames.length;
      }
    }

    requestAnimationFrame(loop);
  }

  function start() {
    if (!running) {
      running = true;
      requestAnimationFrame(loop);
    }
  }

  function stop() {
    running = false;
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stop();
      setFavicon(defaultFavicon); // 👈 fallback quando non attiva
    } else {
      lastTime = performance.now();
      start();
    }
  });

  start();
};

const initMagnets = function () {
  const canUseMagnet = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!canUseMagnet) return;

  const magnets = document.querySelectorAll(".magnet");
  if (!magnets.length) return;

  const config = {
    radius: 250,
    strength: 50,
    ease: 0.28,
    epsilon: 0.01,
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  let rafId = null;
  let isAnimating = false;

  const items = Array.from(magnets).map((el) => {
    // Proxy click on inner link if magnet is clicked
    el.addEventListener("click", (e) => {
      const anchor = e.target.closest("a");
      if (anchor) return;

      const link = el.querySelector("a");
      if (link) link.click();
    });

    return {
      el,
      inner: el.querySelector(".magnet__inner") || el.firstElementChild || el,
      current: { x: 0, y: 0 },
      target: { x: 0, y: 0 },
      force: 0,
      visualForce: 0,
      distance: config.radius,
      lastTransform: "",
    };
  });

  const startAnimation = () => {
    if (isAnimating) return;
    isAnimating = true;
    rafId = requestAnimationFrame(animate);
  };

  const stopAnimation = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    isAnimating = false;
  };

  const onMouseMove = (e) => {
    items.forEach((item) => {
      const rect = item.el.getBoundingClientRect();

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;

      const distance = Math.hypot(deltaX, deltaY);

      const isHover =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (distance < config.radius) {
        const deadZone = 12;

        const visualT = clamp(1 - distance / config.radius, 0, 1);
        const visualForce = visualT * visualT;

        if (distance < deadZone) {
          item.target.x = 0;
          item.target.y = 0;
          item.force = 0;
          item.visualForce = 1;
          item.distance = distance;
          return;
        }

        const dirX = deltaX / distance;
        const dirY = deltaY / distance;

        let moveForce;

        if (isHover) {
          const hoverMaxDistance = Math.hypot(rect.width / 2, rect.height / 2);
          const hoverT = clamp(distance / hoverMaxDistance, 0, 1);
          moveForce = hoverT * hoverT;
        } else {
          moveForce = 1;
        }

        const strength = config.strength * moveForce;

        item.target.x = dirX * strength;
        item.target.y = dirY * strength;
        item.force = moveForce;
        item.visualForce = visualForce;
        item.distance = distance;
      } else {
        item.target.x = 0;
        item.target.y = 0;
        item.force = 0;
        item.visualForce = 0;
        item.distance = config.radius;
      }
    });

    startAnimation();
  };

  const resetItems = () => {
    items.forEach((item) => {
      item.target.x = 0;
      item.target.y = 0;
      item.force = 0;
      item.visualForce = 0;
      item.distance = config.radius;
    });

    startAnimation();
  };

  const animate = () => {
    let hasMotion = false;

    items.forEach((item) => {
      const minEase = config.ease * 0.35;
      const maxEase = config.ease;
      const ease = lerp(maxEase, minEase, item.force || 0);

      item.current.x = lerp(item.current.x, item.target.x, ease);
      item.current.y = lerp(item.current.y, item.target.y, ease);

      if (Math.abs(item.current.x - item.target.x) < config.epsilon) {
        item.current.x = item.target.x;
      } else {
        hasMotion = true;
      }

      if (Math.abs(item.current.y - item.target.y) < config.epsilon) {
        item.current.y = item.target.y;
      } else {
        hasMotion = true;
      }

      const scale = 1 + (item.visualForce || 0) * 0.06;

      const x = item.current.x.toFixed(3);
      const y = item.current.y.toFixed(3);
      const s = scale.toFixed(3);

      const transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`;

      if (transform !== item.lastTransform) {
        item.inner.style.transform = transform;
        item.lastTransform = transform;
      }

      if (
        item.current.x !== 0 ||
        item.current.y !== 0 ||
        item.target.x !== 0 ||
        item.target.y !== 0
      ) {
        hasMotion = true;
      }
    });

    if (hasMotion) {
      rafId = requestAnimationFrame(animate);
    } else {
      stopAnimation();
    }
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseleave", resetItems);
};

// Preload images then initialize everything
preloadImages().then(() => {
    document.fonts.ready.then(function() {

    document.body.classList.remove("loading"); // Remove loading state from body
    initSmoothScrolling(); // Initialize smooth scrolling
    initHeroTitle();
    animateFavicon();
    initMagnets();

  });
});
