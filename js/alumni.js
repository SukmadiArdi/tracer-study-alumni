import { db } from "./firebase.js";

import {

collection,
addDoc,
getDocs,
deleteDoc,
doc,
updateDoc

} from
"https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { calculateScore, getStatus } from "./tracking.js";


const alumniCollection = collection(db,"alumni");


export async function createAlumni(data){

await addDoc(alumniCollection,{

name:data.name,
nim:data.nim,
program:data.program,
year:data.year,
status:"Pending",
confidence:0

});

}


export async function getAlumni(){

const snapshot = await getDocs(alumniCollection);

let alumni = [];

snapshot.forEach(doc => {

alumni.push({
id:doc.id,
...doc.data()
})

});

return alumni;

}


export async function deleteAlumni(id){

await deleteDoc(doc(db,"alumni",id));

}


export async function trackAlumni(alumni){

const score = calculateScore(alumni);

const status = getStatus(score);

await updateDoc(doc(db,"alumni",alumni.id),{

confidence:score,
status:status

});

}