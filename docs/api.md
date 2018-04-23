# Core api

* [createSignal()](#createsignal)
* [listen(fn)](#listenfn)
* [isListened()](#islistened)
* [listenOnce(fn)](#listenoncefn)
* [emit(...args)](#emitargs)

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

Registers a function to call when `signal.emit` is called.
You can listen unlimited amount of function.

### Removing a listener

```javascript
import { createSignal } from "@dmail/signal"

const { listen, isListened } = createSignal()

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

## isListened()

isListened returns a boolean indicating if signal is being listened.

```javascript
import { createSignal } from "@dmail/signal"

const { listen, isListened } = createSignal()
isListened() // false

listen(() => {})
isListened() // true
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

Emit will notify listeners with provided args.

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
  return "A"
})
const listenerB = listen(() => {
  const emitExecution = getEmitExecution()
  emitExecution.getIndex() // 1
  emitExecution.getReturnValue() // ['A']
  emitExecution.shortcircuit("foo")
  return "B"
})
const listenerC = listen(() => "C")

getEmitExecution() // undefined
emit(10) // returns 'foo'
getEmitExecution() // undefined
```

emitReturnValue is `foo` because of `shortcircuit("foo")` call in `listenerB`.
Without it emit would have returned `["A", "B", "C"]`.

If you are interested in more advanced signal use case and features check the [advanced api documentation](./api-advanced.md).
