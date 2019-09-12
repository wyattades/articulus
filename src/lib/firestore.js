// const firebaseConfig = {
//   apiKey: 'AIzaSyCbqLdQG5J3MhPbYtzjoxcRzb_5M_xwuMs',
//   authDomain: 'hobbies-db.firebaseapp.com',
//   databaseURL: 'https://hobbies-db.firebaseio.com',
//   projectId: 'hobbies-db',
//   storageBucket: '',
//   messagingSenderId: '568269658314',
//   appId: '1:568269658314:web:7b1c25607c2ecc86',
// };

const projectId = 'hobbies-db';
const dbId = '(default)';
const API_BASE = `https://firestore.googleapis.com/v1beta1/projects/${projectId}/databases/${dbId}/documents`;

const PROPS = {
  arrayValue: true,
  bytesValue: true,
  booleanValue: true,
  doubleValue: true,
  geoPointValue: true,
  integerValue: true,
  mapValue: true,
  nullValue: true,
  referenceValue: true,
  stringValue: true,
  timestampValue: true,
};
const getFireStoreProp = (value) =>
  Object.keys(value).find((k) => PROPS[k] === true);

const parseFirestoreValue = (value) => {
  const prop = getFireStoreProp(value);
  switch (prop) {
    case 'doubleValue':
    case 'integerValue':
      value = Number(value[prop]);
      break;
    case 'arrayValue':
      value = ((value[prop] && value[prop].values) || []).map(
        parseFirestoreValue,
      );
      break;
    case 'mapValue':
      value = parseFirestoreValue((value[prop] && value[prop].fields) || {});
      break;
    case 'geoPointValue':
      value = { latitude: 0, longitude: 0, ...value[prop] };
      break;
    case 'timestampValue':
      value = new Date(value[prop]);
      break;
    default:
      if (prop) value = value[prop];
      else if (typeof value === 'object')
        for (const k in value) value[k] = parseFirestoreValue(value[k]);
  }
  return value;
};

export const formFirestoreValue = (value) => {
  const type = typeof value;
  switch (type) {
    case 'string':
      // const time = Date.parse(value);
      // const date = new Date(value);
      // if (!Number.isNaN(date.getTime()))
      //   return { timestampValue: date.toISOString() };
      return { stringValue: value };
    case 'boolean':
      return { booleanValue: value };
    case 'number':
      return {
        [Number.isInteger(value) ? 'integerValue' : 'floatValue']: value,
      };
    case 'object':
      if (value === null) return { nullValue: null };
      if (value instanceof Date) return { timestampValue: value.toISOString() };
      if (Array.isArray(value))
        return { arrayValue: value.map(formFirestoreValue) };
      const mapValue = {};
      for (const key in value) mapValue[key] = formFirestoreValue(value[key]);
      return { mapValue };
    default:
      return null;
  }
};

const formFirestoreRes = (data) => {
  const fields = {};
  for (const key in data) fields[key] = formFirestoreValue(data[key]);

  return {
    fields,
  };
};

const parseFirestoreRes = (doc) => {
  const data = {
    id: doc.name.substring(doc.name.lastIndexOf('/') + 1),
    createTime: doc.createTime,
    updateTime: doc.updateTime,
  };
  for (const key in doc.fields)
    data[key] = parseFirestoreValue(doc.fields[key]);
  return data;
};

class ApiError extends Error {
  constructor({ code, message, status }) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = 'ApiError';
  }
}

const auth = {};

export const request = (path, body, method = 'GET', options = {}) => {
  if (options.query) {
    const str = [];
    let i = 0;
    for (const key in options.query)
      str.push(i++ === 0 ? '?' : '&', key, '=', options.query[key]);
    path += str.join('');
  }
  return window
    .fetch(API_BASE + path, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        // Accept: 'application/json',
        // 'Content-Type': 'application/json',
        // Authorization: auth.token,
      },
    })
    .then((res) => res.json())
    .catch((err) => {
      throw new ApiError(err);
    });
};

// TODO:
const fromCollection = (path) => [{ collectionId: path.replace('/', '') }];

export const query = async (collectionId, structuredQuery) => {
  const res = await request(
    ':runQuery',
    {
      structuredQuery: {
        from: fromCollection(collectionId),
        ...structuredQuery,
      },
    },
    'POST',
  );

  if (!Array.isArray(res))
    throw new ApiError({ code: 500, message: 'Invalid res' });

  if (!res.length) return [];

  if (res[0].error) throw new ApiError(res[0].error);
  if (!res[0].document) return [];

  return res.map(({ document }) => parseFirestoreRes(document));
};

export const deleteDoc = async (path, mustExist = false) => {
  const res = await request(path, null, 'DELETE', {
    query: mustExist && { 'currentDocument.exists': true },
  });
  if (res.error) throw new ApiError(res.error);
};

export const getDoc = async (path) => {
  const res = await request(path);
  if (res.error) throw new ApiError(res.error);
  if (res.documents) return res.documents.map(parseFirestoreRes);
  if (Object.keys(res).length === 0) return [];
  return parseFirestoreRes(res);
};

export const createDoc = async (path, documentId = null, data) => {
  const res = await request(path, formFirestoreRes(data), 'POST', {
    query: {
      ...(documentId === null ? {} : { documentId }),
      'mask.fieldPaths': '_', // No need to return anything
    },
  });
  console.log(res);
  if (res.error) throw new ApiError(res.error);

  return res.name.substring(res.name.lastIndexOf('/') + 1);
};
