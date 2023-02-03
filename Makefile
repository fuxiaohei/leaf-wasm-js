.PHONY: release, build, venodr, test

venodr:
	cd src/js_vendor && npx webpack

build: venodr
	cargo build --target wasm32-wasi
	cp ./target/wasm32-wasi/debug/leaf_wasm_js.wasm ./quickjs.wasm

release: venodr
	cargo build --target wasm32-wasi --release
	cp ./target/wasm32-wasi/release/leaf_wasm_js.wasm ./quickjs.wasm
	wasm-opt --strip-debug -o quickjs.wasm quickjs.wasm

test: release
	cat src/js_vendor/dist/tests.js | wizer quickjs.wasm -o quickjs.wizer.wasm --allow-wasi --inherit-stdio=true --inherit-env=true --wasm-bulk-memory=true