import {reject} from 'ramda';

// prevent 'yamljs' from coerecing undefined keys into null
export function stripUndefinedKeys (obj) {
  return reject(isUndefined, obj);
}

function isUndefined (val) {
  return typeof val === 'undefined';
}