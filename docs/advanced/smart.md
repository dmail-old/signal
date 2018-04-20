# Smart signal

A smart signal calls a listener immediatly if it has previously emitted something.

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
