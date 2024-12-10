var difficulty = 5000;
var life = 3;
var score = 0;
var level = 0;
var endGame = false;


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
  
  // 遊戲物件類別
class GameObject {
    constructor() {
        this.colors = {
            '0':[1.0, 1.0, 0.3], // yellow
            '1':[1.0, 0.3, 0.3], // red
            '2':[0.3, 0.3, 1.0], // blue
            '3':[0.3, 1.0, 0.3], // green
            '4':[1.0, 0.3, 1.0], // purple
            '5':[0.3, 1.0, 1.0]  // cyan
        }; // 顏色
        this.maxLevel = 8;
    
        this.coords = [0, 0 ,-20]; // 根據方向設置座標
        this.level = this.generateLevel();
        this.color = this.generateColors(this.level);
        this.obj = null; // 單獨的變數，用於存放資料
    }
  
  
    // 隨機生成等級
    generateLevel() {
        return getRandomInt(1, this.maxLevel);
    }
  
    // 根據等級生成對應數量的顏色
    generateColors(level) {
        let colorArray = [];
        for (let i = 0; i < level; i++) {
            const color = this.colors[getRandomInt(0, 5)];
            colorArray.push(color);
        }
        return colorArray;
    }
  
    // 設置資料的方法
    setObj(obj) {
        this.obj = obj;
    }

    updatePos(){
        this.coords[2]+= 0.03*(level + 1);
    }
}


var dealObj = []
  // 每秒生成一個新的 GameObject 並放入對應的列表
setInterval(() => {

    if(life > 0)
    {
        if(dealObj.length > 10)
            return;
        const gameObject = new GameObject();
        // 根據方向將物件放入對應列表的最前面
        
        dealObj.push(gameObject);
    }
    else{
        dealObj = [];
    }

}, difficulty);
  
function updateScoreText(){
    const scoreElement = document.getElementById('score');
    text = `SCORE: ${score} `; // Positive score

    // Update the text content of the score element
    scoreElement.innerHTML = text;
}

function updateLifeText(){
    const lifeElement = document.getElementById('life');
    text = `LIFE: ${life} `; // Positive life

    // Update the text content of the life element
    lifeElement.innerHTML = text;
}

function updateLevelText(){
    const levelElement = document.getElementById('level');
    text = `LEVEL: ${level+1} `; // Positive life

    // Update the text content of the life element
    levelElement.innerHTML = text;
}

function EndGame(){
    const gameElement = document.getElementById('end');
    gameElement.style.visibility = 'visible'
    const interactiveElements = document.querySelectorAll('*[onclick], *[onkeydown], *[onkeyup]');

    // Disable interactions initially
    interactiveElements.forEach(element => element.style.pointerEvents = 'none');
    // Event listener for keyboard input
    document.addEventListener('keydown', (event) => {
        if (event.key === '0') {
            // Reactivate interactions
            interactiveElements.forEach(element => element.style.pointerEvents = 'auto');
            
            // Trigger restart logic (replace with your game's restart function)
            difficulty = 5000;
            life = 3;
            score = 0;
            level = 0;
            endGame = false;
            gameElement.style.visibility = 'hidden'
            updateLevelText();
            updateLifeText();
            updateScoreText();
            main();
        }
    });

}
