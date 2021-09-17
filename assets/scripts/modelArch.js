class BoardManager{
    static DELTA_LIST = [[-1, 0], [-1, 1], [0, 1], [1, 1]];
    constructor(height, width, connectNum, isDirect, numPlayers) {
        this.height = height;
        this.width = width;
        this.connectNum = connectNum;
        this.isDirect = isDirect;
        this.numPlayers = numPlayers;
    }

    blankBoard(){
        let board = [];
        for(let i = 0; i < this.height; i++){
            let row = [];
            for(let j = 0; j < this.width; j++){
                row.push(0);
            }
            board.push(row);
        }
        return board;
    }

    nextPlayer(currPlayer){
        return currPlayer % this.numPlayers + 1
    }

    takeAction(board, action, player){
        let newBoard = [];
        for(let i = 0; i < this.height; i++){
            newBoard.push([...board[i]])
        }
        if(this.isDirect){
            let r = Math.floor(action/this.width);
            let c = action % this.width;
            if(newBoard[r][c] == 0){
                newBoard[r][c] = player;
                return [newBoard, this.isConnected(newBoard, r, c)];
            }else{
                return [board, -1];
            }
        }else{
            throw{name : "Not Implemented"};
        }
    }

    isConnected(board, r, c){
        let player = board[r][c];
        for (const delta of BoardManager.DELTA_LIST) {
            let deltaR = delta[0];
            let deltaC = delta[1];
            let newR = r + deltaR;
            let newC = c + deltaC;
            let currStreak = 1;
            let reverseState = 0;
            while (1) {
                if(newR < 0 || newR >= this.height || newC < 0 || newC >= this.width){
                    reverseState++;
                }else if(board[newR][newC] == player){
                    currStreak++;
                }else{
                    reverseState++;
                }
                if(reverseState % 2){
                    if(reverseState == 1){
                        reverseState++;
                        deltaR = -deltaR;
                        deltaC = -deltaC;
                        newR = r;
                        newC = c;
                    }else{
                        break;
                    }
                }
                if(currStreak >= this.connectNum){
                    return player;
                }
                newR += deltaR;
                newC += deltaC;
            }
        }
        if(this.numValidMoves(board) == 0){
            return -2;
        }
        return 0;
    }

    numValidMoves(board){
        let ans = 0;
        for (const row of board) {
            for (const el of row) {
                if(el === 0){
                    ans++;
                }
            }
        }
        return ans;
    }

    getValidMoves(board){
        let validMoves = [];
        if(this.isDirect){
            for (const row of board) {
                for (const el of row) {
                    validMoves.push(el === 0);
                }
            }
        }else{
            throw{name: "Not Implemented"};
        }
        return validMoves;
    }

    standardPerspective(board, player){
        let perspBoard = [];
        for(let i = 0; i < this.height; i++){
            let row = [];
            for(let j = 0; j < this.width; j++){
                if(board[i][j] == 0){
                    row.push(0);
                }else{
                    row.push((board[i][j]-player+this.numPlayers) % this.numPlayers + 1);
                }
            }
            perspBoard.push(row);
        }
        return perspBoard;
    }

    oneHotPerspective(board, player){
        let fArray = new Float32Array((this.numPlayers + 1) * this.height * this.width);
        for(let i = 0; i < this.height; i++){
            for(let j = 0; j < this.width; j++){
                if(board[i][j] == 0){
                    fArray[i * this.width + j] = 1;
                }else{
                    let channel = (board[i][j]-player+this.numPlayers) % this.numPlayers + 1;
                    fArray[channel * this.height * this.width + i * this.width + j] = 1;
                }
            }
        }
        return new Tensor(fArray, "float32", [1, this.numPlayers + 1, this.height, this.width]);
    }
}

class NNPlayer{
    constructor(bm, nnModelPath, mcstSteps){
        this.bm = bm;
        this.steps = mcstSteps;
        this.session = new InferenceSession({ backendHint: 'webgl' });
        this.nnPath = nnModelPath;
        // this.setUpSession(nnModelPath);
        this.tree = new MCST(this.session, this.bm);
    }

    async setUpSession(){
        await this.session.loadModel(this.nnPath);
    }

    reset(){
        this.tree.reset();
    }

    async doSearches(state, player){
        console.log(`Search player: ${player}`)
        for(let i = 0; i < this.steps; i++){
            console.log("lol");
            await this.tree.search(state, player);
        }
    }

    async chooseAction(state, player){
        console.log(`Choose action player: ${player}`)
        return this.doSearches(state, player).then(() => {
            let maxAction = this.tree.getMaxAction(state, player);
            return maxAction;
        });
    }
}

class MCST{
    static SMALL_VAL = -1000;
    constructor(iSession, bm){
        this.session = iSession;
        this.bm = bm;

        this.QSA = {};
        this.NSA = {};
        this.PSA = {};
        this.NS = {};
    }
    reset(){
        this.QSA = {};
        this.NSA = {};
        this.PSA = {};
        this.NS = {};
    }
    getMaxAction(state, player){
        let encodedState = this.bm.standardPerspective(state, player).join();
        let visNum = this.NSA[encodedState];
        let possActions = [];
        let maxVis = -1;
        console.log(`LELELELELELELEL: ${visNum}`);
        for(let i = 0; i < visNum.length; i++){
            if(maxVis < visNum[i]){
                possActions = [];
                maxVis = visNum[i];
            }
            if(maxVis == visNum[i]){
                possActions.push(i);
            }
        }
        return possActions[Math.floor(Math.random() * possActions.length)];
    }
    async search(state, player){
        let encodedState = this.bm.standardPerspective(state, player).join();
        if(!(encodedState in this.QSA)){
            let input = [this.bm.oneHotPerspective(state, player)];
            let outputVals = await this.session.run(input);
            let outputValsValues = outputVals.values();
            let probs = outputValsValues.next().value.data;
            let val = outputValsValues.next().value.data[0];

            this.PSA[encodedState] = probs;
            this.QSA[encodedState] = new Float32Array(probs.length);
            this.NSA[encodedState] = new Int32Array(probs.length);
            this.NS[encodedState] = 0;
            console.log("early");
            return [val, player];
        }
        
        let probs = this.PSA[encodedState];
        let qVals = this.QSA[encodedState];
        let visNum = this.NSA[encodedState];
        let sumVisNum = this.NS[encodedState];

        let takenAction = -1;
        let maxPUCT = MCST.SMALL_VAL;
        let validMask = this.bm.getValidMoves(state);
        for(let i = 0; i < probs.length; i++){
            let currPUCT = qVals[i] + probs[i] * Math.sqrt(sumVisNum) / (1 + visNum[i]);
            currPUCT += MCST.SMALL_VAL * !validMask[i];
            if(maxPUCT < currPUCT){
                maxPUCT = currPUCT;
                takenAction = i;
            }
        }

        let [newState, winStatus] = this.bm.takeAction(state, takenAction, player);

        this.NS[encodedState]++;
        visNum[takenAction]++;
        
        if(winStatus){
            console.log(`bee: ${winStatus}`);
            let relVal = (-1) ** (winStatus != player) * (winStatus > 0);
            qVals[takenAction] = (qVals[takenAction] * visNum[takenAction]-1 + relVal) / (visNum[takenAction]);
            return [relVal, winStatus > 0 ? winStatus : 0];
            // if(winStatus > 0){
            //     console.log("won")
            //     return [1, winStatus];
            // }
            // return [0, 0];
        }

        let newPlayer = this.bm.nextPlayer(player);
        let [nextStateVal, valPlayer] = await this.search(newState, newPlayer);

        let relVal = (-1) ** (valPlayer != player) * nextStateVal;
        qVals[takenAction] = (qVals[takenAction] * visNum[takenAction]-1 + relVal) / (visNum[takenAction]);
        visNum[takenAction]++;
        console.log("wub");
        return [nextStateVal, valPlayer];
    }
}

export {BoardManager, NNPlayer, MCST};
