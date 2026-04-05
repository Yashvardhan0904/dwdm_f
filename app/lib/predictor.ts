type DiseaseRule = {
  disease: string;
  keywords: string[];
};

const DISEASE_RULES: DiseaseRule[] = [
  {
    disease: "Malaria",
    keywords: ["high fever", "chills", "sweating", "headache", "fatigue"],
  },
  {
    disease: "Dengue",
    keywords: ["high fever", "rash", "joint pain", "headache", "nausea"],
  },
  {
    disease: "Typhoid",
    keywords: ["fever", "abdominal pain", "fatigue", "loss of appetite"],
  },
  {
    disease: "Flu",
    keywords: ["fever", "cough", "sore throat", "body pain", "fatigue"],
  },
  {
    disease: "Common Cold",
    keywords: ["runny nose", "sneezing", "sore throat", "nasal congestion"],
  },
  {
    disease: "Food Poisoning",
    keywords: ["nausea", "vomiting", "diarrhea", "abdominal pain"],
  },
];

export function predictDisease(symptoms: string[]) {
  const normalized = symptoms.map((item) => item.toLowerCase().trim());

  let topDisease = "General Viral Infection";
  let topScore = 0;
  let topMax = 1;

  for (const rule of DISEASE_RULES) {
    const score = rule.keywords.filter((keyword) =>
      normalized.includes(keyword.toLowerCase()),
    ).length;

    if (score > topScore) {
      topDisease = rule.disease;
      topScore = score;
      topMax = rule.keywords.length;
    }
  }

  if (topScore === 0) {
    return {
      disease: topDisease,
      confidence: 42,
    };
  }

  const rawConfidence = 55 + (topScore / topMax) * 40;

  return {
    disease: topDisease,
    confidence: Math.min(96, Math.round(rawConfidence)),
  };
}