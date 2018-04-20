# Signal api

* [createSignal()](#createsignal)
* [listen(fn)](#listenfn)
* [isListened()](#islistened)
* [listenOnce(fn)](#listenoncefn)
* [emit(...args)](#emitargs)
* [How to remove a listener?](#how-to-remove-a-listener?)
* [Advanced examples](./advanced/index.md)

## createSignal()

```javascript
import { createSignal } from "@dmail/signal"

const doSomethingUsingSignal = () => {
  const completed = createSignal()
  const cancelled = createSignal()

  const id = setTimeout(completed.emit, 10)
  const cancel = () => {
    if (id) {
      id = null
      clearTimeout(id)
      cancelled.emit()
    }
  }

  return { completed, cancelled, cancel }
}

const hooks = doSomethingUsingSignal()

hooks.cancelled.listen(() => console.log("cancelled"))
hooks.completed.listen(() => console.log("completed"))
```

## listen(fn)

Registers a function to call when signal emit is called.
You can listen unlimited amount of function.

```javascript
import { createSignal } from "@dmail/signal"

const { listen } = createSignal()

listen(() => {})
listen(() => {})
```

### listen prevent duplicate listener

listen(fn) returns the same object when it was already called with that fn. It means the following will call fn once

```javascript
import { createSignal } from "@dmail/signal"

const { listen, emit } = createSignal()
let callCount = 0
const fn = () => {
  callCount++
}

listen(fn)
listen(fn)
emit()

callCount // 1
```

## isListened()

isListener returns if signal is being listened by some fn

```javascript
import { createSignal } from "@dmail/signal"

const { listen, isListened } = createSignal()

isListened() // false

listen(() => {})

isListened() // true
```

## listenOnce(fn)

listenOnce register a function that is autoremoved when called.

```javascript
import { createSignal } from "@dmail/signal"

const { listenOnce, emit } = createSignal()

let callCount = 0
listenOnce(() => {
  callCount++
})
emit()
emit()

callCount // 1
```

## emit(...args)

Emit will call listeners with provided args.

```javascript
import { createSignal } from "@dmail/signal"

const { listen, emit } = createSignal()

let sentence = ""
listen((string) => {
  sentence += string
})

emit("hello")
emit("world")

sentence // "helloworld"
```

## How to remove a listener?

Listen returns a function you can call to remove that listener

```javascript
import { createSignal } from "@dmail/signal"

const { listen, emit } = createSignal()

let called = false
const listener = listen(() => {
  called = true
})
listener.remove()
emit()

called // false
```
