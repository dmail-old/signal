# Advanced api

* [Smart option](#smart-option)
* [Recursed option)](#recursed-option)
* [Installer option](#installer-option)
* [Disabling](#disable)
* [createAsyncSignal()](#createasyncsignal)
* [Emitter option](#emitter-option)

## Smart option

Smart option, when enabled, makes signal remembers the last emitted arguments.
Calling `signal.listen` once signal emitted something notify listener immediatly with previous `signal.emit` arguments.

```javascript
import { createSignal } from "@dmail/signal"

const { listen, emit } = createSignal({ smart: true })

emit("foo")
let value
listen((arg) => {
  value = arg
})
value // 'foo'
```

## Recursed option

When a signal is recursed it calls a function.
The default function logs a warning in the console.

```javascript
import { createSignal } from "@dmail/signal"

const { listen, emit } = createSignal()

listen(emit) // logs a warning then throw because infinite recursion
```

### Disable recursed option

You can disable this behaviour by passing null/undefined as shown below

```javascript
import { createSignal } from "@dmail/signal"

const { listen, emit } = createSignal({ recursed: null })

listen(emit) // throw because infinite recursion without warning
```

### Custom recursed option

You can have your own recursed function

```javascript
import { createSignal } from "@dmail/signal"

const recursed = () => {
  throw new Error("signal must not be recursed")
}
const { listen, emit } = createSignal({ recursed })

listen(emit) // throw with signal must not be recursed
```

## Installer option

A signal can do something when being listened and clean it up once unlistened.
The installer option let you do this as shown below:

```javascript
import { createSignal } from "@dmail/signal"

let installed = false
const installer = () => {
  installed = true
  return () => {
    installed = false
  }
}
const { listen, emit } = createSignal({ installer })

installed // false

const { remove } = listen(() => {})
installed // true

remove()
installed // false
```

### Installing a DOM event listener

A signal may be used as a wrapper around native `addEventListener('click')/removeEventListener('click')` browser apis.

```javascript
import { createSignal } from "@dmail/signal"

const installer = ({ emit }) => {
  document.addEventListener("click", emit)
  return () => document.removeEventListener("click", emit)
}
const clicked = createSignal({ installer })
```

Please note how installer receives signal object as argument

## Disable

You may need to disable a signal: it means prevent listener from being notified and installer side effects from hapenning. You can do temporarily during a function execution as shown below.

```javascript
import { createSignal } from "@dmail/signal"

let installed = false
const { listen, emit, disableWhileCalling } = createSignal({
  installer: ({ emit }) => {
    installed = true
    return () => {
      installed = false
    }
  },
})

let notified = false
listen(() => {
  notified = true
})

disableWhileCalling(() => {
  installed // false
  notified // false
  emit()
  notified // false
})

installed // true
notified // false
emit()
notified // true
```

## createAsyncSignal

There is an async version of `createSignal` exported under `createAsyncSignal`.
Each listener are still notified in serie, awaiting the previous one the be resolved.

```javascript
import { createAsyncSignal } from "@dmail/signal"

const { listen, emit } = createAsyncSignal()

listen((a) => Promise.resolve(a + 1))
listen((a) => Promise.resolve(a + 2))

emit(10).then((values) => {
  values // [11, 12]
})
```

Please note how `asyncSignal.emit` returns a thenable resolved to the value of all listener return value.

## Emitter option

`emitter` gives full control on how listener are notified by calls to `emit`.
Several emitter and helpers can be found in [emitters.js](../src/emitters.js).
This is a very advanced usage but you can compose your own emitter using these helpers.
Please note how `createAsyncSignal` is just using `asyncSerialEmitter`.
