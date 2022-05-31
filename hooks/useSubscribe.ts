import { useEffect, useState } from 'react';

export const useSubscribe = <V>(
  emitter: any,
  eventName: string,
  initValue?: (() => V) | V,
  mapValue?: (v: any) => V,
): V => {
  const [value, setValue] = useState(initValue);

  useEffect(() => {
    const cb = (next: V) => {
      setValue(mapValue ? mapValue(next) : next);
    };
    emitter.on(eventName, cb);
    return () => {
      emitter.off(eventName, cb);
    };
  }, []);

  return value;
};
