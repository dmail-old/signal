# Signal api

* [isListened()](#islistened)
* [listen(fn)](#listenfn)
* [listenOnce(fn)](#listenoncefn)
* [emit(...args)](#emitargs)
* [removeAllWhileCalling(fn)](#removeallwhilecallingfn)
* [createSignal({ installer })](#createsignal-installer-)
* [createSignal({ recursed })](#createsignal-recursed-)
* [createSignal({ smart })](#createsignal-smart-)

## isListened()

isListener returns if there is a listener on the signal

```javascript
import { createSignal } from "@dmail/signal"

const { listen, isListened } = createSignal()

isListened() // false

listen(() => {})

isListened() // true
```

## listen(fn)

Registers a function that will be called when emit is called.
You can listen unlimited amount of function.

```javascript
import { createSignal } from "@dmail/signal"

const { listen } = createSignal()

listen(() => {})
listen(() => {})
```

Advanced note: listen(fn) returns the same internal listener object when there is already a listener for fn. It means fn is called once even when you write `listen(fn); listen(fn); emit();`

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

## createSignal({ installer })

createSignal accepts an installer function.
This function will be called every time a first listener is added to signal.
Installer function can return an other function (called uninstaller).
The uninstaller function will be called when signal last listener is removed.

```javascript
import { createSignal } from "@dmail/signal"

const installer = ({ emit }) => {
  // you should use addEventListener/removeEventListener here but this is to show
  // that document.body.onclick wil be undefined when last listener is removed
  document.body.onclick = emit
  return () => {
    document.body.onclick = undefined
  }
}
const { listen, emit } = createSignal({ installer })

document.body.onclick // undefined

const { remove } = listen(() => {})
document.body.onclick // emit

remove()
document.body.onclick // undefined
```

## createSignal({ recursed })

createSignal accepts a recursed function

```javascript
import { createSignal } from "@dmail/signal"

const recursed = () => {}
const { listen, emit } = createSignal({ recursed })

listen(() => emit()) // calls recursed then throw because infinite recursion
```

By default recursed is a function that logs a warning in the console.

## createSignal({ smart })

createSignal accepts a smart boolean which is false by default.
When true a listener function is immediatly called if signal has previously emitted something

```javascript
import { createSignal } from "@dmail/signal"

const { listen, emit } = createSignal({ smart: true })

emit("foo")
let value
listen((arg) => {
  value = arg
})
// here listener is immediatly called so value === "foo"
```

## removeAllWhileCalling(fn)

Call fn immedatly ensuring no existing listener or install logic happens and restore them afterwards.

```javascript
import { createSignal } from "@dmail/signal"

const { removeAllWhileCalling, listen } = createSignal({
  installer: ({ emit }) => {
    document.body.onclick = () => {
      alert("clicked")
      emit()
    }
    return () => {
      document.body.onclick = undefined
    }
  },
})

listen(() => alert("click happened"))

removeAllWhileCalling(() => {
  // during this function execution, previous listener are removed
  // and any install behaviour is cleaned too
  // ensuring the default behaviour happens
  // you can safely write
  document.body.click()
  // and no alert() will happen
})

document.body.click() // will show first alert('clicked') then alert('click happened')
```

## Removing a listener

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
