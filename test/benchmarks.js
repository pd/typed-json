var matcha = require('matcha'),
    tj = require('..');

function Widget(name, size) {
  this.name = name;
  this.size = size;
}

Widget.fromTypedJSON = function(obj) {
  return new Widget(obj.name, obj.size);
};

var NS = {
  Widget: Widget
};

suite('no types found', function() {
  var json    = '[{ "foo": "bar" }]';
  var reviver = tj.reviver();

  bench('Raw JSON.parse', function() {
    JSON.parse(json);
  });

  bench('tj.revive', function() {
    tj.revive(json);
  });

  bench('JSON.parse(json, tj.reviver)', function() {
    JSON.parse(json, reviver);
  });

  var noopReviver = function(key, value) {
    return value;
  };

  bench('JSON.parse(json, noopReviver)', function() {
    JSON.parse(json, noopReviver);
  });
});

suite('types found', function() {
  var json    = '[{ "_type": "Widget", "name": "foo" }]';
  var revopts = { resolver: NS };
  var reviver = tj.reviver(revopts);

  bench('Raw JSON.parse', function() {
    JSON.parse(json);
  });

  bench('tj.revive', function() {
    tj.revive(json, revopts);
  });

  bench('JSON.parse(json, reviver)', function() {
    JSON.parse(json, reviver);
  });

  var constructingReviver = function(key, value) {
    if (!value)
      return value;
    if (value.hasOwnProperty('_type') && value._type === 'Widget')
      return new Widget(value.name, value.size);
    return value;
  };

  bench('JSON.parse(json, customReviver)', function() {
    JSON.parse(json, constructingReviver);
  });
});

suite('custom loader fn', function() {
  function loader(obj, type, key) {
    if (type === 'Foo') return 'foo!';
    else if (type === 'Bar') return 'bar!';
    else return 'baz?';
  }

  var json    = '[{ "_type": "Foo" }, { "_type": "Bar" }, { "_type": "NoSuchType" }]';
  var revopts = { loader: loader };
  var reviver = tj.reviver(revopts);

  bench('Raw JSON.parse', function() {
    JSON.parse(json);
  });

  bench('tj.revive', function() {
    tj.revive(json, revopts);
  });

  bench('JSON.parse(json, reviver)', function() {
    JSON.parse(json, reviver);
  });

  var stringifyingReviver = function(key, value) {
    if (!value)
      return value;
    if (!value.hasOwnProperty('_type'))
      return value;

    if (value._type === 'Foo') return 'foo!';
    else if (value._type === 'Bar') return 'bar!';
    else return 'baz?';
  };

  bench('JSON.parse(json, customReviver)', function() {
    JSON.parse(json, stringifyingReviver);
  });
});
