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

const alumniCollection = collection(db,"alumni");


export async function loadAlumni(){

const snapshot = await getDocs(alumniCollection);

let data = [];

snapshot.forEach((doc)=>{

data.push({

id:doc.id,

...doc.data()

});

});

return data;

}


export async function addAlumniDB(data){

await addDoc(alumniCollection,data);

}


export async function deleteAlumniDB(id){

await deleteDoc(doc(db,"alumni",id));

}


export async function updateAlumniDB(id,data){

await updateDoc(doc(db,"alumni",id),data);

}