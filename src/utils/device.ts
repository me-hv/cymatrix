/**
 * Utility to detect if the user is on a mobile device or tablet.
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // 1. Check user agent
  const userAgentCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  
  // 2. Check touch support and screen size
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth < 768;
  
  return userAgentCheck || (hasTouch && isSmallScreen);
};
