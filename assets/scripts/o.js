// import {Tensor} from "onnxjs";
// import "/Users/Evan's Laptop/node_modules/onnxjs/types/lib/api/index";
// import "onnxjs";
// import { InferenceSession, Tensor } from "onnxjs";
// import { stat } from "fs";
import { BoardManager } from "./modelArch.js";


// import "https://cdn.jsdelivr.net/npm/onnxjs/dist/onnx.min.js";




let bru = new Tensor(new Float32Array([1.0, 2.0, 3.0, 4.0]), "float32", [2, 2]);

let isession = new InferenceSession();

let bm = new BoardManager(10, 10, 5, true, 2);

let arr = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
[0, 2, 0, 0, 0, 0, 2, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 2, 0, 0, 0, 1],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 1, 1, 1, 1, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];

console.log(arr);
// console.log(arr.join());
console.log(bm.standardPerspective(arr, 2));
console.log(arr);
console.log(arr[0][0]);
let ohe = [bm.oneHotPerspective(arr, 2)];
console.log(ohe);

await isession.loadModel("../assets/misc/nfive_6000.onnx");
let hh = await isession.run(ohe);
hh = hh.values();
console.log(hh);
console.log(hh.next().value.data[0])
console.log(hh.next().value.data[0])
console.log('eeeee')
hh = await isession.run(ohe);

// isession.run(ohe).then((output) => {
//     let hh = output.values();
//     // output.values().next();
//     console.log(hh.next().value)
//     console.log(hh.next())
//     console.log('eeeee')
// });

console.log("done");
// console.log(heh);

// let brogle = new Tensor(new Float32Array([1]), "float32", [1]);
// let b = new Float32Array(3);
// b.length
// 


// brogle.
// console.log(bru[:, 3]);

// const mySes = new oncontextmenu.


let dic = {"be": 3};
dic["e"] = new Float32Array(5);
dic["e"][0] = 3;
console.log(dic);

// let bp = dic["e"];
// console.log(bp);
// bp[3] = 2;
// console.log(dic);
// let wwe = dic["be"];
// wwe += 2;
// dic['be']++;
// console.log(dic);

// let valPlayer = 1;
// let player = 3;
// let nextStateVal = 0;

// let relVal = (-1) ** (valPlayer != player) * nextStateVal;
// console.log(relVal);
