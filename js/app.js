import {

createAlumni,
getAlumni,
deleteAlumni,
trackAlumni

} from "./alumni.js";


window.login = function(){

const user = document.getElementById("username").value;
const pass = document.getElementById("password").value;

if(user === "admin" && pass === "admin123"){

document.getElementById("loginPage").classList.add("hidden");

document.getElementById("dashboardPage").classList.remove("hidden");

loadAlumni();

}

else{

alert("Login gagal");

}

}



window.addAlumni = async function(){

const name = document.getElementById("name").value;

const nim = document.getElementById("nim").value;

const program = document.getElementById("program").value;

const year = document.getElementById("year").value;

await createAlumni({

name,
nim,
program,
year

});

loadAlumni();

}



async function loadAlumni(){

const data = await getAlumni();

const table = document.getElementById("alumniTable");

table.innerHTML = "";

let total = data.length;

let identified = 0;

let pending = 0;


data.forEach(a => {

if(a.status === "Identified") identified++;

if(a.status === "Pending") pending++;

const row = document.createElement("tr");

row.innerHTML = `

<td>${a.name}</td>
<td>${a.nim}</td>
<td>${a.program}</td>
<td>${a.year}</td>
<td>${a.status}</td>
<td>${a.confidence}</td>

<td>

<button onclick="runTrack('${a.id}')"
class="bg-blue-500 text-white p-1 rounded">
Track
</button>

<button onclick="removeAlumni('${a.id}')"
class="bg-red-500 text-white p-1 rounded">
Delete
</button>

</td>

`;

table.appendChild(row);

});


document.getElementById("totalAlumni").innerText = total;

document.getElementById("identifiedAlumni").innerText = identified;

document.getElementById("pendingAlumni").innerText = pending;

}



window.runTrack = async function(id){

const data = await getAlumni();

const alumni = data.find(a => a.id === id);

await trackAlumni(alumni);

loadAlumni();

}


window.removeAlumni = async function(id){

await deleteAlumni(id);

loadAlumni();

}