export class LocalDataSaver<T extends { [k in string]?: unknown }> {
  constructor(readonly storageKey: string) {}

  _data?: Partial<T>;
  get data() {
    return (this._data ||= this.load());
  }

  load(): Partial<T> {
    try {
      const str = localStorage.getItem(this.storageKey);
      const obj = str && (JSON.parse(str) as Record<string, unknown> | null);
      if (obj && typeof obj === 'object' && !Array.isArray(obj))
        return obj as Partial<T>;
    } catch (err) {
      console.error('LocalDataSaver.load', err);
    }
    return {};
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (err) {
      console.error('LocalDataSaver.save', err);
    }
  }

  get<K extends keyof T>(key: K): T[K] | undefined {
    return this.data[key];
  }

  set<K extends keyof T>(key: K, value: T[K]) {
    this.data[key] = value;
    this.save();
  }
}
