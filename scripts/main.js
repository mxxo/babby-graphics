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

    // initialize the shader program
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    // aggregate the program info
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        },
    };

    // build all objects we want to draw
    const buffers = initBuffers(gl);

    // draw the scene
    drawScene(gl, programInfo, buffers);
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

// create buffer objects to store vertices (for now)
function initBuffers(gl) {
    // create a buffer for the square's positions
    const positionBuffer = gl.createBuffer();

    // select the positionBuffer to apply buffer ops on
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // create position array for the square
    const positions = [
        -1.0,  1.0,
         1.0,  1.0,
        -1.0, -1.0,
         1.0, -1.0,
    ];

    // pass positions (as a float32 array) to webgl to build the shape
    gl.bufferData(gl.ARRAY_BUFFER,
                  new Float32Array(positions),
                  gl.STATIC_DRAW);
    return {
       position: positionBuffer,
    };
}

// after the shaders are compiled, locations are looked up, and the vertices
// have been put into a buffer, we can render the scene
function drawScene(gl, programInfo, buffers) {

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // create a perspective matrix, used to simulate the perspective distortion
    // in a camera. Field of view is 45 deg, with an aspect ratio (width / height)
    // equal to the canvas and we only want to see objects between 0.1 units and 100
    // units away from the camera.

    const fieldOfView = 45 * Math.PI / 180; // radians '
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    // pass the new matrix in as first arg
    mat4.perspective(projectionMatrix,
                     fieldOfView,
                     aspect,
                     zNear,
                     zFar);

    // set dwg position to the identity point (scene centre)
    const modelViewMatrix = mat4.create();

    // move the drawing position back from the camera by 6 units before dwg

    mat4.translate(modelViewMatrix,      // destination matrix
                   modelViewMatrix,      // matrix to translate
                   [0.0, 0.0, -6.0]);    // translation vector

    // tell webgl how to extract positions from position buffer and put them
    // them into the vertexPosition attribute
    // -- scoped for neatness
    {
        const numComponents = 2; // pull out 2 vals per iteration
        const type = gl.FLOAT;   // the data is 32bit floats
        const normalize = false; // don't normalize
        const stride = 0;        // how many bytes from one value set to next
                                 // (zero means use the type info above to figure it out)
        const offset = 0;        // byte offset in the buffer to start from

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexPosition);
    }

    // tell webgl to use our program
    gl.useProgram(programInfo.program);

    // set shader uniforms
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix);

    {
        const offset = 0;
        const vertexCount = 4;
        gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
    }
}
