.PHONY: release, build

build:
	cargo build --target wasm32-wasi
	cp ./target/wasm32-wasi/debug/leaf-wasm-js.wasm ./
	wizer leaf-wasm-js.wasm -o leaf-wasm-js-wizer.wasm --allow-wasi --inherit-stdio=true --inherit-env=true

release:
	cargo build --target wasm32-wasi --release
	cp ./target/wasm32-wasi/release/leaf-wasm-js.wasm ./
	wizer leaf-wasm-js.wasm -o leaf-wasm-js-wizer.wasm --allow-wasi --inherit-stdio=true --inherit-env=true