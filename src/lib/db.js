import { Subject } from './async';

const addExtras = (q) => {
  q.FindOrCreate = (collection, id, data) => {
    if (id != null)
      return q.Let(
        { data },
        q.If(
          q.Exists(q.Ref(q.Collection(collection), id)),
          q.Update(q.Ref(q.Collection(collection), id), {
            data: q.Var('data'),
          }),
          q.Create(q.Collection(collection), { data: q.Var('data') }),
        ),
      );
    else return q.Create(q.Collection(collection), { data });
  };

  return q;
};

export default class DB {
  /** @returns {DB} */
  static getGlobalInstance() {
    if (!this.globalInstance) this.globalInstance = new DB();

    return this.globalInstance;
  }

  initter = null;

  /** @type {typeof import('faunadb').query} */
  q;

  onLoadQ(cb) {
    if (this.q) cb(this.q);
    else this._onLoadQ = cb;
  }

  /** @type {import('faunadb').Client['query']} **/
  async query(expr, options) {
    try {
      return this.client.query(expr, options);
    } catch (err) {
      console.error('failed query', err);
      throw err;
    }
  }

  onOffline = (v) => console.log('offline', v);

  async init() {
    if (this.initter) return this.initter.toPromise();
    this.initter = new Subject();

    this.fauna = await import('faunadb');

    this.q = addExtras(this.fauna.query);
    this._onLoadQ?.(this.q);

    this.client = new this.fauna.Client({
      secret: process.env.FAUNA_CLIENT_KEY,
    });

    try {
      await this.client.ping();
    } catch (err) {
      if (err.message === 'Network request failed') {
        this.offline = true;
      } else throw err;
    }

    window.addEventListener('offline', this.onOffline);

    this.initter.complete();
  }
}
