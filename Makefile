.PHONY: release, build

build:
	cargo build --target wasm32-wasi
	cp ./target/wasm32-wasi/debug/leaf_wasm_js.wasm ./quickjs.wasm
	# wizer leaf_wasm_js.wasm -o leaf_wasm_js_wizer.wasm --allow-wasi --inherit-stdio=true --inherit-env=true

release:
	cargo build --target wasm32-wasi --release
	cp ./target/wasm32-wasi/release/leaf_wasm_js.wasm ./quickjs.wasm
	# wizer leaf_wasm_js.wasm -o leaf_wasm_js_wizer.wasm --allow-wasi --inherit-stdio=true --inherit-env=true