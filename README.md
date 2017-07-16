# mongoxy

Simple wrapper over node-mongodb-native in order to avoid excessively nested `Promise`s.
Inspired by `mongoskin`.

Install
=======

```bash
$ npm install mongoxy
```

Usage
=====

```js
var mongo = require('mongoxy')
var db = mongo.db("mongodb://localhost:27017/test", {native_parser:true})
db.bind('lol')
db.lol.find({}).toArray().then((docs) => {
	console.log(docs)
	db.close().then(() => {
		console.log('Database closed.')
	})
})
```