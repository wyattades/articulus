import * as _ from 'lodash-es';
import { useEffect, useState } from 'react';

export const useSubscribe = <V>(
  emitter: any,
  eventName: string | string[],
  initValue?: (() => V) | V,
  mapValue?: (v: any) => V,
): V => {
  const [value, setValue] = useState(initValue);

  useEffect(() => {
    const eventNames = _.flatten([eventName]);
    const cb = (next: V) => {
      setValue(mapValue ? mapValue(next) : next);
    };
    for (const name of eventNames) emitter.on(name, cb);
    return () => {
      for (const name of eventNames) emitter.off(name, cb);
    };
  }, []);

  return value;
};
