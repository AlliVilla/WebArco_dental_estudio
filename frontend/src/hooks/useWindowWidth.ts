import { useSyncExternalStore } from "react";

const MOBILE_BP = 768;
const TABLET_BP = 1024;

export const BREAKPOINTS = {
  mobile: MOBILE_BP,
  tablet: TABLET_BP,
} as const;

// useSyncExternalStore: API oficial de React para suscribirse a window.
// getSnapshot lee window.innerWidth fresco cada vez → nunca queda desactualizado,
// inmune a problemas de montaje/desmontaje al navegar entre pantallas.

function subscribe(callback: () => void): () => void {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

function getSnapshot(): number {
  return window.innerWidth;
}

function getServerSnapshot(): number {
  return 1280;
}

export function useWindowWidth(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useResponsive() {
  const w = useWindowWidth();
  return {
    isMobile: w <= MOBILE_BP,
    isTablet: w > MOBILE_BP && w <= TABLET_BP,
    isDesktop: w > TABLET_BP,
    width: w,
  };
}
