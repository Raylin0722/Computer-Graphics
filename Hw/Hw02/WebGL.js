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

var grabMode = false;
var scaleSize = 0.7;
var hexagonPos = [-0.2, 0, 0 , -0.1, 0.17, 0 , 0.1, 0.17, 0 ,
                  0.2, 0, 0 , 0.1, -0.17, 0 , -0.1, -0.17, 0];
var hexagonColor = [1, 0, 0 , 1, 0, 0 , 1, 0, 0 ,
                    1, 0, 0 , 1, 0, 0 , 1, 0, 0];
var rectanglePos = [-0.1, 0.05, 0 , 0.1, 0.05, 0 , 0.1, -0.05, 0 , -0.1, -0.05, 0]
var rectangeTopColor = [0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1]
var rectangleRPos = [-0.1, 0.03, 0 , 0.1, 0.03, 0 , 0.1, -0.03, 0 , -0.1, -0.03, 0]
var rectangeRColor = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
var trianglePos = [0.2, 0, 0 , 0, 0, 0 , 0.1,  0.1, 0]
var triangleColor = [0.7, 0.3, 0.5, 0.7, 0.3, 0.5, 0.7, 0.3, 0.5]
var objtrianglePos = [0, 0, 0 , -0.1, -0.2, 0 , 0.1,  -0.2, 0]
var objtriangleColor = [0.7, 0.3, 0.7, 0.7, 0.3, 0.7, 0.7, 0.3, 0.7]

var CVerticesR05 = [];
var CVerticesR025 = [];
var CVerticesR1 = [];
var CColors = [], tireColor = [], R025Color = [];
var CColorsTouch = [];
var CColorsGrab = [];
var CRadius = 0.05;
for (i = 0; i <= 1000; i++){
    CRadius = 0.05
    x = CRadius*Math.cos(i * 2 * Math.PI / 200)
    y = CRadius*Math.sin(i * 2 * Math.PI / 200) 
    CVerticesR05.push(x, y);
    CVerticesR025.push(x / 2, y / 2);
    CVerticesR1.push(2*x, 2*y);
    CColors.push(0.5, 0.5, 0.5); //circle normal color
    CColorsTouch.push(0, 0, 1); //color when the circle connect with the triangle corner
    CColorsGrab.push(0.5, 0, 0); //color when the circle is grabbed by the triangle corner
    tireColor.push(1, 1, 0);
    R025Color.push(0.2, 1, 0.2);
}


var transformMat = new Matrix4();
var CircletransMat = new Matrix4();





var matStack = [];

function pushMatrix(){
    matStack.push(new Matrix4(transformMat));
}
function popMatrix(){
    transformMat = matStack.pop();
}


var orginX = 0, orginY = 0, angle1 = -45, angle2 = 0, angle3 = 0, objangleL = 0, objangleR = 0;

function main(){
    //////Get the canvas context
    var canvas = document.getElementById('webgl');
    var gl = canvas.getContext('webgl2');
    if(!gl){
        console.log('Failed to get the rendering context for WebGL');
        return ;
    }

    program = compileShader(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    gl.useProgram(program);

    program.a_Position = gl.getAttribLocation(program, 'a_Position');
    program.a_Color = gl.getAttribLocation(program, 'a_Color');
    program.u_modelMatrix = gl.getUniformLocation(program, 'u_modelMatrix');
    if(program.a_Position<0 || program.a_Color<0 || program.u_modelMatrix < 0)  
        console.log('Error: f(program.a_Position<0 || program.a_Color<0 || .....');

   
    
    document.addEventListener('keydown', (event)=> {    
        if( event.key == 'a' || event.key == 'A'){ //move triangle1 to the left
            console.log('A')
            orginX -= 0.05;
            draw(gl);
        }else if ( event.key == 'd' || event.key == 'D'){  //move triangle1 to the right
            console.log('D')
            orginX += 0.05;
            draw(gl);
        }else if ( event.key == 's' || event.key == 'S'){ //shorten the second triangle
            console.log('S')
            orginY -= 0.05;
            draw(gl);
        }else if ( event.key == 'w' || event.key == 'W'){ //shorten the second triangle
            console.log('W')
            orginY += 0.05;
            draw(gl);
        }else if(event.key == 'z' || event.key == 'Z'){
            console.log('Z')
            scaleSize += 0.01;
            
            draw(gl);
        }
        else if(event.key == 'x' || event.key == 'X'){
            console.log('X')
            scaleSize -= 0.01;
            if(scaleSize <= 0.1)
                scaleSize = 0.1;
            draw(gl);
        }
        else if ( event.key == 'r'){  //rotate the second triangle
            console.log('r')
            angle1 -= 5;
            draw(gl);
        }
        else if (event.key == 'R'){  //rotate the second triangle
            console.log('R')
            angle1 += 5;
            draw(gl);
        }
        else if (event.key == 't'){  //rotate the second triangle
            console.log('t')
            angle2 -= 5;
            draw(gl);
        }
        else if ( event.key == 'T'){  //rotate the second triangle
            console.log('T')
            angle2 += 5;
            draw(gl);
        }
        else if (event.key == 'y'){  //rotate the second triangle
            console.log('y')
            angle3 -= 5;
            draw(gl);
        }
        else if ( event.key == 'Y'){  //rotate the second triangle
            console.log('Y')
            angle3 += 5;
            draw(gl);
        }
        else if ( event.key == 'g' || event.key == 'G'){ //shorten the second triangle
            console.log('G')
            ///// TODO: when the user press 'g' or 'G'
            if(!grabMode)
                grabMode = true;
            else    
                grabMode = false;
            draw(gl);
        }
        else if(event.key == 'Q'){
            console.log('Q');
            objangleL += 5;
            draw(gl);
        }
        else if(event.key == 'q'){
            console.log('q');
            objangleL -= 5;
            draw(gl);
        }
        else if(event.key == 'E'){
            console.log('E');
            objangleR += 5;
            draw(gl);
        }
        else if(event.key == 'e'){
            console.log('e');
            objangleR -= 5;
            draw(gl);
        }
    });

    
    hexagon = initVertexBufferForLaterUse(gl, hexagonPos, hexagonColor);
    circleR05 = initVertexBufferForLaterUse(gl, CVerticesR05, tireColor);
    circleR025 = initVertexBufferForLaterUse(gl, CVerticesR025, R025Color);
    circleR1 = initVertexBufferForLaterUse(gl, CVerticesR1, CColors);
    circleR1Touch = initVertexBufferForLaterUse(gl, CVerticesR1, CColorsTouch);
    circleR1Grab = initVertexBufferForLaterUse(gl, CVerticesR1, CColorsGrab);
    rectangleTop = initVertexBufferForLaterUse(gl,  rectanglePos, rectangeTopColor);
    rectangleR = initVertexBufferForLaterUse(gl,  rectangleRPos, rectangeRColor);
    triangle = initVertexBufferForLaterUse(gl,  trianglePos, triangleColor);
    objtriangle = initVertexBufferForLaterUse(gl,  objtrianglePos, objtriangleColor);


    var tick = function() {
        draw(gl);
        requestAnimationFrame(tick);
    }
    tick();
}

var tmp = new Matrix4();

function draw(gl){
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    //CircletransMat.setScale(scaleSize, scaleSize, 0);
    //CircletransMat.translate(0.5, 0.5, 0);
    transformMat.setIdentity();
    transformMat.translate(orginX - 0.3, orginY - 0.5, 0);
    pushMatrix();

    // robot
    initAttributeVariable(gl, program.a_Position, hexagon.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, hexagon.colorBuffer); 
    tmp.setIdentity();
    tmp.setScale(scaleSize, scaleSize, 0);
    tmp.multiply(transformMat);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, tmp.elements);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, hexagon.numVertices);

    transformMat.translate(-0.1, -0.22, 0); // left down circle
    initAttributeVariable(gl, program.a_Position, circleR05.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, circleR05.colorBuffer); 
    tmp.setIdentity();
    tmp.setScale(scaleSize, scaleSize, 0);
    tmp.multiply(transformMat);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, tmp.elements);
    gl.drawArrays(gl.TRIANGLES, 0, circleR05.numVertices);

    popMatrix();
    pushMatrix();
    transformMat.translate(0.1, -0.22, 0); // right down circle
    initAttributeVariable(gl, program.a_Position, circleR05.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, circleR05.colorBuffer); 
    tmp.setIdentity();
    tmp.setScale(scaleSize, scaleSize, 0);
    tmp.multiply(transformMat);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, tmp.elements);
    gl.drawArrays(gl.TRIANGLES, 0, circleR05.numVertices);

    popMatrix();
    transformMat.translate(0, 0.22, 0);
    initAttributeVariable(gl, program.a_Position, rectangleTop.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, rectangleTop.colorBuffer); 
    tmp.setIdentity();
    tmp.setScale(scaleSize, scaleSize, 0);
    tmp.multiply(transformMat);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, tmp.elements);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, rectangleTop.numVertices);
    
    transformMat.translate(-0.125, 0, 0);
    transformMat.rotate(angle1, 0, 0, 1);
    initAttributeVariable(gl, program.a_Position, circleR025.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, circleR025.colorBuffer); 
    tmp.setIdentity();
    tmp.setScale(scaleSize, scaleSize, 0);
    tmp.multiply(transformMat);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, tmp.elements);
    gl.drawArrays(gl.TRIANGLES, 0, circleR025.numVertices);
    
    transformMat.translate(-0.125, 0, 0);
    initAttributeVariable(gl, program.a_Position, rectangleR.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, rectangleR.colorBuffer); 
    tmp.setIdentity();
    tmp.setScale(scaleSize, scaleSize, 0);
    tmp.multiply(transformMat);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, tmp.elements);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, rectangleR.numVertices);
    
    transformMat.translate(-0.125, 0, 0);
    transformMat.rotate(angle2, 0, 0, 1);
    initAttributeVariable(gl, program.a_Position, circleR025.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, circleR025.colorBuffer); 
    tmp.setIdentity();
    tmp.setScale(scaleSize, scaleSize, 0);
    tmp.multiply(transformMat);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, tmp.elements);
    gl.drawArrays(gl.TRIANGLES, 0, circleR025.numVertices);

    transformMat.translate(-0.125, 0, 0);
    initAttributeVariable(gl, program.a_Position, rectangleR.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, rectangleR.colorBuffer); 
    tmp.setIdentity();
    tmp.setScale(scaleSize, scaleSize, 0);
    tmp.multiply(transformMat);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, tmp.elements);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, rectangleR.numVertices);

    transformMat.translate(-0.125, 0, 0);
    transformMat.rotate(angle3, 0, 0, 1);
    initAttributeVariable(gl, program.a_Position, circleR025.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, circleR025.colorBuffer); 
    tmp.setIdentity();
    tmp.setScale(scaleSize, scaleSize, 0);
    tmp.multiply(transformMat);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, tmp.elements);
    gl.drawArrays(gl.TRIANGLES, 0, circleR025.numVertices);

    transformMat.translate(-0.225, 0, 0);
    initAttributeVariable(gl, program.a_Position, triangle.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, triangle.colorBuffer); 
    tmp.setIdentity();
    tmp.setScale(scaleSize, scaleSize, 0);
    tmp.multiply(transformMat);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, tmp.elements);
    gl.drawArrays(gl.TRIANGLES, 0, triangle.numVertices);

    pushMatrix();
    
    
    
    var grabPointPos = transformMat.multiplyVector4(new Vector4([0, 0, 0, 1]));
    var CirclePointPos = CircletransMat.multiplyVector4(new Vector4([0, 0, 0, 1]));
    var distance = Math.sqrt(Math.pow((CirclePointPos.elements[0] - grabPointPos.elements[0]).toFixed(3), 2) + Math.pow((CirclePointPos.elements[1] - grabPointPos.elements[1]).toFixed(3), 2));
    console.log(grabPointPos.elements);
    console.log(CirclePointPos.elements);


    initAttributeVariable(gl, program.a_Position, circleR1.vertexBuffer);
    
    if(distance < 0.1 && grabMode){
        //console.log("Grab");
        //transformMat.translate(-0.2, 0 , 0);
        CircletransMat.set(transformMat);
        initAttributeVariable(gl, program.a_Color, circleR1Grab.colorBuffer);
    }
    else if(distance < 0.1 && !grabMode){
        //console.log("In but not grab");
        transformMat.set(CircletransMat);
        initAttributeVariable(gl, program.a_Color, circleR1Touch.colorBuffer);
    }
    else{
        transformMat.set(CircletransMat);
        initAttributeVariable(gl, program.a_Color, circleR1.colorBuffer);
        grabMode = false;
    }
    tmp.setIdentity();
    tmp.setScale(scaleSize, scaleSize, 0);
    tmp.multiply(transformMat);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, tmp.elements);//pass current transformMat to shader
    gl.drawArrays(gl.TRIANGLES, 0, circleR1.numVertices);//draw the triangle 
    pushMatrix();

    initAttributeVariable(gl, program.a_Position, circleR025.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, circleR025.colorBuffer);
    transformMat.translate(-0.125, 0, 0);
    transformMat.rotate(objangleL, 0, 0, 1);
    tmp.setIdentity();
    tmp.setScale(scaleSize, scaleSize, 0);
    tmp.multiply(transformMat);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, tmp.elements);
    gl.drawArrays(gl.TRIANGLES, 0, circleR025.numVertices);

    initAttributeVariable(gl, program.a_Position, objtriangle.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, objtriangle.colorBuffer);
    transformMat.translate(-0.025, 0, 0);
    transformMat.rotate(-90, 0, 0, 1);
    tmp.setIdentity();
    tmp.setScale(scaleSize, scaleSize, 0);
    tmp.multiply(transformMat);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, tmp.elements);
    gl.drawArrays(gl.TRIANGLES, 0, objtriangle.numVertices);

    popMatrix();

    initAttributeVariable(gl, program.a_Position, circleR025.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, circleR025.colorBuffer);
    transformMat.translate(0.125, 0, 0);
    transformMat.rotate(objangleR, 0, 0, 1);
    tmp.setIdentity();
    tmp.setScale(scaleSize, scaleSize, 0);
    tmp.multiply(transformMat);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, tmp.elements);
    gl.drawArrays(gl.TRIANGLES, 0, circleR025.numVertices);

    initAttributeVariable(gl, program.a_Position, objtriangle.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, objtriangle.colorBuffer);
    transformMat.translate(0.025, 0, 0);
    transformMat.rotate(90, 0, 0, 1);
    tmp.setIdentity();
    tmp.setScale(scaleSize, scaleSize, 0);
    tmp.multiply(transformMat);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, tmp.elements);
    gl.drawArrays(gl.TRIANGLES, 0, objtriangle.numVertices);
}