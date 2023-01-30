import * as _ from 'lodash-es';
import { useEffect, useRef, useState } from 'react';

export const useSubscribe = <V>(
  emitter: any,
  eventName: string | string[],
  mapValue: (arg?: any) => V = _.identity,
  runMapValueOnUpdate = false,
): V => {
  const [value, setValue] = useState(mapValue);
  const first = useRef(true);

  useEffect(() => {
    if (!first.current) setValue(mapValue());
    else first.current = false;

    const eventNames = _.flatten([eventName]);
    const cb = (next: V) => {
      setValue(runMapValueOnUpdate ? mapValue(next) : next);
    };
    for (const name of eventNames) emitter.on(name, cb);
    return () => {
      for (const name of eventNames) emitter.off(name, cb);
    };
  }, [emitter]);

  return value;
};
