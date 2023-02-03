#!/usr/bin/env bash

curl -L https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-19/wasi-sdk-19.0-linux.tar.gz --output wasi-sdk-19.0-linux.tar.gz
tar -xzf wasi-sdk-19.0-linux.tar.gz

wasi_sdk_path=$(pwd)"/wasi-sdk-19.0"

echo "QUICKJS_WASM_SYS_WASI_SDK_PATH="$wasi_sdk_path
export QUICKJS_WASM_SYS_WASI_SDK_PATH=$wasi_sdk_path

(cd src/js_vendor && npm install)

make release