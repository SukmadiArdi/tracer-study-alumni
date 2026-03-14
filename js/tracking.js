export function calculateScore(alumni){

let score = 0;


/* NAME MATCH */

if(alumni.name.length > 5)
score += 40;


/* PROGRAM CONTEXT */

if(
alumni.program.includes("Computer") ||
alumni.program.includes("Information")
)
score += 30;


/* SIMULASI LINKEDIN MATCH */

if(Math.random() > 0.5)
score += 15;


/* CROSS VALIDATION */

if(Math.random() > 0.7)
score += 15;


return score;

}


export function getStatus(score){

if(score >= 80)
return "Identified";

if(score >= 50)
return "Pending";

return "Not Found";

}