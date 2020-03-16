require('dotenv').config();
const fauna = require('faunadb');
const q = fauna.query;

const client = new fauna.Client({
  secret: process.env.FAUNA_ADMIN_KEY,
});

const atomic = (type, params) =>
  q.If(q.Not(q.Exists(q[type](params.name))), q[`Create${type}`](params), null);

const run = async () => {
  await client.query(
    q.Do(
      atomic('Collection', { name: 'maps' }),
      atomic('Index', {
        name: 'maps_by_user_id',
        source: q.Collection('maps'),
        terms: [{ field: ['data', 'user_id'] }],
      }),
    ),
  );

  // await client.query(
  //   q.Create(q.Collection('maps'), {
  //     data: {
  //       user_id: 'testy-man',
  //       name: 'air' + Math.random(),
  //       cost: (Math.random() * 10000) | 0,
  //     },
  //   }),
  // );

  // const res = await client.query(
  //   q.Map(
  //     q.Paginate(q.Documents(q.Collection('maps')), { size: 30 }),
  //     q.Lambda('ref', q.Get(q.Var('ref'))),
  //   ),
  // );

  // const res = await client.query(
  //   q.Paginate(q.Match(q.Index('maps_by_user_id'), 'testy-man'), {
  //     size: 10,
  //   }),
  // );
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
