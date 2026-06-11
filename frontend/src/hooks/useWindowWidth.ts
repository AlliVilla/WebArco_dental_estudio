import { useState, useEffect } from "react";

export function useWindowWidth(debounceMs = 100): number {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const fn = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setWidth(window.innerWidth), debounceMs);
    };
    window.addEventListener("resize", fn);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", fn);
    };
  }, [debounceMs]);

  return width;
}

// Breakpoints unificados — un solo lugar para cambiarlos
export const BREAKPOINTS = {
  mobile: 768, // <= 768 es móvil
  tablet: 1024, // <= 1024 es tablet
} as const;

export function useResponsive() {
  const w = useWindowWidth();
  return {
    isMobile: w <= BREAKPOINTS.mobile,
    isTablet: w > BREAKPOINTS.mobile && w <= BREAKPOINTS.tablet,
    isDesktop: w > BREAKPOINTS.tablet,
    width: w,
  };
}
