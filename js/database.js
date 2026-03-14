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


export async function getAlumni(){

const snapshot = await getDocs(alumniCollection);

let data=[];

snapshot.forEach((d)=>{

data.push({
id:d.id,
...d.data()
});

});

return data;

}


export async function addAlumni(data){

await addDoc(alumniCollection,data);

}


export async function deleteAlumni(id){

await deleteDoc(doc(db,"alumni",id));

}


export async function updateAlumni(id,data){

await updateDoc(doc(db,"alumni",id),data);

}