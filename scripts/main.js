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

    // two types of shaders -> vertex & fragment
    // 1. each vertex is transformed from og coords to clipspace coords of
    // of webgl (ie from -1.0 to 1.0). Returns the vertex position in the
    // special variable gl_Position
    //
    // 2. fragment shader is called once for each pixel on each shape after the
    // vertex shader is run. It figures out the color of the pixel and returns
    // it to the WebGL layer using the special variable gl_FragColor

    // vertex shader program string in GLSL
    const vsSource = `
        attribute vec4 aVertexPosition;

        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;

        void main() {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        }
        `;

    // fragment shader program string
    // (only returns white)
    const fsSource = `
        void main() {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        }
        `;

}

// initialize a shader program

function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // create the shader program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // if we couldn't make the program, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: '
              + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

// create a shader, upload the source text and compile it
// takes context, shader type and the source code string
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    // send source code to shader object
    gl.shaderSource(shader, source);

    // compile shader
    gl.compileShader(shader);

    // check that it compiled OK
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}
