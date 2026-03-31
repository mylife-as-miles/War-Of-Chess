export function createSplashScreen(onComplete) {
  // Inject Google Fonts for the premium look
  const fontLink = document.createElement('link');
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;800;900&family=Montserrat:wght@200;300;400&display=swap';
  fontLink.rel = 'stylesheet';
  document.head.appendChild(fontLink);

  const style = document.createElement('style');
  style.textContent = `
    #splash-screen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: radial-gradient(circle at center, rgba(20, 15, 25, 0.75) 0%, rgba(5, 5, 8, 0.98) 100%);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: #fff;
      font-family: 'Cinzel', serif;
      transition: opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1), visibility 1.5s;
      overflow: hidden;
      box-shadow: inset 0 0 150px rgba(0,0,0,0.9);
    }

    /* Cinematic slow zoom on the background */
    #splash-bg-fx {
      position: absolute;
      top: -5%; left: -5%;
      width: 110%; height: 110%;
      background: 
        linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.8) 100%),
        radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%);
      pointer-events: none;
      z-index: 1;
      animation: slowZoom 20s linear infinite alternate;
    }

    @keyframes slowZoom {
      0% { transform: scale(1); }
      100% { transform: scale(1.05); }
    }

    /* Floating embers in CSS */
    .splash-ember {
      position: absolute;
      border-radius: 50%;
      background: #ffaa55;
      box-shadow: 0 0 12px #ff4400, 0 0 24px #ff2200;
      opacity: 0;
      animation: floatEmber linear infinite;
      pointer-events: none;
      z-index: 2;
    }

    @keyframes floatEmber {
      0% { transform: translateY(100vh) translateX(0) scale(0.5); opacity: 0; }
      20% { opacity: 0.8; }
      80% { opacity: 0.6; }
      100% { transform: translateY(-10vh) translateX(50px) scale(1.2); opacity: 0; }
    }

    .splash-content {
      text-align: center;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }

    .splash-title-container {
      position: relative;
      margin-bottom: 1rem;
    }

    .splash-title {
      font-size: clamp(3.5rem, 10vw, 8rem);
      font-weight: 900;
      letter-spacing: 0.12em;
      margin: 0;
      text-transform: uppercase;
      background: linear-gradient(180deg, #ffffff 0%, #f0d080 30%, #b8860b 70%, #5c4000 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 10px 15px rgba(0,0,0,0.8));
      opacity: 0;
      transform: scale(0.9) translateY(20px);
      animation: titleReveal 2.5s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s forwards;
      position: relative;
    }

    .splash-title::after {
      content: 'War Of Chess';
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-size: 200% auto;
      animation: shine 4s linear infinite;
      opacity: 0.5;
    }

    @keyframes shine {
      to { background-position: 200% center; }
    }

    @keyframes titleReveal {
      0% { opacity: 0; transform: scale(0.9) translateY(30px); filter: blur(10px); }
      100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0px); }
    }

    .splash-divider {
      width: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, rgba(212, 160, 32, 0.8), #fff, rgba(212, 160, 32, 0.8), transparent);
      margin: 1.5rem 0;
      box-shadow: 0 0 10px rgba(212, 160, 32, 0.5);
      animation: expandDivider 2s cubic-bezier(0.4, 0, 0.2, 1) 1.2s forwards;
    }

    @keyframes expandDivider {
      0% { width: 0; opacity: 0; }
      100% { width: 80%; opacity: 1; }
    }

    .splash-subtitle {
      font-family: 'Montserrat', sans-serif;
      font-weight: 300;
      font-size: clamp(0.9rem, 2vw, 1.4rem);
      letter-spacing: 0.5em;
      color: #d4c4b4;
      text-transform: uppercase;
      opacity: 0;
      transform: translateY(-10px);
      animation: subtitleFadeIn 2s cubic-bezier(0.2, 0.8, 0.2, 1) 1.8s forwards;
      text-shadow: 0 2px 4px rgba(0,0,0,0.8);
    }

    @keyframes subtitleFadeIn {
      0% { opacity: 0; transform: translateY(-10px); letter-spacing: 0.3em; }
      100% { opacity: 1; transform: translateY(0); letter-spacing: 0.5em; }
    }

    .splash-button-wrapper {
      margin-top: 5rem;
      opacity: 0;
      animation: buttonReveal 2s cubic-bezier(0.2, 0.8, 0.2, 1) 2.5s forwards;
    }

    @keyframes buttonReveal {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }

    .splash-button {
      background: rgba(15, 10, 15, 0.7);
      border: 1px solid rgba(212, 160, 32, 0.5);
      color: #f0d080;
      font-family: 'Cinzel', serif;
      font-size: 1.1rem;
      font-weight: 600;
      letter-spacing: 0.15em;
      padding: 1.2rem 3.5rem;
      cursor: pointer;
      text-transform: uppercase;
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      position: relative;
      overflow: hidden;
      box-shadow: 0 0 20px rgba(0,0,0,0.8), inset 0 0 0 rgba(212, 160, 32, 0);
      backdrop-filter: blur(4px);
    }

    .splash-button::before {
      content: '';
      position: absolute;
      top: 0; left: -100%;
      width: 50%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transform: skewX(-25deg);
      transition: 0.5s;
    }

    .splash-button::after {
      content: '';
      position: absolute;
      top: -1px; left: -1px; right: -1px; bottom: -1px;
      border: 1px solid rgba(255, 255, 255, 0.5);
      opacity: 0;
      transition: 0.4s;
    }

    .splash-button:hover {
      background: rgba(40, 25, 15, 0.8);
      border-color: #d4a020;
      color: #fff;
      box-shadow: 0 0 30px rgba(212, 160, 32, 0.4), inset 0 0 15px rgba(212, 160, 32, 0.2);
      text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
      transform: scale(1.03);
    }

    .splash-button:hover::before {
      left: 200%;
      transition: 0.7s ease-in-out;
    }

    .splash-button:hover::after {
      opacity: 1;
      transform: scale(1.02);
    }

    .splash-button:active {
      transform: scale(0.98);
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = 'splash-screen';

  const bgFx = document.createElement('div');
  bgFx.id = 'splash-bg-fx';
  overlay.appendChild(bgFx);

  // Add CSS embers
  for (let i = 0; i < 40; i++) {
    const ember = document.createElement('div');
    ember.className = 'splash-ember';
    
    const size = Math.random() * 3 + 1.5;
    const left = Math.random() * 100;
    const duration = Math.random() * 5 + 4;
    const delay = Math.random() * 5;
    
    ember.style.width = `${size}px`;
    ember.style.height = `${size}px`;
    ember.style.left = `${left}vw`;
    ember.style.animationDuration = `${duration}s`;
    ember.style.animationDelay = `${delay}s`;
    
    if (Math.random() > 0.6) {
      ember.style.background = '#ff2200';
      ember.style.boxShadow = '0 0 8px #aa0000, 0 0 16px #ff0000';
    } else if (Math.random() > 0.8) {
      ember.style.background = '#d4a020';
      ember.style.boxShadow = '0 0 8px #8b5a00, 0 0 16px #d4a020';
    }

    overlay.appendChild(ember);
  }

  const content = document.createElement('div');
  content.className = 'splash-content';

  const titleContainer = document.createElement('div');
  titleContainer.className = 'splash-title-container';

  const title = document.createElement('h1');
  title.className = 'splash-title';
  title.textContent = 'War Of Chess';
  titleContainer.appendChild(title);

  const divider = document.createElement('div');
  divider.className = 'splash-divider';

  const subtitle = document.createElement('div');
  subtitle.className = 'splash-subtitle';
  subtitle.textContent = 'Two Kingdoms. One Throne.';

  const buttonWrapper = document.createElement('div');
  buttonWrapper.className = 'splash-button-wrapper';
  
  const button = document.createElement('button');
  button.className = 'splash-button';
  button.textContent = 'Enter Battlefield';

  button.addEventListener('click', () => {
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    overlay.style.transform = 'scale(1.1)';
    setTimeout(() => {
      overlay.remove();
      if (onComplete) onComplete();
    }, 1500);
  });

  buttonWrapper.appendChild(button);

  content.appendChild(titleContainer);
  content.appendChild(divider);
  content.appendChild(subtitle);
  content.appendChild(buttonWrapper);
  overlay.appendChild(content);

  document.body.appendChild(overlay);
}
