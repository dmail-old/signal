# Signal

[![npm](https://badge.fury.io/js/%40dmail%2Fsignal.svg)](https://badge.fury.io/js/%40dmail%2Fsignal)
[![build](https://travis-ci.org/dmail/signal.svg?branch=master)](http://travis-ci.org/dmail/signal)
[![codecov](https://codecov.io/gh/dmail/signal/branch/master/graph/badge.svg)](https://codecov.io/gh/dmail/signal)

A signal can register listeners that gets notified when signal emits something

```javascript
import { createSignal } from "@dmail/signal"

const { listen, emit } = createSignal()

let value
listen((arg) => {
	value = arg
})
emit("foo")

value // "foo"
```

Check the full [API documentation](./docs/api.md) for more.
