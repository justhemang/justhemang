/**
 * premiere-loader.js
 * Automatically wraps the page in the Premiere Pro UI shell when visited directly,
 * and configures the page styling/interactions when loaded inside the Program Monitor iframe.
 */
(function() {
  const isInIframe = window.self !== window.top;

  if (!isInIframe) {
    // ── TOP-LEVEL WINDOW: Inject the Premiere Pro Shell ──
    document.addEventListener('DOMContentLoaded', () => {
      // 1. Save original HTML body content (if needed, but we will load via iframe to prevent scripts conflict)
      const currentURL = window.location.href;
      
      // 2. Clear head stylesheet conflicts and body
      document.body.innerHTML = '';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.overflow = 'hidden';
      document.body.style.backgroundColor = '#161616';
      
      // 3. Inject Premiere UI CSS
      const linkEl = document.createElement('link');
      linkEl.rel = 'stylesheet';
      
      // Compute relative path to CSS file
      const isSubPage = window.location.pathname.includes('/html/');
      const logoPath = isSubPage ? '../images/logo-transparent.png' : 'images/logo-transparent.png';
      const cssPath = isSubPage ? '../css/premiere-ui.css' : 'css/premiere-ui.css';
      const jsPath = isSubPage ? '../js/premiere-ui.js' : 'js/premiere-ui.js';
      
      linkEl.href = cssPath;
      document.head.appendChild(linkEl);

      // 4. Inject Google Font stylesheet (Adobe style fonts)
      if (!document.getElementById('editor-fonts')) {
        const fontLink = document.createElement('link');
        fontLink.id = 'editor-fonts';
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Adobe+Clean:wght@300;400;700&family=Inter:wght@300;400;500;700&family=Space+Mono&display=swap';
        document.head.appendChild(fontLink);
      }

      // 5. Create UI Shell Containers
      // Premiere Pro layout structure:
      // - Top Menubar (File, Edit, etc. & Workspaces)
      // - Main Workspace (Left Panels, Center Preview, Right meters)
      // - Bottom Workspace (Project Bin, Timeline Tracks)
      
      const shellHTML = `
        <div id="pr-editor">
          <!-- TOP MENUBAR -->
          <header id="pr-menubar">
            <div class="menu-left">
              <div class="pr-logo">Pr</div>
              <ul class="menu-items">
                <li class="menu-trigger">File
                  <ul class="dropdown">
                    <li onclick="alert('Creating new Premiere project: JustHemang.prproj')">New Project...</li>
                    <li onclick="alert('Project Saved!')">Save</li>
                    <li class="divider"></li>
                    <li onclick="location.reload()">Reset Workspace</li>
                    <li onclick="window.close()">Exit</li>
                  </ul>
                </li>
                <li class="menu-trigger">Edit
                  <ul class="dropdown">
                    <li>Undo</li>
                    <li>Redo</li>
                    <li class="divider"></li>
                    <li>Cut</li>
                    <li>Copy</li>
                    <li>Paste</li>
                  </ul>
                </li>
                <li class="menu-trigger">Sequence
                  <ul class="dropdown">
                    <li id="menu-render-in-out">Render In to Out</li>
                    <li>Render Effects in Work Area</li>
                    <li class="divider"></li>
                    <li id="menu-nested-seq">Create Nested Sequence...</li>
                  </ul>
                </li>
                <li class="menu-trigger">Window
                  <ul class="dropdown">
                    <li class="window-toggle active" data-panel="project-panel-wrapper">✓ Project Bin</li>
                    <li class="window-toggle active" data-panel="timeline-panel">✓ Timeline</li>
                    <li class="window-toggle active" data-panel="effect-controls-panel">✓ Effect Controls</li>
                    <li class="window-toggle active" data-panel="lumetri-panel">✓ Lumetri Color</li>
                    <li class="window-toggle active" data-panel="meters-panel">✓ Audio Meters</li>
                  </ul>
                </li>
                <li class="menu-trigger">Help
                  <ul class="dropdown">
                    <li onclick="alert('Just Hemang Premiere Pro Portfolio v1.0. Made for Hemang.')">About Editor</li>
                    <li>Keyboard Shortcuts</li>
                  </ul>
                </li>
              </ul>
            </div>
            
            <div class="menu-center">
              <div class="workspaces">
                <span class="ws-tab active" data-workspace="editing">Editing</span>
                <span class="ws-tab" data-workspace="color">Color</span>
                <span class="ws-tab" data-workspace="effects">Effects</span>
              </div>
            </div>

            <div class="menu-right">
              <button id="btn-export">Export</button>
              <div class="win-controls">
                <span>─</span>
                <span>❑</span>
                <span onclick="window.close()">✕</span>
              </div>
            </div>
          </header>

          <!-- MAIN WORKSPACE SPLIT -->
          <div id="pr-workspace">
            <div class="split-horizontal-top">
              
              <!-- LEFT DOCKS (Project Panel & Effect Controls & Lumetri) -->
              <div id="pr-left-dock" class="pane">
                <!-- TOP TAB GROUP -->
                <div class="tab-header-group">
                  <div class="pane-tab active" data-tab="effect-controls-panel">Effect Controls</div>
                  <div class="pane-tab" data-tab="lumetri-panel">Lumetri Color</div>
                  <div class="pane-maximize" title="Toggle Maximize">⛶</div>
                </div>
                
                <div class="tab-content-group">
                  <!-- EFFECT CONTROLS PANEL -->
                  <div id="effect-controls-panel" class="tab-pane active">
                    <div class="ec-section">
                      <div class="ec-header">Video Effects</div>
                      <div class="ec-property">
                        <span class="ec-prop-name">Position</span>
                        <div class="ec-prop-controls">
                          <label>X: </label>
                          <input type="range" id="ec-pos-x" min="0" max="200" value="100">
                          <span class="ec-value" id="val-pos-x">0px</span>
                        </div>
                        <div class="ec-prop-controls">
                          <label>Y: </label>
                          <input type="range" id="ec-pos-y" min="0" max="200" value="100">
                          <span class="ec-value" id="val-pos-y">0px</span>
                        </div>
                      </div>
                      <div class="ec-property">
                        <span class="ec-prop-name">Scale</span>
                        <div class="ec-prop-controls">
                          <input type="range" id="ec-scale" min="20" max="200" value="100">
                          <span class="ec-value" id="val-scale">100%</span>
                        </div>
                      </div>
                      <div class="ec-property">
                        <span class="ec-prop-name">Rotation</span>
                        <div class="ec-prop-controls">
                          <input type="range" id="ec-rotation" min="-180" max="180" value="0">
                          <span class="ec-value" id="val-rotation">0°</span>
                        </div>
                      </div>
                      <div class="ec-property">
                        <span class="ec-prop-name">Opacity</span>
                        <div class="ec-prop-controls">
                          <input type="range" id="ec-opacity" min="0" max="100" value="100">
                          <span class="ec-value" id="val-opacity">100%</span>
                        </div>
                      </div>
                      <button class="btn-ec-reset" id="btn-reset-motion">Reset Motion</button>
                    </div>
                  </div>
                  
                  <!-- LUMETRI COLOR PANEL -->
                  <div id="lumetri-panel" class="tab-pane">
                    <div class="lum-section">
                      <div class="ec-header">Basic Correction</div>
                      <div class="ec-property">
                        <span class="ec-prop-name">Exposure</span>
                        <input type="range" id="lum-exposure" min="-100" max="100" value="0">
                        <span class="ec-value" id="val-lum-exposure">0</span>
                      </div>
                      <div class="ec-property">
                        <span class="ec-prop-name">Contrast</span>
                        <input type="range" id="lum-contrast" min="-100" max="100" value="0">
                        <span class="ec-value" id="val-lum-contrast">0</span>
                      </div>
                      <div class="ec-property">
                        <span class="ec-prop-name">Saturation</span>
                        <input type="range" id="lum-saturation" min="0" max="200" value="100">
                        <span class="ec-value" id="val-lum-saturation">100</span>
                      </div>
                      <div class="ec-property">
                        <span class="ec-prop-name">Temperature</span>
                        <input type="range" id="lum-temperature" min="-100" max="100" value="0">
                        <span class="ec-value" id="val-lum-temperature">0</span>
                      </div>
                      <div class="ec-property">
                        <span class="ec-prop-name">Vignette</span>
                        <input type="range" id="lum-vignette" min="0" max="100" value="0">
                        <span class="ec-value" id="val-lum-vignette">0</span>
                      </div>
                      <button class="btn-ec-reset" id="btn-reset-lumetri">Reset Color</button>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- RESIZE SPLIT 1 -->
              <div class="resizer resizer-horizontal" id="resizer-left"></div>

              <!-- PROGRAM MONITOR (Center Preview Panel) -->
              <div id="pr-program-monitor" class="pane">
                <div class="tab-header-group">
                  <div class="pane-tab active" id="monitor-title">Program: Master_Sequence</div>
                  <div class="pane-maximize" title="Toggle Maximize">⛶</div>
                </div>
                
                <div class="monitor-player">
                  <div class="player-view">
                    <!-- Video Slate (visible when Master Sequence is active) -->
                    <div id="pr-monitor-slate" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; width: 100%; height: 100%; background-color: #0c0c0c; position: absolute; inset: 0; z-index: 5;">
                      <img src="${logoPath}" alt="JustHemang" style="width: 140px; height: 140px; object-fit: contain; filter: drop-shadow(0 0 20px rgba(94, 242, 255, 0.4));" id="slate-logo-img">
                      <div style="font-family:'Space Mono', monospace; font-size:10px; color:#555; text-align:center; line-height:1.6;">
                        <span style="color:#888; font-weight:bold;">PROJECT:</span> JustHemang.prproj <br>
                        <span style="color:#888; font-weight:bold;">SEQUENCE:</span> Master_Sequence <br>
                        <span style="color:#888; font-weight:bold;">TC START:</span> 00:00:00:00
                      </div>
                    </div>
                    
                    <!-- Website Iframe -->
                    <iframe id="pr-iframe" src="${currentURL}"></iframe>
                    <!-- Vignette Overlay -->
                    <div id="player-vignette"></div>
                    <!-- Rendering Glitch Overlay -->
                    <div id="player-glitch"></div>
                  </div>
                  
                  <!-- Player Controls -->
                  <div class="player-controls">
                    <div class="timecode-display">
                      <span id="player-timecode">00:00:00:00</span>
                    </div>
                    <div class="control-buttons">
                      <button id="btn-prev-frame" title="Step Back 1 Frame">◀</button>
                      <button id="btn-play" class="btn-play-pause" title="Play Sequence">▶</button>
                      <button id="btn-next-frame" title="Step Forward 1 Frame">▶</button>
                    </div>
                    <div class="resolution-control">
                      <select id="player-res">
                        <option value="1">Full</option>
                        <option value="0.5">1/2</option>
                        <option value="0.25">1/4</option>
                        <option value="0.125">1/8</option>
                      </select>
                      <select id="player-zoom">
                        <option value="fit">Fit</option>
                        <option value="0.5">50%</option>
                        <option value="0.75">75%</option>
                        <option value="1">100%</option>
                        <option value="1.5">150%</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- RESIZE SPLIT 2 -->
              <div class="resizer resizer-horizontal" id="resizer-right"></div>

              <!-- AUDIO METERS PANEL -->
              <div id="meters-panel" class="pane">
                <div class="meter-channel">
                  <div class="meter-bar-track">
                    <div class="meter-bar-fill" id="meter-fill-l"></div>
                  </div>
                  <span class="db-label">L</span>
                </div>
                <div class="meter-channel">
                  <div class="meter-bar-track">
                    <div class="meter-bar-fill" id="meter-fill-r"></div>
                  </div>
                  <span class="db-label">R</span>
                </div>
                <div class="db-ticks">
                  <span>0</span>
                  <span>-6</span>
                  <span>-12</span>
                  <span>-18</span>
                  <span>-24</span>
                  <span>-36</span>
                  <span>-48</span>
                </div>
              </div>
            </div>
            
            <!-- RESIZE SPLIT VERTICAL -->
            <div class="resizer resizer-vertical" id="resizer-vertical"></div>

            <div class="split-horizontal-bottom">
              
              <!-- BOTTOM LEFT DOCK: PROJECT BIN -->
              <div id="project-panel-wrapper" class="pane">
                <div class="tab-header-group">
                  <div class="pane-tab active" data-tab="project-bin">Project: Just_Hemang</div>
                  <div class="pane-tab" data-tab="effects-bin">Effects</div>
                  <div class="pane-tab" data-tab="history-bin">History</div>
                  <div class="pane-maximize" title="Toggle Maximize">⛶</div>
                </div>
                
                <div class="tab-content-group">
                  <!-- Project Bin Contents -->
                  <div id="project-bin" class="tab-pane active project-view">
                    <div class="bin-search">
                      <input type="text" placeholder="Find..." id="project-search">
                    </div>
                    <div class="project-assets">
                      <div class="asset-item sequence" data-seq="master" title="Double click to open">
                        <span class="asset-icon">SEQ</span>
                        <span class="asset-name">Master_Sequence</span>
                      </div>
                      <div class="asset-item sequence" data-seq="home" title="Double click to open">
                        <span class="asset-icon">SEQ</span>
                        <span class="asset-name">Home_Sequence (Nested)</span>
                      </div>
                      <div class="asset-item sequence" data-seq="work" title="Double click to open">
                        <span class="asset-icon">SEQ</span>
                        <span class="asset-name">Work_Sequence (Nested)</span>
                      </div>
                      <div class="asset-item sequence" data-seq="services" title="Double click to open">
                        <span class="asset-icon">SEQ</span>
                        <span class="asset-name">Services_Sequence (Nested)</span>
                      </div>
                      <div class="asset-item sequence" data-seq="contact" title="Double click to open">
                        <span class="asset-icon">SEQ</span>
                        <span class="asset-name">Contact_Sequence (Nested)</span>
                      </div>
                      
                      <div class="asset-folder">
                        <div class="folder-header">Bins / Footage</div>
                        <div class="folder-content">
                          <div class="asset-item video">
                            <span class="asset-icon">VID</span>
                            <span class="asset-name">Showreel_Background.mp4</span>
                          </div>
                          <div class="asset-item image">
                            <span class="asset-icon">IMG</span>
                            <span class="asset-name">logo-transparent.png</span>
                          </div>
                        </div>
                      </div>
                      
                      <div class="asset-folder">
                        <div class="folder-header">Audio</div>
                        <div class="folder-content">
                          <div class="asset-item audio" id="asset-ambient-music">
                            <span class="asset-icon">AUD</span>
                            <span class="asset-name">ambient-lofi-track.mp3</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Effects Bin Contents -->
                  <div id="effects-bin" class="tab-pane effects-view">
                    <div style="font-size: 8.5px; color: #666; margin-bottom: 8px; text-transform: uppercase;">Double-click or drag to timeline:</div>
                    <div class="effects-list">
                      <div class="effect-item-class" data-effect="blur" draggable="true">Blur (Fast Gaussian)</div>
                      <div class="effect-item-class" data-effect="glitch" draggable="true">Digital Glitch Distortion</div>
                      <div class="effect-item-class" data-effect="vhs" draggable="true">VHS Retro Look</div>
                      <div class="effect-item-class" data-effect="grayscale" draggable="true">Monochrome (Black & White)</div>
                      <div class="effect-item-class" data-effect="invert" draggable="true">Color Invert</div>
                    </div>
                    <button class="btn-ec-reset" id="btn-clear-effects" style="width: 100%; margin-top: 12px; font-weight: bold; border-color: #555;">Clear All Effects</button>
                  </div>
                  
                  <!-- History Bin Contents -->
                  <div id="history-bin" class="tab-pane history-view">
                    <div class="history-list" id="pr-history-list">
                      <div class="history-step active">Open Project</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- TIMELINE TOOLBAR (Vertical Middle strip) -->
              <div id="pr-toolbar">
                <button class="tool-btn active" id="tool-select" title="Selection Tool (V)">V</button>
                <button class="tool-btn" id="tool-razor" title="Razor Tool (C)">C</button>
                <button class="tool-btn" id="tool-hand" title="Hand Tool (H)">H</button>
                <button class="tool-btn" id="tool-type" title="Type Tool (T)">T</button>
              </div>

              <!-- TIMELINE PANEL -->
              <div id="timeline-panel" class="pane">
                <!-- Timeline Tabs (Master Sequence & Open Sequences) -->
                <div class="tab-header-group">
                  <div class="timeline-tabs" id="pr-timeline-tabs">
                    <div class="timeline-tab active" data-sequence="master">Master_Sequence</div>
                  </div>
                  <div class="pane-maximize" title="Toggle Maximize">⛶</div>
                </div>
                
                <!-- Timeline Workspace Area -->
                <div class="timeline-area">
                  <!-- Time Ruler -->
                  <div class="timeline-ruler-container">
                    <div class="timeline-ruler" id="timeline-ruler">
                      <!-- Rendered dynamically -->
                    </div>
                    <!-- Time Scrubber Playhead -->
                    <div class="timeline-playhead" id="timeline-playhead">
                      <div class="playhead-handle"></div>
                      <div class="playhead-line"></div>
                    </div>
                  </div>
                  
                  <!-- Tracks Container -->
                  <div class="timeline-tracks">
                    <!-- VIDEO TRACK V1 -->
                    <div class="track-row video-track">
                      <div class="track-header">
                        <span>V1</span>
                        <div class="track-toggle">V</div>
                      </div>
                      <div class="track-timeline" id="video-track-clips">
                        <!-- Clips loaded dynamically based on active sequence -->
                      </div>
                    </div>
                    
                    <!-- AUDIO TRACK A1 -->
                    <div class="track-row audio-track">
                      <div class="track-header">
                        <span>A1</span>
                        <div class="track-toggle">
                          <span class="mute-btn" id="mute-track">M</span>
                          <span class="solo-btn" id="solo-track">S</span>
                        </div>
                      </div>
                      <div class="track-timeline" id="audio-track-clips">
                        <!-- Clips loaded dynamically -->
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
        
        <!-- CREATIVE EXPORT MODE OVERLAY -->
        <div id="pr-export-overlay">
          <button class="btn-export-close" id="btn-export-close-x">✕</button>
          
          <div class="export-left">
            <h2 style="font-size:18px;font-weight:700;color:var(--text-active);margin-bottom:20px;text-transform:uppercase;letter-spacing:0.08em;font-family:'Inter',sans-serif;">Export Preview</h2>
            <div class="export-preview-box">
              <iframe id="export-iframe" src="${currentURL}"></iframe>
            </div>
            <div class="export-preview-playhead">
              <div class="export-preview-playhead-fill"></div>
            </div>
            <p style="margin-top:16px;font-family:'Space Mono',monospace;font-size:10px;color:#666;">Render Status: High Quality Pre-Visualization Active</p>
          </div>
          
          <div class="export-right">
            <div>
              <div class="export-right-title">Export Settings</div>
              
              <div class="export-group">
                <label>Format</label>
                <select id="export-format">
                  <option value="freelance">Freelance Contract / Project Invite</option>
                  <option value="fulltime">Full-Time Developer & Designer Hire</option>
                  <option value="collab">Creative Collaboration</option>
                </select>
              </div>
              
              <div class="export-group">
                <label>Preset</label>
                <select id="export-preset">
                  <option value="high">Hemang Luthra (Premium Quality)</option>
                  <option value="fast">Quick Delivery (Turnaround &lt; 3 Days)</option>
                  <option value="custom">Custom Brief Selection</option>
                </select>
              </div>
              
              <div class="export-group">
                <label>Output Name</label>
                <input type="text" id="export-name" value="Hemang_Luthra_Portfolio_Project.zip">
              </div>

              <div class="export-group" style="margin-bottom:24px;">
                <label>Destination Location</label>
                <input type="text" id="export-dest" value="Contact / Inquiry Box" disabled>
              </div>
              
              <div class="export-contact-details">
                <h3>Project Contact Parameters</h3>
                <div class="export-contact-item">
                  <span class="label">Email:</span>
                  <a href="mailto:hemanluthra6@gmail.com" class="value">hemanluthra6@gmail.com</a>
                </div>
                <div class="export-contact-item">
                  <span class="label">LinkedIn:</span>
                  <a href="https://www.linkedin.com/in/hemang-luthra" target="_blank" class="value">linkedin.com/in/hemang-luthra</a>
                </div>
                <div class="export-contact-item">
                  <span class="label">YouTube:</span>
                  <a href="https://www.youtube.com/@JustHemang" target="_blank" class="value">youtube.com/@JustHemang</a>
                </div>
                <div class="export-contact-item">
                  <span class="label">Instagram:</span>
                  <a href="https://www.instagram.com/justhemang6/" target="_blank" class="value">@justhemang6</a>
                </div>
              </div>
            </div>
            
            <div>
              <p style="font-size:9.5px;color:#777;line-height:1.4;margin-bottom:12px;">Clicking EXPORT sends a signal to generate a direct inquiry email containing your parameters. Let's build something awesome together!</p>
              <div class="export-footer">
                <button class="btn-export-cancel" id="btn-export-cancel">Cancel</button>
                <button class="btn-export-action" id="btn-export-send">Export (Hire)</button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Audio Elements -->
        <audio id="ambient-audio" loop src="https://assets.mixkit.co/music/preview/mixkit-dreaming-big-31.mp3"></audio>
        <audio id="slice-audio" src="https://assets.mixkit.co/sfx/preview/mixkit-saber-slash-shwip-2234.mp3"></audio>
      `;

      document.body.innerHTML = shellHTML;

      // 6. Inject Premiere UI JS Script
      const scriptEl = document.createElement('script');
      scriptEl.src = jsPath;
      document.body.appendChild(scriptEl);
    });
  } else {
    // ── IFRAME WINDOW: Configure local page inside editor ──
    document.addEventListener('DOMContentLoaded', () => {
      // 1. Inject styling rules to hide navbar, margins, and custom cursors
      const iframeStyle = document.createElement('style');
      iframeStyle.id = 'iframe-editor-style';
      iframeStyle.textContent = `
        /* Scale down entire page to fit inside editor preview */
        html {
          zoom: 0.7;
        }
        /* Hide default scrollbars */
        html, body {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        html::-webkit-scrollbar, body::-webkit-scrollbar {
          display: none !important;
        }
        /* Hide scroll indicator and mouse shape */
        #scroll-indicator, .scroll-indicator {
          display: none !important;
        }
        /* Hide navbar sidebar */
        #main-nav, nav, .fixed.left-0.top-0 { 
          display: none !important; 
        }
        /* Reset content alignment/margins */
        #main-content, main, .pl-16, .pl-20 { 
          margin-left: 0 !important; 
          padding-left: 0 !important; 
        }
        /* Disable page's own custom cursor dots so they don't clash */
        .ct-dot { 
          display: none !important; 
        }
        /* Interactive Tool Cursor Bindings */
        body.tool-select, body.tool-select * {
          cursor: default !important;
        }
        body.tool-select a, body.tool-select button, body.tool-select [role="button"], body.tool-select .skill-card, body.tool-select .laptop {
          cursor: pointer !important;
        }
        
        body.tool-hand, body.tool-hand * {
          cursor: grab !important;
          user-select: none !important;
        }
        body.tool-hand.dragging, body.tool-hand.dragging * {
          cursor: grabbing !important;
        }
        
        body.tool-razor, body.tool-razor * {
          cursor: cell !important;
        }
        
        body.tool-type, body.tool-type * {
          cursor: text !important;
        }
        
        body.tool-type [data-editable="true"] {
          outline: 1px dashed #1473e6 !important;
          background: rgba(20, 115, 230, 0.05) !important;
        }
        
        /* Effect Transition overlay */
        .pr-effect-glitch-body {
          animation: glitch-anim 0.3s steps(2) infinite;
        }
        @keyframes glitch-anim {
          0% { filter: hue-rotate(0deg) skew(0deg) contrast(1); }
          50% { filter: hue-rotate(180deg) skew(5deg) contrast(1.5); }
          100% { filter: hue-rotate(360deg) skew(-5deg) contrast(1); }
        }
      `;
      document.head.appendChild(iframeStyle);
      
      // Set default cursor class
      document.body.classList.add('tool-select');
      
      // Mark elements for Type Tool editing
      document.querySelectorAll('h1, h2, h3, p, span, strong').forEach(el => {
        if (el.children.length === 0 && el.textContent.trim().length > 0) {
          el.setAttribute('data-editable', 'true');
        }
      });
      
      // 2. Setup Scroll Communication
      window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const percent = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
        
        window.parent.postMessage({
          type: 'iframe-scroll',
          percent: percent,
          scrollTop: scrollTop,
          scrollHeight: scrollHeight
        }, '*');
      });

      // 2.5 Relate keyboard controls to parent
      window.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          if (e.key === ' ') {
            e.preventDefault();
          }
          window.parent.postMessage({
            type: 'iframe-keydown',
            key: e.key
          }, '*');
        }
      });

      // 3. Setup Navigation Notification
      const isSubPage = window.location.pathname.includes('/html/');
      const pageName = isSubPage 
        ? (window.location.pathname.includes('page_2') ? 'Work' : (window.location.pathname.includes('page_3') ? 'Services' : 'Contact'))
        : 'Home';

      window.parent.postMessage({
        type: 'iframe-loaded',
        page: pageName,
        url: window.location.pathname
      }, '*');

      // 4. Listen for commands from parent
      window.addEventListener('message', (e) => {
        const data = e.data;
        if (!data || typeof data !== 'object') return;
        
        if (data.type === 'scroll-to') {
          // Smooth lerp scroll — interpolate toward target Y position
          const targetY = data.percent * (document.documentElement.scrollHeight - window.innerHeight);
          
          // Cancel any in-flight smooth scroll
          if (window._lerpScrollRaf) cancelAnimationFrame(window._lerpScrollRaf);
          
          const startY = window.scrollY;
          const distance = targetY - startY;
          const duration = 600; // ms
          const startTime = performance.now();
          
          function lerpScroll(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3);
            window.scrollTo(0, startY + distance * ease);
            if (progress < 1) {
              window._lerpScrollRaf = requestAnimationFrame(lerpScroll);
            }
          }
          window._lerpScrollRaf = requestAnimationFrame(lerpScroll);
        } else if (data.type === 'apply-transform') {
          // Apply motion transformations (Position, Scale, Rotation, Opacity)
          const body = document.body;
          const tx = (data.posX - 100) * 5; // offset X
          const ty = (data.posY - 100) * 5; // offset Y
          const scale = data.scale / 100;
          const rotation = data.rotation;
          const opacity = data.opacity / 100;
          
          body.style.transformOrigin = 'center top';
          body.style.transform = `translate(${tx}px, ${ty}px) scale(${scale}) rotate(${rotation}deg)`;
          body.style.opacity = opacity;
          body.style.transition = 'none';
        } else if (data.type === 'apply-filter') {
          // Apply Lumetri adjustments (brightness, contrast, saturate, temperature, sepia)
          const exposure = 1 + (data.exposure / 100); // 0 to 2
          const contrast = 1 + (data.contrast / 100); // 0 to 2
          const saturation = data.saturation / 100; // 0 to 2
          const temp = data.temperature; // sepia tinting
          
          let filterVal = `brightness(${exposure}) contrast(${contrast}) saturate(${saturation})`;
          if (temp > 0) {
            filterVal += ` sepia(${temp / 100})`;
          } else if (temp < 0) {
            // Cold temperature - hue shift / saturate blue
            filterVal += ` hue-rotate(${temp * 0.3}deg)`;
          }
          
          document.body.style.filter = filterVal;
          
          // Vignette effect overlay inside iframe
          let vign = document.getElementById('iframe-vignette-overlay');
          if (!vign) {
            vign = document.createElement('div');
            vign.id = 'iframe-vignette-overlay';
            vign.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:999999;box-shadow:inset 0 0 100px rgba(0,0,0,0) transition:box-shadow 0.1s;';
            document.body.appendChild(vign);
          }
          vign.style.boxShadow = `inset 0 0 ${data.vignette * 2.5}px rgba(0,0,0,${data.vignette / 100 * 0.85})`;
        } else if (data.type === 'apply-tool') {
          // Toggle Toolbar states inside iframe (do not wipe native classes)
          document.body.classList.remove('tool-select', 'tool-razor', 'tool-hand', 'tool-type');
          document.body.classList.add(`tool-${data.tool}`);
          
          if (data.tool === 'hand') {
            setupHandDragging();
          } else {
            removeHandDragging();
          }
        } else if (data.type === 'trigger-glitch') {
          // Trigger razor glitch effect
          document.body.classList.add('pr-effect-glitch-body');
          setTimeout(() => {
            document.body.classList.remove('pr-effect-glitch-body');
          }, 400);
        } else if (data.type === 'set-editable-text') {
          // Make text clickable and editable
          if (data.editable) {
            enableTextEdits();
          } else {
            disableTextEdits();
          }
        }
      });
      
      // Hand Tool Drag Scroll Helper
      let isDragging = false;
      let startY = 0;
      let startScrollTop = 0;
      
      function onMouseDown(e) {
        if (!document.body.classList.contains('tool-hand')) return;
        isDragging = true;
        document.body.classList.add('dragging');
        startY = e.clientY;
        startScrollTop = window.scrollY;
      }
      
      function onMouseMove(e) {
        if (!isDragging) return;
        const dy = e.clientY - startY;
        window.scrollTo(0, startScrollTop - dy);
      }
      
      function onMouseUp() {
        isDragging = false;
        document.body.classList.remove('dragging');
      }
      
      function setupHandDragging() {
        window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      }
      
      function removeHandDragging() {
        window.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      }
      
      // Text Editing Helper
      function enableTextEdits() {
        document.querySelectorAll('[data-editable="true"]').forEach(el => {
          el.contentEditable = 'true';
          el.addEventListener('blur', handleTextBlur);
        });
      }
      
      function disableTextEdits() {
        document.querySelectorAll('[data-editable="true"]').forEach(el => {
          el.removeAttribute('contenteditable');
          el.removeEventListener('blur', handleTextBlur);
        });
      }
      
      function handleTextBlur(e) {
        window.parent.postMessage({
          type: 'text-edited',
          text: e.target.textContent
        }, '*');
      }
    });
  }
})();
