export function calculateScore(alumni){

let score = 0;

if(alumni.program.includes("Computer"))
score += 30;

if(Math.random() > 0.5)
score += 40;

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