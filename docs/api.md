# API

* [createSignal()](#createsignal)
* [isListened()](#islistened)
* [listen(fn)](#listenfn)
* [listenOnce(fn)](#listenoncefn)
* [emit(...args)](#emitargs)
* [Smart option](#smart-option)
* [Recursed option)](#recursed-option)
* [Installer option](#installer-option)
* [disableWhileCalling(fn)](#disablewhilecallingfn)
* [createAsyncSignal()](#createasyncsignal)
* [Emitter option](#emitter-option)

## createSignal()

return methods to add function and call them on demand.

```javascript
import { createSignal } from "@dmail/signal"

const createTimer = (ms = 0) => {
  const completed = createSignal()
  const cancelled = createSignal()

  const id = setTimeout(completed.emit, ms)

  const cancel = () => {
    if (id) {
      clearTimeout(id)
      id = null
      cancelled.emit()
    }
  }

  return { completed, cancelled, cancel }
}

const timer = createTimer(10)

timer.cancelled.listen(() => console.log("cancelled"))
timer.completed.listen(() => console.log("completed"))

timer.cancel() // logs 'cancelled' in the console
```

## listen(fn)

Registers a function to call when `signal.emit` is called.
You can listen unlimited amount of function.

## isListened()

isListened returns a boolean indicating if signal is being listened.

```javascript
import { createSignal } from "@dmail/signal"

const { listen, isListened } = createSignal()

isListened() // false

listen(() => {})

isListened() // true
```

### Removing a listener

```javascript
import { createSignal } from "@dmail/signal"

const { listen } = createSignal()

const listener = listen(() => {})

listener.remove()
```

### Duplicate check on listener

Only one listener per fn per signal.

```javascript
import { createSignal } from "@dmail/signal"

const { listen } = createSignal()
const fn = () => {}

listen(fn)
listen(fn) // throw with `there is already a listener for that fn on this signal`
```

## listenOnce(fn)

listenOnce register a listener autoremoved when notified.

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

Emit notify listeners with provided args.

```javascript
import { createSignal } from "@dmail/signal"

const { listen, emit } = createSignal()

listen((a) => a)
listen((a) => a + 1)

emit(0) // returns [0, 1]
emit(10) // returns [10, 11]
```

### emit execution

You can track emit execution using `isEmitting` & `getEmitExecution`

#### isEmitting()

```javascript
import { createSignal } from "@dmail/signal"

const { listen, emit, isEmitting } = createAsyncSignal()

listen(() => {
  isEmitting() // true
})
isEmitting() // false
emit()
isEmitting() // false
```

#### getEmitExecution()

```javascript
import { createSignal } from "@dmail/signal"

const { listen, emit, getEmitExecution } = createAsyncSignal()

const listenerA = listen(() => {
  const emitExecution = getEmitExecution()
  emitExecution.getIndex() // 0
  emitExecution.getListeners() // [listenerA, listenerB, listenerC]
  emitExecution.getArguments() // [10]
  emitExecution.getReturnValue() // []
  return "a"
})
const listenerB = listen(() => {
  const emitExecution = getEmitExecution()
  emitExecution.getIndex() // 1
  emitExecution.getReturnValue() // ['a']
  emitExecution.stop()
  return "b"
})
const listenerC = listen(() => "c")

getEmitExecution() // undefined
emit(10) // returns ["a", "b"]
getEmitExecution() // undefined
```

`emit()` returns `["a", "b"]` because of `emitExecution.stop()` call in `listenerB`.
Without it emit would have returned `["a", "b", "c"]`.

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

A signal is considered as recursed when `emit` is called while an other `emit` is still notifying his listeners.
The recursed option is a function that will be called when the signal is recursed.
The default function logs a warning in the console.

```javascript
import { createSignal } from "@dmail/signal"

const { listen, emit } = createSignal()

listen(emit)
emit() // logs a warning then throw because infinite recursion
```

### How to ignore a recursed signal

You can choose to do nothing on recursed signal by passing null/undefined as shown below

```javascript
import { createSignal } from "@dmail/signal"

const { listen, emit } = createSignal({ recursed: null })

listen(emit)
emit() // throw because infinite recursion without warning
```

### How to call custom function when a signal is recursed

You can have your own recursed function

```javascript
import { createSignal } from "@dmail/signal"

const recursed = ({ emitExecution, args }) => {
  throw new Error(`signal recursed with ${args} while emitting ${emitExecution.getArguments()}`)
}
const { listen, emit } = createSignal({ recursed })

listen(() => emit("second"))
emit("first") // throw error "signal recursed with second while emitting first"
```

recursed receive `{ emitExecution, args }`.

* emitExecution is the current emit execution, documentation available [here](../api.md#getemitexecution)
* args are the arguments passed when emit was called

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

### Installer example: wrapper around DOM click event

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

## disableWhileCalling(fn)

You may need to disable a signal: it means prevent listener from being notified and installer side effects from hapenning. You can disable a signal temporarily during a function execution as shown below.

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

## createAsyncSignal()

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
For instance `createAsyncSignal` is using `asyncSerialEmitter` exported in [src/emitter/index.js](../src/emitter/index.js).  
