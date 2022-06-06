import * as _ from 'lodash-es';
import { useEffect, useRef, useState } from 'react';

export const useSubscribe = <V>(
  emitter: any,
  eventName: string | string[],
  initValue?: (() => V) | V,
  mapValue?: (v: any) => V,
): V => {
  const [value, setValue] = useState(initValue);
  const first = useRef(true);

  useEffect(() => {
    if (!first.current)
      setValue(_.isFunction(initValue) ? initValue() : initValue);
    else first.current = false;

    const eventNames = _.flatten([eventName]);
    const cb = (next: V) => {
      setValue(mapValue ? mapValue(next) : next);
    };
    for (const name of eventNames) emitter.on(name, cb);
    return () => {
      for (const name of eventNames) emitter.off(name, cb);
    };
  }, [emitter]);

  return value;
};
