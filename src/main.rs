use quickjs_wasm_rs::Context;

use std::io::{self, Read};

#[export_name = "wizer.initialize"]
pub extern "C" fn init() {
    println!("wizer initialize");
}

fn main() {
    let mut input_script = String::new();
    io::stdin().read_to_string(&mut input_script).unwrap();

    let context = Context::default();

    let eval_result = context.eval_global("index.js", input_script.as_str());
    if eval_result.is_err() {
        println!("Error: {}", eval_result.err().unwrap());
        return;
    }
    println!("eval_result: {}", eval_result.unwrap().as_str().unwrap());

    println!("input_script: {}", input_script);
}
