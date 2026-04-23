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

  const heroTitleSplit = SplitText.create(heroTitle, { type: "words,lines" });
  let pills = document.querySelectorAll(".hero__title .pill");

  if (pills.length <= 0) return;

  const mappedPills = {};
  const wordsWithPills = [];
  const tl = gsap.timeline();

  tl.fromTo(
    heroTitleSplit.lines,
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
    },
  );

  Array.from(pills).map((pill) => {
    const pillWordNumber = pill.getAttribute("data-keyword-number");
    if (!pillWordNumber) return;

    const num = parseInt(pillWordNumber);
    if (mappedPills[num]) return;

    mappedPills[num] = pill;
  });

  heroTitleSplit.words.map((word, index) => {
    const i = index + 1;

    if (mappedPills[i]) {
      const pillText = mappedPills[i].innerText;
      heroTitleSplit.words[index].setAttribute("data-keyword", pillText);
      wordsWithPills.push(heroTitleSplit.words[index]);
    }
  });

  tl.to(
    wordsWithPills,
    {
      stagger: {
        each: 0,
        onStart: function () {
          this.targets()[0].setAttribute("data-keyword-ready", "true");
        },
      },
    },
    `-=${tl.duration() / 2}`,
  );

  const hello = document.querySelector(".hero__contact");
  if (!hello) return;

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
    `-=0.2`,
  );
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
  const magnets = document.querySelectorAll(".magnet");
  if (!magnets.length) return;

  const config = {
    radius: 250,
    strength: 50,
    ease: 0.28,
  };

  const items = Array.from(magnets).map((el) => {
    // Proxy Click on inner link if magnet is clicked
    el.addEventListener("click", (e) => {
      const link = el.querySelector("a");
      if (link) {
        link.click();
      }
    });
    
    return {
        el,
        inner: el.querySelector(".magnet__inner") || el.firstElementChild || el,
        current: { x: 0, y: 0 },
        target: { x: 0, y: 0 },
        force: 0,
        visualForce: 0,
        distance: config.radius,
    };
});

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

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

        // forza visiva: cresce avvicinandoti al centro
        const visualT = clamp(1 - distance / config.radius, 0, 1);
        const visualForce = visualT * visualT;

        if (distance < deadZone) {
          item.target.x = 0;
          item.target.y = 0;
          item.force = 0; // movimento nullo al centro
          item.visualForce = 1; // blur/scale massimi al centro
          item.distance = distance;
          return;
        }

        const dirX = deltaX / distance;
        const dirY = deltaY / distance;
    
        let moveForce;

        if (isHover) {
          // dentro il box: la forza diminuisce verso il centro
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
  };

  const animate = () => {
    items.forEach((item) => {
      const minEase = config.ease * 0.35;
      const maxEase = config.ease;

      const ease = lerp(maxEase, minEase, item.force || 0);

      item.current.x = lerp(item.current.x, item.target.x, ease);
      item.current.y = lerp(item.current.y, item.target.y, ease);

      const scale = 1 + (item.visualForce || 0) * 0.06;

      item.inner.style.transform = `
        translate3d(${item.current.x}px, ${item.current.y}px, 0)
        scale(${scale})
      `;

      const opacity = item.visualForce || 0;

      item.inner.style.backdropFilter = `blur(${opacity * 10}px)`;
      item.inner.style.background = `rgba(255, 255, 255, ${Math.max(0, Math.min(0.15, opacity * 0.15))})`;
    });

    requestAnimationFrame(animate);
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseleave", () => {
    items.forEach((item) => {
      item.target.x = 0;
      item.target.y = 0;
      item.force = 0;
      item.visualForce = 0;
    });
  });

  animate();
};

// Preload images then initialize everything
preloadImages().then(() => {
  document.body.classList.remove("loading"); // Remove loading state from body
  initSmoothScrolling(); // Initialize smooth scrolling
  initHeroTitle();
  animateFavicon();
  initMagnets();
});
