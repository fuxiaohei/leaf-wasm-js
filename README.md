# leaf-wasm-js

build `quickjs.wasm` for leaf-wasm project.

current code **only test on MacOS**.

## Prerequisites

Install `node` and `npm`.

Install `rust` and `cargo`.

## Build

run command:

```bash
./install_deps.sh
make release
```

## Test

test js vendor runnable:

```bash
make test
```
