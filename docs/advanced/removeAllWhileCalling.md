# removeAllWhileCalling

It may happen that you need to do something _as if_ signal was not listened.
removeAllWhileCalling helps you to do this by ensuring no side effect related to signal will happen during a function execution.
You can see it as temporary way to disable a signal.

```javascript
import { createSignal } from "@dmail/signal"

let installed = false
const { listen, emit, removeAllWhileCalling } = createSignal({
  installer: ({ emit }) => {
    installed = true
    return () => {
      installed = false
    }
  },
})

let called = false
listen(() => {
  called = true
})

removeAllWhileCalling(() => {
  installed // false
  called // false
  emit()
  called // false
})

installed // true
called // false
emit()
called // true
```
