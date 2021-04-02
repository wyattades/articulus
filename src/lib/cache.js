export class OfflineCache {
  constructor(name) {
    this.name = name;
    this.load();
  }

  data = null;

  load() {
    try {
      const json = localStorage.getItem(`fc:cache:${this.name}`);
      const data = json && JSON.parse(json);
      if (data && typeof data === 'object') this.data = data;
    } catch (_) {}

    return this.data;
  }
  save() {
    this.data.__saved_at = Date.now();

    localStorage.setItem(`fc:cache:${this.name}`, JSON.stringify(this.data));
  }

  async fetch(key, getValue, getFallback) {
    let val;
    try {
      val = await getValue();
    } catch (err) {
      if (err.message === 'Network request failed') {
        if (this.has(key)) return this.get(key);
        else val = await getFallback();
      }
    }

    this.set(key, val);
    return val;
  }

  get(key) {
    return this.data[key];
  }

  set(key, value) {
    this.data[key] = value;
    this.save();
  }

  has(key) {
    return key in this.data;
  }

  del(key) {
    delete this.data[key];
    this.save();
  }

  clear() {
    this.data = {};
    this.save();
  }
}
