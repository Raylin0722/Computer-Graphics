var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Normal;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_modelMatrix;
    uniform mat4 u_normalMatrix;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    void main(){
        gl_Position = u_MvpMatrix * a_Position;
        v_PositionInWorld = (u_modelMatrix * a_Position).xyz; 
        v_Normal = normalize(vec3(u_normalMatrix * a_Normal));
    }    
`;

var FSHADER_SOURCE = `
    precision mediump float;
    uniform vec3 u_LightPosition;
    uniform vec3 u_ViewPosition;
    uniform float u_Ka;
    uniform float u_Kd;
    uniform float u_Ks;
    uniform float u_shininess;
    uniform vec3 u_Color;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    void main(){
        // let ambient and diffuse color are u_Color 
        // (you can also input them from ouside and make them different)
        vec3 ambientLightColor = u_Color;
        vec3 diffuseLightColor = u_Color;
        // assume white specular light (you can also input it from ouside)
        vec3 specularLightColor = vec3(1.0, 1.0, 1.0);        

        vec3 ambient = ambientLightColor * u_Ka;

        vec3 normal = normalize(v_Normal);
        vec3 lightDirection = normalize(u_LightPosition - v_PositionInWorld);
        float nDotL = max(dot(lightDirection, normal), 0.0);
        vec3 diffuse = diffuseLightColor * u_Kd * nDotL;

        vec3 specular = vec3(0.0, 0.0, 0.0);
        if(nDotL > 0.0) {
            vec3 R = reflect(-lightDirection, normal);
            // V: the vector, point to viewer       
            vec3 V = normalize(u_ViewPosition - v_PositionInWorld); 
            float specAngle = clamp(dot(R, V), 0.0, 1.0);
            specular = u_Ks * pow(specAngle, u_shininess) * specularLightColor; 
        }

        gl_FragColor = vec4( ambient + diffuse + specular, 1.0 );
    }
`;

function compileShader(gl, vShaderText, fShaderText){
    //////Build vertex and fragment shader objects
    var vertexShader = gl.createShader(gl.VERTEX_SHADER)
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    //The way to  set up shader text source
    gl.shaderSource(vertexShader, vShaderText)
    gl.shaderSource(fragmentShader, fShaderText)
    //compile vertex shader
    gl.compileShader(vertexShader)
    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
        console.log('vertex shader ereror');
        var message = gl.getShaderInfoLog(vertexShader); 
        console.log(message);//print shader compiling error message
    }
    //compile fragment shader
    gl.compileShader(fragmentShader)
    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
        console.log('fragment shader ereror');
        var message = gl.getShaderInfoLog(fragmentShader);
        console.log(message);//print shader compiling error message
    }

    /////link shader to program (by a self-define function)
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    //if not success, log the program info, and delete it.
    if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
        alert(gl.getProgramInfoLog(program) + "");
        gl.deleteProgram(program);
    }

    return program;
}


var mouseLastX, mouseLastY;
var mouseDragging = false;
var angleX = 0, angleY = 0;
var gl, canvas;
var mvpMatrix;
var modelMatrix;
var normalMatrix;
var nVertex;
var cameraX = 1, cameraY = 3, cameraZ = 10;
var lightX = 2, lightY = 2, lightZ = 2;
var circle = [];
var cube = [];
var light = [];
var triangle = [];
var rotateTriangle = [];
var rectangle = [];
var rectangleR = [], rectangleL = [];
var zoomScale = 1;
var rotateAngle = 0;
var moveX = 0, moveZ = 0;
var objRotateL = 231;
var objRotateR = 320;
var robotRotate1 = 90;
var robotRotate2 = -45;
var robotRotate3 = 0;
var grabMode = false;
var touch = false;

function initAttributeVariable(gl, a_attribute, buffer){
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
}
function initArrayBufferForLaterUse(gl, data, num, type) {
    // Create a buffer object
    var buffer = gl.createBuffer();
    if (!buffer) {
      console.log('Failed to create the buffer object');
      return null;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  
    // Store the necessary information to assign the object to the attribute variable later
    buffer.num = num;
    buffer.type = type;
  
    return buffer;
  }
  
function initVertexBufferForLaterUse(gl, vertices, normals, texCoords){
    var nVertices = vertices.length / 3;
  
    var o = new Object();
    o.vertexBuffer = initArrayBufferForLaterUse(gl, new Float32Array(vertices), 3, gl.FLOAT);
    if( normals != null ) o.normalBuffer = initArrayBufferForLaterUse(gl, new Float32Array(normals), 3, gl.FLOAT);
    if( texCoords != null ) o.texCoordBuffer = initArrayBufferForLaterUse(gl, new Float32Array(texCoords), 2, gl.FLOAT);
    //you can have error check here
    o.numVertices = nVertices;
  
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  
    return o;
}

function getNormalOnVertices(vertices){
    var normals = [];
    var nTriangles = vertices.length/9;
    for(let i=0; i < nTriangles; i ++ ){
        var idx = i * 9 + 0 * 3;
        var p0x = vertices[idx+0], p0y = vertices[idx+1], p0z = vertices[idx+2];
        idx = i * 9 + 1 * 3;
        var p1x = vertices[idx+0], p1y = vertices[idx+1], p1z = vertices[idx+2];
        idx = i * 9 + 2 * 3;
        var p2x = vertices[idx+0], p2y = vertices[idx+1], p2z = vertices[idx+2];
  
        var ux = p1x - p0x, uy = p1y - p0y, uz = p1z - p0z;
        var vx = p2x - p0x, vy = p2y - p0y, vz = p2z - p0z;
  
        var nx = uy*vz - uz*vy;
        var ny = uz*vx - ux*vz;
        var nz = ux*vy - uy*vx;
  
        var norm = Math.sqrt(nx*nx + ny*ny + nz*nz);
        nx = nx / norm;
        ny = ny / norm;
        nz = nz / norm;
  
        normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
    }
    return normals;
}

function main(){
    canvas = document.getElementById('webgl');
    gl = canvas.getContext('webgl2');
    if(!gl){
        console.log('Failed to get the rendering context for WebGL');
        return ;
    }

    program = compileShader(gl, VSHADER_SOURCE, FSHADER_SOURCE);

    gl.useProgram(program);

    program.a_Position = gl.getAttribLocation(program, 'a_Position'); 
    program.a_Normal = gl.getAttribLocation(program, 'a_Normal'); 
    program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix'); 
    program.u_modelMatrix = gl.getUniformLocation(program, 'u_modelMatrix'); 
    program.u_normalMatrix = gl.getUniformLocation(program, 'u_normalMatrix');
    program.u_LightPosition = gl.getUniformLocation(program, 'u_LightPosition');
    program.u_ViewPosition = gl.getUniformLocation(program, 'u_ViewPosition');
    program.u_Ka = gl.getUniformLocation(program, 'u_Ka'); 
    program.u_Kd = gl.getUniformLocation(program, 'u_Kd');
    program.u_Ks = gl.getUniformLocation(program, 'u_Ks');
    program.u_shininess = gl.getUniformLocation(program, 'u_shininess');
    program.u_Color = gl.getUniformLocation(program, 'u_Color'); 

    ////cube
    //TODO-1: create vertices for the cube whose edge length is 2.0 (or 1.0 is also fine)
    //F: Face, T: Triangle, V: vertex (XYZ)
    cubeVertices = [1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0,   //this row for the face z = 1.0
                    1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0,   //this row for the face x = 1.0
                    1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0,  //this row for the face y = 1.0
                    -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0,   //this row for the face x = -1.0
                    -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,    //this row for the face y = -1.0
                    1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0   //this row for the face z = -1.0
                  ]
    lightVertices = [0.1, 0.1, 0.1, -0.1, 0.1, 0.1, -0.1, -0.1, 0.1, 0.1, 0.1, 0.1, -0.1, -0.1, 0.1, 0.1, -0.1, 0.1,   //this row for the face z = 0.1
                  0.1, 0.1, 0.1, 0.1, -0.1, 0.1, 0.1, -0.1, -0.1, 0.1, 0.1, 0.1, 0.1, -0.1, -0.1, 0.1, 0.1, -0.1,   //this row for the face x = 0.1
                  0.1, 0.1, 0.1, 0.1, 0.1, -0.1, -0.1, 0.1, -0.1, 0.1, 0.1, 0.1, -0.1, 0.1, -0.1, -0.1, 0.1, 0.1,  //this row for the face y = 0.1
                  -0.1, 0.1, 0.1, -0.1, 0.1, -0.1, -0.1, -0.1, -0.1, -0.1, 0.1, 0.1, -0.1, -0.1, -0.1, -0.1, -0.1, 0.1,   //this row for the face x = -0.1
                  -0.1, -0.1, -0.1, 0.1, -0.1, -0.1, 0.1, -0.1, 0.1, -0.1, -0.1, -0.1, 0.1, -0.1, 0.1, -0.1, -0.1, 0.1,    //this row for the face y = -0.1
                  0.1, -0.1, -0.1, -0.1, -0.1, -0.1, -0.1, 0.1, -0.1, 0.1, -0.1, -0.1, -0.1, 0.1, -0.1, 0.1, 0.1, -0.1   //this row for the face z = -1.0
                ]
    cubeNormals = getNormalOnVertices(cubeVertices);
    lightNormals = getNormalOnVertices(lightVertices);
    
    triangleVertices = [0.5, 0.5, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 
                        0.5, 0.5, 0.5, 0.0, 0.0, 0.5, 1.0, 0.0, 0.5, 
                        0.5, 0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.0,
                        1.0, 0.0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.0, 0.5, 0.5, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.5,
                        0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.5, 1.0, 0.0, 0.5, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0,
                      ];


    triangleNormals = getNormalOnVertices(triangleVertices);
    
    rotateTriangleVertices = [0.25, 0.2, 0.2, 0.0, 0.0, 0.2, 0.5, 0.0, 0.2, 
                              0.25, 0.2, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 
                              0.25, 0.2, 0.2, 0.0, 0.0, 0.2, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.25, 0.2, 0.0, 0.25, 0.2, 0.2,
                              0.5, 0.0, 0.0, 0.25, 0.2, 0.0, 0.25, 0.2, 0.2, 0.25, 0.2, 0.2, 0.5, 0.0, 0.2, 0.5, 0.0, 0.0,
                              0.0, 0.0, 0.2, 0.5, 0.0, 0.2, 0.5, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.2,
                             ];

    rotateTriangleNormals = getNormalOnVertices(rotateTriangleVertices);
    
    rectangleVertices = [0.50, 0.25, 0.25, 0.00, 0.25, 0.25, 0.00, 0.00, 0.25, 0.50, 0.25, 0.25, 0.00, 0.00, 0.25, 0.50, 0.00, 0.25,   //this row for the face z = 0.50
                         0.50, 0.25, 0.25, 0.50, 0.00, 0.25, 0.50, 0.00, 0.00, 0.50, 0.25, 0.25, 0.50, 0.00, 0.00, 0.50, 0.25, 0.00,   //this row for the face x = 0.50
                         0.50, 0.25, 0.25, 0.50, 0.25, 0.00, 0.00, 0.25, 0.00, 0.50, 0.25, 0.25, 0.00, 0.25, 0.00, 0.00, 0.25, 0.25,  //this row for the face y = 0.50
                         0.00, 0.25, 0.25, 0.00, 0.25, 0.00, 0.00, 0.00, 0.00, 0.00, 0.25, 0.25, 0.00, 0.00, 0.00, 0.00, 0.00, 0.25,   //this row for the face x = 0.00
                         0.00, 0.00, 0.00, 0.50, 0.00, 0.00, 0.50, 0.00, 0.25, 0.00, 0.00, 0.00, 0.50, 0.00, 0.25, 0.00, 0.00, 0.25,    //this row for the face y = 0.00
                         0.50, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.25, 0.00, 0.50, 0.00, 0.00, 0.00, 0.25, 0.00, 0.50, 0.25, 0.00   //this row for the face z = 0.0
                        ];
    rectangleVerticesR = [0.50, 0.50, 0.40, 0.00, 0.50, 0.40, 0.00, 0.00, 0.40, 0.50, 0.50, 0.40, 0.00, 0.00, 0.40, 0.50, 0.00, 0.40,   //this row for the face z = 0.50
                          0.50, 0.50, 0.40, 0.50, 0.00, 0.40, 0.50, 0.00, 0.00, 0.50, 0.50, 0.40, 0.50, 0.00, 0.00, 0.50, 0.50, 0.00,   //this row for the face x = 0.50
                          0.50, 0.50, 0.40, 0.50, 0.50, 0.00, 0.00, 0.50, 0.00, 0.50, 0.50, 0.40, 0.00, 0.50, 0.00, 0.00, 0.50, 0.40,  //this row for the face y = 0.50
                          0.00, 0.50, 0.40, 0.00, 0.50, 0.00, 0.00, 0.00, 0.00, 0.00, 0.50, 0.40, 0.00, 0.00, 0.00, 0.00, 0.00, 0.40,   //this row for the face x = 0.00
                          0.00, 0.00, 0.00, 0.50, 0.00, 0.00, 0.50, 0.00, 0.40, 0.00, 0.00, 0.00, 0.50, 0.00, 0.40, 0.00, 0.00, 0.40,    //this row for the face y = 0.00
                          0.50, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.50, 0.00, 0.50, 0.00, 0.00, 0.00, 0.50, 0.00, 0.50, 0.50, 0.00   //this row for the face z = 0.0
                         ];
    rectangleVerticesL = [0.25, 0.50, 0.25, 0.00, 0.50, 0.25, 0.00, 0.00, 0.25, 0.25, 0.50, 0.25, 0.00, 0.00, 0.25, 0.25, 0.00, 0.25,   //this row for the face z = 0.50
                          0.25, 0.50, 0.25, 0.25, 0.00, 0.25, 0.25, 0.00, 0.00, 0.25, 0.50, 0.25, 0.25, 0.00, 0.00, 0.25, 0.50, 0.00,   //this row for the face x = 0.50
                          0.25, 0.50, 0.25, 0.25, 0.50, 0.00, 0.00, 0.50, 0.00, 0.25, 0.50, 0.25, 0.00, 0.50, 0.00, 0.00, 0.50, 0.25,  //this row for the face y = 0.50
                          0.00, 0.50, 0.25, 0.00, 0.50, 0.00, 0.00, 0.00, 0.00, 0.00, 0.50, 0.25, 0.00, 0.00, 0.00, 0.00, 0.00, 0.25,   //this row for the face x = 0.00
                          0.00, 0.00, 0.00, 0.25, 0.00, 0.00, 0.25, 0.00, 0.25, 0.00, 0.00, 0.00, 0.25, 0.00, 0.25, 0.00, 0.00, 0.25,    //this row for the face y = 0.00
                          0.25, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.50, 0.00, 0.25, 0.00, 0.00, 0.00, 0.50, 0.00, 0.25, 0.50, 0.00   //this row for the face z = 0.0
                        ];
    rectangleNormals = getNormalOnVertices(rectangleVertices);
    rectangleNormalsR = getNormalOnVertices(rectangleVerticesR);
    rectangleNormalsL = getNormalOnVertices(rectangleVerticesL);


    let o = initVertexBufferForLaterUse(gl, cubeVertices, cubeNormals, null);
    cube.push(o);

    o = initVertexBufferForLaterUse(gl, triangleVertices, triangleNormals, null);
    triangle.push(o);

    o = initVertexBufferForLaterUse(gl, rectangleVertices, rectangleNormals, null);
    rectangle.push(o);

    o = initVertexBufferForLaterUse(gl, rectangleVerticesR, rectangleNormalsR, null);
    rectangleR.push(o);

    o = initVertexBufferForLaterUse(gl, rectangleVerticesL, rectangleNormalsL, null);
    rectangleL.push(o);

    o = initVertexBufferForLaterUse(gl, rotateTriangleVertices, rotateTriangleNormals, null);
    rotateTriangle.push(o);

    o = initVertexBufferForLaterUse(gl, lightVertices, lightNormals, null);
    light.push(o);

    mvpMatrix = new Matrix4();
    modelMatrix = new Matrix4();
    normalMatrix = new Matrix4();

    gl.enable(gl.DEPTH_TEST);

    draw();//draw it once before mouse move

    

    canvas.onmousedown = function(ev){mouseDown(ev)};
    canvas.onmousemove = function(ev){mouseMove(ev)};
    canvas.onmouseup = function(ev){mouseUp(ev)};
    document.onkeydown = function(ev){keydown(ev)};

    var slider1 = document.getElementById("Zoom");
    slider1.oninput = function() {
        zoomScale = this.value / 50.0;
        console.log(this.value);
        draw();
    }
}

var tmp = new Matrix4();
var matStack = [];
var mdlMatrix = new Matrix4();
function pushMatrix(){
    matStack.push(new Matrix4(mdlMatrix));
}
function popMatrix(){
    mdlMatrix = matStack.pop();
}



var objMatrix = new Matrix4();
objMatrix.setTranslate(0, 0.1, 0);

function draw(){
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mdlMatrix.setTranslate(lightX, lightY, lightZ);
    drawLightCube(light, mdlMatrix, 1, 1, 1);

    //mdlMatrix.setScale(2.0, 0.1, 2.0);
    mdlMatrix.setScale(3 * zoomScale, 0.1 * zoomScale, 3 * zoomScale);
    //Cube (ground)
    drawOneObject(cube, mdlMatrix, 1.0, 0.4, 0.4);

    mdlMatrix.setIdentity();
    mdlMatrix.translate(1+moveX, 0.25, 1 +moveZ);
    pushMatrix();
    tmp.setScale(zoomScale, zoomScale, zoomScale);
    tmp.multiply(mdlMatrix);
    drawOneObject(rectangleR, tmp, 1.0, 1.0, 1.0);

    popMatrix();
    pushMatrix();
    mdlMatrix.scale(0.3, 0.3, 0.3);
    mdlMatrix.translate(-0.3, -0.5, 0.35);
    tmp.setScale(zoomScale, zoomScale, zoomScale);
    tmp.multiply(mdlMatrix);
    drawOneObject(triangle, tmp, 1.0, 0.0, 0.0);

    popMatrix();
    pushMatrix();
    mdlMatrix.scale(0.3, 0.3, 0.3);
    mdlMatrix.translate(1.0, -0.5, 0.35);
    tmp.setScale(zoomScale, zoomScale, zoomScale);
    tmp.multiply(mdlMatrix);
    drawOneObject(triangle, tmp, 1.0, 0.0, 0.0);

    // green triangle
    popMatrix();
    pushMatrix();
    mdlMatrix.translate(0.01, 0.5, 0);
    mdlMatrix.rotate(robotRotate3, 0, 1, 0);
    tmp.setScale(zoomScale, zoomScale, zoomScale);
    tmp.multiply(mdlMatrix);
    drawOneObject(triangle, tmp, 0.0, 1.0, 0.0);

    // yellow triangle(joint1)
    mdlMatrix.translate(1, 0, 0.1);
    mdlMatrix.rotate(robotRotate1, 0, 0, 1)
    tmp.setIdentity();
    tmp.setScale(zoomScale, zoomScale, zoomScale);
    tmp.multiply(mdlMatrix);
    drawOneObject(rotateTriangle, tmp, 1.0, 1.0, 0);

    mdlMatrix.translate(0.1, -0.5, -0.03);
    tmp.setIdentity();
    tmp.setScale(zoomScale, zoomScale, zoomScale);
    tmp.multiply(mdlMatrix);
    drawOneObject(rectangleL, tmp, 0.2, 0.2, 1.0);

    // yellow triangle(joint2)
    mdlMatrix.translate(0, 0.0, 0.03);
    mdlMatrix.rotate(robotRotate2, 0, 0, 1)
    tmp.setIdentity();
    tmp.setScale(zoomScale, zoomScale, zoomScale);
    tmp.multiply(mdlMatrix);
    drawOneObject(rotateTriangle, tmp, 1.0, 1.0, 0);

    mdlMatrix.translate(0.1, -0.5, -0.03);
    tmp.setIdentity();
    tmp.setScale(zoomScale, zoomScale, zoomScale);
    tmp.multiply(mdlMatrix);
    drawOneObject(rectangleL, tmp, 0.2, 0.2, 1.0);

    check = new Matrix4(tmp);
    pushMatrix();

    //obj
    
    tmp.setIdentity();
    tmp.setScale(zoomScale, zoomScale, zoomScale);
    tmp.multiply(objMatrix);

    //checkGrab(check, tmp);

    needCheck = [[0.25, 0.50, 0.25, 1], [0.25, 0.50, 0.00, 1], [0.00, 0.50, 0.25, 1], [0.00, 0.50, 0.00, 1], 
                 [0.25, 0.00, 0.25, 1], [0.25, 0.00, 0.00, 1], [0.00, 0.00, 0.25, 1], [0.00, 0.00, 0.00, 1]];
    grabPos = [];
    objPos = [];
    obj = [[0.50, 0.50, 0.40, 1], [0.00, 0.00, 0.00, 1]];
    needCheck.forEach(vec4 => {
        grabPos.push(check.multiplyVector4(new Vector4(vec4)));
    });
    obj.forEach(vec =>{
        objPos.push(tmp.multiplyVector4(new Vector4(vec)));
    }) 
    var checking = 0;
    dist = []
    for(let i = 0; i < 8; i++){
        distance1 = Math.sqrt(Math.pow((grabPos[i].elements[0] - objPos[0].elements[0]).toFixed(6), 2) + 
        Math.pow((grabPos[i].elements[1] - objPos[0].elements[1]).toFixed(6), 2) +
        Math.pow((grabPos[i].elements[2] - objPos[0].elements[2]).toFixed(6), 2))
        dist.push(distance1);
        distance2 = Math.sqrt(Math.pow((grabPos[i].elements[0] - objPos[1].elements[0]).toFixed(6), 2) + 
        Math.pow((grabPos[i].elements[1] - objPos[1].elements[1]).toFixed(6), 2) +
        Math.pow((grabPos[i].elements[2] - objPos[1].elements[2]).toFixed(6), 2))
        dist.push(distance2);
        if(distance1 <= 0.3 * zoomScale || distance2 <= 0.3 * zoomScale){
            checking += 1;
        }
        
    }
    if(checking >= 1)
        touch = true;
    else
        touch = false;


    if(touch && grabMode){// grab
        tmp.setIdentity();
        tmp.setScale(zoomScale, zoomScale, zoomScale);
        mdlMatrix.translate(-0.2, -0.3, -0.1);
        tmp.multiply(mdlMatrix);
        drawOneObject(rectangleR, tmp, 0.3, 0.3, 0.3);
        objMatrix = new Matrix4(mdlMatrix);

    }
    else if(touch && !grabMode){// touch
        drawOneObject(rectangleR, tmp, 0, 0.7, 0.7);
    }
    else{
        drawOneObject(rectangleR, tmp, 1.0, 1.0, 1.0);
    }

    mdlMatrix = new Matrix4(objMatrix);
    pushMatrix();
    mdlMatrix.translate(0,0.5,0.1);
    mdlMatrix.rotate(objRotateL, 0 , 0, 1);
    tmp.setIdentity();
    tmp.setScale(zoomScale, zoomScale, zoomScale);
    tmp.multiply(mdlMatrix);
    drawOneObject(rotateTriangle, tmp, 1, 1, 0);

    mdlMatrix.translate(0, -0.5, -0.1);
    tmp.setIdentity();
    tmp.setScale(zoomScale, zoomScale, zoomScale);
    tmp.multiply(mdlMatrix);
    drawOneObject(rectangleR, tmp, 1, 0, 1);

    popMatrix();
    pushMatrix();
    mdlMatrix.translate(0.5,0.5,0.1);
    mdlMatrix.rotate(objRotateR, 0 , 0, 1);
    tmp.setIdentity();
    tmp.setScale(zoomScale, zoomScale, zoomScale);
    tmp.multiply(mdlMatrix);
    drawOneObject(rotateTriangle, tmp, 1, 1, 0);

    mdlMatrix.translate(0, 0, -0.1);
    mdlMatrix.rotate(38, 0, 0, 1);
    tmp.setIdentity();
    tmp.setScale(zoomScale, zoomScale, zoomScale);
    tmp.multiply(mdlMatrix);
    drawOneObject(rectangleR, tmp, 1, 0, 1);
}

//obj: the object components
//mdlMatrix: the model matrix without mouse rotation
//colorR, G, B: object color
function drawOneObject(obj, mdlMatrix, colorR, colorG, colorB){
    //model Matrix (part of the mvp matrix)
    modelMatrix.setRotate(angleY, 1, 0, 0);//for mouse rotation
    modelMatrix.rotate(angleX, 0, 1, 0);//for mouse rotation
    modelMatrix.multiply(mdlMatrix);
    //mvp: projection * view * model matrix  
    mvpMatrix.setPerspective(30, 1, 1, 100);
    mvpMatrix.lookAt(cameraX, cameraY, cameraZ, 0, 0, 1, 0, 1, 0);
    mvpMatrix.multiply(modelMatrix);

    //normal matrix
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();

    gl.uniform3f(program.u_LightPosition, lightX,lightY,lightZ);
    gl.uniform3f(program.u_ViewPosition, cameraX, cameraY, cameraZ);
    gl.uniform1f(program.u_Ka, 0.2);
    gl.uniform1f(program.u_Kd, 0.7);
    gl.uniform1f(program.u_Ks, 1.0);
    gl.uniform1f(program.u_shininess, 10.0);
    gl.uniform3f(program.u_Color, colorR, colorG, colorB);


    gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(program.u_normalMatrix, false, normalMatrix.elements);

    for( let i=0; i < obj.length; i ++ ){
      initAttributeVariable(gl, program.a_Position, obj[i].vertexBuffer);
      initAttributeVariable(gl, program.a_Normal, obj[i].normalBuffer);
      gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
    }
}

function drawLightCube(obj, mdlMatrix, colorR, colorG, colorB){
    //model Matrix (part of the mvp matrix)
    modelMatrix.setIdentity().multiply(mdlMatrix);
    //mvp: projection * view * model matrix  
    mvpMatrix.setPerspective(30, 1, 1, 100);
    mvpMatrix.lookAt(cameraX, cameraY, cameraZ, 0, 0, 1, 0, 1, 0);
    mvpMatrix.multiply(modelMatrix);

    //normal matrix
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();

    gl.uniform3f(program.u_LightPosition, lightX,lightY,lightZ);
    gl.uniform3f(program.u_ViewPosition, cameraX, cameraY, cameraZ);
    gl.uniform1f(program.u_Ka, 0.2);
    gl.uniform1f(program.u_Kd, 0.7);
    gl.uniform1f(program.u_Ks, 1.0);
    gl.uniform1f(program.u_shininess, 10.0);
    gl.uniform3f(program.u_Color, colorR, colorG, colorB);


    gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(program.u_normalMatrix, false, normalMatrix.elements);

    for( let i=0; i < obj.length; i ++ ){
      initAttributeVariable(gl, program.a_Position, obj[i].vertexBuffer);
      initAttributeVariable(gl, program.a_Normal, obj[i].normalBuffer);
      gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
    }
}


function parseOBJ(text) {
  // because indices are base 1 let's just fill in the 0th data
  const objPositions = [[0, 0, 0]];
  const objTexcoords = [[0, 0]];
  const objNormals = [[0, 0, 0]];

  // same order as `f` indices
  const objVertexData = [
    objPositions,
    objTexcoords,
    objNormals,
  ];

  // same order as `f` indices
  let webglVertexData = [
    [],   // positions
    [],   // texcoords
    [],   // normals
  ];

  const materialLibs = [];
  const geometries = [];
  let geometry;
  let groups = ['default'];
  let material = 'default';
  let object = 'default';

  const noop = () => {};

  function newGeometry() {
    // If there is an existing geometry and it's
    // not empty then start a new one.
    if (geometry && geometry.data.position.length) {
      geometry = undefined;
    }
  }

  function setGeometry() {
    if (!geometry) {
      const position = [];
      const texcoord = [];
      const normal = [];
      webglVertexData = [
        position,
        texcoord,
        normal,
      ];
      geometry = {
        object,
        groups,
        material,
        data: {
          position,
          texcoord,
          normal,
        },
      };
      geometries.push(geometry);
    }
  }

  function addVertex(vert) {
    const ptn = vert.split('/');
    ptn.forEach((objIndexStr, i) => {
      if (!objIndexStr) {
        return;
      }
      const objIndex = parseInt(objIndexStr);
      const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
      webglVertexData[i].push(...objVertexData[i][index]);
    });
  }

  const keywords = {
    v(parts) {
      objPositions.push(parts.map(parseFloat));
    },
    vn(parts) {
      objNormals.push(parts.map(parseFloat));
    },
    vt(parts) {
      // should check for missing v and extra w?
      objTexcoords.push(parts.map(parseFloat));
    },
    f(parts) {
      setGeometry();
      const numTriangles = parts.length - 2;
      for (let tri = 0; tri < numTriangles; ++tri) {
        addVertex(parts[0]);
        addVertex(parts[tri + 1]);
        addVertex(parts[tri + 2]);
      }
    },
    s: noop,    // smoothing group
    mtllib(parts, unparsedArgs) {
      // the spec says there can be multiple filenames here
      // but many exist with spaces in a single filename
      materialLibs.push(unparsedArgs);
    },
    usemtl(parts, unparsedArgs) {
      material = unparsedArgs;
      newGeometry();
    },
    g(parts) {
      groups = parts;
      newGeometry();
    },
    o(parts, unparsedArgs) {
      object = unparsedArgs;
      newGeometry();
    },
  };

  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split('\n');
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = keywords[keyword];
    if (!handler) {
      console.warn('unhandled keyword:', keyword);  // eslint-disable-line no-console
      continue;
    }
    handler(parts, unparsedArgs);
  }

  // remove any arrays that have no entries.
  for (const geometry of geometries) {
    geometry.data = Object.fromEntries(
        Object.entries(geometry.data).filter(([, array]) => array.length > 0));
  }

  return {
    geometries,
    materialLibs,
  };
}

function mouseDown(ev){ 
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();
    if( rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom){
        mouseLastX = x;
        mouseLastY = y;
        mouseDragging = true;
    }
}

function mouseUp(ev){ 
    mouseDragging = false;
}

function mouseMove(ev){ 
    var x = ev.clientX;
    var y = ev.clientY;
    if( mouseDragging ){
        var factor = 100/canvas.height; //100 determine the spped you rotate the object
        var dx = factor * (x - mouseLastX);
        var dy = factor * (y - mouseLastY);

        angleX += dx; //yes, x for y, y for x, this is right
        angleY += dy;
    }
    mouseLastX = x;
    mouseLastY = y;

    draw();
}

function keydown(ev){
    switch(ev.key){
        case 'w': case 'W':
            moveZ -= 0.1;
            if(moveZ <= -4.1)
            moveZ = -4.1
            break;
        case 's': case 'S':
            moveZ += 0.1;
            if(moveZ >= 1.7)
            moveZ = 1.7
            break;
        case 'a': case 'A':
            moveX -= 0.1;
            if(moveX <= -3.9)
            moveX = -3.9
            break;
        case 'd': case 'D':
            moveX += 0.1;
            if(moveX >= 1.4)
            moveX = 1.4
            break;
        case 'q':
            objRotateL += 3
            if(objRotateL >= 231)
                objRotateL = 231;
            break;
        case 'Q':
            objRotateL -= 3
            if(objRotateL <= 180)
                objRotateL = 180;
            break;
        case 'e':
            objRotateR += 3
            if(objRotateR >= 320)
                objRotateR = 320;
            break;
        case 'E':
            objRotateR -= 3
            if(objRotateR <= 269)
                objRotateR = 269;
            break;
        case 'r':
            robotRotate1 += 3
            if(robotRotate1 >= 99)
                robotRotate1 = 99;
            break;
        case 'R':
            robotRotate1 -= 3
            if(robotRotate1 <= 60)
                robotRotate1 = 60;
            break;
        case 't':
            robotRotate2 += 3
            if(robotRotate2 >= -39)
                robotRotate2 = -39;
            break;
        case 'T':
            robotRotate2 -= 3
            if(robotRotate2 <= -90)
                robotRotate2 = -90;
            break;
        case 'y':
            robotRotate3 += 3;
            break;
            case 'Y':
            robotRotate3 -= 3;
            break;
        case 'g': case 'G':
            if(!grabMode)
                grabMode = true;
            else    
                grabMode = false;
    }

    draw();
}

