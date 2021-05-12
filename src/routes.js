import { createBrowserHistory } from 'history';
import * as R from 'ramda';
import * as pathToRegexp from 'path-to-regexp';

const history = createBrowserHistory();

let routes = {
  Menu: '/',
  Play: '/play/:mapKey?',
  Editor: '/edit/:mapKey?',
};

const basePath =
  process.env.BASENAME && process.env.BASENAME !== '/'
    ? process.env.BASENAME
    : '';

routes = R.map((route) => `${basePath}${route}`, routes);

const compiledRoutes = R.map((route) => pathToRegexp.compile(route), routes);
const matchedRoutes = R.map((route) => pathToRegexp.match(route), routes);

const resolvePath = (type, params = {}) => {
  const toPath = compiledRoutes[type];
  let pathname;
  if (!toPath || !(pathname = toPath(params)))
    throw new Error(
      `Route type not found: ${type}, params: ${Object.keys(params)}`,
    );

  return pathname;
};

/**
 * @param {keyof typeof routes} type
 * @param {object} [params]
 */
export const push = (type, params) => history.push(resolvePath(type, params));

/**
 * @param {keyof typeof routes} type
 * @param {object} [params]
 */
export const replace = (type, params) =>
  history.replace(resolvePath(type, params));

const parsePath = (pathname) => {
  for (const key in matchedRoutes) {
    const match = matchedRoutes[key](pathname);
    if (match) return [key, match.params];
  }

  return [];
};

export const getKeyParams = () => parsePath(history.location.pathname);

export const listen = (cb) =>
  history.listen((loc) => {
    cb(...parsePath(loc.pathname));
  });
