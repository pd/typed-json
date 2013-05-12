"use strict";

var tj = module.exports = {};

/**
 * Tiny wrapper around `JSON.parse` which will always use a new reviver
 * with the given options.
 *
 * @param {String} json A valid JSON string.
 * @param {Object?} options Options are passed directly to `tj.revive`.
 * @return The deserialized value
 * @see reviver
 */
tj.revive = function(json, options) {
  return JSON.parse(json, tj.reviver(options));
};

/**
 * Generate a `reviver` function suitable for use with  `JSON.parse`.
 *
 * @param {Object?} options
 * @param {String} options.key The key used to define type names
 * @param {Object|function(typeName: String, typeKey: String, obj: Object)} options.resolver
 *   A namespace object containing your types (which should have the `loader` function exposed),
 *   or a function that will return the correct object on which to find the `loader` function for
 *   a given type.
 * @param {String|function(obj: Object, typeName: String, typeKey: String)} options.loader
 *   How to deserialize the object. Either the function name to call on the `resolver`'s output,
 *   or a function that will do all of the work (in which case, `resolver` is unused).
 * @return {function(key, value)} A JSON reviver function
 */
tj.reviver = function(options) {
  options = options || {};
  var resolver = options.resolver || global,
      loader   = options.loader   || 'fromTypedJSON',
      typeKey  = options.key      || '_type';

  return function(key, obj) {
    var id, type;

    if (!obj || !(id = obj[typeKey]))
      return obj;

    if (typeof loader === 'function') {
      delete obj[typeKey];
      return loader(obj, id, typeKey);
    }

    if (typeof resolver === 'function')
      type = resolver(id, typeKey, obj);
    else if (resolver[id])
      type = resolver[id];
    else
      return obj;

    if (typeof type[loader] !== 'function')
      return obj;

    delete obj[typeKey];
    return type[loader](obj, id, typeKey);
  };
};
