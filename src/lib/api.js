import * as firestore from './firestore';

export const getMaps = ({ page = 0 }) =>
  firestore.query('/maps', {
    limit: 32,
    // order
  });

export const createMap = (data) => firestore.createDoc('/maps', null, data);

export const getMyMaps = () =>
  firestore.query('maps', {
    limit: 32,
    where: {
      fieldFilter: {
        field: {
          fieldPath: 'xxx',
        },
        op: 'GREATER_THAN_OR_EQUAL',
        value: firestore.formFirestoreValue(10),
      },
    },
  });
