/**
 * animation.js
 * 
 * Sprite control and animation logic
 * 
 * Responsibilities:
 * - Manage layered sprite rendering (body, eyes, mouth)
 * - Switch mouth sprites based on phoneme categories
 * - Implement automatic eye blinking at natural intervals
 * - Handle sprite placeholder generation when assets are missing
 * - Provide manual sprite control for testing
 * - Manage sprite positioning and layering
 * - Apply smooth transitions between sprite states
 */

import { Sprite, Container, Graphics, Text, Texture } from 'pixi.js';

/**
 * Animation state
 */
let animationState = {
  mouthSprites: new Map(),
  eyeSprites: new Map(),
  bodySprite: null,
  currentMouthType: 'idle',
  currentEyeState: 'open',
  blinkTimer: 0,
  blinkDuration: 0.15, // seconds
  isBlinking: false,
  nextBlinkTime: Math.random() * 3 + 2, // 2-5 seconds
  timeSinceLastBlink: 0,
};

/**
 * Initialize animation system
 */
export async function initAnimation(layers) {
  // Create placeholder sprites for each mouth type
  const mouthTypes = ['idle', 'a', 'e', 'o', 'u', 'closed', 'm', 'f'];
  
  for (const type of mouthTypes) {
    const placeholder = createPlaceholderSprite(`mouth_${type}`, 200, 150);
    placeholder.position.set(640, 480);
    
    animationState.mouthSprites.set(type, {
      sprite: placeholder,
      loaded: false,
      assetUrl: null,
    });

    layers.mouth.addChild(placeholder);
  }

  // Create placeholder eye sprites
  const eyeStates = ['open', 'closed'];
  
  for (const state of eyeStates) {
    const placeholder = createPlaceholderSprite(`eye_${state}`, 100, 60);
    placeholder.position.set(630, 300);
    
    animationState.eyeSprites.set(state, {
      sprite: placeholder,
      loaded: false,
      assetUrl: null,
    });

    // Only show open eye initially
    if (state !== 'open') {
      placeholder.visible = false;
    }
    layers.eyes.addChild(placeholder);
  }

  // Create body placeholder
  const bodyPlaceholder = createPlaceholderSprite('body', 400, 600);
  bodyPlaceholder.position.set(640, 400);
  
  animationState.bodySprite = {
    sprite: bodyPlaceholder,
    loaded: false,
    assetUrl: null,
  };

  layers.body.addChild(bodyPlaceholder);

  return { success: true };
}

/**
 * Create a placeholder sprite for missing assets
 */
function createPlaceholderSprite(label, width, height) {
  const container = new Container();

  try {
    // Create background rectangle using Graphics
    const bg = new Graphics();
    
    // PixiJS v8 API - draw filled rectangle with border
    bg.rect(-width / 2, -height / 2, width, height);
    bg.fill(0x333333);
    bg.stroke({ width: 2, color: 0x666666 });
    
    // Position graphics at origin
    bg.position.set(0, 0);
    container.addChild(bg);
  } catch (e) {
    console.warn('Graphics rendering failed, using simple container:', e);
  }

  // Label text (PixiJS v8 API)
  const text = new Text({
    text: label,
    style: {
      fontFamily: 'Arial, monospace',
      fontSize: 14,
      fill: 0xaaaaaa,
      align: 'center',
    },
  });
  text.anchor.set(0.5, 0.5);
  text.position.set(0, 0);
  container.addChild(text);

  // Return container with proper positioning
  return container;
}

/**
 * Load and set sprite image from asset URL
 */
function loadSpriteImage(spriteData, assetUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      try {
        const texture = Texture.from(img);
        const newSprite = new Sprite(texture);
        newSprite.anchor.set(0.5, 0.5);
        newSprite.position.set(spriteData.sprite.position.x, spriteData.sprite.position.y);
        
        // Replace sprite in parent container
        const parent = spriteData.sprite.parent;
        if (parent) {
          const index = parent.children.indexOf(spriteData.sprite);
          if (index !== -1) {
            parent.removeChildAt(index);
            parent.addChildAt(newSprite, index);
          } else {
            parent.addChild(newSprite);
          }
        }
        
        spriteData.sprite = newSprite;
        spriteData.loaded = true;
        spriteData.assetUrl = assetUrl;
        
        resolve();
      } catch (error) {
        console.error('Error loading sprite image:', error);
        reject(error);
      }
    };

    img.onerror = () => {
      console.error('Failed to load image:', assetUrl);
      reject(new Error('Failed to load image: ' + assetUrl));
    };
    img.src = assetUrl;
  });
}

/**
 * Update mouth sprite based on phoneme category
 */
export function updateMouthSprite(mouthLayer, phonemeCategory) {
  if (!phonemeCategory || animationState.currentMouthType === phonemeCategory) {
    return;
  }

  const mouthData = animationState.mouthSprites.get(phonemeCategory);
  if (!mouthData) {
    console.warn(`Unknown mouth type: ${phonemeCategory}`);
    return;
  }

  // Hide all mouth sprites except current
  for (const [type, data] of animationState.mouthSprites) {
    data.sprite.visible = type === phonemeCategory;
  }

  animationState.currentMouthType = phonemeCategory;
}

/**
 * Update eye sprite with automatic blinking
 */
export function updateEyeSprite(eyeLayer) {
  // Update blink timer
  animationState.timeSinceLastBlink += 1 / 60; // Assuming 60 FPS

  if (animationState.isBlinking) {
    animationState.blinkTimer += 1 / 60;

    if (animationState.blinkTimer > animationState.blinkDuration) {
      // Blink finished
      animationState.isBlinking = false;
      animationState.blinkTimer = 0;
      animationState.nextBlinkTime = Math.random() * 3 + 2; // 2-5 seconds
      animationState.timeSinceLastBlink = 0;

      // Show open eye
      const openEye = animationState.eyeSprites.get('open');
      const closedEye = animationState.eyeSprites.get('closed');
      if (openEye && closedEye) {
        openEye.sprite.visible = true;
        closedEye.sprite.visible = false;
      }
    } else {
      // Blink is ongoing - show closed eye
      const openEye = animationState.eyeSprites.get('open');
      const closedEye = animationState.eyeSprites.get('closed');
      if (openEye && closedEye) {
        openEye.sprite.visible = false;
        closedEye.sprite.visible = true;
      }
    }
  } else if (animationState.timeSinceLastBlink >= animationState.nextBlinkTime) {
    // Trigger a natural blink
    animationState.isBlinking = true;
    animationState.blinkTimer = 0;
  }
}

/**
 * Manually set eye state (for testing)
 */
export function setEyeState(eyeLayer, state) {
  if (state !== 'open' && state !== 'closed') {
    console.warn(`Unknown eye state: ${state}`);
    return;
  }

  animationState.isBlinking = false;
  animationState.blinkTimer = 0;
  animationState.currentEyeState = state;

  const openEye = animationState.eyeSprites.get('open');
  const closedEye = animationState.eyeSprites.get('closed');

  if (openEye && closedEye) {
    openEye.sprite.visible = state === 'open';
    closedEye.sprite.visible = state === 'closed';
  }
}

/**
 * Manually trigger a blink (for testing)
 */
export function triggerBlink(eyeLayer) {
  animationState.isBlinking = true;
  animationState.blinkTimer = 0;
  animationState.timeSinceLastBlink = 0;
}

/**
 * Load asset image into sprite system
 */
export async function loadAssetSprite(assetType, assetUrl) {
  try {
    // Determine which sprite to load
    let spriteData = null;

    if (assetType.startsWith('mouth_')) {
      const mouthType = assetType.replace('mouth_', '');
      spriteData = animationState.mouthSprites.get(mouthType);
    } else if (assetType.startsWith('eye_')) {
      const eyeState = assetType.replace('eye_', '');
      spriteData = animationState.eyeSprites.get(eyeState);
    } else if (assetType === 'body') {
      spriteData = animationState.bodySprite;
    }

    if (!spriteData) {
      console.warn(`Unknown asset type: ${assetType}`);
      return;
    }

    await loadSpriteImage(spriteData, assetUrl);
    console.log(`✅ Loaded asset: ${assetType}`);
  } catch (error) {
    console.error(`Failed to load asset ${assetType}:`, error);
  }
}

/**
 * Get current animation state (for diagnostics)
 */
export function getAnimationState() {
  return {
    currentMouthType: animationState.currentMouthType,
    currentEyeState: animationState.currentEyeState,
    isBlinking: animationState.isBlinking,
    loadedMouth: Array.from(animationState.mouthSprites.entries())
      .filter(([, data]) => data.loaded)
      .map(([type]) => type),
    loadedEyes: Array.from(animationState.eyeSprites.entries())
      .filter(([, data]) => data.loaded)
      .map(([state]) => state),
    bodyLoaded: animationState.bodySprite.loaded,
  };
}
