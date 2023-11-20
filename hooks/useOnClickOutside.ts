import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';

export function useOnClickOutside(
  ref: RefObject<HTMLElement>,
  handler: (event: MouseEvent | TouchEvent) => void,
) {
  const latestHandler = useRef(handler);
  latestHandler.current = handler;

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = event.target as HTMLElement;
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(el)) {
        return;
      }

      latestHandler.current(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref]);
}
