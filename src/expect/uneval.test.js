import assert from "assert"

import { uneval } from "./uneval.js"

const expectUneval = (value, expectedUneval) => assert.equal(uneval(value), expectedUneval)

/* eslint-disable no-new-wrappers, no-new-object */

// boolean/Boolean
expectUneval(true, "true")
expectUneval(false, "false")
expectUneval(new Boolean(true), "new Boolean(true)")
expectUneval(new Boolean(false), "new Boolean(false)")

// function
expectUneval(() => {}, "function () {}") // because babel
expectUneval(
	() => true,
	`function () {
  return true;
}`
) // because babel

// null
expectUneval(null, "null")

// number/Number
expectUneval(0, "0")
expectUneval(1, "1")
expectUneval(new Number(0), "new Number(0)")
expectUneval(new Number(-1), "new Number(-1)")

// object/Object
expectUneval({}, "{}")
expectUneval({ foo: true }, '{"foo": true}')
expectUneval({ foo: { name: "dam" } }, '{"foo": {"name": "dam"}}')
expectUneval(new Object({}), "{}")
const circularObject = {
	foo: true
}
circularObject.self = circularObject
expectUneval(circularObject, `{"foo": true, "self": {}}`)
// todo: more complex circular structure

// string/String
expectUneval("", `""`)
expectUneval("dam", `"dam"`)
expectUneval("don't", `"don\\\'t"`)
expectUneval(`his name is "dam"`, `"his name is \\\"dam\\\""`)
expectUneval(new String(""), `new String("")`)
expectUneval(new String("dam"), `new String("dam")`)

// symbol/Symbol
expectUneval(Symbol(), "{}")

// undefined
expectUneval(undefined, "undefined")

// regexp/Regexp
expectUneval(/ok/g, "/ok/g")
expectUneval(new RegExp("foo", "g"), "/foo/g")

// error
expectUneval(new Error("here"), `new Error("here")`)
expectUneval(new RangeError("here"), `new RangeError("here")`)

// date
expectUneval(new Date(), `new Date(${Date.now()})`)

// array
expectUneval([], `[]`)
// todo: new Array & circular array

// other instance
const CustomConstructor = function() {
	this.foo = true
}
const customInstance = new CustomConstructor()
expectUneval(customInstance, `new CustomConstructor({"foo": true})`)

console.log("all passed")

/* eslint-enable no-new-wrappers, no-new-object */
