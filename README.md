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

// create a signal
const signal = createSignal()

// register a function to call on demand
signal.listen((arg) => {
  console.log(arg)
})

// call function registered on that signal
signal.emit("Hello world")
```

Executing above code logs "Hello world" in the console

## Tests

```shell
npm test
```

## Style guide

Prettier and eslint are used to ensure code style and format

## API reference

* [api documentation](./docs/api.md)

## Licensing

MIT
