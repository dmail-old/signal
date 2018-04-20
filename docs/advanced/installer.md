# Installable signal

You'll often want to do something when a signal is being listened and cleanup when it's not anymore. You can do this thanks to the installer hook.

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

## DOM event listener example

Let's say we want to create a wrapper around `addEventListener('click')/removeEventListener('click')` browser apis.

```javascript
import { createSignal } from "@dmail/signal"

const installer = ({ emit }) => {
  document.addEventListener("click", emit)
  return () => document.removeEventListener("click", emit)
}
const clicked = createSignal({ installer })
```

## Installer + custom emit logic

The default way of calling the listeners is to call them in serie `synchronously`.
Here is an example showing how you can call them in serie `asynchronously`.

```javascript
import { createSignal } from "@dmail/signal"

const signal = createSignal({
  installer: ({ getListeners }) => {
    const customEmit = () => {
      const listeners = getListeners()
      return listeners.reduce(
        (promise, listener) => promise.then(() => Promise.resolve(listener())),
        Promise.resolve(),
      )
    }

    document.addEventListener("load", customEmit)
    return () => document.removeEventListener("load", customEmit)
  },
})
```
