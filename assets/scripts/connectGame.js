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
        // Reset models
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
            currPlayerObj.chooseAction(this.board, this.currPlayer).then((action) => {
                this.makeMove(action);
            })
        }
    }
    
    renderPiece(action, temp = false){
        let piece = document.createElement("div");
        piece.classList.add("piece", `t${this.bm.numPlayers}c${this.currPlayer}`);
        if(temp){
            piece.classList.add("temp-piece");
            document.getElementById(action).prepend(piece);
        }else{
            document.getElementById(action).appendChild(piece);
        }
    }

    makeMove(action){
        let [newBoard, winStatus] = this.bm.takeAction(this.board, action, this.currPlayer);
        if(winStatus == -1){
            console.log(`Invalid Action: ${action}`)
            this.setMessage(`Invalid move for Player ${this.currPlayer}.`);
            return;
        }
        if(!this.bm.isDirect){
            action += this.bm.lowestOpeningInColumn(this.board, action) * this.bm.width;
        }
        this.board = newBoard;
        this.renderPiece(action);
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

    clickSquare(event){
        if(this.winner){
            if(this.winner > 0){
                this.setMessage(`The game is over. (Player ${this.winner} won.)`)
            }else{
                this.setMessage("The game is over. (No more possible moves.)")
            }
            return;
        }
        if(this.players[this.currPlayer-1] !== "H"){
            this.setMessage(`Player ${this.currPlayer} is still making a move.`)
            return;
        }
        let action;
        if(this.bm.isDirect){
            if(event.target.classList.contains("piece")){
                if(event.target.parentNode.id){
                    action = event.target.parentNode.id;
                }else{
                    return;
                }
            }else{
                action = event.target.id;
            }            
        }else{
            if(event.target.classList.contains("piece")){
                if(event.target.parentNode.id){
                    action = event.target.parentNode.id;
                }else{
                    return;
                }
            }else{
                action = event.target.id;
            }
            action %= this.bm.width;
        }
        this.makeMove(action);
    }

    hoverSquare(event){
        if(this.winner){
            return;
        }
        if(this.players[this.currPlayer-1] !== "H"){
            return;
        }
        let spot;
        if(this.bm.isDirect){
            if(event.target.classList.contains("piece")){
                return;
            }
            spot = event.target.id;   
        }else{
            if(event.target.classList.contains("piece")){
                if(event.target.parentNode.id){
                    spot = event.target.parentNode.id;
                }else{
                    return;
                }
            }else{
                spot = event.target.id;
            }
            spot %= this.bm.width;
            let row = this.bm.lowestOpeningInColumn(this.board, spot);
            if(row != -1){
                spot += this.bm.lowestOpeningInColumn(this.board, spot) * this.bm.width;
            }else{
                return;
            }
        }
        this.renderPiece(spot, true);
    }

    outHoverSquare(event){
        if(this.winner){
            return;
        }
        let squ;
        if(this.bm.isDirect){
            if(event.target.classList.contains("piece")){
                return;
            }
            squ = event.target;
        }else{
            let spot;
            if(event.target.classList.contains("piece")){
                if(event.target.parentNode.id){
                    spot = event.target.parentNode.id;
                }else{
                    return;
                }
            }else{
                spot = event.target.id;
            }
            spot %= this.bm.width;
            let row = this.bm.lowestOpeningInColumn(this.board, spot);
            if(row != -1){
                spot += this.bm.lowestOpeningInColumn(this.board, spot) * this.bm.width;
            }else{
                return;
            }
            squ = document.getElementById(spot);
        }
        for(let i = 0; i < squ.children.length; i++){
            if(squ.children[i].classList.contains("temp-piece")){
                squ.removeChild(squ.children[i])
            }
        }
    }

    boundReset = this.reset.bind(this);
    boundClickSquare = this.clickSquare.bind(this);
    boundHoverSquare = this.hoverSquare.bind(this);
    boundOutSquare = this.outHoverSquare.bind(this);
}

async function runGame(){
    let g = new Game(10, 10, 5, true, 2);
    let bm = new BoardManager(10, 10, 5, true, 2);
    let nn = new NNPlayer(bm, "../assets/misc/fixed_r2_6000.onnx", 60);

    g.players = ["H", nn];
    nn.setUpSession().then(() => {
        g.renderBoard();
    });
}

window.onload = runGame()
