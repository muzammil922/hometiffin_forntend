/**
 * Animates a cloned food image flying into the shopping cart icon in the navbar.
 * The animation has 3 stages (total 3 seconds):
 * - Stage 1 (0.5s): Rises and scales up from the start position.
 * - Stage 2 (2.0s): Hovers and drifts slowly.
 * - Stage 3 (0.5s): Zoom-flies and shrinks into the cart icon.
 * 
 * @param {Event} event - The click event that triggered the add action.
 * @param {string} imageUrl - The URL of the image to animate.
 * @param {Function} onComplete - Callback executed when the animation completes.
 */
export function flyToCart(event, imageUrl, onComplete) {
  const button = event?.currentTarget;
  if (!button) {
    if (onComplete) onComplete();
    return;
  }

  // Try to find an image in the nearest container (e.g. Card)
  const container = button.closest('.bg-white') || button.closest('div');
  let originalImg = null;
  if (container) {
    originalImg = container.querySelector('img');
  }

  // Calculate starting bounds
  let startRect = null;
  if (originalImg) {
    startRect = originalImg.getBoundingClientRect();
  } else {
    startRect = button.getBoundingClientRect();
  }

  // Create the clone image element
  const clone = document.createElement('img');
  clone.src = imageUrl || (originalImg ? originalImg.src : '/cutout_biryani.png');
  clone.style.position = 'fixed';
  clone.style.zIndex = '99999';
  clone.style.pointerEvents = 'none';
  clone.style.objectFit = 'contain';
  clone.style.borderRadius = '50%';
  clone.style.left = `${startRect.left}px`;
  clone.style.top = `${startRect.top}px`;
  clone.style.width = `${startRect.width}px`;
  clone.style.height = `${startRect.height}px`;
  clone.style.opacity = '1';
  document.body.appendChild(clone);

  // Floating coordinates: rise 80px up, drift 30% towards the center of the screen
  const screenWidth = window.innerWidth;
  const floatX = startRect.left + (screenWidth / 2 - startRect.left) * 0.25;
  const floatY = startRect.top - 85;

  // Locate the visible cart icon (desktop or mobile)
  const getTargetCart = () => {
    let target = document.getElementById('desktop-cart-icon');
    if (!target || target.getBoundingClientRect().width === 0) {
      target = document.getElementById('mobile-cart-icon');
    }
    return target;
  };

  // ────────────────────────────────────────────────────────
  // STAGE 1: Rise and scale up (0.5s)
  // ────────────────────────────────────────────────────────
  requestAnimationFrame(() => {
    clone.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
    clone.style.left = `${floatX}px`;
    clone.style.top = `${floatY}px`;
    clone.style.transform = 'scale(1.4) rotate(4deg)';
  });

  // ────────────────────────────────────────────────────────
  // STAGE 2: Hover and slow wobble drift (1.5s)
  // ────────────────────────────────────────────────────────
  let hoverTimeout = setTimeout(() => {
    // Add pulsing wobble and glow class
    clone.classList.add('animate-dish-float');
    
    // Slow drift transition for coordinates
    clone.style.transition = 'all 1.5s ease-in-out';
    clone.style.left = `${floatX + 15}px`;
    clone.style.top = `${floatY - 20}px`;
  }, 500);

  // ────────────────────────────────────────────────────────
  // STAGE 3: Fly to Cart and shrink (0.5s)
  // ────────────────────────────────────────────────────────
  let flyTimeout = setTimeout(() => {
    // Remove wobble class so final fast zoom works correctly
    clone.classList.remove('animate-dish-float');
    void clone.offsetWidth; // Force reflow

    const targetCart = getTargetCart();
    if (targetCart) {
      const targetRect = targetCart.getBoundingClientRect();
      clone.style.transition = 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
      clone.style.left = `${targetRect.left + targetRect.width / 2 - 15}px`;
      clone.style.top = `${targetRect.top + targetRect.height / 2 - 15}px`;
      clone.style.width = '30px';
      clone.style.height = '30px';
      clone.style.opacity = '0.15';
      clone.style.transform = 'scale(0.05) rotate(720deg)';
    }
  }, 2000);

  // ────────────────────────────────────────────────────────
  // COMPLETION & CLEANUP (at 2.5s)
  // ────────────────────────────────────────────────────────
  let doneTimeout = setTimeout(() => {
    if (clone.parentNode) {
      clone.parentNode.removeChild(clone);
    }

    const targetCart = getTargetCart();
    if (targetCart) {
      targetCart.classList.add('animate-cart-pop');
      setTimeout(() => {
        targetCart.classList.remove('animate-cart-pop');
      }, 500);
    }

    if (onComplete) onComplete();
  }, 2500);
}
