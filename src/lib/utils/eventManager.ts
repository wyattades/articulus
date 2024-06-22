/* eslint-disable @typescript-eslint/no-explicit-any */

type Emitter = any;

export class EventManager {
  events: {
    off: string;
    eventName: string;
    eventEmitter: Emitter;
    cb: (...args: any[]) => any;
  }[] = [];

  on(eventEmitter: Emitter, eventName: string, cb: (...args: any[]) => any) {
    const [on, off] =
      'on' in eventEmitter
        ? ['on', 'off']
        : 'addListener' in eventEmitter
          ? ['addListener', 'removeListener']
          : ['addEventListener', 'removeEventListener'];

    eventEmitter[on](eventName, cb);
    this.events.push({ off, eventName, eventEmitter, cb });

    return this;
  }

  off(
    eventEmitter?: Emitter,
    eventName?: string,
    cb?: (...args: any[]) => any,
  ) {
    this.events = this.events.filter((e) => {
      if (cb) {
        if (
          cb !== e.cb ||
          eventName !== e.eventName ||
          eventEmitter !== e.eventEmitter
        )
          return true;
      } else if (eventName) {
        if (eventName !== e.eventName || eventEmitter !== e.eventEmitter)
          return true;
      } else if (eventEmitter) {
        if (eventEmitter !== e.eventEmitter) return true;
      }

      e.eventEmitter[e.off](e.eventName, e.cb);
      return false;
    });

    return this;
  }
}
