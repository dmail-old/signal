# Signal

[![npm](https://badge.fury.io/js/%40dmail%2Fsignal.svg)](https://badge.fury.io/js/%40dmail%2Fsignal)
[![build](https://travis-ci.org/dmail/signal.svg?branch=master)](http://travis-ci.org/dmail/signal)
[![codecov](https://codecov.io/gh/dmail/signal/branch/master/graph/badge.svg)](https://codecov.io/gh/dmail/signal)

> Manage a list of functions to call on demand

## Installing / Getting started

```shell
npm install @dmail/signal
```

```javascript
import { createSignal } from "@dmail/signal"

const signal = createSignal()

signal.listen((arg) => {
  console.log(arg)
})

signal.emit("Hello world")
```

Executing above code logs `"Hello world"` in the console

## Style guide

Prettier and eslint are used to ensure code style and format

## API reference

* [api documentation](./docs/api.md)

## Licensing

MIT
