/**
 * premiere-ui.js
 * Core editor logic for Adobe Premiere Pro workspace shell.
 * Coordinates page iframes, timelines, audio mixers, and custom grading.
 */
(function() {
  // ── 1. GLOBAL STATE ──
  const state = {
    activeWorkspace: 'editing', // editing, color, effects
    activeSequence: 'master',   // master, home, work, services, contact
    activeTool: 'select',       // select, razor, hand, type
    isPlaying: false,
    isScrubbing: false,
    ambientMuted: false,
    ambientSoloed: false,
    openSequences: ['master', 'home', 'contact', 'work', 'services'],  // Tabs currently open in timeline
    loaderReady: false,  // Blocks scroll/play until site loader finishes
    activeEffects: {
      blur: false,
      glitch: false,
      vhs: false,
      grayscale: false,
      invert: false
    },
    
    // Sliders state
    motion: {
      posX: 100, // percentage offset
      posY: 100,
      scale: 100,
      rotation: 0,
      opacity: 100
    },
    lumetri: {
      exposure: 0,
      contrast: 0,
      saturation: 100,
      temperature: 0,
      vignette: 0
    },
    
    // Audio analyzer
    audioContext: null,
    analyser: null,
    audioSource: null,
    
    // Timeline settings
    sequenceDurations: {
      master: 40, // 40 seconds total
      home: 10,
      work: 10,
      services: 10,
      contact: 10
    }
  };

  // Clips definition for V1 track
  const clipData = {
    master: [
      { id: 'home', name: 'Home_Sequence (Nested)', start: 0, dur: 10, color: 'var(--track-nested-color)', nested: true },
      { id: 'work', name: 'Work_Sequence (Nested)', start: 10, dur: 10, color: 'var(--track-nested-color)', nested: true },
      { id: 'services', name: 'Services_Sequence (Nested)', start: 20, dur: 10, color: 'var(--track-nested-color)', nested: true },
      { id: 'contact', name: 'Contact_Sequence (Nested)', start: 30, dur: 10, color: 'var(--track-nested-color)', nested: true }
    ],
    home: [
      { id: 'sec-hero', name: 'Hero Clip', start: 0, dur: 3, color: 'var(--track-v-color)', nested: false, scrollPercent: 0 },
      { id: 'sec-about', name: 'About Clip', start: 3, dur: 3, color: 'var(--track-v-color)', nested: false, scrollPercent: 0.35 },
      { id: 'sec-skills', name: 'Skills Clip', start: 6, dur: 2, color: 'var(--track-v-color)', nested: false, scrollPercent: 0.68 },
      { id: 'sec-footer', name: 'Footer Clip', start: 8, dur: 2, color: 'var(--track-v-color)', nested: false, scrollPercent: 0.95 }
    ],
    work: [
      { id: 'sec-work-title', name: 'Header & Title', start: 0, dur: 3, color: 'var(--track-v-color)', nested: false, scrollPercent: 0 },
      { id: 'sec-work-reel', name: 'Showreel Video', start: 3, dur: 3, color: 'var(--track-v-color)', nested: false, scrollPercent: 0.38 },
      { id: 'sec-work-grid', name: 'Portfolio Grid', start: 6, dur: 4, color: 'var(--track-v-color)', nested: false, scrollPercent: 0.75 }
    ],
    services: [
      { id: 'sec-serv-header', name: 'Header Clip', start: 0, dur: 3, color: 'var(--track-v-color)', nested: false, scrollPercent: 0 },
      { id: 'sec-serv-rates', name: 'Pricing & Packages', start: 3, dur: 4, color: 'var(--track-v-color)', nested: false, scrollPercent: 0.45 },
      { id: 'sec-serv-steps', name: 'Process Workflow', start: 7, dur: 3, color: 'var(--track-v-color)', nested: false, scrollPercent: 0.85 }
    ],
    contact: [
      { id: 'sec-cont-header', name: 'Header Clip', start: 0, dur: 3, color: 'var(--track-v-color)', nested: false, scrollPercent: 0 },
      { id: 'sec-cont-form', name: 'Contact Form', start: 3, dur: 4, color: 'var(--track-v-color)', nested: false, scrollPercent: 0.50 },
      { id: 'sec-cont-socials', name: 'Social Links', start: 7, dur: 3, color: 'var(--track-v-color)', nested: false, scrollPercent: 0.90 }
    ]
  };

  const isParentSubPage = window.location.pathname.includes('/html/');
  const sequencePaths = {
    master: isParentSubPage ? '../index.html' : 'index.html',
    home: isParentSubPage ? '../index.html' : 'index.html',
    work: isParentSubPage ? 'page_2.html' : 'html/page_2.html',
    services: isParentSubPage ? 'page_3.html' : 'html/page_3.html',
    contact: isParentSubPage ? 'page_4.html' : 'html/page_4.html'
  };

  // ── 2. DOM ELEMENT CACHE ──
  const els = {
    iframe: document.getElementById('pr-iframe'),
    slate: document.getElementById('pr-monitor-slate'),
    playhead: document.getElementById('timeline-playhead'),
    timecode: document.getElementById('player-timecode'),
    ruler: document.getElementById('timeline-ruler'),
    vTrack: document.getElementById('video-track-clips'),
    aTrack: document.getElementById('audio-track-clips'),
    playBtn: document.getElementById('btn-play'),
    timelineTabs: document.getElementById('pr-timeline-tabs'),
    monitorTitle: document.getElementById('monitor-title'),
    vignette: document.getElementById('player-vignette'),
    glitchOverlay: document.getElementById('player-glitch'),
    
    // Sliders
    ecPosX: document.getElementById('ec-pos-x'),
    ecPosY: document.getElementById('ec-pos-y'),
    ecScale: document.getElementById('ec-scale'),
    ecRotation: document.getElementById('ec-rotation'),
    ecOpacity: document.getElementById('ec-opacity'),
    
    // Lumetri
    lumExposure: document.getElementById('lum-exposure'),
    lumContrast: document.getElementById('lum-contrast'),
    lumSaturation: document.getElementById('lum-saturation'),
    lumTemp: document.getElementById('lum-temperature'),
    lumVignette: document.getElementById('lum-vignette'),
    
    // Audio elements
    ambientAudio: document.getElementById('ambient-audio'),
    sliceAudio: document.getElementById('slice-audio'),
    meterL: document.getElementById('meter-fill-l'),
    meterR: document.getElementById('meter-fill-r'),
    
    // History list
    historyList: document.getElementById('pr-history-list')
  };

  // ── 3. RESIZABLE WINDOW HANDLERS ──
  function setupResizers() {
    const leftResizer = document.getElementById('resizer-left');
    const rightResizer = document.getElementById('resizer-right');
    const vertResizer = document.getElementById('resizer-vertical');
    
    const leftDock = document.getElementById('pr-left-dock');
    const programMon = document.getElementById('pr-program-monitor');
    const metersPanel = document.getElementById('meters-panel');
    const topSplit = document.querySelector('.split-horizontal-top');
    const bottomSplit = document.querySelector('.split-horizontal-bottom');
    const projectPanel = document.getElementById('project-panel-wrapper');
    const timelinePanel = document.getElementById('timeline-panel');
    
    // Left drag resizing
    leftResizer.addEventListener('mousedown', (e) => {
      e.preventDefault();
      leftResizer.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      
      function onMouseMove(event) {
        const newWidth = event.clientX;
        if (newWidth > 180 && newWidth < 500) {
          leftDock.style.width = newWidth + 'px';
          projectPanel.style.width = newWidth + 'px';
        }
      }
      function onMouseUp() {
        leftResizer.classList.remove('dragging');
        document.body.style.cursor = 'default';
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        addHistoryStep('Resize panels');
      }
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
    
    // Right drag resizing (Meters Panel)
    rightResizer.addEventListener('mousedown', (e) => {
      e.preventDefault();
      rightResizer.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      
      function onMouseMove(event) {
        const newWidth = window.innerWidth - event.clientX;
        if (newWidth > 45 && newWidth < 150) {
          metersPanel.style.width = newWidth + 'px';
        }
      }
      function onMouseUp() {
        rightResizer.classList.remove('dragging');
        document.body.style.cursor = 'default';
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        addHistoryStep('Resize panels');
      }
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
    
    // Vertical drag resizing (Timeline vs Monitor)
    vertResizer.addEventListener('mousedown', (e) => {
      e.preventDefault();
      vertResizer.classList.add('dragging');
      document.body.style.cursor = 'row-resize';
      
      function onMouseMove(event) {
        const menuHeight = 32;
        const totalHeight = window.innerHeight - menuHeight;
        const topHeight = event.clientY - menuHeight;
        const topPercent = (topHeight / totalHeight) * 100;
        
        if (topPercent > 20 && topPercent < 80) {
          topSplit.style.flex = `1 1 ${topPercent}%`;
          bottomSplit.style.flex = `1 1 ${100 - topPercent}%`;
        }
      }
      function onMouseUp() {
        vertResizer.classList.remove('dragging');
        document.body.style.cursor = 'default';
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        addHistoryStep('Resize panels');
      }
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
  }

  // ── 4. WORKSPACE CONTROLLER ──
  function setupWorkspaces() {
    document.querySelectorAll('.ws-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const ws = e.target.dataset.workspace;
        document.querySelectorAll('.ws-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        
        // Update state
        state.activeWorkspace = ws;
        applyWorkspaceLayout(ws);
        addHistoryStep(`Switch to ${ws} workspace`);
      });
    });
  }

  function applyWorkspaceLayout(workspace) {
    // Reset layout tab panes
    const ecTab = document.querySelector('[data-tab="effect-controls-panel"]');
    const lumTab = document.querySelector('[data-tab="lumetri-panel"]');
    const projectTab = document.querySelector('[data-tab="project-bin"]');
    const effectsTab = document.querySelector('[data-tab="effects-bin"]');
    
    // Reset left dock panel visibility
    document.querySelectorAll('#pr-left-dock .pane-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#pr-left-dock .tab-pane').forEach(p => p.classList.remove('active'));
    
    if (workspace === 'color') {
      // Show Lumetri color panel
      lumTab.classList.add('active');
      document.getElementById('lumetri-panel').classList.add('active');
    } else if (workspace === 'effects') {
      // Show Effects bin
      ecTab.classList.add('active');
      document.getElementById('effect-controls-panel').classList.add('active');
      
      document.querySelectorAll('#project-panel-wrapper .pane-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('#project-panel-wrapper .tab-pane').forEach(p => p.classList.remove('active'));
      document.querySelector('[data-tab="effects-bin"]').classList.add('active');
      document.getElementById('effects-bin').classList.add('active');
    } else if (workspace === 'audio') {
      // Standard layout but focus audio meters
      ecTab.classList.add('active');
      document.getElementById('effect-controls-panel').classList.add('active');
      els.ambientAudio.play();
      state.isPlaying = true;
      els.playBtn.textContent = '||';
      els.playBtn.classList.add('active');
    } else {
      // Editing (Default)
      ecTab.classList.add('active');
      document.getElementById('effect-controls-panel').classList.add('active');
    }
  }

  // ── 5. PANEL TOGGLING & MAXIMIZING ──
  function setupPanelControls() {
    // Window dropdown panel toggles
    document.querySelectorAll('.window-toggle').forEach(item => {
      item.addEventListener('click', (e) => {
        const panelId = e.target.dataset.panel;
        const panel = document.getElementById(panelId);
        
        if (panel.classList.contains('hidden-pane')) {
          panel.classList.remove('hidden-pane');
          e.target.textContent = `✓ ${e.target.textContent.slice(2)}`;
          addHistoryStep(`Show window: ${panelId}`);
        } else {
          panel.classList.add('hidden-pane');
          e.target.textContent = `  ${e.target.textContent.slice(2)}`;
          addHistoryStep(`Hide window: ${panelId}`);
        }
      });
    });

    // Pane maximize button (⛶)
    document.querySelectorAll('.pane-maximize').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pane = e.target.closest('.pane');
        
        // If it's the Program Monitor, make the iframe go full screen!
        if (pane.id === 'pr-program-monitor') {
          if (els.iframe.requestFullscreen) {
            els.iframe.requestFullscreen().catch((err) => {
              togglePaneMaximize(pane);
            });
          } else if (els.iframe.webkitRequestFullscreen) { /* Safari */
            els.iframe.webkitRequestFullscreen();
          } else {
            togglePaneMaximize(pane);
          }
          addHistoryStep('Fullscreen Sequence Preview');
        } else {
          togglePaneMaximize(pane);
        }
      });
    });

    function togglePaneMaximize(pane) {
      const isMax = pane.classList.contains('pane-maximized');
      document.querySelectorAll('.pane').forEach(p => p.classList.remove('pane-maximized'));
      if (!isMax) {
        pane.classList.add('pane-maximized');
        addHistoryStep('Maximize panel');
      } else {
        addHistoryStep('Restore panel layout');
      }
    }

    // Left pane sub tabs switching (Effect Controls vs Lumetri Color)
    document.querySelectorAll('#pr-left-dock .pane-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const targetTab = e.target.dataset.tab;
        document.querySelectorAll('#pr-left-dock .pane-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('#pr-left-dock .tab-pane').forEach(p => p.classList.remove('active'));
        
        e.target.classList.add('active');
        document.getElementById(targetTab).classList.add('active');
      });
    });

    // Project bin sub tabs switching (Project vs Effects vs History)
    document.querySelectorAll('#project-panel-wrapper .pane-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const targetTab = e.target.dataset.tab;
        document.querySelectorAll('#project-panel-wrapper .pane-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('#project-panel-wrapper .tab-pane').forEach(p => p.classList.remove('active'));
        
        e.target.classList.add('active');
        document.getElementById(targetTab).classList.add('active');
      });
    });
  }

  // ── 6. TIMELINE & SCRUBBING ENGINE ──
  function renderTimelineClips() {
    // Clear tracks
    els.vTrack.innerHTML = '';
    els.aTrack.innerHTML = '';
    
    const seq = state.activeSequence;
    const duration = state.sequenceDurations[seq];
    
    // Draw ruler
    els.ruler.innerHTML = '';
    const ticksCount = 5;
    for (let i = 0; i <= ticksCount; i++) {
      const secVal = Math.round((duration / ticksCount) * i);
      const tick = document.createElement('div');
      tick.className = 'ruler-tick-label';
      tick.textContent = `00:00:${secVal < 10 ? '0' + secVal : secVal}:00`;
      els.ruler.appendChild(tick);
    }
    
    // Draw V1 clips
    const clips = clipData[seq] || [];
    clips.forEach(clip => {
      const clipEl = document.createElement('div');
      clipEl.className = 'timeline-clip';
      if (clip.nested) clipEl.classList.add('clip-nested');
      
      const widthPct = (clip.dur / duration) * 100;
      const leftPct = (clip.start / duration) * 100;
      
      clipEl.style.width = `calc(${widthPct}% - 4px)`;
      clipEl.style.left = `${leftPct}%`;
      clipEl.style.backgroundColor = clip.color;
      
      clipEl.innerHTML = `
        <div class="clip-name">${clip.name}</div>
      `;
      
      // Single click to navigate or scroll
      clipEl.addEventListener('click', () => {
        if (clip.nested) {
          openSequence(clip.id);
        } else {
          updateIframeScroll(clip.scrollPercent);
          updatePlayheadPosition(clip.scrollPercent);
        }
      });
      
      els.vTrack.appendChild(clipEl);
    });
    
    // Draw A1 audio clip (runs full sequence duration)
    const audioClip = document.createElement('div');
    audioClip.className = 'timeline-clip';
    audioClip.style.width = 'calc(100% - 4px)';
    audioClip.style.left = '0%';
    audioClip.innerHTML = `<div class="clip-name">lofi-ambient-music.mp3</div>`;
    els.aTrack.appendChild(audioClip);
  }

  function openSequence(seqId) {
    if (!state.openSequences.includes(seqId)) {
      state.openSequences.push(seqId);
    }
    
    // Change active sequence
    state.activeSequence = seqId;
    
    // Reload timeline tabs UI
    renderTimelineTabs();
    
    // Render clips
    renderTimelineClips();
    
    // Update active sequence style in Project Bin
    document.querySelectorAll('.asset-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.seq === seqId) {
        item.classList.add('active');
      }
    });

    // Toggle slate card visibility if we are in Master sequence
    if (seqId === 'master') {
      if (els.slate) els.slate.style.display = 'flex';
      els.iframe.style.display = 'none';
      els.monitorTitle.textContent = `Program: MASTER_Sequence (Project Slate)`;
    } else {
      if (els.slate) els.slate.style.display = 'none';
      els.iframe.style.display = 'block';
      
      const path = sequencePaths[seqId];
      if (path) {
        els.iframe.src = path;
        els.monitorTitle.textContent = `Program: ${seqId.toUpperCase()}_Sequence`;
      }
    }
    
    // Reset playhead
    updatePlayheadPosition(0);
    
    addHistoryStep(`Open Sequence: ${seqId}`);
  }

  function renderTimelineTabs() {
    els.timelineTabs.innerHTML = '';
    state.openSequences.forEach(seqId => {
      const tab = document.createElement('div');
      tab.className = `timeline-tab ${state.activeSequence === seqId ? 'active' : ''}`;
      tab.dataset.sequence = seqId;
      
      const niceName = seqId.toUpperCase() + '_Sequence';
      tab.innerHTML = `${niceName}`;
      
      tab.addEventListener('click', (e) => {
        if (e.target.classList.contains('timeline-tab')) {
          openSequence(seqId);
        }
      });
      
      els.timelineTabs.appendChild(tab);
    });
  }

  function updatePlayheadPosition(percent) {
    els.playhead.style.left = `${percent * 100}%`;
    
    // Update timecode
    const duration = state.sequenceDurations[state.activeSequence];
    const totalFrames = duration * 30; // 30fps
    const currentFrameTotal = Math.floor(percent * totalFrames);
    
    const minutes = Math.floor(currentFrameTotal / 1800);
    const seconds = Math.floor((currentFrameTotal % 1800) / 30);
    const frames = currentFrameTotal % 30;
    
    const pad = (num) => (num < 10 ? '0' + num : num);
    els.timecode.textContent = `00:${pad(minutes)}:${pad(seconds)}:${pad(frames)}`;
  }

  // Scrub playhead with mouse dragging
  function setupPlayheadScrubbing() {
    const container = document.querySelector('.timeline-ruler-container');
    
    function scrub(e) {
      const rect = container.getBoundingClientRect();
      let clickX = e.clientX - rect.left;
      if (clickX < 0) clickX = 0;
      if (clickX > rect.width) clickX = rect.width;
      
      const percent = clickX / rect.width;
      updatePlayheadPosition(percent);
      
      // If we are in the master sequence, playhead scrubs through pages
      if (state.activeSequence === 'master') {
        const pagesCount = 4;
        const pageIndex = Math.min(Math.floor(percent * pagesCount), pagesCount - 1);
        const pageURLList = isParentSubPage 
          ? ['../index.html', 'page_2.html', 'page_3.html', 'page_4.html']
          : ['index.html', 'html/page_2.html', 'html/page_3.html', 'html/page_4.html'];
        const pageURL = pageURLList[pageIndex];
        
        // Page scroll percent inside that specific page
        const pageScrollPercent = (percent * pagesCount) % 1.0;
        
        // Check if iframe source is correct page, if not load it
        const currentIframeURL = els.iframe.src;
        const currentFilename = currentIframeURL.split('/').pop().split('?')[0];
        const targetFilename = pageURL.split('/').pop();
        
        if (currentFilename !== targetFilename) {
          els.iframe.src = pageURL;
          els.monitorTitle.textContent = `Program: MASTER_Sequence (${targetFilename.split('.')[0]})`;
        }
        
        // Scroll inside iframe
        sendIframeMessage({ type: 'scroll-to', percent: pageScrollPercent });
      } else {
        // Normal sequence: scrolls active page
        sendIframeMessage({ type: 'scroll-to', percent: percent });
      }
    }
    
    container.addEventListener('mousedown', (e) => {
      state.isScrubbing = true;
      scrub(e);
      window.addEventListener('mousemove', scrub);
      
      function onMouseUp() {
        state.isScrubbing = false;
        window.removeEventListener('mousemove', scrub);
        window.removeEventListener('mouseup', onMouseUp);
        addHistoryStep('Timeline scrubbing');
      }
      window.addEventListener('mouseup', onMouseUp);
    });
  }

  // ── 7. SLIDERS & TRANSFORMS ──
  function setupSliders() {
    // MOTION
    els.ecPosX.addEventListener('input', (e) => {
      state.motion.posX = parseInt(e.target.value);
      document.getElementById('val-pos-x').textContent = (state.motion.posX - 100) * 5 + 'px';
      applyMotion();
    });
    els.ecPosY.addEventListener('input', (e) => {
      state.motion.posY = parseInt(e.target.value);
      document.getElementById('val-pos-y').textContent = (state.motion.posY - 100) * 5 + 'px';
      applyMotion();
    });
    els.ecScale.addEventListener('input', (e) => {
      state.motion.scale = parseInt(e.target.value);
      document.getElementById('val-scale').textContent = state.motion.scale + '%';
      applyMotion();
    });
    els.ecRotation.addEventListener('input', (e) => {
      state.motion.rotation = parseInt(e.target.value);
      document.getElementById('val-rotation').textContent = state.motion.rotation + 'deg';
      applyMotion();
    });
    els.ecOpacity.addEventListener('input', (e) => {
      state.motion.opacity = parseInt(e.target.value);
      document.getElementById('val-opacity').textContent = state.motion.opacity + '%';
      applyMotion();
    });
    
    document.getElementById('btn-reset-motion').addEventListener('click', () => {
      state.motion = { posX: 100, posY: 100, scale: 100, rotation: 0, opacity: 100 };
      els.ecPosX.value = 100;
      els.ecPosY.value = 100;
      els.ecScale.value = 100;
      els.ecRotation.value = 0;
      els.ecOpacity.value = 100;
      document.getElementById('val-pos-x').textContent = '0px';
      document.getElementById('val-pos-y').textContent = '0px';
      document.getElementById('val-scale').textContent = '100%';
      document.getElementById('val-rotation').textContent = '0deg';
      document.getElementById('val-opacity').textContent = '100%';
      applyMotion();
      addHistoryStep('Reset Motion controls');
    });

    // LUMETRI
    els.lumExposure.addEventListener('input', (e) => {
      state.lumetri.exposure = parseInt(e.target.value);
      document.getElementById('val-lum-exposure').textContent = state.lumetri.exposure;
      applyLumetri();
    });
    els.lumContrast.addEventListener('input', (e) => {
      state.lumetri.contrast = parseInt(e.target.value);
      document.getElementById('val-lum-contrast').textContent = state.lumetri.contrast;
      applyLumetri();
    });
    els.lumSaturation.addEventListener('input', (e) => {
      state.lumetri.saturation = parseInt(e.target.value);
      document.getElementById('val-lum-saturation').textContent = state.lumetri.saturation;
      applyLumetri();
    });
    els.lumTemp.addEventListener('input', (e) => {
      state.lumetri.temperature = parseInt(e.target.value);
      document.getElementById('val-lum-temperature').textContent = state.lumetri.temperature;
      applyLumetri();
    });
    els.lumVignette.addEventListener('input', (e) => {
      state.lumetri.vignette = parseInt(e.target.value);
      document.getElementById('val-lum-vignette').textContent = state.lumetri.vignette;
      applyLumetri();
    });

    document.getElementById('btn-reset-lumetri').addEventListener('click', () => {
      state.lumetri = { exposure: 0, contrast: 0, saturation: 100, temperature: 0, vignette: 0 };
      els.lumExposure.value = 0;
      els.lumContrast.value = 0;
      els.lumSaturation.value = 100;
      els.lumTemp.value = 0;
      els.lumVignette.value = 0;
      document.getElementById('val-lum-exposure').textContent = '0';
      document.getElementById('val-lum-contrast').textContent = '0';
      document.getElementById('val-lum-saturation').textContent = '100';
      document.getElementById('val-lum-temperature').textContent = '0';
      document.getElementById('val-lum-vignette').textContent = '0';
      applyLumetri();
      addHistoryStep('Reset Lumetri controls');
    });
  }

  function applyMotion() {
    sendIframeMessage({
      type: 'apply-transform',
      posX: state.motion.posX,
      posY: state.motion.posY,
      scale: state.motion.scale,
      rotation: state.motion.rotation,
      opacity: state.motion.opacity
    });
  }

  function applyLumetri() {
    // 1. Calculate Lumetri values
    const exp = 1 + (state.lumetri.exposure / 100);
    const con = 1 + (state.lumetri.contrast / 100);
    const sat = state.activeEffects.grayscale ? 0 : (state.lumetri.saturation / 100);
    const temp = state.lumetri.temperature;
    
    let filterVal = `brightness(${exp}) contrast(${con}) saturate(${sat})`;
    if (temp > 0) {
      filterVal += ` sepia(${temp / 100})`;
    } else if (temp < 0) {
      filterVal += ` hue-rotate(${temp * 0.3}deg)`;
    }
    
    // 2. Add cumulative effects
    if (state.activeEffects.blur) filterVal += ' blur(3px)';
    if (state.activeEffects.invert) filterVal += ' invert(1)';
    if (state.activeEffects.vhs) filterVal += ' contrast(1.2) brightness(0.9) saturate(1.4) hue-rotate(10deg)';
    
    // 3. Apply filter to iframe container directly in parent
    els.iframe.style.filter = filterVal;
    
    // 4. Send message to iframe to double-apply (safeguard)
    sendIframeMessage({
      type: 'apply-filter',
      exposure: state.lumetri.exposure,
      contrast: state.lumetri.contrast,
      saturation: state.activeEffects.grayscale ? 0 : state.lumetri.saturation,
      temperature: state.lumetri.temperature,
      vignette: state.lumetri.vignette
    });

    // Parent Vignette reflection
    els.vignette.style.boxShadow = `inset 0 0 ${state.lumetri.vignette * 2.5}px rgba(0,0,0,${state.lumetri.vignette / 100 * 0.85})`;
  }

  // Zoom control on preview window (CSS scale overlay)
  function setupMonitorScaling() {
    const zoomSelector = document.getElementById('player-zoom');
    zoomSelector.addEventListener('change', (e) => {
      const zoom = e.target.value;
      if (zoom === 'fit') {
        els.iframe.style.transform = 'none';
        els.iframe.style.width = '100%';
        els.iframe.style.height = '100%';
      } else {
        const val = parseFloat(zoom);
        els.iframe.style.transform = `scale(${val})`;
        els.iframe.style.width = `${100 / val}%`;
        els.iframe.style.height = `${100 / val}%`;
      }
      addHistoryStep(`Adjust monitor scaling: ${zoom}`);
    });
  }

  // ── 8. TOOLBAR STATES ──
  function setupToolbar() {
    const toolButtons = {
      select: document.getElementById('tool-select'),
      razor: document.getElementById('tool-razor'),
      hand: document.getElementById('tool-hand'),
      type: document.getElementById('tool-type')
    };

    Object.keys(toolButtons).forEach(tool => {
      toolButtons[tool].addEventListener('click', () => {
        // Toggle active button style
        Object.values(toolButtons).forEach(b => b.classList.remove('active'));
        toolButtons[tool].classList.add('active');
        
        state.activeTool = tool;
        addHistoryStep(`Select Tool: ${tool}`);
        
        // Toggle cursor class on parent document body
        document.body.classList.remove('tool-select', 'tool-razor', 'tool-hand', 'tool-type');
        document.body.classList.add(`tool-${tool}`);
        
        // Notify Iframe of tool switch
        sendIframeMessage({ type: 'apply-tool', tool: tool });
        
        // Enable/Disable text clicks in iframe
        sendIframeMessage({ type: 'set-editable-text', editable: tool === 'type' });
      });
    });
  }

  // ── 9. PLAYBACK ENGINE & AUDIO METERS ──
  let playInterval = null;
  function setupPlayback() {
    els.playBtn.addEventListener('click', togglePlayback);
    
    // Play audio asset when double clicked
    document.getElementById('asset-ambient-music').addEventListener('dblclick', () => {
      els.ambientAudio.play();
      state.isPlaying = true;
      els.playBtn.textContent = '||';
      els.playBtn.classList.add('active');
      addHistoryStep('Play Ambient Beat');
    });

    // Mute/Solo track controls
    document.getElementById('mute-track').addEventListener('click', (e) => {
      state.ambientMuted = !state.ambientMuted;
      els.ambientAudio.muted = state.ambientMuted;
      e.target.classList.toggle('active', state.ambientMuted);
      addHistoryStep(state.ambientMuted ? 'Mute Audio Track' : 'Unmute Audio Track');
    });
  }

  function togglePlayback() {
    // Block playback until the site's loading screen has finished
    if (!state.loaderReady && !state.isPlaying) return;
    if (state.isPlaying) {
      // Pause
      state.isPlaying = false;
      els.playBtn.textContent = '▶';
      els.playBtn.classList.remove('active');
      els.ambientAudio.pause();
      clearInterval(playInterval);
      addHistoryStep('Pause sequence');
    } else {
      // Play
      state.isPlaying = true;
      els.playBtn.textContent = '||';
      els.playBtn.classList.add('active');
      
      // Try playing lofi audio track (fails safely if browser blocks)
      els.ambientAudio.play().catch(() => console.log('Audio playback blocked by browser. Drag/Scrub to unlock.'));
      
      initAudioVisualizer();
      
      // Auto-scroller timer loop simulating video playback
      const duration = state.sequenceDurations[state.activeSequence];
      const step = 0.05; // seconds
      
      // Read current playhead position
      let percent = parseFloat(els.playhead.style.left) / 100 || 0;
      
      playInterval = setInterval(() => {
        percent += step / duration;
        if (percent >= 1.0) {
          percent = 1.0;
          updatePlayheadPosition(percent);
          sendIframeMessage({ type: 'scroll-to', percent: percent });
          togglePlayback(); // Pause autoplay at the end of the timeline
          return;
        }
        
        updatePlayheadPosition(percent);
        
        // Scroll iframe
        sendIframeMessage({ type: 'scroll-to', percent: percent });
      }, step * 1000);
      
      addHistoryStep('Play sequence');
    }
  }

  function initAudioVisualizer() {
    if (state.audioContext) return;
    
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      state.audioContext = new AudioCtx();
      state.analyser = state.audioContext.createAnalyser();
      state.analyser.fftSize = 32;
      
      state.audioSource = state.audioContext.createMediaElementSource(els.ambientAudio);
      state.audioSource.connect(state.analyser);
      state.analyser.connect(state.audioContext.destination);
      
      animateAudioMeters();
    } catch(e) {
      console.log('AudioContext not supported or already initialized.', e);
    }
  }

  function animateAudioMeters() {
    if (!state.analyser) return;
    
    const bufferLength = state.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    function draw() {
      if (!state.isPlaying || els.ambientAudio.paused) {
        els.meterL.style.height = '0%';
        els.meterR.style.height = '0%';
        requestAnimationFrame(draw);
        return;
      }
      
      state.analyser.getByteFrequencyData(dataArray);
      
      // Take average frequency value for L/R
      let total = 0;
      for (let i = 0; i < bufferLength; i++) {
        total += dataArray[i];
      }
      const average = total / bufferLength;
      const height = Math.min((average / 160) * 100, 100); // map to percentage
      
      // Introduce subtle offsets for L/R channel bounce realism
      const lOffset = (Math.random() - 0.5) * 8;
      const rOffset = (Math.random() - 0.5) * 8;
      
      els.meterL.style.height = Math.max(0, Math.min(height + lOffset, 100)) + '%';
      els.meterR.style.height = Math.max(0, Math.min(height + rOffset, 100)) + '%';
      
      requestAnimationFrame(draw);
    }
    draw();
  }

  // ── 10. DRAG-DROP & CLICK EFFECTS ──
  function setupDragDropEffects() {
    // Click & double click to apply from Effects Panel directly
    document.querySelectorAll('.effect-item-class').forEach(el => {
      el.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', e.target.dataset.effect);
      });
      
      // Toggle effect on click or double click
      el.addEventListener('dblclick', (e) => {
        const effect = e.currentTarget.dataset.effect;
        if (effect) {
          applyDroppedEffect(effect);
        }
      });
      el.addEventListener('click', (e) => {
        const effect = e.currentTarget.dataset.effect;
        if (effect) {
          applyDroppedEffect(effect);
        }
      });
    });

    const timeline = document.getElementById('timeline-panel');
    timeline.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    timeline.addEventListener('drop', (e) => {
      e.preventDefault();
      const effect = e.dataTransfer.getData('text/plain');
      if (effect) {
        applyDroppedEffect(effect);
      }
    });
    
    // Clear All button
    const clearBtn = document.getElementById('btn-clear-effects');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        state.activeEffects = { blur: false, glitch: false, vhs: false, grayscale: false, invert: false };
        document.querySelectorAll('.effect-item-class').forEach(el => {
          el.style.borderColor = '#3c3c3c';
          el.style.backgroundColor = '#2b2b2b';
        });
        applyLumetri();
        addHistoryStep('Clear All Effects');
      });
    }
  }

  function applyDroppedEffect(effect) {
    // Toggle active state
    if (state.activeEffects[effect] !== undefined) {
      state.activeEffects[effect] = !state.activeEffects[effect];
      addHistoryStep(`${state.activeEffects[effect] ? 'Apply' : 'Remove'} effect: ${effect}`);
      
      // Update visual item selection in bin
      document.querySelectorAll('.effect-item-class').forEach(el => {
        if (el.dataset.effect === effect) {
          if (state.activeEffects[effect]) {
            el.style.borderColor = 'var(--accent-color)';
            el.style.backgroundColor = '#1473e620';
          } else {
            el.style.borderColor = '#3c3c3c';
            el.style.backgroundColor = '#2b2b2b';
          }
        }
      });
    }
    
    // Audio slice effect
    els.sliceAudio.currentTime = 0;
    els.sliceAudio.play().catch(() => {});
    
    // Trigger render glitch animation if glitch is activated
    if (effect === 'glitch' && state.activeEffects.glitch) {
      sendIframeMessage({ type: 'trigger-glitch' });
      els.glitchOverlay.style.background = 'rgba(255, 0, 0, 0.15)';
      setTimeout(() => {
        els.glitchOverlay.style.background = 'none';
      }, 400);
    }
    
    // Apply changes
    applyLumetri();
  }

  // ── 11. EXTRA INTERACTIVE FEATURES ──
  // Clicking assets in bin to open them (single click page switcher)
  function setupProjectBin() {
    document.querySelectorAll('.asset-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const seqId = e.currentTarget.dataset.seq;
        if (seqId) {
          openSequence(seqId);
        }
      });
    });

    // Asset filter search
    const searchInput = document.getElementById('project-search');
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value.toLowerCase();
      document.querySelectorAll('.asset-item').forEach(item => {
        const name = item.querySelector('.asset-name').textContent.toLowerCase();
        item.style.display = name.includes(val) ? 'flex' : 'none';
      });
    });

    // Create Nested Sequence menu trigger
    document.getElementById('menu-nested-seq').addEventListener('click', () => {
      const name = prompt('Enter name for Nested Sequence:', 'Nested_Sequence_1');
      if (name) {
        const seqId = name.toLowerCase().replace(/\s+/g, '_');
        
        // Add to sequence paths and clip lists dynamically
        sequencePaths[seqId] = 'index.html';
        state.sequenceDurations[seqId] = 10;
        clipData[seqId] = [
          { id: 'sec-custom', name: 'Custom Dynamic Clip', start: 0, dur: 10, color: 'var(--track-v-color)', nested: false, scrollPercent: 0 }
        ];

        // Add asset to bin
        const bin = document.querySelector('.project-assets');
        const asset = document.createElement('div');
        asset.className = 'asset-item sequence';
        asset.dataset.seq = seqId;
        asset.innerHTML = `<span class="asset-icon">SEQ</span><span class="asset-name">${name}</span>`;
        asset.addEventListener('click', () => openSequence(seqId));
        bin.appendChild(asset);
        
        addHistoryStep(`Create Nested Sequence: ${name}`);
        alert(`Nested Sequence "${name}" created in bin!`);
      }
    });

    // Render In to Out triggers render glitch bar loading
    document.getElementById('menu-render-in-out').addEventListener('click', () => {
      els.monitorTitle.textContent = 'Rendering Effects... (Progress: 0%)';
      els.playBtn.disabled = true;
      document.querySelector('.player-view').classList.add('rendering');
      
      let prog = 0;
      const interval = setInterval(() => {
        prog += 10;
        els.monitorTitle.textContent = `Rendering Effects... (Progress: ${prog}%)`;
        if (prog >= 100) {
          clearInterval(interval);
          els.monitorTitle.textContent = `Program: ${state.activeSequence.toUpperCase()}_Sequence`;
          els.playBtn.disabled = false;
          document.querySelector('.player-view').classList.remove('rendering');
          addHistoryStep('Render In/Out Effects');
          alert('Render complete! Timeline area is green (Fully cached).');
        }
      }, 150);
    });
  }

  // ── 12. UTILITIES & COMMUNICATION ──
  function sendIframeMessage(data) {
    if (els.iframe && els.iframe.contentWindow) {
      els.iframe.contentWindow.postMessage(data, '*');
    }
  }

  function updateIframeScroll(percent) {
    sendIframeMessage({ type: 'scroll-to', percent: percent });
  }

  // Listen to scrolls/actions inside Iframe
  window.addEventListener('message', (e) => {
    const data = e.data;
    if (!data || typeof data !== 'object') return;
    
    if (data.type === 'iframe-keydown') {
      if (data.key === ' ') {
        togglePlayback();
      } else {
        handleArrowKeys(data.key);
      }
    } else if (data.type === 'iframe-scroll') {
      // Sync timeline playhead when user scrolls website normally (only if not scrubbing or playing)
      if (state.isScrubbing || state.isPlaying) return;
      
      if (state.activeSequence !== 'master') {
        updatePlayheadPosition(data.percent);
      } else {
        // Master sequence represents all pages, map scroll to active block fraction
        const seqNames = ['home', 'work', 'services', 'contact'];
        const idx = seqNames.indexOf(state.activeSequence);
        if (idx !== -1) {
          const totalPercent = (idx / 4) + (data.percent * 0.25);
          updatePlayheadPosition(totalPercent);
        }
      }
    } else if (data.type === 'iframe-loaded') {
      // Iframe navigated to a different page, update active sequence tab/preview name
      const seqId = data.page.toLowerCase();
      
      // Update active sequence state without changing iframe src (avoid loops)
      state.activeSequence = seqId;
      if (!state.openSequences.includes(seqId)) {
        state.openSequences.push(seqId);
      }
      
      renderTimelineTabs();
      renderTimelineClips();
      
      document.querySelectorAll('.asset-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.seq === seqId) {
          item.classList.add('active');
        }
      });
      
      els.monitorTitle.textContent = `Program: ${data.page.toUpperCase()}_Sequence`;
      addHistoryStep(`Loaded sequence page: ${data.page}`);
      
      // Re-apply motion & lumetri styles to new iframe body
      applyMotion();
      applyLumetri();
      sendIframeMessage({ type: 'apply-tool', tool: state.activeTool });
      sendIframeMessage({ type: 'set-editable-text', editable: state.activeTool === 'type' });
    } else if (data.type === 'text-edited') {
      addHistoryStep(`Edit Text: "${data.text.slice(0, 15)}..."`);
    }
  });

  // ── 12.5 CREATIVE EXPORT SCREEN ──
  function setupExport() {
    const exportBtn = document.getElementById('btn-export');
    const exportOverlay = document.getElementById('pr-export-overlay');
    const closeBtn = document.getElementById('btn-export-close-x');
    const cancelBtn = document.getElementById('btn-export-cancel');
    const sendBtn = document.getElementById('btn-export-send');
    const exportIframe = document.getElementById('export-iframe');
    
    exportBtn.addEventListener('click', () => {
      exportIframe.src = els.iframe.src;
      exportOverlay.classList.add('active');
      addHistoryStep('Open Export Panel');
    });
    
    function closeExport() {
      exportOverlay.classList.remove('active');
      addHistoryStep('Close Export Panel');
    }
    
    closeBtn.addEventListener('click', closeExport);
    cancelBtn.addEventListener('click', closeExport);
    
    sendBtn.addEventListener('click', () => {
      const format = document.getElementById('export-format').value;
      const preset = document.getElementById('export-preset').value;
      const filename = document.getElementById('export-name').value;
      
      const subject = encodeURIComponent(`Project Inquiry - Premiere Pro Portfolio`);
      const body = encodeURIComponent(
        `Hi Hemang,\n\nI was browsing your Premiere Pro UI website and wanted to reach out regarding a potential collaboration!\n\n` +
        `Here are my project parameters:\n` +
        `- Inquiry Type: ${format === 'freelance' ? 'Freelance / Contract Job' : (format === 'fulltime' ? 'Full-Time Hire' : 'Creative Collaboration')}\n` +
        `- Priority Level: ${preset === 'high' ? 'High Quality (Premium Contract)' : (preset === 'fast' ? 'Express Delivery' : 'Standard Brief')}\n` +
        `- Asset Title: ${filename}\n\n` +
        `Let me know when you are available to chat!\n\nBest regards,\n[Your Name]`
      );
      
      addHistoryStep('Export Complete - Mail composed');
      window.open(`mailto:hemanluthra6@gmail.com?subject=${subject}&body=${body}`);
      closeExport();
    });
  }

  // ── 12.7 KEYBOARD CONTROLS (SPACEBAR & ARROWS) ──
  function setupKeyboardControls() {
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      // Block all playback controls until the site loader finishes
      if (!state.loaderReady) return;
      
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (e.key === ' ') {
          e.preventDefault();
          togglePlayback();
        } else {
          e.preventDefault();
          handleArrowKeys(e.key);
        }
      }
    });
  }

  function handleArrowKeys(key) {
    let percent = parseFloat(els.playhead.style.left) / 100 || 0;
    
    if (key === 'ArrowLeft') {
      percent = Math.max(0, percent - 0.008);
      addHistoryStep('Step backward 1 frame');
    } else if (key === 'ArrowRight') {
      percent = Math.min(1.0, percent + 0.008);
      addHistoryStep('Step forward 1 frame');
    } else if (key === 'ArrowUp') {
      percent = Math.max(0, percent - 0.04);
      addHistoryStep('Scroll sequence up');
    } else if (key === 'ArrowDown') {
      percent = Math.min(1.0, percent + 0.04);
      addHistoryStep('Scroll sequence down');
    }
    
    updatePlayheadPosition(percent);
    
    if (state.activeSequence === 'master') {
      const pagesCount = 4;
      const pageIndex = Math.min(Math.floor(percent * pagesCount), pagesCount - 1);
      const pageURL = isParentSubPage 
        ? ['../index.html', 'page_2.html', 'page_3.html', 'page_4.html'][pageIndex]
        : ['index.html', 'html/page_2.html', 'html/page_3.html', 'html/page_4.html'][pageIndex];
      
      const pageScrollPercent = (percent * pagesCount) % 1.0;
      
      const currentIframeURL = els.iframe.src;
      const currentFilename = currentIframeURL.split('/').pop().split('?')[0];
      const targetFilename = pageURL.split('/').pop();
      
      if (currentFilename !== targetFilename) {
        els.iframe.src = pageURL;
        els.monitorTitle.textContent = `Program: MASTER_Sequence (${targetFilename.split('.')[0]})`;
      }
      sendIframeMessage({ type: 'scroll-to', percent: pageScrollPercent });
    } else {
      sendIframeMessage({ type: 'scroll-to', percent: percent });
    }
  }

  function addHistoryStep(name) {
    const step = document.createElement('div');
    step.className = 'history-step active';
    step.textContent = name;
    
    // De-activate previous active steps
    document.querySelectorAll('.history-step').forEach(s => s.classList.remove('active'));
    
    els.historyList.appendChild(step);
    els.historyList.scrollTop = els.historyList.scrollHeight;
  }

  // ── 13. INITIALIZE ──
  function init() {
    setupResizers();
    setupWorkspaces();
    setupPanelControls();
    renderTimelineTabs();
    renderTimelineClips();
    setupPlayheadScrubbing();
    setupSliders();
    setupMonitorScaling();
    setupToolbar();
    setupPlayback();
    setupDragDropEffects();
    setupProjectBin();
    setupExport();
    setupKeyboardControls();
    
    // Set initial active state
    openSequence('home');
    
    // Set initial tool and cursor
    document.body.classList.add('tool-select');
    sendIframeMessage({ type: 'apply-tool', tool: state.activeTool });
    addHistoryStep('Project loaded: JustHemang.prproj');

    // ── Block scroll/play until the site loader finishes ──────────────────
    // The site uses #loader which hides itself after the GSAP exit animation.
    // We poll for that + listen for a custom 'pr:loaderDone' event (fired below).
    function checkLoaderGone() {
      const loaderEl = document.getElementById('loader');
      // Loader is gone when display:none or it no longer exists
      if (!loaderEl || loaderEl.style.display === 'none' || getComputedStyle(loaderEl).display === 'none') {
        state.loaderReady = true;
        return;
      }
      requestAnimationFrame(checkLoaderGone);
    }
    // Also allow explicit signal from the page script
    window.addEventListener('pr:loaderDone', () => { state.loaderReady = true; });
    checkLoaderGone();
  }

  init();
})();
