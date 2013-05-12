"use strict";

var tj = module.exports = {
  defaults: {
    resolver: global,
    loader:   'fromTypedJSON',
    key:      '_type'
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
  var resolver = options.resolver || tj.defaults.resolver,
      loader   = options.loader   || tj.defaults.loader,
      typeKey  = options.key      || tj.defaults.key;

  return function(key, value) {
    var id, type;

    if (!value || !value.hasOwnProperty(typeKey))
      return value;

    id = value[typeKey];
    if (typeof loader === 'function') {
      delete value[typeKey];
      return loader(value, id, typeKey);
    }

    if (typeof resolver === 'function')
      type = resolver(id, typeKey, value);
    else if (resolver.hasOwnProperty(id))
      type = resolver[id];
    else
      return value;

    if (typeof type[loader] !== 'function')
      return value;

    delete value[typeKey];
    return type[loader](value, id, typeKey);
  };
};
