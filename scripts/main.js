main();

function main() {
    const canvas = document.querySelector("#glCanvas");

    // init gl context
    const gl = canvas.getContext("webgl");

    // only continue if webgl is working
    if (gl === null) {
      alert("Unable to initialize WebGL. Your browser or machine may not support it.");
      return;
    }

    // set clear color to fully opaque black
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // clear color buffer using the specified clear color
    gl.clear(gl.COLOR_BUFFER_BIT);
}
