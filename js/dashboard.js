export function renderDashboardChart(data){

const ctx = document.getElementById("chart-alumni");

let identified = 0;
let pending = 0;
let notFound = 0;

data.forEach(a=>{

if(a.status==="Identified") identified++;
else if(a.status==="Pending") pending++;
else notFound++;

});

new Chart(ctx,{

type:"doughnut",

data:{
labels:["Identified","Pending","Not Found"],
datasets:[{
data:[identified,pending,notFound]
}]
}

});

}