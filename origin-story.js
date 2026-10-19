/* =======================================================
   PIP'S ORIGIN STORY — SCROLL REVEALS + IMAGE MODAL
   Load this file after script.js with defer.
   ======================================================= */
(() => {
  const root = document.querySelector('.origin-scroll-story');
  if (!root || root.dataset.originReady === 'true') return;
  root.dataset.originReady = 'true';

  const chapters = [

  // ==========================================
  // CHAPTER 1 — THE NURSERY AT SLEEPY SKY
  // ==========================================
  {
    title: 'The Nursery at Sleepy Sky',
    eyebrow: 'CHAPTER 01 · THE BEGINNING',
    caption: 'A forgotten lullaby finds its way through the stars',
    image: 'assets/origin-story/pip-origin-01-nursery.webp',
    alt: 'Midnight Nursery under the moon with a magical music box playing a golden lullaby',

    paragraphs: [
      'Long ago, at the far corner of Sleepy Sky, stood Midnight Nursery, where unfinished dreams floated like bubbles, waiting to be shaped.',

      'In its quietest room sat an old music box. Its tune wobbled so badly that even the dust bunnies covered their ears! Then, one quiet night, a forgotten lullaby slipped free. Its gentle melody drifted past the moon and reached a tiny wandering star.',

      'Curious, the star followed the music to a little cradle resting on a cloud. It curled up inside and glowed softly until morning.'
    ]
  },


  // ==========================================
  // CHAPTER 2 — THE STAR IN THE CRADLE
  // ==========================================
  {
    title: 'The Star in the Cradle',
    eyebrow: 'CHAPTER 02 · A NEW FRIEND',
    caption: 'A mysterious little baby arrives at the nursery',
    image: 'assets/origin-story/pip-origin-02-star-cradle.webp',
    alt: 'Tiny Pip sleeping in a starry cloud cradle while the nursery creatures look on',

    paragraphs: [
      'When morning came, the cradle was no longer empty. Inside lay a tiny baby with a smooth, round skull face, warm glowing eyes, a crooked little smile, and a starry nightcap tied with a pink bow.',

      'Nobody knew where he had come from. The nursery creatures gathered around, kept him warm, sang gentle lullabies, and made a cozy home for him among the clouds.',

      'They named him Pip. He was sleepy, curious, a little clumsy, and delighted by every silly sound. Somehow, Midnight Nursery had never felt quite so magical.'
    ]
  },


  // ==========================================
  // CHAPTER 3 — THE BABY WHO COULD HEAR DREAMS
  // ==========================================
  {
    title: 'The Baby Who Could Hear Dreams',
    eyebrow: 'CHAPTER 03 · DISCOVERY',
    caption: 'Every little dream has its own melody',
    image: 'assets/origin-story/pip-origin-03-hears-dreams.webp',
    alt: 'Pip looking at glowing dream bubbles filled with magical adventures',

    paragraphs: [
      'Pip was no ordinary baby. While the little creatures slept, he heard what nobody else could: the quiet melodies hiding inside their dreams.',

      'A lonely ghost dreamed of a warm, glowing lighthouse. A little fox dreamed of racing across the moon. A homesick cat dreamed of the garden it missed. To Pip, every dream sounded different.',

      'He tried humming along, but notes bounced off the nursery walls, clouds floated through windows, and one enormous hiccup sent stars spinning into the ceiling! Pip giggled and tried again.',

      'Then he hummed the right melody, and a sleeping creature smiled. Pip finally understood his special gift: he could hear the dreams others could not express.'
    ]
  },


  // ==========================================
  // CHAPTER 4 — TINY INVENTIONS, BIG COMFORT
  // ==========================================
  {
    title: 'Tiny Inventions, Big Comfort',
    eyebrow: 'CHAPTER 04 · LITTLE INVENTIONS',
    caption: 'Pip learns to turn dreams into something real',
    image: 'assets/origin-story/pip-origin-04-inventions.webp',
    alt: 'Pip in a cozy workshop with a glowing lantern, colorful blocks, and floating stars',

    paragraphs: [
      'Pip wanted to do more than listen to dreams. He wanted to help them come true.',

      'First, he experimented with a music box, creating gentle melodies for a little ghost afraid of the dark. Pip hummed a soothing tune, lit his lantern, and delivered a peaceful dream to the ghost’s window.',

      'But not every creature needed a lullaby. A tiny mouse was frightened by shadows, while a lonely cloud-bunny had too much energy to sleep. Pip designed golden nightlights that turned scary shadows into friendly stars. For the bunny, he built cheerful rattles and colorful blocks to stack, tumble, and build again.',

      'Soon, the mouse felt safe and the bunny was giggling. Pip discovered that a little light could bring comfort, while a little play could make someone feel less alone.'
    ]
  },


  // ==========================================
  // CHAPTER 5 — THE LITTLE DREAM ENGINEER
  // ==========================================
  {
    title: 'The Little Dream Engineer',
    eyebrow: 'CHAPTER 05 · PIP FINDS HIS PURPOSE',
    caption: 'A little story earns Pip a very special badge',
    image: 'assets/origin-story/pip-origin-05-dream-engineer.webp',
    alt: 'Pip reading a magical bedtime storybook beside the wise owl of Midnight Nursery',

    paragraphs: [
      'Pip’s workshop filled with music boxes, glowing lanterns, rattles, and colorful blocks. One evening, a little creature asked, “Can you make me a dream about somewhere I’ve never been?”',

      'Pip thought all night. The next morning, he picked up a pencil and drew moonlit forests, sleepy oceans, friendly dragons, and castles floating among the clouds.',

      'He turned his drawings into a bedtime storybook filled with adventures beyond the little creatures’ own worlds. That night, the nursery keeper read Pip’s story aloud, and every creature listened with sparkling eyes.',

      'The keeper smiled and pinned a tiny engineer’s badge to Pip’s nightcap. From that night onward, Pip became the Junior Dream Engineer at Midnight Nursery.',

      '“I build the dreams you fall asleep inside.”'
    ]
  }

];

  const dialog = document.getElementById('originStoryDialog');
  const dialogImage = document.getElementById('originDialogImage');
  const dialogCaption = document.getElementById('originDialogCaption');
  const dialogEyebrow = document.getElementById('originDialogEyebrow');
  const dialogCount = document.getElementById('originDialogCount');
  const dialogTitle = document.getElementById('originDialogTitle');
  const dialogText = document.getElementById('originDialogText');
  const dialogPrev = document.getElementById('originDialogPrev');
  const dialogNext = document.getElementById('originDialogNext');
  const dialogClose = document.getElementById('originDialogClose');
  const dialogDone = document.getElementById('originDialogDone');

  const progressTrack = document.getElementById('originStoryProgressTrack');
  const progressFill = document.getElementById('originStoryProgressFill');
  const progressLabel = document.getElementById('originStoryProgressLabel');
  const status = document.getElementById('originStoryStatus');
  const chapterCards = [...root.querySelectorAll('[data-origin-chapter]')];
  const chapterPills = [...root.querySelectorAll('[data-origin-jump]')];

  let currentIndex = 0;
  let lastTrigger = null;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function updateChapterNavigation(index) {
    const safeIndex = clamp(index, 0, chapters.length - 1);
    chapterPills.forEach((pill, pillIndex) => {
      const active = pillIndex === safeIndex;
      pill.classList.toggle('is-active', active);
      if (active) pill.setAttribute('aria-current', 'step');
      else pill.removeAttribute('aria-current');
    });
    progressLabel.textContent = `Chapter ${safeIndex + 1} of ${chapters.length}`;
  }

  function renderChapter(index) {
    currentIndex = clamp(index, 0, chapters.length - 1);
    const chapter = chapters[currentIndex];

    dialogImage.src = chapter.image;
    dialogImage.alt = chapter.alt;
    dialogCaption.textContent = chapter.caption;
    dialogEyebrow.textContent = chapter.eyebrow;
    dialogCount.textContent =
      `SCENE ${String(currentIndex + 1).padStart(2, '0')} / ${String(chapters.length).padStart(2, '0')}`;
    dialogTitle.textContent = chapter.title;

    dialogText.replaceChildren();
    chapter.paragraphs.forEach(copy => {
      const paragraph = document.createElement('p');
      paragraph.textContent = copy;
      dialogText.appendChild(paragraph);
    });

    dialogPrev.disabled = currentIndex === 0;
    dialogNext.textContent =
      currentIndex === chapters.length - 1 ? 'Read again ↻' : 'Next scene →';
  }

  function openChapter(index, trigger) {
    if (!dialog) return;
    lastTrigger = trigger || document.activeElement;
    renderChapter(index);

    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  }

  function closeChapter() {
    if (!dialog) return;
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
  }

  root.addEventListener('click', event => {
    const openButton = event.target.closest('[data-origin-open]');
    if (openButton) {
      const index = Number(openButton.dataset.originOpen);
      if (Number.isInteger(index) && index >= 0 && index < chapters.length) {
        openChapter(index, openButton);
      }
      return;
    }

    const sparkleButton = event.target.closest('[data-origin-sparkle]');
    if (sparkleButton) {
      const chapterArt = sparkleButton.closest('.origin-chapter-art');
      if (!chapterArt) return;
      const rect = chapterArt.getBoundingClientRect();
      const btnRect = sparkleButton.getBoundingClientRect();
      for (let i = 0; i < 5; i += 1) {
        const sparkle = document.createElement('span');
        sparkle.className = 'origin-pop-sparkle';
        sparkle.textContent = i % 2 ? '✧' : '✦';
        sparkle.style.left = `${btnRect.left - rect.left + btnRect.width / 2 + (Math.random() - .5) * 44}px`;
        sparkle.style.top = `${btnRect.top - rect.top + btnRect.height / 2 + (Math.random() - .5) * 20}px`;
        sparkle.style.setProperty('--spark-x', `${(Math.random() - .5) * 50}px`);
        sparkle.style.setProperty('--spark-y', `${-20 - Math.random() * 35}px`);
        chapterArt.appendChild(sparkle);
        window.setTimeout(() => sparkle.remove(), 950);
      }
      const chapterIndex = Number(sparkleButton.dataset.originSparkle);
      const chapter = chapters[chapterIndex];
      if (status && chapter) status.textContent = `A sprinkle of stardust for “${chapter.title}”! ✦`;
    }
  });

  dialogPrev?.addEventListener('click', () => {
    if (currentIndex > 0) renderChapter(currentIndex - 1);
  });

  dialogNext?.addEventListener('click', () => {
    renderChapter(currentIndex === chapters.length - 1 ? 0 : currentIndex + 1);
  });

  dialogClose?.addEventListener('click', closeChapter);
  dialogDone?.addEventListener('click', closeChapter);

  dialog?.addEventListener('click', event => {
    if (event.target === dialog) closeChapter();
  });

  dialog?.addEventListener('close', () => {
    if (lastTrigger && typeof lastTrigger.focus === 'function' && lastTrigger.isConnected) {
      lastTrigger.focus({ preventScroll: true });
    }
  });

  // Reveal chapters when they enter the viewport.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { root, threshold: 0.16, rootMargin: '0px 0px -4% 0px' });

    chapterCards.forEach(card => {
      if (!card.classList.contains('is-visible')) revealObserver.observe(card);
    });

    const activeObserver = new IntersectionObserver(entries => {
      const candidates = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (candidates.length) {
        const index = Number(candidates[0].target.dataset.originChapter);
        if (Number.isInteger(index)) updateChapterNavigation(index);
      }
    }, { root, threshold: [0.2, 0.4, 0.6], rootMargin: '-15% 0px -35% 0px' });

    chapterCards.forEach(card => activeObserver.observe(card));
  } else {
    chapterCards.forEach(card => card.classList.add('is-visible'));
  }

  // The fill tracks scrolling INSIDE the story box, not the main website page.
  let framePending = false;
  function updateScrollProgress() {
    framePending = false;
    if (!progressTrack || !progressFill) return;

    const totalScrollable = Math.max(1, root.scrollHeight - root.clientHeight);
    const progress = clamp(root.scrollTop / totalScrollable, 0, 1);
    progressFill.style.width = `${progress * 100}%`;
    progressTrack.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
  }

  function scheduleProgressUpdate() {
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(updateScrollProgress);
  }

  root.addEventListener('scroll', scheduleProgressUpdate, { passive: true });
  window.addEventListener('resize', scheduleProgressUpdate, { passive: true });
  updateScrollProgress();

  // Chapter pills scroll to each scene and also update the selected state.
  chapterPills.forEach((pill, index) => {
    pill.addEventListener('click', () => updateChapterNavigation(index));
  });
})();
