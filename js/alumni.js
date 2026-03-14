import { db } from "./firebase.js";
import { collection, addDoc } from 
"https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

async function addAlumni(data){

await addDoc(collection(db,"alumni"),{
name:data.name,
nim:data.nim,
program:data.program,
year:data.year,
status:"Pending",
confidence:0
});

}