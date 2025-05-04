import { useState, useEffect } from 'react';

/**
 * Custom hook for detecting if a media query matches.
 * Useful for responsive design logic in components.
 * 
 * @param query The media query to match
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with the match state
  const [matches, setMatches] = useState<boolean>(() => {
    // Check if window is available (for SSR compatibility)
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Create media query list
    const mediaQueryList = window.matchMedia(query);
    
    // Define the listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add the listener to the media query list
    // Using the deprecated addListener first for older browsers
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', listener);
    } else {
      // @ts-ignore - For older browsers
      mediaQueryList.addListener(listener);
    }

    // Initial check
    setMatches(mediaQueryList.matches);

    // Clean up
    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', listener);
      } else {
        // @ts-ignore - For older browsers
        mediaQueryList.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
} 