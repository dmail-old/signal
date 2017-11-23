# Signal

[![npm](https://badge.fury.io/js/%40dmail%2Fsignal.svg)](https://badge.fury.io/js/%40dmail%2Fsignal)
[![build](https://travis-ci.org/dmail/signal.svg?branch=master)](http://travis-ci.org/dmail/signal)
[![codecov](https://codecov.io/gh/dmail/signal/branch/master/graph/badge.svg)](https://codecov.io/gh/dmail/signal)

A signal can register listeners that gets notified when signal emits something

```javascript
import { createSignal } from "@dmail/signal"

let value
const listener = arg => {
	value = arg
}
const completed = createSignal()

completed.listen(listener)
if (value) {
	throw new Error("signal.listen(listener) must await signal.emit() before calling listener")
}
completed.emit("foo")
if (value === undefined) {
	if (value) {
		throw new Error("signal.emit('foo') must call listener with 'foo'")
	}
}
```

Check the full [API documentation](./docs/api.md) for more.
