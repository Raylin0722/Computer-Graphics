var VSHADER_SOURCE = `
        attribute vec4 a_Position;
        attribute vec4 a_Color;
        varying vec4 v_Color;
        void main(){
            gl_Position = a_Position;
            gl_PointSize = 6.0;
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
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if(gl.getProgramParameter(program, gl.LINK_STATUS)){
        return program;
    }
    alert(gl.getProgramInfoLog(program) + "");
    gl.deleteProgram(program);
}
function compileShader(gl, vShaderText, fShaderText){
    var vertexShader = gl.createShader(gl.VERTEX_SHADER)
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(vertexShader, vShaderText)
    gl.shaderSource(fragmentShader, fShaderText)
    gl.compileShader(vertexShader)
    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
        console.log('vertex shader ereror');
        var message = gl.getShaderInfoLog(vertexShader); 
        console.log(message);
    }
    gl.compileShader(fragmentShader)
    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
        console.log('fragment shader ereror');
        var message = gl.getShaderInfoLog(fragmentShader);
        console.log(message);
    }
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
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
    var buffer = gl.createBuffer();
    if (!buffer) {
      console.log('Failed to create the buffer object');
      return null;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    buffer.num = num;
    buffer.type = type;
    return buffer;
}
function initVertexBufferForLaterUse(gl, vertices, colors){
    console.log(vertices);
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

var type = 0; // default type 0 (dot)(d) type 1 (triangle)(t) type 2 (square)(s) type 4 (line)(l)
var color = 0; // default color 0 (red)(r)


function main(){
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

    if(program.a_Position < 0 || program.a_Color < 0)  
        console.log('Error: f(program.a_Position < 0 || program.a_Color < 0');
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);


    document.addEventListener('keydown', (event)=> {    
        if( event.key == 'd' || event.key == 'D')
            type = 0;
        else if ( event.key == 't' || event.key == 'T')
            type = 1;
        else if ( event.key == 's' || event.key == 'S')
            type = 2;
        else if ( event.key == 'l' || event.key == 'L')
            type = 3;
        else if ( event.key == 'r' || event.key == 'R')
            color = 0;
        else if ( event.key == 'g' || event.key == 'G')
            color = 1;
        else if ( event.key == 'y' || event.key == 'Y')
            color = 2;
        
    });
    canvas.onmousedown = function(ev){click(ev, gl)}
}

var needDrawShape = [[], [], [], []];
var needDrawColor = [[], [], [], []];


function click(ev, gl){
    console.log('type: ' + type);
    console.log('color: ' + color );
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    x = ( x - rect.width / 2) * 2 / rect.width;
    y = ( -y + rect.height / 2) * 2 / rect.height; 

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    var RGY = [[1, 0, 0], [0, 1, 0], [1, 1, 0]]
    /*drawPosSample = [[0, 0, 0], [0, 0, 0, -0.1, -0.2, 0, 0.1, -0.2, 0], [0.1, 0.1, 0, 0.1, -0.1, 0, -0.1, 0.1, 0,  0.1, -0.1, 0, -0.1, 0.1, 0, -0.1, -0.1, 0], [0.0, 0.0, 0, 0.3, 0.3, 0]]
    // default type 0 (dot)(d) type 1 (triangle)(t) type 2 (square)(s) type 4 (line)(l)
    var tmp = drawPosSample[type].slice();
    for(var i = 0; i < tmp.length; i+=3){
        tmp[i] += x;
        tmp[i + 1] += y;
        needDrawColor[type].push(RGY[color]);
    }
    needDrawShape[type].push(tmp);*/

    switch(type){
        case 0:
            var tmp = [0, 0, 0];
            tmp[0] += x;
            tmp[1] += y;
            needDrawShape[type].push(tmp);
            needDrawColor[type].push(RGY[color]);
            break;
        case 1:
            var tmp = [0, 0, 0, -0.1, -0.2, 0, 0.1, -0.2, 0];
            for(var i = 0; i < 9; i+=3){
                tmp[i] += x;
                tmp[i + 1] += y;
                needDrawColor[type].push(RGY[color]);
            }
            needDrawShape[type].push(tmp);
            break;
        case 2:
            var tmp = [0.1, 0.1, 0, 0.1, -0.1, 0, -0.1, 0.1, 0,  0.1, -0.1, 0, -0.1, 0.1, 0, -0.1, -0.1, 0];
            for(var i = 0; i < 18; i+=3){
                tmp[i] += x;
                tmp[i + 1] += y;
                needDrawColor[type].push(RGY[color]);
            }
            needDrawShape[type].push(tmp);
            break;
        case 3:
            var tmp = [0.0, 0.0, 0, 0.3, 0.3, 0];
            for(var i = 0; i < 6; i+=3){
                tmp[i] += x;
                tmp[i + 1] += y;
                needDrawColor[type].push(RGY[color]);
            }
            needDrawShape[type].push(tmp);
            break;
    }
    
    buffer=initVertexBufferForLaterUse(gl, needDrawShape[0].flat().slice(-9), needDrawColor[0].flat().slice(-9));
    initAttributeVariable(gl, program.a_Position, buffer.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, buffer.colorBuffer);
    gl.drawArrays(gl.POINTS, 0, buffer.numVertices);

    buffer=initVertexBufferForLaterUse(gl, needDrawShape[1].flat().slice(-27), needDrawColor[1].flat().slice(-27));
    initAttributeVariable(gl, program.a_Position, buffer.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, buffer.colorBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, buffer.numVertices);

    buffer=initVertexBufferForLaterUse(gl, needDrawShape[2].flat().slice(-54), needDrawColor[2].flat().slice(-54));
    initAttributeVariable(gl, program.a_Position, buffer.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, buffer.colorBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, buffer.numVertices);

    buffer=initVertexBufferForLaterUse(gl, needDrawShape[3].flat().slice(-18), needDrawColor[3].flat().slice(-18));
    initAttributeVariable(gl, program.a_Position, buffer.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, buffer.colorBuffer);
    gl.drawArrays(gl.LINES, 0, buffer.numVertices);

}