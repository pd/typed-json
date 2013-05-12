# typed-json
[![Build Status](https://travis-ci.org/pd/typed-json.png?branch=master)](https://travis-ci.org/pd/typed-json)
[![Coverage Status](https://coveralls.io/repos/pd/typed-json/badge.png?branch=master)](https://coveralls.io/r/pd/typed-json?branch=master)

Easily generate a `reviver` for [JSON.parse][json-parse] that can convert matching JSON objects to the type of your choosing.

`typed-json` is not an extension of JSON. It does not alter or augment the JSON syntax. It is not a modified JSON parser. It uses the native `reviver` feature of `JSON.parse` to call out to *your* code when it encounters an object with the property you specify. It does not know how to instantiate your class or rebuild an object graph. It just makes it simpler for you to do so.

Your serialized objects can have a property specifying where to find a `fromTypedJSON` function. If present, its return value will be the result of `JSON.parse`.

~~~~js
var tj = require('typed-json');

Book.fromTypedJSON = function(object) {
  return new Book(object.title);
};

var book = tj.parse('{ "_type": "Book", "title": "Debt" }');

book instanceof Book //=> true
book.title //=> "Debt"
book._type //=> undefined
~~~~

## API

### .parse(json, { key: '_type', loader: 'fromTypedJSON', resolver: global })
Options:

- **key**: The name of the property used to identify the type.
- **loader**:  If a string, it is the name of the function to call after identifying a type using the `resolver`. If a function, it will be called directly to deserialize the current JSON object.
- **resolver**: If an object, type names are expected to correspond to properties of the object (eg, if `resolver: { Foo: ..., Bar: ... }`, types `Foo` and `Bar` are available). If a function, it will be called with the type name encountered, and is expected to return an object that responds to the `loader` method, which will be used to deserialize the object.

#### Custom key name and type lookup
~~~~js
var Deals = {
  Coupon: { fromTypedJSON: ... },
  Sale:   { fromTypedJSON: ... }
};

var json  = '[{ "kind": "coupon", "discount": "10%" }, { "kind": "sale", "discount": "25%" }]';
var deals = tj.parse(json, {
  key: "kind",
  resolver: function(kind) { return Deals[kind.titleCase()]; }
});

// Calls Deals['Coupon'].fromTypedJSON({ discount: '10%' })
//  then Deals['Sale'].fromTypedJSON({ discount: '25%' })

//=> [<Coupon 10%>, <Sale 25%>]
~~~~

#### Custom loader function
If your types can not easily be retrieved from a single namespace, or you can't implement `fromTypedJSON` on all of them, you can instead pass a function to perform the object construction. In this case, the `resolver` will not be used at all:

~~~~js
var customDeserializer = function(object, type, key) {
  //=> object: { color: 'red' }
  //=> type:   'Bike'
  //=> key:    '_type'

  if      (type === 'Car')  return new Automobile(object);
  else if (type === 'Bike') return new Cycle(wheels: 2, color: object.color);
  else andSoOn();
};

var transport = tj.parse('{ "_type": "Bike", "color": "red" }', {
  loader: customDeserializer
});
transport instanceof Cycle //=> true
~~~~

### .reviver({ key: '_type', ns: global })
Returns a `reviver` function suitable for use with [JSON.parse][json-parse].

If you are going to be calling `revive` a lot, you should probably keep one of these around:

~~~~js
var reviver = tj.reviver({ key: 'ClassName', resolver: app.models });
//=> [Function]

var user = JSON.parse('{ "ClassName": "User", "email": "user@example.com" }', reviver);
user instanceof app.models.User
//=> true
~~~~


[json-parse]: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/JSON/parse
