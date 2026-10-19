

(() => {
  "use strict";

  if (!window.gsap) {
    console.warn("GSAP did not load. Check your internet connection.");
    return;
  }

  const gsap = window.gsap;
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reduceMotion) return;

  // Register scroll animations.
  if (window.ScrollTrigger) {
    gsap.registerPlugin(window.ScrollTrigger);
  }



  const finePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  ).matches;

  if (finePointer) {
    const cursorGlow = document.createElement("div");
    cursorGlow.className = "gsap-cursor-glow";
    cursorGlow.setAttribute("aria-hidden", "true");
    document.body.appendChild(cursorGlow);


    
gsap.set(cursorGlow, {
  xPercent: -50,
  yPercent: -50,
  scale: 0,
  opacity: 0,
  width: 24,
  height: 24
});

    const moveX = gsap.quickTo(cursorGlow, "x", {
      duration: 0.22,
      ease: "power3.out"
    });

    const moveY = gsap.quickTo(cursorGlow, "y", {
      duration: 0.22,
      ease: "power3.out"
    });

    window.addEventListener("pointermove", (event) => {
      moveX(event.clientX);
      moveY(event.clientY);

     gsap.to(cursorGlow, {
  scale: 1,
  opacity: 1,
  duration: 0.25,
  overwrite: "auto"
});


    }, { passive: true });

    window.addEventListener("pointerleave", () => {
      gsap.to(cursorGlow, {
        scale: 0,
        opacity: 0,
        duration: 0.25,
        overwrite: "auto"
      });
    });

    let lastSparkle = 0;

    window.addEventListener("pointermove", (event) => {
      const now = performance.now();

      if (now - lastSparkle < 75) return;
      lastSparkle = now;

      const sparkle = document.createElement("span");
      sparkle.className = "gsap-cursor-sparkle";
      sparkle.setAttribute("aria-hidden", "true");

      document.body.appendChild(sparkle);

      gsap.set(sparkle, {
        x: event.clientX,
        y: event.clientY,
        xPercent: -50,
        yPercent: -50,
        scale: gsap.utils.random(0.45, 1.1),
        rotation: gsap.utils.random(-35, 35)
      });

      gsap.to(sparkle, {
        x: `+=${gsap.utils.random(-22, 22)}`,
        y: `+=${gsap.utils.random(-35, -10)}`,
        opacity: 0,
        scale: 0,
        rotation: "+=45",
        duration: gsap.utils.random(0.45, 0.8),
        ease: "power2.out",
        onComplete: () => sparkle.remove()
      });
    }, { passive: true });
  }

 

  // The story lives in its own scrollable box, so ScrollTrigger must use that box.
  const storyScroller = document.querySelector(".origin-scroll-story");
  const chapters = gsap.utils.toArray(".origin-chapter");

  if (chapters.length && window.ScrollTrigger) {
    chapters.forEach((chapter) => {
      chapter.style.transition = "none";
      chapter.style.opacity = "1";
      chapter.style.transform = "none";

      const art = chapter.querySelector(".origin-chapter-art");
      const copy = chapter.querySelector(".origin-chapter-copy");

     
      const direction = chapter.classList.contains(
        "origin-chapter-right"
      ) ? 35 : -35;

      gsap.fromTo(
        art,
        {
          autoAlpha: 0,
          x: direction,
          y: 25,
          scale: 0.96
        },
        {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            scroller: storyScroller || window,
            trigger: chapter,
            start: "top 82%",
            toggleActions: "play none none reverse"
          }
        }
      );

      gsap.fromTo(
        copy,
        {
          autoAlpha: 0,
          y: 32
        },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          delay: 0.12,
          ease: "power2.out",
          scrollTrigger: {
            scroller: storyScroller || window,
            trigger: chapter,
            start: "top 82%",
            toggleActions: "play none none reverse"
          }
        }
      );

      const image = chapter.querySelector(".origin-scene-image img");

      if (image) {
        gsap.fromTo(
          image,
          { scale: 0.96 },
          {
            scale: 1,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
                scroller: storyScroller || window,
              trigger: image,
              start: "top 88%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }
    });

    const storyHeading = document.querySelector(
      ".origin-story-heading"
    );

    if (storyHeading) {
      gsap.fromTo(
        storyHeading,
        { autoAlpha: 0, y: 25 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: {
            scroller: storyScroller || window,
            trigger: storyHeading,
            start: "top 90%",
            once: true
          }
        }
      );
    }
  }


  // Recalculate nested-story trigger positions after lazy-loaded images settle.
  if (storyScroller && window.ScrollTrigger) {
    const refreshStoryTriggers = () => window.ScrollTrigger.refresh();
    storyScroller.querySelectorAll("img").forEach((image) => {
      if (!image.complete) {
        image.addEventListener("load", refreshStoryTriggers, { once: true });
        image.addEventListener("error", refreshStoryTriggers, { once: true });
      }
    });
    window.requestAnimationFrame(refreshStoryTriggers);
  }

  // ==========================================
  // PIP — FLOAT + ORIGINAL EYE-GLINT TRACKING
  // Requires assets/pip-main.webp with its baked-in glints removed.
  // ==========================================

  const pip = document.querySelector("#pipImage");
  const pipFigure = document.querySelector("#pipFigure");

  if (pip && pipFigure && !pipFigure.dataset.pipFaceReady) {
    pipFigure.dataset.pipFaceReady = "true";

    // Put the art and moving eye highlights in one wrapper so they
    // stay aligned while Pip floats.
    const artLayer = document.createElement("div");
    artLayer.className = "pip-art-layer";
    pip.parentNode.insertBefore(artLayer, pip);
    artLayer.appendChild(pip);

    const faceTracker = document.createElement("div");
    faceTracker.className = "pip-face-tracker";
    faceTracker.setAttribute("aria-hidden", "true");
    faceTracker.innerHTML = `
      <span class="pip-eye-glint pip-eye-left"></span>
      <span class="pip-eye-glint pip-eye-right"></span>
      <span class="pip-hover-smile">☺</span>
    `;
    artLayer.appendChild(faceTracker);

    const glints = [...faceTracker.querySelectorAll(".pip-eye-glint")];
    const [leftGlint, rightGlint] = glints;
    const smileBadge = faceTracker.querySelector(".pip-hover-smile");

    // Floating the wrapper keeps the character and eye layers together.
    gsap.set(artLayer, {
      transformOrigin: "50% 55%",
      transformPerspective: 900,
      willChange: "transform"
    });

    gsap.to(artLayer, {
      y: -8,
      duration: 2.3,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1
    });

    gsap.set(glints, {
      xPercent: -50,
      yPercent: -50,
      x: 0,
      y: 0
    });

    gsap.set(smileBadge, {
      autoAlpha: 0,
      y: 7,
      scale: 0.8,
      transformOrigin: "50% 50%"
    });

    const leftX = gsap.quickTo(leftGlint, "x", {
      duration: 0.18,
      ease: "power3.out"
    });
    const leftY = gsap.quickTo(leftGlint, "y", {
      duration: 0.18,
      ease: "power3.out"
    });
    const rightX = gsap.quickTo(rightGlint, "x", {
      duration: 0.18,
      ease: "power3.out"
    });
    const rightY = gsap.quickTo(rightGlint, "y", {
      duration: 0.18,
      ease: "power3.out"
    });

    // No artwork rotation: only the existing amber eye glints move.
    function resetFace() {
      leftX(0);
      leftY(0);
      rightX(0);
      rightY(0);
    }

    function followPointer(event) {
      const bounds = pip.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;

      // Use cursor position relative to Pip, even when the cursor is
      // outside his image. Values are clamped so the highlights stay
      // safely inside the existing eye sockets.
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;

      const dx = gsap.utils.clamp(-4.2, 4.2, (x - 0.52) * 10);
      const dy = gsap.utils.clamp(-3.0, 3.0, (y - 0.41) * 7.5);

      leftX(dx);
      rightX(dx);
      leftY(dy);
      rightY(dy);
    }

    function showSmile() {
      gsap.to(smileBadge, {
        autoAlpha: 1,
        y: -3,
        scale: 1,
        duration: 0.2,
        ease: "back.out(1.5)",
        overwrite: "auto"
      });
    }

    function hideSmile() {
      gsap.to(smileBadge, {
        autoAlpha: 0,
        y: 7,
        scale: 0.8,
        duration: 0.16,
        ease: "power2.out",
        overwrite: "auto"
      });
    }

    if (finePointer) {
      pipFigure.addEventListener("pointerenter", event => {
        if (event.pointerType !== "touch") showSmile();
      });

      // The purple cursor is page-wide, so let the eye highlights follow
      // its path anywhere on the page, not only while hovering over Pip.
      window.addEventListener("pointermove", event => {
        if (event.pointerType !== "touch") followPointer(event);
      }, { passive: true });

      pipFigure.addEventListener("pointerleave", hideSmile);
      window.addEventListener("blur", resetFace);
    }

    // Touchscreen fallback: tap the art, but don't interfere with hotspots.
    pipFigure.addEventListener("pointerdown", event => {
      if (event.pointerType !== "touch") return;
      if (event.target.closest(".hit-zone")) return;

      followPointer(event);
      showSmile();


      window.setTimeout(() => {
        resetFace();
        hideSmile();
      }, 900);
    });

    // Keep the original gentle tap bounce, but apply it to the art layer
    // so the eye glints remain attached to Pip's image.
    pip.addEventListener("click", () => {
      gsap.fromTo(
        artLayer,
        { scale: 1 },
        {
          scale: 1.025,
          duration: 0.18,
          ease: "power1.out",
          yoyo: true,
          repeat: 1,
          overwrite: false
        }
      );
    });
  }

})();
