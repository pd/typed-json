var assert = require('chai').assert;
var tj = process.env.COVERAGE_RUN ? require('../index-cov') : require('../index');

var T  = {},
    NS = { T: T };

test('typedJSON.revive() wraps JSON.parse(json, reviver())', function() {
  Number.fromTypedJSON = function(obj) { return obj.num * 10 };
  var num = tj.revive('{ "_type": "Number", "num": 25 }');
  assert.equal(num, 250);
  delete Number.fromTypedJSON;
});

suite('revival', function() {
  var revive = function(json, options) {
    options = options || {};
    options.resolver = NS;
    return tj.revive(json, options);
  };

  setup(function() {
    T.fromTypedJSON = function() { throw new Error('unstubbed'); };
  });

  teardown(function() {
    delete global.T;
  });

  test('ignore non-object values', function() {
    var ary = tj.revive('[1, 2, 3, "four", null]');
    assert.deepEqual(ary, [1, 2, 3, "four", null]);
  });

  test('ignore objects without "_type" key', function() {
    var obj = tj.revive('{ "relevant": false }');
    assert.deepEqual(obj, { relevant: false });
  });

  test('ignore unknown "_type" key value', function() {
    var obj = tj.revive('{ "_type": "Nope", "some": "object" }');
    assert.deepEqual(obj, { _type: "Nope", some: "object" });
  });

  test('find "_type" in global scope', function() {
    global.AnythingHere = {
      fromTypedJSON: function(obj) {
        assert.equal(obj.prop, 'prop-value');
        return 'pass';
      }
    };

    assert.equal(tj.revive('{ "_type": "AnythingHere", "prop": "prop-value" }'),
                 'pass');

    delete global.AnythingHere;
  });

  test('lookup types in different namespace', function() {
    T.fromTypedJSON = function(obj) { return 'pass'; };
    assert.equal(tj.revive('{ "_type": "Anything" }',
                            { resolver: { Anything: T } }),
                 'pass');
  });

  test('ignore "_type" without fromTypedJSON property', function() {
    delete T.fromTypedJSON;
    assert.deepEqual(revive('{ "_type": "T", "fn": "missing" }'),
                     { _type: "T", fn: "missing" });
  });

  test('ignore "_type" with non-function fromTypedJSON', function() {
    T.fromTypedJSON = "I'm just a string";
    assert.deepEqual(revive('{ "_type": "T", "fn": "bad-type" }'),
                     { _type: "T", fn: "bad-type" });
  });

  test('delete "_type" before passing to fromTypedJSON', function() {
    T.fromTypedJSON = function(obj) {
      assert.deepEqual(obj, { still: "here" });
      return 'pass';
    };

    assert.equal(revive('{ "_type": "T", "still": "here" }'),
                 'pass');
  });

  test('use key other than "_type"', function() {
    T.fromTypedJSON = function(obj) { return 'pass'; };
    assert.equal(revive('{ "__loader__": "T" }', { key: "__loader__" }),
                 'pass');
  });

  test('lookup types using a function', function() {
    var lookupType = function(name, key, obj) {
      assert.equal(name, 'Foo');
      assert.equal(key,  '_viaFn');
      assert.deepEqual(obj, { _viaFn: 'Foo' });
      return { fromTypedJSON: function() { return 'pass'; } };
    };

    var obj = tj.revive('{ "_viaFn": "Foo" }',
                         { key: '_viaFn', resolver: lookupType });
    assert.equal(obj, 'pass');
  });

  test('use a different function name than fromTypedJSON', function() {
    T.deserialize = function(obj) {
      assert.deepEqual(obj, { diff: 'fn-name' });
      return 'alternate-pass';
    };

    assert.equal(revive('{ "_type": "T", "diff": "fn-name" }', { loader: 'deserialize' }),
                 'alternate-pass');
  });

  test('use a provided function instead of searching for fromTypedJSON', function() {
    var loader = function(value, type, key) {
      assert.equal(key, '_type');
      assert.deepEqual(value, { custom: 'deserializer' });

      if (type === 'Foo') return { foo: true };
      return { foo: false };
    };

    assert.deepEqual(tj.revive('{ "_type": "Foo", "custom": "deserializer" }', { loader: loader }),
                     { foo: true });

    assert.deepEqual(tj.revive('{ "_type": "Bar", "custom": "deserializer" }', { loader: loader }),
                     { foo: false });
  });

  test('deep revival', function() {
    var A = {
      fromTypedJSON: function() { return 'A' }
    };

    var B = {
      fromTypedJSON: function(obj) {
        assert.equal(obj.a, 'my-a');
        return 'B';
      }
    };

    var json = '[{ "_type": "A" }, { "_type": "B", "a": "my-a" }, { "C": { "_type": "A" } }]';
    assert.deepEqual(tj.revive(json, { resolver: { A: A, B: B } }),
                     ['A', 'B', { C: 'A' }]);
  });

  test('fromTypedJSON also gets type name and key', function() {
    T.fromTypedJSON = function(obj, typeName, typeKey) {
      assert.equal(typeName, 'Fake', '__load');
      assert.deepEqual(obj, { still: 'works' });
      return 'pass';
    };

    assert.equal(tj.revive('{ "__load": "Fake", "still": "works" }',
                            { key: '__load', resolver: { Fake: T } }),
                 'pass');
  });

  test('does not swallow errors', function() {
    assert.throws(function() {
      tj.revive('this is not json');
    }, SyntaxError);

    T.fromTypedJSON = function() { throw new Error('pass'); };
    assert.throws(function() {
      revive('{ "_type": "T" }');
    }, Error, 'pass');
  });

});
