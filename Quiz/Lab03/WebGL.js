var VSHADER_SOURCE = `
        attribute vec4 a_Position;
        attribute vec4 a_Color;
        varying vec4 v_Color;
        uniform mat4 u_modelMatrix;
        void main(){
            gl_Position = u_modelMatrix * a_Position;
            gl_PointSize = 10.0;
            v_Color = a_Color;
        }    
    `;

var FSHADER_SOURCE = `
        precision mediump float;
        varying vec4 v_Color;
        void main(){
            gl_FragColor = v_Color;
        }
    `;


function createProgram(gl, vertexShader, fragmentShader){
    //create the program and attach the shaders
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    //if success, return the program. if not, log the program info, and delete it.
    if(gl.getProgramParameter(program, gl.LINK_STATUS)){
        return program;
    }
    alert(gl.getProgramInfoLog(program) + "");
    gl.deleteProgram(program);
}

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

/////BEGIN:///////////////////////////////////////////////////////////////////////////////////////////////
/////The folloing three function is for creating vertex buffer, but link to shader to user later//////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////
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

function initVertexBufferForLaterUse(gl, vertices, colors){
    var nVertices = vertices.length / 3;

    var o = new Object();
    o.vertexBuffer = initArrayBufferForLaterUse(gl, new Float32Array(vertices), 3, gl.FLOAT);
    o.colorBuffer = initArrayBufferForLaterUse(gl, new Float32Array(colors), 3, gl.FLOAT);
    if (!o.vertexBuffer || !o.colorBuffer) 
        console.log("Error: in initVertexBufferForLaterUse(gl, vertices, colors)"); 
    o.numVertices = nVertices;

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return o;
}
/////END://///////////////////////////////////////////////////////////////////////////////////////////////
/////The folloing three function is for creating vertex buffer, but link to shader to user later//////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

var transformMat = new Matrix4(); //cuon 4x4 matrix

//NOTE: You are NOT allowed to change the vertex information here
var triangleVerticesA = [0.0, 0.2, 0.0, -0.1, -0.3, 0.0, 0.1, -0.3, 0.0]; //green rotating triangle vertices
var triangleColorA = [0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0 ]; //green trotating riangle color

//NOTE: You are NOT allowed to change the vertex information here
var triangleVerticesB = [0.0, 0.0, 0.0, -0.1, -0.5, 0.0, 0.1, -0.5, 0.0]; //green rotating triangle vertices
var triangleColorB= [0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0 ]; //green trotating riangle color
   
var triangle1XMove = 0;
var triangle2Angle = 125;
var triangle2HeightScale = 1;
var triangle3Angle = 0;

function main(){
    //////Get the canvas context
    var canvas = document.getElementById('webgl');
    var gl = canvas.getContext('webgl2');
    if(!gl){
        console.log('Failed to get the rendering context for WebGL');
        return ;
    }

    /////compile shader and use it
    program = compileShader(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    gl.useProgram(program);

    /////prepare attribute reference of the shader
    program.a_Position = gl.getAttribLocation(program, 'a_Position');
    program.a_Color = gl.getAttribLocation(program, 'a_Color');
    program.u_modelMatrix = gl.getUniformLocation(program, 'u_modelMatrix');
    if(program.a_Position<0 || program.a_Color<0 || program.u_modelMatrix < 0)  
        console.log('Error: f(program.a_Position<0 || program.a_Color<0 || .....');

    /////create vertex buffer of rotating point, center points, rotating triangle for later use
    triangleModelA = initVertexBufferForLaterUse(gl, triangleVerticesA, triangleColorA);
    triangleModelB = initVertexBufferForLaterUse(gl, triangleVerticesB, triangleColorB);
    
    document.addEventListener('keydown', (event)=> {    
        if( event.key == 'a' || event.key == 'A'){ //move triangle1 to the left
            console.log('A')
            triangle1XMove -= 0.05;
            draw(gl)
        }else if ( event.key == 'd' || event.key == 'D'){  //move triangle1 to the right
            console.log('D')
            triangle1XMove += 0.05;
            draw(gl)
        }else if ( event.key == 'r' || event.key == 'R'){  //rotate the second triangle
            console.log('R')
            triangle2Angle += 10;
            draw(gl)
        }else if ( triangle2HeightScale < 1.5 && (event.key == 'l' || event.key == 'L')){ //elongate the second triangle
            console.log('L')
            triangle2HeightScale += 0.1;
            draw(gl)
        }else if ( triangle2HeightScale >0.2 && (event.key == 's' || event.key == 'S')){ //shorten the second triangle
            console.log('S')
            triangle2HeightScale -= 0.1;
            draw(gl)
        }else if ( (event.key == 'o' || event.key == 'O')){ //rotate the third triangle
            console.log('O')
            triangle3Angle += 10;
            draw(gl)
        }
    });
    draw(gl)
}

function draw(gl)
{
    ////clear background color by black
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    transformMat.setIdentity(); //set identity matrix to transformMat
    
    //Note: You are NOT Allowed to change the following code
    transformMat.translate(triangle1XMove, 0, 0);
    initAttributeVariable(gl, program.a_Position, triangleModelA.vertexBuffer);//set triangle  vertex to shader varibale
    initAttributeVariable(gl, program.a_Color, triangleModelA.colorBuffer); //set triangle  color to shader varibale
    gl.uniformMatrix4fv(program.u_modelMatrix, false, transformMat.elements);//pass current transformMat to shader
    gl.drawArrays(gl.TRIANGLES, 0, triangleModelA.numVertices);//draw a triangle using triangleModelA
    ////////////// END: draw the first triangle

    //////////TODO: draw the other 2 triangles////////////////
    /////////The code segment from here to the end of draw() function 
    /////////   is the only code segment you are allowed to change in this practice

    transformMat.translate(0, 0.2, 0);
    transformMat.rotate(triangle2Angle, 0.0, 0.0);
    transformMat.scale(1, triangle2HeightScale, 0);
    transformMat.translate(0, -0.2, 0);
    initAttributeVariable(gl, program.a_Position, triangleModelA.vertexBuffer);//set triangle  vertex to shader varibale
    initAttributeVariable(gl, program.a_Color, triangleModelA.colorBuffer); //set triangle  color to shader varibale
    gl.uniformMatrix4fv(program.u_modelMatrix, false, transformMat.elements);//pass current transformMat to shader
    gl.drawArrays(gl.TRIANGLES, 0, triangleModelA.numVertices);//draw a triangle using triangleModelA

    transformMat.translate(0.1, -0.3, 0);
    transformMat.scale(1, 1 / triangle2HeightScale, 0);
    transformMat.rotate(triangle3Angle, 0.0, 0.0);
    transformMat.translate(0, -0.2, 0);
    initAttributeVariable(gl, program.a_Position, triangleModelA.vertexBuffer);//set triangle  vertex to shader varibale
    initAttributeVariable(gl, program.a_Color, triangleModelA.colorBuffer); //set triangle  color to shader varibale
    gl.uniformMatrix4fv(program.u_modelMatrix, false, transformMat.elements);//pass current transformMat to shader
    gl.drawArrays(gl.TRIANGLES, 0, triangleModelA.numVertices);//draw a triangle using triangleModelA

}
