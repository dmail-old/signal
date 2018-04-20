# Recursed hook

When a signal is recursed it calls a function, the default function logs a warning in the console.

```javascript
import { createSignal } from "@dmail/signal"

const { listen, emit } = createSignal()

listen(emit) // logs a warning then throw because infinite recursion
```

You can disable this behaviour by passing null/undefined as shown below

```javascript
import { createSignal } from "@dmail/signal"

const { listen, emit } = createSignal({ recursed: null })

listen(emit) // throw because infinite recursion without warning
```

You can have your own recursed function

```javascript
import { createSignal } from "@dmail/signal"

const recursed = () => {
  throw new Error("signal must not be recursed")
}
const { listen, emit } = createSignal({ recursed })

listen(emit) // throw with signal must not be recursed
```
