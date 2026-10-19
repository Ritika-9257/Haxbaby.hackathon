/**
 * interactive-storybook.js
 * 
 * Interactive Storybook Engine for Pip's Dream World.
 * Enhances the 5 chapters with:
 * - Interactive hotspot pins on illustrations with real sound effects & animations.
 * - Bedtime decision choices with lore note reveals.
 * - Web Speech API synchronized narration with progressive sentence highlights.
 * - Keyboard navigation (Arrow keys, Space, R).
 * - Junior Dream Engineer Certificate of Completion.
 */
(() => {
  'use strict';

  // Sound effects loader
  const sfx = {
    chime: new Audio('assets/audio/sfx-chime.wav'),
    pop: new Audio('assets/audio/sfx-pop.wav'),
    pageturn: new Audio('assets/audio/sfx-pageturn.wav'),
    giggle: new Audio('assets/audio/sfx-giggle.wav'),
    sparkle: new Audio('assets/audio/sfx-sparkle.wav')
  };

  function playSfx(name) {
    const audio = sfx[name];
    if (audio) {
      audio.currentTime = 0;
      audio.volume = 0.55;
      audio.play().catch(() => {});
    }
  }

  // Hotspots definition for the 5 chapters
  const CHAPTER_HOTSPOTS = {
    0: [
      { id: 'mb', name: 'Antique Music Box', x: '35%', y: '68%', icon: '🎶', text: '♫ Plink! The music box wobbles and plays a sweet celestial chord!', sfx: 'chime' },
      { id: 'star', name: 'Wandering Star', x: '68%', y: '22%', icon: '⭐', text: '✧ The wandering star twinkles warmly and drifts toward the cradle!', sfx: 'sparkle' },
      { id: 'bub', name: 'Dream Bubbles', x: '18%', y: '32%', icon: '🫧', text: 'Pop! A bubble bursts with a puff of lavender stardust.', sfx: 'pop' },
      { id: 'moon', name: 'Sleepy Moon', x: '82%', y: '14%', icon: '🌙', text: 'The moonbeams shine softly on the nursery clouds.', sfx: 'chime' }
    ],
    1: [
      { id: 'pip', name: 'Baby Pip', x: '48%', y: '58%', icon: '💀', text: 'Pip wiggles his starry nightcap, blinks glowing eyes, and giggles softly!', sfx: 'giggle' },
      { id: 'cradle', name: 'Cloud Cradle', x: '52%', y: '78%', icon: '☁️', text: 'The cradle rocks gently back and forth on a cloud.', sfx: 'chime' },
      { id: 'friends', name: 'Nursery Friends', x: '24%', y: '52%', icon: '🐰', text: 'The little cloud bunny and gentle ghost wave hello with warm hearts ♡!', sfx: 'sparkle' },
      { id: 'bow', name: 'Pink Bow', x: '43%', y: '42%', icon: '🎀', text: 'Pip’s pink bow twitches and sprinkles golden dust.', sfx: 'sparkle' }
    ],
    2: [
      { id: 'ghost', name: 'Lighthouse Dream', x: '26%', y: '28%', icon: '🏮', text: 'The lonely ghost’s dream bubble glows with a warm, comforting light.', sfx: 'chime' },
      { id: 'fox', name: 'Moon-Runner Dream', x: '62%', y: '25%', icon: '🦊', text: 'Playful pawprints race across the moon with melodic chiming steps!', sfx: 'sparkle' },
      { id: 'cat', name: 'Garden Cat Dream', x: '76%', y: '48%', icon: '🐱', text: 'Emerald slumber flowers bloom in the homesick cat’s dream bubble.', sfx: 'chime' },
      { id: 'listen', name: 'Listening Pip', x: '46%', y: '65%', icon: '🍼', text: 'Pip hiccuped! Three tiny shooting stars spun right into the ceiling!', sfx: 'giggle' }
    ],
    3: [
      { id: 'lantern', name: 'Dream Lantern', x: '32%', y: '56%', icon: '🏮', text: 'The lantern shifts between Honey Gold, Peach Blush, and Mint Cloud!', sfx: 'sparkle' },
      { id: 'blocks', name: 'Toy Blocks', x: '64%', y: '68%', icon: '🧱', text: 'Click-clack! Four colorful blocks snap together and Pip shakes his rattle!', sfx: 'chime' },
      { id: 'shadow', name: 'Shadow Filter', x: '82%', y: '34%', icon: '✨', text: 'A scary corner shadow turns into a friendly, giggling marshmallow kitten.', sfx: 'pop' },
      { id: 'tools', name: 'Tinkering Pip', x: '48%', y: '52%', icon: '🛠️', text: 'Pip sketches a blueprint in glowing starlight ink!', sfx: 'giggle' }
    ],
    4: [
      { id: 'book', name: 'Bedtime Storybook', x: '46%', y: '65%', icon: '📖', text: 'Golden pages flutter open, releasing illustrated stars and sleepy dragons!', sfx: 'pageturn' },
      { id: 'owl', name: 'Wise Owl Keeper', x: '68%', y: '45%', icon: '🦉', text: 'The wise owl winks proud eyes and adjusts his feathered glasses with a soft hoot.', sfx: 'chime' },
      { id: 'badge', name: 'Engineer Badge', x: '38%', y: '44%', icon: '🎖️', text: '★ Sparkle! Pip’s Junior Dream Engineer badge gleams with celestial pride!', sfx: 'sparkle' },
      { id: 'castles', name: 'Cloud Castles', x: '20%', y: '22%', icon: '🏰', text: 'A friendly cloud dragon blows a sleepy smoke ring shaped like a heart ♡.', sfx: 'sparkle' }
    ]
  };

  // Bedtime choices definition
  const CHAPTER_CHOICES = {
    0: {
      question: 'How should the wandering star journey to Midnight Nursery?',
      options: [
        { label: 'Ride on a passing twilight cloud', note: '☁️ The star surfed down on a fluffy lavender cloud, enjoying the gentle evening breeze.' },
        { label: 'Follow the golden musical notes in the air', note: '♫ The star danced from note to note like a staircase of light across the night sky.' }
      ]
    },
    1: {
      question: 'What lullaby do the nursery creatures whisper to welcome Pip?',
      options: [
        { label: 'The Melody of Star Dew', note: '✨ “Sleep soft, little star, in blankets of spun dew, morning dreams await you.”' },
        { label: 'The Cloud Bunny’s Hush-Hymn', note: '🐰 The cloud bunny hummed a soft rhythmic beat like a gentle heartbeat against the clouds.' }
      ]
    },
    2: {
      question: 'Which sleeping friend should Pip harmonize for first?',
      options: [
        { label: 'The little fox racing the moon', note: '🦊 Pip hummed an energetic staccato chime that gave the fox wings across lunar craters!' },
        { label: 'The lonely ghost seeking the lighthouse', note: '👻 Pip hummed a deep, comforting warm chord that turned the ghost into a peaceful cloud.' }
      ]
    },
    3: {
      question: 'Which blueprint should Pip calibrate on his workbench?',
      options: [
        { label: 'The Anti-Shadow Star Lantern', note: '🏮 Pip fitted the lantern with a prism lens projecting soothing constellations on ceilings.' },
        { label: 'The Fluffy Cloud Blanket Loom', note: '☁️ Pip threaded starlight yarn to weave blankets that keep toes warm even in chilly night air.' }
      ]
    },
    4: {
      question: 'What dream realm should Pip draft for tonight’s sleepers?',
      options: [
        { label: 'The Castles of Cotton Candy Clouds', note: '🏰 High above the storm lines, where dreamers leap from turret to turret in zero gravity.' },
        { label: 'The Bioluminescent Slumber Ocean', note: '🌊 Where glowing jellyfish sing soft harmonic chords and lullaby whales drift in deep blue peace.' }
      ]
    }
  };

  // Feedback Banner Helper
  function showHotspotFeedback(text) {
    let banner = document.getElementById('storyHotspotFeedback');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'storyHotspotFeedback';
      banner.className = 'story-hotspot-feedback';
      banner.setAttribute('role', 'status');
      banner.setAttribute('aria-live', 'polite');
      const storyRoot = document.querySelector('.origin-scroll-story') || document.body;
      storyRoot.prepend(banner);
    }

    banner.innerHTML = `
      <span aria-hidden="true">✨</span>
      <span class="feedback-msg">${text}</span>
      <button type="button" class="feedback-close-btn" aria-label="Dismiss">✕</button>
    `;

    banner.querySelector('.feedback-close-btn')?.addEventListener('click', () => {
      banner.remove();
    });

    clearTimeout(banner._timer);
    banner._timer = setTimeout(() => {
      banner.remove();
    }, 4500);
  }

  // Inject Hotspot pins into each chapter card
  function injectHotspots() {
    const chapters = document.querySelectorAll('.origin-chapter[data-origin-chapter]');
    chapters.forEach(card => {
      const chIdx = parseInt(card.dataset.originChapter, 10);
      const art = card.querySelector('.origin-chapter-art');
      const spots = CHAPTER_HOTSPOTS[chIdx];
      if (!art || !spots || art.dataset.hotspotsInjected === 'true') return;
      art.dataset.hotspotsInjected = 'true';

      spots.forEach(sp => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'story-hotspot-pin';
        btn.style.left = sp.x;
        btn.style.top = sp.y;
        btn.setAttribute('aria-label', `${sp.name}: ${sp.text}`);
        btn.title = `${sp.name}`;

        btn.innerHTML = `
          <span class="hotspot-ring" aria-hidden="true"></span>
          <span class="hotspot-icon" aria-hidden="true">${sp.icon}</span>
          <span class="hotspot-tooltip">${sp.name}</span>
        `;

        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          playSfx(sp.sfx);
          btn.classList.add('is-activated');
          setTimeout(() => btn.classList.remove('is-activated'), 600);
          showHotspotFeedback(sp.text);
        });

        art.appendChild(btn);
      });

      // Inject Bedtime Choice card into chapter copy
      const copy = card.querySelector('.origin-chapter-copy');
      const choiceData = CHAPTER_CHOICES[chIdx];
      if (copy && choiceData && !copy.querySelector('.bedtime-choice-card')) {
        const choiceBox = document.createElement('div');
        choiceBox.className = 'bedtime-choice-card';
        choiceBox.innerHTML = `
          <div class="choice-header-row">
            <span aria-hidden="true">🌟</span>
            <h4>Bedtime Choice</h4>
          </div>
          <p class="choice-prompt-text">${choiceData.question}</p>
          <div class="choice-buttons-stack">
            ${choiceData.options.map((opt, oIdx) => `
              <button type="button" class="choice-pick-btn" data-choice-idx="${oIdx}">
                <span class="choice-icon-mark">○</span>
                <span>${opt.label}</span>
              </button>
            `).join('')}
          </div>
          <div class="choice-lore-reveal-box" hidden></div>
        `;

        const loreBox = choiceBox.querySelector('.choice-lore-reveal-box');
        const choiceBtns = choiceBox.querySelectorAll('.choice-pick-btn');

        choiceBtns.forEach((cBtn, oIdx) => {
          cBtn.addEventListener('click', () => {
            choiceBtns.forEach(b => {
              b.classList.remove('is-chosen');
              b.querySelector('.choice-icon-mark').textContent = '○';
            });
            cBtn.classList.add('is-chosen');
            cBtn.querySelector('.choice-icon-mark').textContent = '✓';

            playSfx('sparkle');
            const chosen = choiceData.options[oIdx];
            if (loreBox && chosen) {
              loreBox.hidden = false;
              loreBox.innerHTML = `<strong>Bedtime Lore:</strong> ${chosen.note}`;
            }
          });
        });

        copy.appendChild(choiceBox);
      }
    });
  }

  // Web Speech API Narration inside the Story Reader Dialog
  let isNarrating = false;
  let quietMode = false;
  let activeSentence = -1;

  function stopSpeech() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isNarrating = false;
    activeSentence = -1;
    document.querySelectorAll('.origin-dialog-text p').forEach(p => p.classList.remove('is-highlighted-sentence'));
    const btn = document.getElementById('dialogNarrationToggle');
    if (btn) {
      btn.classList.remove('is-narrating-now');
      btn.innerHTML = '🗣️ Listen to Scene';
    }
    if (window.pipAudioCoordinator) {
      window.pipAudioCoordinator.resumeLullaby();
    }
  }

  function startSpeech(text, dialogTextEl) {
    if (!('speechSynthesis' in window) || quietMode) return;
    stopSpeech();

    if (window.pipAudioCoordinator) {
      window.pipAudioCoordinator.pauseLullaby();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.88; // Gentle bedtime cadence
    utterance.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    const gentleVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Serena'))) || voices.find(v => v.lang.startsWith('en'));
    if (gentleVoice) utterance.voice = gentleVoice;

    const paragraphs = dialogTextEl ? [...dialogTextEl.querySelectorAll('p')] : [];

    utterance.onstart = () => {
      isNarrating = true;
      const btn = document.getElementById('dialogNarrationToggle');
      if (btn) {
        btn.classList.add('is-narrating-now');
        btn.innerHTML = '⏸ Pause Narration';
      }
    };

    utterance.onboundary = (e) => {
      if (e.name === 'sentence' && paragraphs.length) {
        activeSentence = (activeSentence + 1) % paragraphs.length;
        paragraphs.forEach((p, idx) => {
          p.classList.toggle('is-highlighted-sentence', idx === activeSentence);
        });
      }
    };

    utterance.onend = stopSpeech;
    utterance.onerror = stopSpeech;

    window.speechSynthesis.speak(utterance);
  }

  // Inject Narration Bar into #originStoryDialog
  function setupDialogNarration() {
    const dialog = document.getElementById('originStoryDialog');
    const copy = dialog?.querySelector('.origin-dialog-copy');
    if (!dialog || !copy || copy.querySelector('.origin-narration-bar')) return;

    const bar = document.createElement('div');
    bar.className = 'origin-narration-bar';
    bar.innerHTML = `
      <button type="button" class="narration-action-pill" id="dialogNarrationToggle">
        🗣️ Listen to Scene
      </button>
      <button type="button" class="narration-action-pill" id="dialogQuietToggle">
        📖 Audio: Ready
      </button>
      <button type="button" class="narration-action-pill" id="dialogReplayScene">
        ↻ Replay
      </button>
    `;

    copy.insertBefore(bar, copy.querySelector('.origin-dialog-text'));

    const narrateBtn = bar.querySelector('#dialogNarrationToggle');
    const quietBtn = bar.querySelector('#dialogQuietToggle');
    const replayBtn = bar.querySelector('#dialogReplayScene');

    narrateBtn?.addEventListener('click', () => {
      if (isNarrating) {
        stopSpeech();
      } else {
        const text = dialog.querySelector('.origin-dialog-text')?.textContent || '';
        const title = dialog.querySelector('#originDialogTitle')?.textContent || '';
        startSpeech(`${title}. ${text}`, dialog.querySelector('.origin-dialog-text'));
      }
    });

    quietBtn?.addEventListener('click', () => {
      quietMode = !quietMode;
      if (quietMode) stopSpeech();
      quietBtn.textContent = quietMode ? '🔇 Quiet Mode: ON' : '📖 Audio: Ready';
      quietBtn.classList.toggle('is-quiet', quietMode);
      playSfx('pop');
    });

    replayBtn?.addEventListener('click', () => {
      stopSpeech();
      playSfx('pageturn');
      const text = dialog.querySelector('.origin-dialog-text')?.textContent || '';
      const title = dialog.querySelector('#originDialogTitle')?.textContent || '';
      setTimeout(() => startSpeech(`${title}. ${text}`, dialog.querySelector('.origin-dialog-text')), 200);
    });

    // Close speech when dialog closes
    dialog.addEventListener('close', stopSpeech);

    // Watch next button: on chapter 5, show certificate
    const nextBtn = document.getElementById('originDialogNext');
    nextBtn?.addEventListener('click', () => {
      stopSpeech();
      playSfx('pageturn');
      const countEl = document.getElementById('originDialogCount');
      if (countEl && countEl.textContent.includes('05 / 05')) {
        setTimeout(() => showCertificateModal(), 600);
      }
    });

    document.getElementById('originDialogPrev')?.addEventListener('click', () => {
      stopSpeech();
      playSfx('pageturn');
    });
  }

  // Certificate Modal Handler
  function showCertificateModal() {
    let cert = document.getElementById('dreamCertificateModal');
    if (!cert) {
      cert = document.createElement('dialog');
      cert.id = 'dreamCertificateModal';
      cert.className = 'cert-dialog';
      cert.innerHTML = `
        <div class="cert-box">
          <div class="cert-badge-top" aria-hidden="true">🎖️✨</div>
          <h2 class="cert-main-title">Midnight Nursery Dream Certificate</h2>
          <p class="cert-sub-title">Official Junior Dream Engineer Commendation</p>
          <img src="assets/origin-story/pip-origin-05-dream-engineer.webp" alt="Pip wearing his proud dream engineer badge" class="cert-preview-img">
          <p class="cert-copy-text">
            Congratulations, Little Dreamer! You have journeyed through all five chapters with <strong>Pip</strong>, tuned gentle lullabies, filtered away nighttime monsters, and unlocked your honorary <strong>Junior Dream Engineer Badge</strong>.
          </p>
          <div class="cert-motto-pill">
            <em>“I build the dreams you fall asleep inside.” — Pip</em>
          </div>
          <div class="cert-buttons-row">
            <button type="button" class="soft-button" id="closeCertModal">Tuck in story ♥</button>
            <a href="#lullaby-lab" class="primary-button" id="jumpToLullabyFromCert">Listen to Lullabies ♫</a>
          </div>
        </div>
      `;
      document.body.appendChild(cert);

      cert.querySelector('#closeCertModal')?.addEventListener('click', () => {
        cert.close();
        playSfx('pop');
      });

      cert.querySelector('#jumpToLullabyFromCert')?.addEventListener('click', () => {
        cert.close();
        playSfx('sparkle');
        document.getElementById('lullaby-lab')?.scrollIntoView({ behavior: 'smooth' });
      });
    }

    if (typeof cert.showModal === 'function') {
      cert.showModal();
    } else {
      cert.setAttribute('open', '');
    }
    playSfx('chime');
  }

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    const dialog = document.getElementById('originStoryDialog');
    if (!dialog || !dialog.open) return;

    if (e.key === 'ArrowRight') {
      document.getElementById('originDialogNext')?.click();
    } else if (e.key === 'ArrowLeft') {
      document.getElementById('originDialogPrev')?.click();
    } else if (e.key === 'r' || e.key === 'R') {
      document.getElementById('dialogReplayScene')?.click();
    } else if (e.key === ' ') {
      e.preventDefault();
      document.getElementById('dialogNarrationToggle')?.click();
    }
  });

  // Coordinator export
  window.pipStoryCoordinator = {
    stopNarration: stopSpeech,
    isNarrating: () => isNarrating
  };

  // Run initial setups
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectHotspots();
      setupDialogNarration();
    });
  } else {
    injectHotspots();
    setupDialogNarration();
  }
})();
