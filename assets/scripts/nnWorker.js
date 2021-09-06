// importScripts("./modelArch.js")
import {NNPlayer, BoardManager} from "./modelArch.js";
// import "https://cdn.jsdelivr.net/npm/onnxjs/dist/onnx.min.js";


let player;

onmessage = function(msg){
    console.log("whatefaweawfaffweafew");
    let outMsg = {};
    const msgDict = msg.data;
    if(msgDict["type"] === "INIT"){
        let bm = new BoardManager(
            msgDict["height"], msgDict["width"], msgDict["connectNum"], msgDict["isDirect"], msgDict["numPlayers"]
        );

        player = new NNPlayer(bm, msgDict["nnModelPath"], msgDict["mcstSteps"]);
        outMsg["type"] = "INIT";
        postMessage(outMsg);
        console.log("wefoijaweoiafweioj");
        return;
    }
    if(msgDict["type"] === "ACTION"){
        // console.log(player.bm.width, "w");
        outMsg["type"] = "ACTION";
        console.log(player.bm.width, "what");
        console.log(Object.getOwnPropertyNames(player));
        player.chooseAction(msgDict["state"], msgDict["player"]).then((output) => {
            outMsg["action"] = output;
            return;
        });
        // get next action
    }
}
