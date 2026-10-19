/**
 * lullaby-lab.js
 * 
 * Interactive Lullaby Lab Engine for Pip's Dream World.
 * Features:
 * - Real playable 44.1 kHz WAV lullaby tracks with seeking, looping, volume, mute.
 * - Sleep timer with countdown and soft volume fade-out.
 * - Layered ambient soundscape mixer (Rain, Night Wind, Celestial Crickets).
 * - Custom audio upload.
 * - Audio coordination with Storybook speech synthesis.
 */
(() => {
  'use strict';

  const TRACKS = [
    {
      id: 'starlight',
      title: 'Starlight Music Box',
      desc: 'A celestial music box melody that guided Pip’s cradle through the stars.',
      src: 'assets/audio/lullaby-starlight.wav',
      badge: 'Music Box · 432 Hz',
      durationEst: 33
    },
    {
      id: 'cradle',
      title: 'Cradle in the Clouds',
      desc: 'Gentle celesta & harp arpeggios that cradle restless little dreamers.',
      src: 'assets/audio/lullaby-cradle.wav',
      badge: 'Harp & Celesta',
      durationEst: 29
    },
    {
      id: 'midnight',
      title: "Pip's Midnight Serenade",
      desc: 'The classic Midnight Nursery hymn tuned to soothe night-fears and closet phantoms.',
      src: 'assets/audio/lullaby-midnight.wav',
      badge: 'Slumber Chime',
      durationEst: 34
    },
    {
      id: 'moonwaltz',
      title: 'Moonlit Slumber Waltz',
      desc: 'A slow 3/4 dream waltz dancing on soft cotton-candy cloud tops.',
      src: 'assets/audio/lullaby-moonwaltz.wav',
      badge: 'Dream Waltz',
      durationEst: 25
    }
  ];

  let currentTrackIdx = 0;
  let isPlaying = false;
  let isRepeat = true;
  let isMuted = false;
  let currentVolume = 0.75;

  let lullabyAudio = new Audio();
  lullabyAudio.preload = 'metadata';

  // Ambient sound elements
  const ambients = {
    rain: { audio: new Audio('assets/audio/ambient-rain.wav'), enabled: false, volume: 0.5 },
    wind: { audio: new Audio('assets/audio/ambient-nightwind.wav'), enabled: false, volume: 0.4 },
    crickets: { audio: new Audio('assets/audio/ambient-crickets.wav'), enabled: false, volume: 0.45 }
  };

  Object.values(ambients).forEach(amb => {
    amb.audio.loop = true;
    amb.audio.preload = 'auto';
  });

  // Sleep timer state
  let sleepTimerInterval = null;
  let sleepTimerSeconds = 0;

  // DOM Elements
  const cradleStage = document.getElementById('cradleStage');
  const activeTitle = document.getElementById('activeTrackTitle');
  const activeBadge = document.getElementById('activeTrackBadge');
  const activeDesc = document.getElementById('activeTrackDesc');
  const waveBars = document.getElementById('lullabyWaveBars');
  const timeElapsed = document.getElementById('lullabyTimeElapsed');
  const timeTotal = document.getElementById('lullabyTimeTotal');
  const seekSlider = document.getElementById('lullabySeekRange');
  const masterPlayBtn = document.getElementById('masterLullabyPlay');
  const prevBtn = document.getElementById('prevLullabyTrack');
  const nextBtn = document.getElementById('nextLullabyTrack');
  const repeatBtn = document.getElementById('repeatLullabyTrack');
  const muteBtn = document.getElementById('lullabyMuteBtn');
  const volSlider = document.getElementById('lullabyVolSlider');
  const sleepSelect = document.getElementById('lullabySleepTimer');
  const countdownBadge = document.getElementById('lullabyCountdownBadge');
  const statusNote = document.getElementById('lullabyStatusNote');
  const customInput = document.getElementById('customAudioUpload');
  const customBtn = document.getElementById('customAudioBtn');
  const trackCards = document.querySelectorAll('.track-card[data-track-idx]');

  function formatTime(sec) {
    if (!sec || isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function updateTrackDisplay() {
    const track = TRACKS[currentTrackIdx];
    if (!track) return;

    if (activeTitle) activeTitle.textContent = track.title;
    if (activeBadge) activeBadge.textContent = track.badge;
    if (activeDesc) activeDesc.textContent = track.desc;

    trackCards.forEach((card, idx) => {
      const isCurrent = idx === currentTrackIdx;
      card.classList.toggle('is-active-track', isCurrent);
      const playBtn = card.querySelector('.track-play-btn');
      if (playBtn) {
        playBtn.textContent = (isCurrent && isPlaying) ? '⏸' : '▶';
        playBtn.setAttribute('aria-label', (isCurrent && isPlaying) ? `Pause ${track.title}` : `Play ${track.title}`);
      }
    });

    if (masterPlayBtn) {
      masterPlayBtn.textContent = isPlaying ? '⏸' : '▶';
      masterPlayBtn.setAttribute('aria-label', isPlaying ? 'Pause lullaby' : 'Play lullaby');
    }

    if (cradleStage) {
      cradleStage.classList.toggle('is-rocking', isPlaying);
    }

    if (waveBars) {
      waveBars.classList.toggle('active-bars', isPlaying && !isMuted);
    }
  }

  function playTrack(idx) {
    if (idx !== undefined && idx !== currentTrackIdx) {
      currentTrackIdx = idx;
      lullabyAudio.src = TRACKS[currentTrackIdx].src;
      lullabyAudio.currentTime = 0;
    } else if (!lullabyAudio.src) {
      lullabyAudio.src = TRACKS[currentTrackIdx].src;
    }

    lullabyAudio.volume = isMuted ? 0 : currentVolume;
    lullabyAudio.loop = isRepeat;

    // Notify speech synthesis in storybook to avoid audio clash
    if (window.pipStoryCoordinator && typeof window.pipStoryCoordinator.stopNarration === 'function') {
      window.pipStoryCoordinator.stopNarration();
    }

    lullabyAudio.play()
      .then(() => {
        isPlaying = true;
        updateTrackDisplay();
        if (statusNote) statusNote.textContent = `Now playing: “${TRACKS[currentTrackIdx].title}” ♫`;
      })
      .catch((err) => {
        console.warn('Playback error or blocked by policy:', err);
        isPlaying = false;
        updateTrackDisplay();
        if (statusNote) statusNote.textContent = 'Tap play to start the music box.';
      });
  }

  function pauseTrack() {
    lullabyAudio.pause();
    isPlaying = false;
    updateTrackDisplay();
    if (statusNote) statusNote.textContent = 'The music box is resting.';
  }

  function togglePlay() {
    if (isPlaying) {
      pauseTrack();
    } else {
      playTrack();
    }
  }

  // Audio element events
  lullabyAudio.addEventListener('timeupdate', () => {
    const cur = lullabyAudio.currentTime || 0;
    const dur = lullabyAudio.duration || TRACKS[currentTrackIdx].durationEst;

    if (timeElapsed) timeElapsed.textContent = formatTime(cur);
    if (timeTotal) timeTotal.textContent = formatTime(dur);

    if (seekSlider && !seekSlider.matches(':active')) {
      seekSlider.max = Math.round(dur);
      seekSlider.value = Math.round(cur);
    }
  });

  lullabyAudio.addEventListener('loadedmetadata', () => {
    const dur = lullabyAudio.duration || TRACKS[currentTrackIdx].durationEst;
    if (timeTotal) timeTotal.textContent = formatTime(dur);
    if (seekSlider) seekSlider.max = Math.round(dur);
  });

  lullabyAudio.addEventListener('ended', () => {
    if (isRepeat) {
      lullabyAudio.currentTime = 0;
      lullabyAudio.play().catch(() => {});
    } else {
      currentTrackIdx = (currentTrackIdx + 1) % TRACKS.length;
      playTrack(currentTrackIdx);
    }
  });

  // Controls wiring
  if (masterPlayBtn) masterPlayBtn.addEventListener('click', togglePlay);

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const prev = (currentTrackIdx - 1 + TRACKS.length) % TRACKS.length;
      playTrack(prev);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const next = (currentTrackIdx + 1) % TRACKS.length;
      playTrack(next);
    });
  }

  if (repeatBtn) {
    repeatBtn.addEventListener('click', () => {
      isRepeat = !isRepeat;
      lullabyAudio.loop = isRepeat;
      repeatBtn.classList.toggle('is-active', isRepeat);
      repeatBtn.setAttribute('aria-pressed', String(isRepeat));
    });
  }

  if (seekSlider) {
    seekSlider.addEventListener('input', () => {
      lullabyAudio.currentTime = parseFloat(seekSlider.value);
    });
  }

  if (volSlider) {
    volSlider.addEventListener('input', () => {
      currentVolume = parseFloat(volSlider.value);
      if (!isMuted) {
        lullabyAudio.volume = currentVolume;
      }
      if (muteBtn) {
        muteBtn.textContent = currentVolume === 0 ? '🔇' : currentVolume < 0.5 ? '🔉' : '🔊';
      }
    });
  }

  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      isMuted = !isMuted;
      lullabyAudio.volume = isMuted ? 0 : currentVolume;
      muteBtn.textContent = isMuted ? '🔇' : currentVolume < 0.5 ? '🔉' : '🔊';
      Object.values(ambients).forEach(amb => {
        amb.audio.muted = isMuted;
      });
      if (waveBars) {
        waveBars.classList.toggle('active-bars', isPlaying && !isMuted);
      }
    });
  }

  // Sleep Timer
  function stopSleepTimer() {
    if (sleepTimerInterval) {
      clearInterval(sleepTimerInterval);
      sleepTimerInterval = null;
    }
    sleepTimerSeconds = 0;
    if (countdownBadge) countdownBadge.hidden = true;
  }

  if (sleepSelect) {
    sleepSelect.addEventListener('change', () => {
      const mins = parseInt(sleepSelect.value, 10);
      stopSleepTimer();

      if (mins > 0) {
        sleepTimerSeconds = mins * 60;
        if (countdownBadge) {
          countdownBadge.hidden = false;
          countdownBadge.textContent = `${mins}:00`;
        }

        sleepTimerInterval = setInterval(() => {
          sleepTimerSeconds -= 1;

          // Gentle fade in final 15 seconds
          if (sleepTimerSeconds <= 15 && sleepTimerSeconds > 0) {
            lullabyAudio.volume = Math.max(0.01, (sleepTimerSeconds / 15) * currentVolume);
          }

          if (countdownBadge) {
            const m = Math.floor(sleepTimerSeconds / 60);
            const s = sleepTimerSeconds % 60;
            countdownBadge.textContent = `${m}:${s.toString().padStart(2, '0')}`;
          }

          if (sleepTimerSeconds <= 0) {
            stopSleepTimer();
            pauseTrack();
            Object.values(ambients).forEach(amb => {
              amb.audio.pause();
              amb.enabled = false;
            });
            document.querySelectorAll('.ambient-tile').forEach(t => t.classList.remove('is-on'));
            document.querySelectorAll('.amb-toggle-pill').forEach(p => {
              p.classList.remove('pill-active');
              p.textContent = 'OFF';
            });
            lullabyAudio.volume = currentVolume; // restore volume
            if (statusNote) statusNote.textContent = 'Sleep timer completed. Sweet dreams! 🌙';
          }
        }, 1000);
      }
    });
  }

  // Playlist track item click
  trackCards.forEach((card) => {
    card.addEventListener('click', (e) => {
      const idx = parseInt(card.dataset.trackIdx, 10);
      if (idx === currentTrackIdx && isPlaying) {
        pauseTrack();
      } else {
        playTrack(idx);
      }
    });
  });

  // Custom audio upload
  if (customBtn && customInput) {
    customBtn.addEventListener('click', () => customInput.click());
    customInput.addEventListener('change', () => {
      const file = customInput.files?.[0];
      if (!file) return;

      const fileUrl = URL.createObjectURL(file);
      const customTrack = {
        id: `custom-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        desc: 'Custom imported bedtime song.',
        src: fileUrl,
        badge: 'Custom File',
        durationEst: 45
      };

      TRACKS.unshift(customTrack);
      currentTrackIdx = 0;
      playTrack(0);
      if (statusNote) statusNote.textContent = `Loaded custom audio: “${customTrack.title}”`;
    });
  }

  // Ambient sound controls
  document.querySelectorAll('[data-ambient-key]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.ambientKey;
      const amb = ambients[key];
      if (!amb) return;

      amb.enabled = !amb.enabled;
      const tile = btn.closest('.ambient-tile');
      tile?.classList.toggle('is-on', amb.enabled);
      btn.classList.toggle('pill-active', amb.enabled);
      btn.textContent = amb.enabled ? 'ON' : 'OFF';

      if (amb.enabled) {
        amb.audio.volume = isMuted ? 0 : amb.volume;
        amb.audio.play().catch(() => {});
      } else {
        amb.audio.pause();
      }
    });
  });

  document.querySelectorAll('[data-ambient-slider]').forEach(slider => {
    slider.addEventListener('input', () => {
      const key = slider.dataset.ambientSlider;
      const amb = ambients[key];
      if (!amb) return;
      amb.volume = parseFloat(slider.value);
      if (amb.enabled && !isMuted) {
        amb.audio.volume = amb.volume;
      }
    });
  });

  // Global Audio Coordinator for narration
  window.pipAudioCoordinator = {
    pauseLullaby: () => {
      if (isPlaying) {
        lullabyAudio.volume = Math.min(0.12, currentVolume * 0.25);
      }
    },
    resumeLullaby: () => {
      if (isPlaying && !isMuted) {
        lullabyAudio.volume = currentVolume;
      }
    },
    isPlaying: () => isPlaying
  };

  // Initial display setup
  updateTrackDisplay();
})();
