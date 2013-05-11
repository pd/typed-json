"use strict";

var tj = module.exports = {
  defaults: {
    key: '_type',
    ns: global
  }
};

/**
 * Tiny wrapper around `JSON.parse` which will always use a new reviver
 * with the given options.
 *
 * @param {String} json A valid JSON string.
 * @return The parsed JSON
 * @see reviver
 */
tj.revive = function(json, options) {
  return JSON.parse(json, tj.reviver(options));
};

/**
 * @param {Object?} options
 * @return {function(key, value)} A JSON reviver function
 */
tj.reviver = function(options) {
  options = options || {};
  var ns      = options.ns  || tj.defaults.ns,
      typeKey = options.key || tj.defaults.key;

  return function(key, value) {
    var id, type;

    if (value === null || typeof value !== 'object')
      return value;

    id = value[typeKey];
    if (typeof id === 'undefined')
      return value;

    if (typeof ns === 'function')
      type = ns.call(undefined, id, typeKey, value);
    else
      type = ns[id];

    if (!type || typeof type.fromTypedJSON !== 'function')
      return value;

    delete value[typeKey];
    return type.fromTypedJSON(value, id, typeKey);
  };
};
