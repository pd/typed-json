# typed-json
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

### .parse(json, { key: '_type', ns: global })
Options:

- **key**: The name of the property used to identify the type.
- **ns**: The namespace in which to resolve types. Alternatively, a function that will return the object on which to find the `fromTypedJSON` function.

~~~~js
var Deals = {
  Coupon: { fromTypedJSON: ... },
  Sale:   { fromTypedJSON: ... }
};

var json  = '[{ "kind": "Coupon", "discount": "10%" }, { "kind": "Sale", "discount": "25%" }]';
var deals = tj.parse(json, {
  key: "kind",
  ns: function(kind) { return Deals[kind]; }
});

// Calls Deals['Coupon'].fromTypedJSON({ discount: '10%' })
//  then Deals['Sale'].fromTypedJSON({ discount: '25%' })

//=> [<Coupon 10%>, <Sale 25%>]
~~~~

Aliased to `revive`: `tj.revive(json, { ... })`.

### .reviver({ key: '_type', ns: global })
Returns a `reviver` function suitable for use with [JSON.parse][json-parse].

If you are going to be calling `revive` a lot, you should probably keep one of these around:

~~~~js
var reviver = tj.reviver({ key: 'ClassName', ns: app.models });
//=> [Function]

var user = JSON.parse('{ "ClassName": "User", "email": "user@example.com" }', reviver);
user instanceof app.models.User
//=> true
~~~~


[json-parse]: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/JSON/parse
