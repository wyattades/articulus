import Router from 'next/router';
import * as _ from 'lodash-es';
import * as pathToRegexp from 'path-to-regexp';

const routes = {
  Menu: '/',
  Play: '/play/:mapKey?',
  Editor: '/edit/:mapKey?',
};

const compiledRoutes = _.mapValues(routes, (route) =>
  pathToRegexp.compile(route),
);
const matchedRoutes = _.mapValues(routes, (route) => pathToRegexp.match(route));

const resolvePath = (type, params = {}) => {
  const toPath = compiledRoutes[type];
  let pathname;
  if (!toPath || !(pathname = toPath(params)))
    throw new Error(
      `Route type not found: ${type}, params: ${Object.keys(params)}`,
    );

  return Router.pathname + (pathname && pathname !== '/' ? '#' + pathname : '');
};

/**
 * @param {keyof typeof routes} type
 * @param {object} [params]
 */
export const push = (type, params) =>
  Router.push(resolvePath(type, params), null, { shallow: true });

/**
 * @param {keyof typeof routes} type
 * @param {object} [params]
 */
export const replace = (type, params) =>
  Router.replace(resolvePath(type, params), null, { shallow: true });

const parsePath = (pathname) => {
  for (const key in matchedRoutes) {
    const match = matchedRoutes[key](pathname);
    if (match) return [key, match.params];
  }

  return [];
};

const getHashPathname = (url) =>
  new URL(url, 'http://a.a').hash.replace('#', '') || '/';

export const getKeyParams = () => parsePath(getHashPathname(Router.asPath));

export const listen = (cb) => {
  const handler = (url) => {
    cb(...parsePath(getHashPathname(url)));
  };
  Router.events.on('hashChangeComplete', handler);
  return () => Router.events.off('hashChangeComplete', handler);
};
