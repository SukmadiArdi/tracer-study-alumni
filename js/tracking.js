// ===== GENERATE NAME VARIATIONS =====

export function generateNameVariations(fullName) {

  const parts = fullName.split(" ");

  const variations = [];

  variations.push(fullName);

  if (parts.length > 1) {
    variations.push(parts[0] + " " + parts[1][0] + ".");
  }

  if (parts.length > 2) {
    variations.push(parts[0] + " " + parts[2]);
  }

  return variations;
}



// ===== CREATE TARGET PROFILE =====

export function createTargetProfile(alumni) {

  return {
    nameVariations: generateNameVariations(alumni.name),
    program: alumni.program,
    year: alumni.year
  };

}



// ===== SIMULATE OSINT SEARCH =====

export function simulateSearch() {

  const sources = [
    "LinkedIn",
    "GitHub",
    "Google Scholar",
    "Public Employment Database"
  ];

  const results = [];

  sources.forEach(source => {

    if (Math.random() > 0.5) {

      results.push({
        source: source,
        found: true
      });

    }

  });

  return results;

}



// ===== CALCULATE CONFIDENCE SCORE =====

export function calculateScore(alumni) {

  let score = 0;

  // name strength
  if (alumni.name.length > 5) {
    score += 40;
  }

  // program relevance
  if (
    alumni.program.includes("Computer") ||
    alumni.program.includes("Information") ||
    alumni.program.includes("Engineering")
  ) {
    score += 30;
  }

  // simulated OSINT signals
  const osintResults = simulateSearch();

  osintResults.forEach(result => {

    if (result.found) {
      score += 10;
    }

  });

  // limit score
  if (score > 100) score = 100;

  return score;

}



// ===== DETERMINE STATUS =====

export function determineStatus(score) {

  if (score >= 80) {
    return "Identified";
  }

  if (score >= 50) {
    return "Pending";
  }

  return "Not Found";

}



// ===== RUN TRACKING =====

export function runTracking(alumni) {

  const score = calculateScore(alumni);

  const status = determineStatus(score);

  return {
    confidence: score,
    status: status
  };

}