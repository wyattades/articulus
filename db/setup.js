require('dotenv').config();
const fauna = require('faunadb');
const q = fauna.query;

const client = new fauna.Client({
  secret: process.env.FAUNA_ADMIN_KEY,
});

const atomic = (type, params) => {
  let update = null;
  const ref = q[type](params.name);

  if (type === 'Role') {
    update = q.Update(ref, params);
  }

  return q.If(q.Not(q.Exists(ref)), q[`Create${type}`](params), update);
};

const run = async () => {
  await client.query(
    q.Do(
      atomic('Collection', { name: 'maps' }),
      atomic('Collection', { name: 'builds' }),
    ),
  );

  await client.query(
    q.Do(
      atomic('Index', {
        name: 'maps_by_user_id',
        source: q.Collection('maps'),
        terms: [{ field: ['data', 'user_id'] }],
      }),
      atomic('Index', {
        name: 'builds_by_user_id',
        source: q.Collection('builds'),
        terms: [{ field: ['data', 'user_id'] }],
      }),
    ),
  );

  await client.query(
    q.Do(
      atomic('Role', {
        name: 'client',
        privileges: [
          {
            resource: q.Collection('maps'),
            actions: {
              read: true,
              write: true,
              create: true,
              delete: false,
              history_read: false,
              history_write: false,
              unrestricted_read: false,
            },
          },
          {
            resource: q.Index('maps_by_user_id'),
            actions: {
              unrestricted_read: false,
              read: true,
            },
          },
          {
            resource: q.Collection('builds'),
            actions: {
              read: true,
              write: true,
              create: true,
              delete: false,
              history_read: false,
              history_write: false,
              unrestricted_read: false,
            },
          },
          {
            resource: q.Index('builds_by_user_id'),
            actions: {
              unrestricted_read: false,
              read: true,
            },
          },
        ],
        membership: [],
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
  console.dir(err.requestResult.responseContent, { depth: 10 });
  process.exit(1);
});
