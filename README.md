# Signal

[![npm](https://badge.fury.io/js/%40dmail%2Fsignal.svg)](https://badge.fury.io/js/%40dmail%2Fsignal)
[![build](https://travis-ci.org/dmail/signal.svg?branch=master)](http://travis-ci.org/dmail/signal)
[![codecov](https://codecov.io/gh/dmail/signal/branch/master/graph/badge.svg)](https://codecov.io/gh/dmail/signal)

A signal is an object notifying its listeners when it emits something.
To resume, it is a low level event emitter.

```javascript
import { createSignal } from "@dmail/signal"

const signal = createSignal()

signal.listen((arg) => {
  arg === "foo" // true
})
signal.emit("foo")
```

Check the [core api documentation](./docs/api.md) and [advanced api documentation](./docs/api-advanced.md).
