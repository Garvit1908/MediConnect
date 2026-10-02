const OpenAI = require("openai");
require("dotenv").config();

const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

const VALID_SPECIALIZATIONS = [
  "General Physician",
  "Cardiologist",
  "Dermatologist",
  "Neurologist",
  "Orthopedic",
  "Pediatrician",
  "Psychiatrist",
  "Dentist",
  "ENT Specialist",
];

async function findmatch(patientquery) {
  const system_prompt = `
You are a senior clinical triage doctor. Your task is to analyze patient symptoms and select the most relevant specialist from these exact 9 categories:

1. "General Physician" (Fever, cold, fatigue, viral/bacterial infections, stomach issues)
2. "Cardiologist" (Chest pain, palpitations, hypertension, shortness of breath)
3. "Dermatologist" (Skin rash, acne, eczema, itching, hair fall, skin infections)
4. "Neurologist" (Migraine, severe headache, dizziness, nerve pain, numbness)
5. "Orthopedic" (Bone fractures, joint pain, back pain, arthritis, knee injury)
6. "Pediatrician" (Child & infant diseases, growth issues, pediatric fever)
7. "Psychiatrist" (Anxiety, depression, stress, insomnia, mood disorders)
8. "Dentist" (Toothache, gum bleeding, cavities, oral infections)
9. "ENT Specialist" (Ear ache, throat infection, sinus, hearing loss, tonsils)

Rules:
- You must choose strictly one of the 9 categories above as "specialization".
- If the symptoms are broad or multiple, pick "General Physician".
- Assess urgency: "ROUTINE", "URGENT", or "EMERGENCY".
- Give a brief, reassuring clinical reasoning for the patient in 1-2 sentences.

Respond in strict JSON format:
{
  "specialization": "Exact Specialization Name",
  "urgency": "ROUTINE | URGENT | EMERGENCY",
  "reasoning": "Brief empathetic explanation"
}
`;

  const response = await client.chat.completions.create({
    model: "gemini-3.5-flash-lite",
    messages: [
      { role: "system", content: system_prompt },
      { role: "user", content: `${patientquery}` },
    ],
  });

  const rawContent = response.choices?.[0]?.message?.content || "{}";
  const cleanJson = rawContent.replace(/```json/gi, "").replace(/```/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleanJson);
  } catch {
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      parsed = {};
    }
  }

  // Ensure safe fallback
  if (!VALID_SPECIALIZATIONS.includes(parsed.specialization)) {
    parsed.specialization = "General Physician";
  }
  if (!parsed.urgency) {
    parsed.urgency = "ROUTINE";
  }
  if (!parsed.reasoning) {
    parsed.reasoning = `Based on your symptoms, we recommend consulting a ${parsed.specialization}.`;
  }

  return parsed;
}

module.exports = { findmatch };
