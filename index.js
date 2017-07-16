var mongodb = require('mongodb')
var MongoClient = mongodb.MongoClient

/** HELPERS */

function _proxify(orig, dest) {
	Object.keys(orig.prototype).forEach( (methodName) => {
		try {
			var meth = orig.prototype[methodName]
			if (typeof meth !== "function")
				return
		} catch (e) {
			return 
		}

		dest.prototype[methodName] || (
			dest.prototype[methodName] = function () {
				// var _this = this
				/*var ret =*/
				return this._promise().then( (proxied) => {
						return proxied[methodName].apply(proxied, arguments)
				})
				
				/*if (this._catcher)
					ret = ret.catch(this._catcher)

				return ret*/
			}
		)
	})
}

function _catchify (obj, catcher) { 
	return new Proxy(obj, { 
		get (target, prop, receiver) {
			var value = target[prop]
			if (typeof value === "function" && prop.charAt(0) != '_') {
				return (function (...args) {
					var ret = value.apply(target, args)
					if (Promise.prototype.isPrototypeOf(ret)) {
						return ret.catch(catcher)
					}
					return ret
				})
			}
			return value
		}
	})
}

/*function _definePromise(obj, value) {
	Object.defineProperty(obj, "promise", {
		value, writable: false, configurable: true
	})
}*/

class _MongoxyWrapper {
	constructor () {
	}

	get promise () {
		this._definePromise(this._promiseCreator())
		return this.promise 
	}

	_definePromise(value) {
		Object.defineProperty(this, "promise", {
			value, writable: false, configurable: true
		})
	}

	_promise () {
		return this.promise
	}
}

/** Wrappers */

// Db
class Db extends _MongoxyWrapper {
	constructor (args) {
		super()
		this._args = args
	}

	_promiseCreator () { return MongoClient.connect(...this._args) }

	bind (name, options) {
		this[name] = new Collection(name, options, this)
	}

/*	collection (name, options) {
		return new Collection(name, options, this)
	}*/

	/*withCatcher (catcher) {
		var c = {}
		return new Proxy(this, {
			get (target, prop, receiver) {
				if (prop in c) {
					return c[prop]
				}

				var v = target[prop]
				if (Collection.prototype.isPrototypeOf(v)) {
					receiver.bind(...v._args)
					return c[prop]
				}

				if (typeof v === "function") {
					return v.bind(receiver)
				}

				if (prop == "_catcher") {
					return catcher
				}

				return v
			},
			set (target, prop, value, receiver) {
				c[prop] = value
				return true
			}
		})
	}*/
}
_proxify(mongodb.Db, Db)

// Collection
class Collection extends _MongoxyWrapper {
	constructor (name, options, db) {
		super()
		this._name = name
		this._db = db
		this._args = [name, options]
		// this._catcher = db._catcher
	}

	_promiseCreator () { return this._db.collection(...this._args) }

	find (...args) {
		return new Cursor(this._promise().then( (collection) => { return collection.find(...args) }), this._catcher)
	}
}
_proxify(mongodb.Collection, Collection)

// Cursor
class Cursor extends _MongoxyWrapper {
	constructor (promise/*, catcher*/) {
		super()
		this._definePromise(promise)
		// this._catcher = catcher
	}
}
_proxify(mongodb.Cursor, Cursor)

/** EXPORTS */
var exports = module.exports
exports.db = function () {
	return new Db(arguments)
}

exports.catchify = _catchify