.PHONY: build-release, build

build:
	cargo build --target wasm32-wasi && \
	cp ./target/wasm32-wasi/debug/leaf-wasm-js.wasm ./

build-release:
	cargo build --target wasm32-wasi --release && \
	cp ./target/wasm32-wasi/release/leaf-wasm-js.wasm ./