import { useEffect, useCallback } from 'react';

const REFRESH_EVENT = 'reviewpulse:data-updated';

export function triggerRefresh() {
  window.dispatchEvent(new CustomEvent(REFRESH_EVENT));
}

export function useRefresh(callback: () => void) {
  const handler = useCallback(() => callback(), [callback]);
  
  useEffect(() => {
    window.addEventListener(REFRESH_EVENT, handler);
    return () => window.removeEventListener(REFRESH_EVENT, handler);
  }, [handler]);
}