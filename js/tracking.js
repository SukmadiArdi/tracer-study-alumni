export function calculateScore(alumni){

let score = 0;


/* NAME MATCH */

if(alumni.name.length > 5)
score += 40;


/* PROGRAM MATCH */

if(alumni.program.includes("Computer"))
score += 30;


/* RANDOM OSINT SIMULATION */

if(Math.random() > 0.5)
score += 15;

if(Math.random() > 0.7)
score += 15;


return score;

}



export function getStatus(score){

if(score >= 80)

return "Identified";

else if(score >= 50)

return "Pending";

else

return "Not Found";

}