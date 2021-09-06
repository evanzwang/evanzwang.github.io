// import { Tensor } from "onnxjs";
import { NNPlayer, BoardManager } from "./modelArch.js";

class Game{
    constructor(height, width, connectNum, isDirect, numPlayers) {
        this.bm = new BoardManager(height, width, connectNum, isDirect, numPlayers);
        this.currPlayer = 1;
        this.players = [];
        this.board = this.bm.blankBoard();
        this.winner = 0;
    }
    renderBoard(){
        let squareWidth = 100 / this.bm.width;
        let boardDiv = document.getElementById("board");
        for(let i = 0; i < this.bm.height; i++){
            let row = document.createElement("div");
            row.classList.add("row");
            for(let j = 0; j < this.bm.width; j++){
                let squ = document.createElement("div");

                squ.classList.add("square");
                squ.setAttribute("id", i * this.bm.width + j);
                squ.addEventListener("click", this.boundClickSquare);
                squ.addEventListener("mouseenter", this.boundHoverSquare);
                squ.addEventListener("mouseleave", this.boundOutSquare);

                squ.style.paddingBottom = `${squareWidth}%`;

                row.appendChild(squ);
            }
            boardDiv.appendChild(row);
        }

        let playersDiv = document.getElementById("players");
        let r1 = document.createElement("div");
        r1.classList.add("row");
        let r2 = document.createElement("div");
        r2.classList.add("row");

        playersDiv.style.width = `${100 / this.bm.width * this.bm.numPlayers}%`;
        squareWidth = 100 / this.bm.numPlayers;
        for(let i = 0; i < this.bm.numPlayers; i++){
            let squ1 = document.createElement("div");
            squ1.classList.add("square");
            squ1.style.paddingBottom = `${squareWidth}%`
            squ1.textContent = `${i + 1}`;
            r1.appendChild(squ1);
            let squ2 = document.createElement("div");
            squ2.classList.add("square");
            squ2.style.paddingBottom = `${squareWidth}%`

            let piece = document.createElement("div");
            piece.classList.add("piece", `t${this.bm.numPlayers}c${i+1}`);
            squ2.appendChild(piece);
            
            r2.appendChild(squ2);
        }
        playersDiv.appendChild(r1);
        playersDiv.appendChild(r2);

        document.getElementById("reset-button").addEventListener("click", this.boundReset);
        this.updatePlayer();
    }

    reset(){
        // reset models
        let boardDiv = document.getElementById("board");
        for(let i = 0; i < this.bm.height; i++){
            for(let j = 0; j < this.bm.width; j++){
                while(boardDiv.children[i].children[j].firstChild){
                    boardDiv.children[i].children[j].removeChild(boardDiv.children[i].children[j].firstChild);
                }
            }
        }
        this.winner = 0;
        this.board = this.bm.blankBoard();
        this.currPlayer = 1;
        this.updatePlayer();
    }

    setMessage(msg){
        document.getElementById("msg").textContent = msg;
    }

    async updatePlayer(){
        let msg = `Player ${this.currPlayer} to move: `;
        let currPlayerObj = this.players[this.currPlayer-1];
        if(currPlayerObj === "H"){
            msg += "Human";
        }else if(currPlayerObj === "R"){
            msg += "Random";
        }else if(currPlayerObj instanceof NNPlayer){
            msg += "Neural Network";
        }
        this.setMessage(msg);

        if(currPlayerObj !== "H"){
            // let d = this.players[this.currPlayer-1].chooseAction(this.board, this.currPlayer);
            // console.log(d);
            currPlayerObj.chooseAction(this.board, this.currPlayer).then((action) => {
                console.log(action, "ACtion?");
                this.makeMove(action);
            })
            // let d = await currPlayerObj.chooseAction(this.board, this.currPlayer);
            // console.log(d);
            // this.makeMove(d);
            // this.makeMove(currPlayerObj.chooseAction(this.board, this.currPlayer));
        }
        // if(currPlayerObj instanceof Worker){
        //     const inDict = {"type": "ACTION", "state": this.board, "player": this.currPlayer};
        //     currPlayerObj.postMessage(inDict);
        // }
    }
    
    renderPiece(action, temp = false){
        let piece = document.createElement("div");
        piece.classList.add("piece", `t${this.bm.numPlayers}c${this.currPlayer}`);
        if(temp){
            piece.classList.add("temp-piece");
            document.getElementById(action).prepend(piece);
        }else{
            document.getElementById(action).appendChild(piece);
            console.log("what")
        }
    }

    makeMove(action){
        let [newBoard, winStatus] = this.bm.takeAction(this.board, action, this.currPlayer);
        if(winStatus == -1){
            this.setMessage(`Invalid move for Player ${this.currPlayer}.`);
            return;
        }
        this.board = newBoard;
        this.renderPiece(action);
        console.log("hehe render");
        if(winStatus != 0){
            if(winStatus > 0){
                this.setMessage(`Player ${winStatus} has won!`);
            }else{
                this.setMessage(`The game is a draw.`);
            }
            this.winner = winStatus;            
        }else{
            this.currPlayer = this.bm.nextPlayer(this.currPlayer);
            this.updatePlayer();
        }
    }

    parseMessage(msg){
        const msgDict = msg.data;
        if(msgDict["type"] === "INIT"){
            return;
        }
        if(msgDict["type"] === "ACTION"){
            this.makeMove(msgDict["action"]);
        }
    }

    clickSquare(event){
        if(this.winner){
            if(this.winner > 0){
                this.setMessage(`The game is over. (Player ${this.winner} won.)`)
            }else{
                this.setMessage("The game is over. (No more possible moves.)")
            }
            return;
        }
        console.log("clicked");
        if(this.bm.isDirect){
            let action;
            if(event.target.classList.contains("piece")){
                if(event.target.parentNode.id){
                    action = event.target.parentNode.id;
                }else{
                    return;
                }
            }else{
                action = event.target.id;
            }
            if(this.players[this.currPlayer-1] !== "H"){
                this.setMessage(`Player ${this.currPlayer} is still making a move.`)
                return;
            }
            this.makeMove(action);
        }else{
            throw{name : "Not Implemented"};
        }
    }

    hoverSquare(event){
        if(this.winner){
            return;
        }
        if(this.bm.isDirect){
            if(event.target.classList.contains("piece")){
                return;
            }
            if(this.players[this.currPlayer-1] !== "H"){
                return;
            }
            this.renderPiece(event.target.id, true);
        }else{
            throw{name : "Not Implemented"};
        }
    }

    outHoverSquare(event){
        if(this.winner){
            return;
        }
        if(this.bm.isDirect){
            if(event.target.classList.contains("piece")){
                return;
            }
            let squ = event.target;
            for(let i = 0; i < squ.children.length; i++){
                if(squ.children[i].classList.contains("temp-piece")){
                    squ.removeChild(squ.children[i])
                }
            }
        }else{
            throw{name : "Not Implemented"};
        }
    }

    boundReset = this.reset.bind(this);
    boundClickSquare = this.clickSquare.bind(this);
    boundHoverSquare = this.hoverSquare.bind(this);
    boundOutSquare = this.outHoverSquare.bind(this);
}

function renderBoard(){
    let bm = new BoardManager(10, 10, 5, true, 2);
    let boardDiv = document.getElementById("board");
    // boardDiv.appendChild(document.createTextNode("bruh"))
    for(let i = 0; i < 10; i++){
        let de = document.createElement("div");
        de.classList.add("row");
        for(let j = 0; j < 10; j++){
            let b = document.createElement("div");
            b.classList.add("square");
            b.setAttribute("id", i * bm.width + j);
            // b.addEventListener("click", clickSquare);
            let c = document.createElement("div");
            c.classList.add("piece")
            // c.textContent = "ee"
            b.appendChild(c);
            de.appendChild(b);
        }
        boardDiv.appendChild(de);
    }
}

async function runGame(){
    let g = new Game(10, 10, 5, true, 2);
    let bm = new BoardManager(10, 10, 5, true, 2);
    let nn = new NNPlayer(bm, "../assets/misc/nfive_6000.onnx", 36);

    let nnWorker = new Worker("../assets/scripts/nnWorker.js", {type: "module"});
    // let inDict = {"type": "INIT", "model": nn};
    // let session = new InferenceSession();
    // await session.loadModel("../assets/misc/nfive_6000.onnx");

    // let inDict = {
    //     "type": "INIT", 
    //     "width": bm, "height": 10, "connectNum": 5, "isDirect": true, "numPlayers": 2,
    //     "nnModelPath": "../assets/misc/nfive_6000.onnx", "mcstSteps": 3
    // };

    // nn.chooseAction;
    // nnWorker.postMessage(inDict);
    // nnWorker.onmessage = g.parseMessage;

    
    console.log("hi");
    // lol moment
    g.players = ["H", nn];
    g.renderBoard();
}

let bm = new BoardManager(10, 10, 5, true, 2);
let b = bm.blankBoard();
let [c, _] = bm.takeAction(b, 3, 1);
let [d, __] = bm.takeAction(b, 5, 2);

// console.log(c);
// console.log(d);

// export {BoardManager};

window.onload = runGame()
