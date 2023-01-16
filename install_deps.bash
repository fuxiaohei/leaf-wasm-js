#!/usr/bin/env bash

curl -vL https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-19/wasi-sdk-19.0-macos.tar.gz --output wasi-sdk-19.0-macos.tar.gz
tar -xzvf wasi-sdk-19.0-macos.tar.gz
wasi_sdk_path=$(pwd)"/wasi-sdk-19.0"
export QUICKJS_WASM_SYS_WASI_SDK_PATH=$wasi_sdk_path