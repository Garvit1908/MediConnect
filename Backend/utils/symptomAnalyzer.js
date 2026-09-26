/**
 * MediConnect AI Clinical Triage & Symptom Analyzer
 * Combines Google Gemini (when configured) with an extensive medical
 * symptom-to-specialization clinical mapping engine.
 */

const MEDICAL_KNOWLEDGE_BASE = {
  Cardiologist: {
    aliases: ["Cardiologist", "Cardiology", "Heart Specialist"],
    keywords: [
      "chest pain", "chest tightness", "chest pressure", "heart", "heartbeat",
      "palpitation", "palpitations", "shortness of breath", "breathlessness",
      "irregular heartbeat", "arrhythmia", "angina", "arm pain", "left arm",
      "high blood pressure", "hypertension", "cholesterol", "swollen ankles",
      "dizziness on standing", "cardiac"
    ],
    redFlags: ["chest pain", "chest tightness", "radiating pain", "severe breathlessness"],
    summaryTemplate: "Symptoms point towards potential cardiovascular involvement. A consultation with a Cardiologist is advised for ECG, blood pressure evaluation, and cardiac risk assessment.",
    questions: [
      "Do your symptoms worsen with physical exertion or climbing stairs?",
      "Have you noticed any swelling in your ankles or feet?",
      "Is there a family history of heart disease or hypertension?"
    ]
  },
  Dermatologist: {
    aliases: ["Dermatologist", "Dermatology", "Skin Specialist"],
    keywords: [
      "skin", "rash", "rashes", "itching", "itchy", "acne", "pimple", "pimples",
      "eczema", "psoriasis", "hives", "urticaria", "hair loss", "hair fall",
      "dandruff", "pigmentation", "fungal", "skin allergy", "dry skin", "blister",
      "blisters", "boils", "mole", "scalp", "skin redness", "peeling skin"
    ],
    redFlags: ["rapidly spreading rash", "blistering with fever", "black mole changing size"],
    summaryTemplate: "Reported symptoms are consistent with dermatological or cutaneous irritation. A certified Dermatologist should evaluate the skin lesions and prescribe targeted topical or systemic therapy.",
    questions: [
      "When did you first notice the rash or skin changes?",
      "Have you recently used any new cosmetic products, soaps, or medications?",
      "Does the condition itch more at night or after contact with specific materials?"
    ]
  },
  Neurologist: {
    aliases: ["Neurologist", "Neurology", "Brain Specialist"],
    keywords: [
      "headache", "migraine", "severe headache", "head pain", "dizziness",
      "vertigo", "spinning", "numbness", "tingling", "pins and needles",
      "seizure", "seizures", "fits", "tremor", "tremors", "memory loss",
      "confusion", "fainting", "syncope", "paralysis", "nerve pain", "balance loss",
      "light sensitivity", "photophobia", "aura", "facial droop"
    ],
    redFlags: ["sudden worst headache", "facial droop", "slurred speech", "seizures", "one-sided weakness"],
    summaryTemplate: "Reported symptoms indicate possible neurological etiology such as migraine, neuropathic sensitivity, or vestibular disturbance. Consultation with a Neurologist is strongly recommended.",
    questions: [
      "Are your headaches accompanied by visual disturbances, nausea, or sensitivity to light/sound?",
      "Have you noticed any weakness or loss of coordination in your hands or legs?",
      "How frequently do these episodes occur and what triggers them?"
    ]
  },
  Orthopedic: {
    aliases: ["Orthopedic", "Orthopedics", "Bone Specialist", "Joint Specialist"],
    keywords: [
      "bone", "joint", "joint pain", "knee pain", "back pain", "lower back",
      "spine", "neck pain", "shoulder pain", "fracture", "sprain", "swelling",
      "arthritis", "stiffness", "ligament", "tendon", "hip pain", "ankle pain",
      "difficulty walking", "creaking joints", "sports injury"
    ],
    redFlags: ["inability to bear weight", "visible joint deformity", "severe trauma after fall"],
    summaryTemplate: "Symptoms correlate with musculoskeletal or joint dysfunction. An Orthopedic specialist can assess joint mobility, order targeted imaging (X-Ray/MRI), and outline rehabilitation.",
    questions: [
      "Did the pain begin following an acute injury, twist, or gradual wear?",
      "Is the joint stiffness worse in the morning upon waking up?",
      "Does resting or taking over-the-counter anti-inflammatory medicine relieve the pain?"
    ]
  },
  "ENT Specialist": {
    aliases: ["ENT Specialist", "ENT", "Otolaryngology", "Ear Nose Throat"],
    keywords: [
      "ear", "earache", "ear pain", "throat", "sore throat", "throat pain",
      "tonsil", "tonsils", "hearing loss", "muffled hearing", "tinnitus",
      "ringing in ear", "sinus", "sinusitis", "nasal", "runny nose", "blocked nose",
      "hoarseness", "voice loss", "nasal congestion", "difficulty swallowing",
      "ear discharge", "vertigo", "nosebleed"
    ],
    redFlags: ["difficulty breathing or swallowing", "ear discharge with severe vertigo", "persistent hoarseness > 2 weeks"],
    summaryTemplate: "Symptoms present clinical signs of otorhinolaryngological (ear, nose, or throat) involvement. An ENT specialist can perform an endoscopic otoscopy and advise on medical or conservative treatment.",
    questions: [
      "Is the throat pain accompanied by difficulty swallowing liquids or solids?",
      "Have you noticed any fluid drainage or hearing impairment in the affected ear?",
      "Do seasonal changes or air conditioning exacerbate your nasal symptoms?"
    ]
  },
  "General Physician": {
    aliases: ["General Physician", "General Medicine", "Internal Medicine"],
    keywords: [
      "fever", "high temperature", "chills", "weakness", "fatigue", "tiredness",
      "body ache", "flu", "cold", "viral", "cough", "vomiting", "nausea",
      "stomach pain", "abdominal pain", "diarrhea", "loose motion", "food poisoning",
      "infection", "loss of appetite", "dehydration", "diabetes", "routine checkup",
      "malaise", "head cold", "shivering"
    ],
    redFlags: ["fever above 103F for >3 days", "severe persistent vomiting", "signs of severe dehydration"],
    summaryTemplate: "Symptoms indicate an acute systemic infection, viral syndrome, or general medical ailment. An initial consultation with a General Physician is recommended for comprehensive diagnostic triage.",
    questions: [
      "How many days has the fever or illness been active, and what was your peak recorded temperature?",
      "Are you able to keep fluids down without vomiting?",
      "Have you recently traveled or had contact with anyone carrying similar infections?"
    ]
  },
  Pediatrician: {
    aliases: ["Pediatrician", "Pediatrics", "Child Specialist"],
    keywords: [
      "baby", "infant", "child", "toddler", "kid", "newborn", "pediatric",
      "child fever", "baby rash", "incessant crying", "colic", "teething",
      "not feeding", "vaccination", "milestone delay", "growth"
    ],
    redFlags: ["infant lethargy", "child refusing all fluids", "respiratory retractions in child"],
    summaryTemplate: "Symptoms relate to infant, child, or pediatric health. A certified Pediatrician is the dedicated clinical expert equipped to evaluate developmental metrics and pediatric pharmacotherapy.",
    questions: [
      "What is the exact age and weight of the child?",
      "Is the child maintaining normal wet diaper count and fluid intake?",
      "Are vaccinations up to date according to national schedules?"
    ]
  },
  Psychiatrist: {
    aliases: ["Psychiatrist", "Psychiatry", "Mental Health Specialist"],
    keywords: [
      "anxiety", "anxious", "depression", "depressed", "sadness", "panic",
      "panic attack", "insomnia", "sleeplessness", "sleep trouble", "nightmares",
      "chronic stress", "bipolar", "mood swings", "ocd", "adhd", "burnout",
      "overthinking", "racing thoughts", "loss of interest", "social anxiety"
    ],
    redFlags: ["self-harm thoughts", "hallucinations", "complete inability to function"],
    summaryTemplate: "Reported symptoms are consistent with emotional, psychological, or affective distress. A Psychiatrist or clinical mental health specialist can offer structured clinical assessment and therapy plans.",
    questions: [
      "How significantly have these emotional symptoms impacted your sleep, appetite, or daily routine?",
      "How long have you been feeling this persistent overwhelm or anxiety?",
      "Have you previously tried psychotherapy or psychiatric counseling?"
    ]
  },
  Dentist: {
    aliases: ["Dentist", "Dental", "Dental Surgeon"],
    keywords: [
      "tooth", "teeth", "toothache", "gum", "gums", "bleeding gums", "cavity",
      "decay", "tooth sensitivity", "hot cold pain", "root canal", "jaw pain",
      "mouth ulcer", "bad breath", "swollen gum", "wisdom tooth", "loose tooth"
    ],
    redFlags: ["facial swelling spreading to eye or neck", "uncontrolled oral bleeding"],
    summaryTemplate: "Symptoms involve dental, oral mucosal, or periodontal structures. A Dental Surgeon is required to inspect tooth vitality, order intraoral radiography, and prescribe dental interventions.",
    questions: [
      "Does the tooth sensitivity flare up specifically with hot or cold foods?",
      "Is there noticeable swelling or bleeding along the gumline when brushing?",
      "Is the pain throbbing, sharp, or continuous through the night?"
    ]
  }
};

function analyzeRuleBased(text) {
  const normalized = text.toLowerCase();
  const scores = {};
  const matchedKeywordsBySpec = {};
  let isHighUrgency = false;
  let isModerateUrgency = false;

  for (const [spec, data] of Object.entries(MEDICAL_KNOWLEDGE_BASE)) {
    let score = 0;
    const matches = [];

    for (const kw of data.keywords) {
      if (normalized.includes(kw)) {
        score += kw.split(" ").length > 1 ? 3 : 1.5;
        matches.push(kw);
      }
    }

    for (const rf of data.redFlags) {
      if (normalized.includes(rf)) {
        score += 5;
        isHighUrgency = true;
      }
    }

    if (score > 0) {
      scores[spec] = score;
      matchedKeywordsBySpec[spec] = matches;
    }
  }

  if (
    normalized.includes("unconscious") ||
    normalized.includes("paralysis") ||
    normalized.includes("blood in cough") ||
    normalized.includes("cannot breathe") ||
    normalized.includes("severe chest pain")
  ) {
    isHighUrgency = true;
  } else if (
    normalized.includes("severe") ||
    normalized.includes("high fever") ||
    normalized.includes("persistent") ||
    normalized.includes("vomiting")
  ) {
    isModerateUrgency = true;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  let primary = "General Physician";
  let secondary = null;
  let matchedKeywords = [];

  if (sorted.length > 0) {
    primary = sorted[0][0];
    matchedKeywords = matchedKeywordsBySpec[primary] || [];
    if (sorted.length > 1) {
      secondary = sorted[1][0];
      matchedKeywords = Array.from(new Set([...matchedKeywords, ...(matchedKeywordsBySpec[secondary] || [])]));
    }
  }

  const specData = MEDICAL_KNOWLEDGE_BASE[primary] || MEDICAL_KNOWLEDGE_BASE["General Physician"];
  const urgency = isHighUrgency ? "High" : isModerateUrgency ? "Moderate" : "Routine";
  const confidence = sorted.length > 0 ? Math.min(96, Math.max(74, Math.round(sorted[0][1] * 14))) : 70;

  return {
    primarySpecialization: primary,
    secondarySpecialization: secondary,
    urgency,
    confidence,
    matchedKeywords: matchedKeywords.slice(0, 6),
    clinicalSummary: specData.summaryTemplate,
    recommendedQuestions: specData.questions,
    disclaimer:
      "MediConnect AI provides preliminary triage recommendations based on reported symptoms and does not substitute professional medical diagnosis. If you are experiencing sudden severe chest pain, loss of consciousness, or breathing failure, please contact emergency services immediately.",
    source: "Clinical-Triage-Engine"
  };
}

async function analyzeWithGemini(symptomsText) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const validSpecializations = Object.keys(MEDICAL_KNOWLEDGE_BASE).join(", ");
  const prompt = `You are an expert AI clinical triage assistant for MediConnect telehealth platform.
Analyze the following patient reported symptoms:
"${symptomsText}"

Output strict JSON with this exact schema:
{
  "primarySpecialization": "<One of: ${validSpecializations}>",
  "secondarySpecialization": "<One of: ${validSpecializations} or null>",
  "urgency": "<Routine | Moderate | High>",
  "confidence": <integer between 70 and 98>,
  "matchedKeywords": ["<extracted keyword 1>", "<extracted keyword 2>"],
  "clinicalSummary": "<2-sentence clinical explanation justifying the specialist recommendation>",
  "recommendedQuestions": ["<question for doctor 1>", "<question for doctor 2>", "<question for doctor 3>"]
}
Output only the raw JSON string without markdown formatting.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4500);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 500,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    clearTimeout(timeoutId);
    if (!res.ok) return null;

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const parsed = JSON.parse(rawText.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim());
    return {
      ...parsed,
      disclaimer:
        "MediConnect AI provides preliminary triage recommendations based on reported symptoms and does not substitute professional medical diagnosis. If you are experiencing an emergency, please visit the nearest hospital immediately.",
      source: "Gemini-1.5-Flash"
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return null;
  }
}

async function analyzeSymptoms(symptomsText) {
  try {
    const geminiResult = await analyzeWithGemini(symptomsText);
    if (geminiResult && geminiResult.primarySpecialization) {
      return geminiResult;
    }
  } catch (e) {}
  return analyzeRuleBased(symptomsText);
}

module.exports = {
  analyzeSymptoms,
  MEDICAL_KNOWLEDGE_BASE,
};


/**
 * Clinical Reference Ranges for Common Lab Parameters
 */
const LAB_REFERENCE_DATA = [
  { name: "Fasting Blood Sugar", aliases: ["fbs", "fasting glucose", "fasting blood sugar", "glucose fasting"], unit: "mg/dL", min: 70, max: 99, highMeaning: "Elevated fasting blood sugar (impaired fasting glucose or pre-diabetes/diabetes risk).", lowMeaning: "Hypoglycemia (low blood sugar)." },
  { name: "HbA1c", aliases: ["hba1c", "glycated hemoglobin", "a1c"], unit: "%", min: 4.0, max: 5.6, highMeaning: "Prediabetes (5.7 - 6.4%) or Diabetes (>=6.5%). Indicates 3-month average elevated blood glucose.", lowMeaning: "Unusually low HbA1c; may indicate hemolytic anemia." },
  { name: "Total Cholesterol", aliases: ["total cholesterol", "cholesterol total", "serum cholesterol"], unit: "mg/dL", min: 125, max: 200, highMeaning: "Hypercholesterolemia. Elevated cardiovascular risk and arterial plaque predisposition.", lowMeaning: "Very low cholesterol (rare, check liver health)." },
  { name: "Triglycerides", aliases: ["triglycerides", "serum triglycerides", "tg"], unit: "mg/dL", min: 50, max: 150, highMeaning: "Hypertriglyceridemia. Associated with metabolic syndrome and dietary fat intake.", lowMeaning: "Low triglycerides." },
  { name: "TSH (Thyroid Stimulating Hormone)", aliases: ["tsh", "thyroid stimulating hormone", "ultrasensitive tsh"], unit: "uIU/mL", min: 0.4, max: 4.5, highMeaning: "Hypothyroidism (Underactive thyroid gland, fatigue, weight gain tendency).", lowMeaning: "Hyperthyroidism (Overactive thyroid gland, palpitations, weight loss)." },
  { name: "Hemoglobin", aliases: ["hemoglobin", "hb", "hgb"], unit: "g/dL", min: 12.0, max: 17.5, highMeaning: "Polycythemia (elevated red cell mass or dehydration).", lowMeaning: "Anemia (iron deficiency, blood loss, or nutritional deficit)." },
  { name: "Platelet Count", aliases: ["platelet count", "platelets", "plt"], unit: "lakh/cumm", min: 1.5, max: 4.5, highMeaning: "Thrombocytosis (inflammation or reactive marrow).", lowMeaning: "Thrombocytopenia (bleeding risk, viral infections like dengue)." },
  { name: "SGPT / ALT (Liver Enzyme)", aliases: ["sgpt", "alt", "alanine aminotransferase"], unit: "U/L", min: 7, max: 56, highMeaning: "Hepatic stress, fatty liver, or hepatocellular inflammation.", lowMeaning: "Normal liver baseline." },
  { name: "Serum Creatinine (Kidney Function)", aliases: ["creatinine", "serum creatinine"], unit: "mg/dL", min: 0.6, max: 1.2, highMeaning: "Decreased renal filtration / kidney strain. Requires adequate hydration and nephrology review.", lowMeaning: "Low muscle mass or hyperfiltration." },
  { name: "Vitamin D (25-OH)", aliases: ["vitamin d", "25-hydroxy vitamin d", "vit d"], unit: "ng/mL", min: 30, max: 100, highMeaning: "Vitamin D toxicity (rare, usually from over-supplementation).", lowMeaning: "Vitamin D deficiency / insufficiency (bone pain, fatigue, low immunity)." },
  { name: "Vitamin B12", aliases: ["vitamin b12", "b12", "cobalamin"], unit: "pg/mL", min: 200, max: 900, highMeaning: "High B12 (often benign, or from supplements).", lowMeaning: "B12 deficiency (peripheral neuropathy, fatigue, tingling in extremities)." }
];

function summarizeReportRuleBased(reportText) {
  const normalized = reportText.toLowerCase();
  const extractedMarkers = [];
  let outOfRangeCount = 0;

  for (const lab of LAB_REFERENCE_DATA) {
    for (const alias of lab.aliases) {
      const regex = new RegExp(alias + "[^0-9]{0,20}([0-9]+(?:\\.[0-9]+)?)", "i");
      const match = normalized.match(regex);
      if (match && match[1]) {
        const val = parseFloat(match[1]);
        let status = "NORMAL";
        let clinicalNote = "Within optimal physiological reference range.";

        if (val > lab.max) {
          status = "HIGH";
          clinicalNote = lab.highMeaning;
          outOfRangeCount++;
        } else if (val < lab.min) {
          status = "LOW";
          clinicalNote = lab.lowMeaning;
          outOfRangeCount++;
        }

        extractedMarkers.push({
          parameter: lab.name,
          value: val,
          unit: lab.unit,
          referenceRange: lab.min + " - " + lab.max + " " + lab.unit,
          status,
          clinicalNote
        });
        break;
      }
    }
  }

  let recommendedDoctor = "General Physician";
  if (normalized.includes("cholesterol") || normalized.includes("triglyceride") || normalized.includes("ecg") || normalized.includes("troponin")) {
    recommendedDoctor = "Cardiologist";
  } else if (normalized.includes("tsh") || normalized.includes("hba1c") || normalized.includes("glucose") || normalized.includes("sugar")) {
    recommendedDoctor = "General Physician / Endocrinologist";
  } else if (normalized.includes("creatinine") || normalized.includes("urea") || normalized.includes("urine")) {
    recommendedDoctor = "Nephrologist / General Physician";
  } else if (normalized.includes("sgpt") || normalized.includes("bilirubin") || normalized.includes("liver")) {
    recommendedDoctor = "Gastroenterologist / Physician";
  }

  return {
    overview: extractedMarkers.length > 0 
      ? ("Analyzed " + extractedMarkers.length + " clinical marker(s) from your lab report. Found " + outOfRangeCount + " parameter(s) requiring attention.")
      : "Processed document overview. No specific numeric markers matched standard reference panels, but clinical context was triaged.",
    totalMarkers: extractedMarkers.length,
    outOfRangeCount,
    extractedMarkers,
    keyTakeaway: outOfRangeCount > 0
      ? "Certain values fall outside standard clinical reference bounds. Reviewing these findings with a certified physician is recommended to formulate a lifestyle, dietary, or pharmacotherapy plan."
      : "All identified markers appear within standard physiological limits. Maintain routine health screening and consult your doctor for preventative guidance.",
    recommendedDoctor,
    suggestedQuestions: [
      "Do any of these out-of-range parameters require immediate medication, or can they be managed through diet and lifestyle?",
      "When should I repeat these blood tests to check for improvement?",
      "Are there any secondary confirmatory tests recommended based on these findings?"
    ],
    disclaimer: "MediConnect AI Report Summarizer is an assistive educational tool and does not substitute professional medical interpretation. Always consult your attending doctor."
  };
}

async function summarizeMedicalReport(reportText) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return summarizeReportRuleBased(reportText);
  }

  const prompt = `You are an expert clinical laboratory analyst for MediConnect telehealth.
Analyze this medical report / lab text:
"${reportText}"

Extract all lab test markers, compare with standard reference ranges, and return strict JSON with this exact format:
{
  "overview": "<2-sentence plain English summary of the report>",
  "totalMarkers": <integer>,
  "outOfRangeCount": <integer>,
  "extractedMarkers": [
    {
      "parameter": "<Test Name e.g. HbA1c>",
      "value": <number or string>,
      "unit": "<unit>",
      "referenceRange": "<range>",
      "status": "<NORMAL | HIGH | LOW>",
      "clinicalNote": "<1-sentence plain English explanation of what this status means>"
    }
  ],
  "keyTakeaway": "<Clear summary for the patient of what to do next>",
  "recommendedDoctor": "<Clinical Specialty e.g. Cardiologist, Endocrinologist, General Physician>",
  "suggestedQuestions": ["<question 1>", "<question 2>", "<question 3>"]
}
Output only raw JSON without markdown.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 800, responseMimeType: "application/json" },
        }),
      }
    );
    clearTimeout(timeoutId);

    if (!res.ok) return summarizeReportRuleBased(reportText);
    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return summarizeReportRuleBased(reportText);

    const parsed = JSON.parse(rawText.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim());
    return {
      ...parsed,
      disclaimer: "MediConnect AI Report Summarizer is an educational triage tool. Formal clinical diagnosis must be made by a licensed doctor."
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return summarizeReportRuleBased(reportText);
  }
}

async function handleAIChat(message, chatHistory = [], context = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  const normalizedMsg = message.toLowerCase();

  // If report summarization requested in chat
  if (normalizedMsg.includes("summarize") || normalizedMsg.includes("report") || normalizedMsg.includes("blood test") || normalizedMsg.includes("hba1c") || normalizedMsg.includes("cholesterol")) {
    const summary = await summarizeMedicalReport(message);
    let reply = summary.overview + "\n\n" + summary.keyTakeaway;
    if (summary.extractedMarkers && summary.extractedMarkers.length > 0) {
      reply += "\n\nKey findings identified:\n" + summary.extractedMarkers.map(m => "• " + m.parameter + ": " + m.value + " " + m.unit + " (" + m.status + ") — " + m.clinicalNote).join("\n");
    }
    reply += "\n\nRecommended Specialist: " + summary.recommendedDoctor;
    return {
      reply,
      summaryData: summary,
      followUpSuggestions: [
        "What dietary changes can help improve these numbers?",
        "When should I repeat this lab test?",
        "Can you connect me with a " + summary.recommendedDoctor + "?"
      ]
    };
  }

  // Symptom match in chat
  if (normalizedMsg.includes("fever") || normalizedMsg.includes("pain") || normalizedMsg.includes("cough") || normalizedMsg.includes("rash") || normalizedMsg.includes("headache") || normalizedMsg.includes("symptom")) {
    const triage = await analyzeSymptoms(message);
    return {
      reply: "Based on the symptoms described (" + triage.matchedKeywords.join(", ") + "), our clinical triage suggests consulting a " + triage.primarySpecialization + ".\n\n" + triage.clinicalSummary,
      triageData: triage,
      followUpSuggestions: [
        "What questions should I ask the " + triage.primarySpecialization + "?",
        "Are these symptoms urgent?",
        "Show me available " + triage.primarySpecialization + " doctors"
      ]
    };
  }

  // Standard LLM or smart medical assistant reply
  if (apiKey) {
    try {
      const prompt = `You are MediConnect AI, an empathetic, certified clinical health assistant on the MediConnect Telehealth platform.
User says: "${message}"
Chat History: ${JSON.stringify(chatHistory.slice(-4))}
Context: ${JSON.stringify(context || {})}

Provide a warm, scientifically accurate, concise (2-3 short paragraphs) answer.
Always suggest relevant medical questions to ask a doctor, and provide a clear medical disclaimer.
Keep formatting clean with bullet points.`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return {
          reply: text,
          followUpSuggestions: [
            "Which specialist should I consult for this?",
            "What preventive steps can I take?",
            "Summarize my recent lab report"
          ]
        };
      }
    } catch (e) {}
  }

  // Fallback intelligent response
  return {
    reply: "Hello! I am your MediConnect AI Health Assistant. I can help you:\n\n1. **Analyze Symptoms:** Describe what you are experiencing, and I will recommend the right clinical specialist.\n2. **Summarize Lab Reports:** Paste your blood test, lipid panel, or scan findings, and I will decode complex markers into plain English.\n3. **Prepare for Doctor Visits:** Generate targeted clinical questions for your upcoming consultation.\n\nHow can I assist your health journey today?",
    followUpSuggestions: [
      "I have a high fever and sore throat",
      "Summarize my blood test: Fasting Sugar 138, HbA1c 6.8%",
      "I have sudden chest pain and palpitations"
    ]
  };
}

module.exports.summarizeMedicalReport = summarizeMedicalReport;
module.exports.handleAIChat = handleAIChat;
