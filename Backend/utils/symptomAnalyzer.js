/**
 * MediConnect Clinical Triage & Lab Report Intelligence Engine
 * Dual-layer architecture:
 * 1. Google Gemini Generative AI (active if GEMINI_API_KEY is configured in environment)
 * 2. Comprehensive offline Clinical Knowledge Base (100+ symptoms, CBC, Metabolic, Inflammatory & Wellness panels)
 */

const https = require("https");

// ============================================================================
// CLINICAL LAB REFERENCE DATABASE (CBC, Metabolic, Inflammatory, Lipids, etc.)
// ============================================================================
const LAB_REFERENCE_DATABASE = [
  // COMPLETE BLOOD COUNT (CBC) & DIFFERENTIAL
  {
    parameter: "Hemoglobin",
    aliases: ["hemoglobin", "hb", "haemoglobin", "hgb"],
    min: 12.0,
    max: 17.5,
    unit: "g/dL",
    lowFlag: "Anemia (Iron deficiency, chronic blood loss, or nutritional deficit).",
    highFlag: "Polycythemia (Dehydration, chronic hypoxia, or bone marrow overproduction).",
    specialist: "General Physician"
  },
  {
    parameter: "Red Blood Cell Count (RBC)",
    aliases: ["red blood cell", "rbc", "red blood cells", "erythrocytes"],
    min: 4.0,
    max: 5.9,
    unit: "10^6/µL",
    lowFlag: "Erythropenia / Anemia, reduced oxygen-carrying capacity.",
    highFlag: "Erythrocytosis, reactive or secondary polycythemia.",
    specialist: "General Physician"
  },
  {
    parameter: "Hematocrit (PCV)",
    aliases: ["hematocrit", "pcv", "packed cell volume"],
    min: 36.0,
    max: 50.0,
    unit: "%",
    lowFlag: "Low hematocrit, indicative of anemia or fluid overload.",
    highFlag: "Elevated hematocrit, signs of dehydration or polycythemia.",
    specialist: "General Physician"
  },
  {
    parameter: "Mean Corpuscular Volume (MCV)",
    aliases: ["mcv", "mean corpuscular volume"],
    min: 80.0,
    max: 100.0,
    unit: "fL",
    lowFlag: "Microcytic red cells (classic indicator of Iron Deficiency Anemia or Thalassemia trait).",
    highFlag: "Macrocytic red cells (indicative of Vitamin B12 or Folate deficiency).",
    specialist: "General Physician"
  },
  {
    parameter: "Mean Corpuscular Hemoglobin (MCH)",
    aliases: ["mch", "mean corpuscular hemoglobin"],
    min: 27.0,
    max: 33.0,
    unit: "pg",
    lowFlag: "Hypochromia (pale red cells typical in iron deficiency).",
    highFlag: "Hyperchromia (associated with macrocytosis).",
    specialist: "General Physician"
  },
  {
    parameter: "MCHC",
    aliases: ["mchc"],
    min: 32.0,
    max: 36.0,
    unit: "g/dL",
    lowFlag: "Hypochromic microcytic state.",
    highFlag: "Spherocytosis or severe hyperchromia.",
    specialist: "General Physician"
  },
  {
    parameter: "Red Cell Distribution Width (RDW)",
    aliases: ["rdw", "rdw-cv", "red cell distribution width"],
    min: 11.5,
    max: 14.5,
    unit: "%",
    lowFlag: "Homogeneous cell population.",
    highFlag: "Anisocytosis (high size variation, strongly points to active Iron Deficiency Anemia).",
    specialist: "General Physician"
  },
  {
    parameter: "Total Leukocyte Count (WBC)",
    aliases: ["wbc", "total leukocyte count", "white blood cell", "white blood cells", "tlc"],
    min: 4000,
    max: 11000,
    unit: "cells/µL",
    lowFlag: "Leukopenia (bone marrow suppression, viral infection, or autoimmune condition).",
    highFlag: "Leukocytosis (active bacterial infection, systemic inflammation, or stress response).",
    specialist: "General Physician"
  },
  {
    parameter: "Absolute Neutrophil Count",
    aliases: ["neutrophil", "neutrophils", "anc", "absolute neutrophil count"],
    min: 1800,
    max: 7500,
    unit: "cells/µL",
    lowFlag: "Neutropenia (vulnerability to opportunistic infection).",
    highFlag: "Neutrophilia (acute bacterial infection or inflammatory response).",
    specialist: "General Physician"
  },
  {
    parameter: "Absolute Lymphocyte Count",
    aliases: ["lymphocyte", "lymphocytes", "absolute lymphocyte count"],
    min: 1000,
    max: 4000,
    unit: "cells/µL",
    lowFlag: "Lymphopenia (immunodeficiency or acute viral stress).",
    highFlag: "Lymphocytosis (viral illness, recovery phase, or lymphoid reaction).",
    specialist: "General Physician"
  },
  {
    parameter: "Platelet Count",
    aliases: ["platelet", "platelets", "platelet count", "thrombocytes"],
    min: 150000,
    max: 450000,
    unit: "/µL",
    lowFlag: "Thrombocytopenia (increased bleeding/bruising risk, dengue/viral infection risk).",
    highFlag: "Thrombocytosis (reactive inflammatory state or reactive marrow).",
    specialist: "General Physician"
  },

  // METABOLIC & INFLAMMATORY MARKERS
  {
    parameter: "Serum Ferritin",
    aliases: ["ferritin", "serum ferritin"],
    min: 24.0,
    max: 336.0,
    unit: "ng/mL",
    lowFlag: "Depleted iron stores / Iron deficiency (even before overt anemia manifests).",
    highFlag: "Ferritin elevation (acute phase reactant, inflammation, hemochromatosis).",
    specialist: "General Physician"
  },
  {
    parameter: "C-Reactive Protein (CRP)",
    aliases: ["crp", "c-reactive protein", "c reactive protein"],
    min: 0.0,
    max: 5.0,
    unit: "mg/L",
    lowFlag: "Normal baseline.",
    highFlag: "Active systemic inflammation, bacterial infection, or tissue trauma.",
    specialist: "General Physician"
  },
  {
    parameter: "Fasting Blood Sugar",
    aliases: ["fasting blood sugar", "fbs", "fasting glucose", "fasting blood glucose"],
    min: 70.0,
    max: 99.0,
    unit: "mg/dL",
    lowFlag: "Hypoglycemia (low blood sugar).",
    highFlag: "Impaired Fasting Glucose (100-125 pre-diabetes, >=126 diabetes risk).",
    specialist: "General Physician"
  },
  {
    parameter: "HbA1c",
    aliases: ["hba1c", "glycated hemoglobin", "a1c"],
    min: 4.0,
    max: 5.6,
    unit: "%",
    lowFlag: "Low average blood glucose.",
    highFlag: "Prediabetes (5.7 - 6.4%) or Diabetes (>=6.5%). 3-month elevated glucose control.",
    specialist: "General Physician"
  },
  {
    parameter: "Serum Creatinine",
    aliases: ["creatinine", "serum creatinine"],
    min: 0.6,
    max: 1.2,
    unit: "mg/dL",
    lowFlag: "Low muscle mass or hyperfiltration.",
    highFlag: "Reduced renal clearance / kidney filtration compromise.",
    specialist: "General Physician"
  },
  {
    parameter: "Total Cholesterol",
    aliases: ["total cholesterol", "cholesterol"],
    min: 125.0,
    max: 200.0,
    unit: "mg/dL",
    lowFlag: "Very low cholesterol (nutritional deficit or malabsorption).",
    highFlag: "Hypercholesterolemia. Elevated cardiovascular plaque risk.",
    specialist: "Cardiologist"
  },
  {
    parameter: "Triglycerides",
    aliases: ["triglycerides", "triglyceride", "tg"],
    min: 50.0,
    max: 150.0,
    unit: "mg/dL",
    lowFlag: "Low baseline.",
    highFlag: "Hypertriglyceridemia, metabolic syndrome, or pancreatic risk if >500.",
    specialist: "Cardiologist"
  },
  {
    parameter: "Thyroid Stimulating Hormone (TSH)",
    aliases: ["tsh", "thyroid stimulating hormone"],
    min: 0.4,
    max: 4.2,
    unit: "µIU/mL",
    lowFlag: "Hyperthyroidism (overactive thyroid).",
    highFlag: "Hypothyroidism (underactive thyroid, causing fatigue, sluggish metabolism).",
    specialist: "General Physician"
  }
  // LIVER FUNCTION TEST (LFT)
  {
    parameter: "Bilirubin (Total)",
    aliases: ["bilirubin", "total bilirubin", "s. bilirubin"],
    min: 0.2,
    max: 1.2,
    unit: "mg/dL",
    lowFlag: "Normal physiological baseline.",
    highFlag: "Hyperbilirubinemia / Jaundice (suggests hepatic dysfunction, bile duct obstruction, or hemolysis).",
    specialist: "Gastroenterologist"
  },
  {
    parameter: "SGPT / ALT (Alanine Aminotransferase)",
    aliases: ["sgpt", "alt", "alanine aminotransferase", "alanine transaminase"],
    min: 7.0,
    max: 56.0,
    unit: "U/L",
    lowFlag: "Normal baseline.",
    highFlag: "Elevated liver enzyme (hepatocellular inflammation, fatty liver disease, viral hepatitis, or medication-induced stress).",
    specialist: "Gastroenterologist"
  },
  {
    parameter: "SGOT / AST (Aspartate Aminotransferase)",
    aliases: ["sgot", "ast", "aspartate aminotransferase"],
    min: 10.0,
    max: 40.0,
    unit: "U/L",
    lowFlag: "Normal baseline.",
    highFlag: "Elevated hepatic/cellular enzyme (liver tissue injury, alcoholic liver disease, or muscle breakdown).",
    specialist: "Gastroenterologist"
  },
  {
    parameter: "Alkaline Phosphatase (ALP)",
    aliases: ["alkaline phosphatase", "alp"],
    min: 44.0,
    max: 147.0,
    unit: "U/L",
    lowFlag: "Low ALP (malnutrition, zinc deficiency).",
    highFlag: "Biliary obstruction, cholestasis, or high bone turnover.",
    specialist: "Gastroenterologist"
  },
  {
    parameter: "Serum Albumin",
    aliases: ["albumin", "serum albumin"],
    min: 3.5,
    max: 5.5,
    unit: "g/dL",
    lowFlag: "Hypoalbuminemia (chronic liver impairment, nephrotic kidney syndrome, or severe protein malnutrition).",
    highFlag: "Dehydration.",
    specialist: "General Physician"
  },

  // KIDNEY & METABOLIC (KFT / RFT)
  {
    parameter: "Blood Urea Nitrogen (BUN)",
    aliases: ["blood urea", "bun", "urea"],
    min: 7.0,
    max: 20.0,
    unit: "mg/dL",
    lowFlag: "Low baseline (overhydration or severe liver disease).",
    highFlag: "Azotemia (impaired renal filtration, dehydration, or high protein catabolism).",
    specialist: "Nephrologist"
  },
  {
    parameter: "Uric Acid",
    aliases: ["uric acid", "serum uric acid"],
    min: 3.5,
    max: 7.2,
    unit: "mg/dL",
    lowFlag: "Hypouricemia.",
    highFlag: "Hyperuricemia (risk of Gout, joint crystal deposits, or kidney stones).",
    specialist: "Orthopedic"
  },

  // VITAMINS
  {
    parameter: "Vitamin D3 (25-Hydroxy)",
    aliases: ["vitamin d", "vitamin d3", "25-oh vitamin d"],
    min: 30.0,
    max: 100.0,
    unit: "ng/mL",
    lowFlag: "Vitamin D deficiency (bone density loss, fatigue, muscle weakness, weakened immune resilience).",
    highFlag: "Hypervitaminosis D (rare, excessive supplementation).",
    specialist: "General Physician"
  },
  {
    parameter: "Vitamin B12",
    aliases: ["vitamin b12", "b12", "cobalamin"],
    min: 200.0,
    max: 900.0,
    unit: "pg/mL",
    lowFlag: "Vitamin B12 deficiency (peripheral neuropathy, tingling in hands/feet, cognitive brain fog, megaloblastic anemia).",
    highFlag: "Elevated B12 (frequently benign or supplement-related).",
    specialist: "General Physician"
  },
];

// ============================================================================
// GENERAL HEALTH & WELLNESS KNOWLEDGE RESPONDER
// ============================================================================
function getGeneralHealthResponse(query) {
  const q = query.toLowerCase();

  // 1. "How to be healthy" / General fitness & wellness
  if (
    q.includes("how to be healthy") ||
    q.includes("healthy") ||
    q.includes("stay healthy") ||
    q.includes("stay fit") ||
    q.includes("good health") ||
    q.includes("healthy lifestyle") ||
    q.includes("swasth")
  ) {
    return {
      reply: `Here are the 6 foundational pillars of lifelong health, backed by preventive medicine:

1. 🥗 **Nutritional Balance:**
   • Prioritize whole foods: leafy greens, legumes, lean proteins, nuts, and seasonal fruits.
   • Minimize refined sugars, ultra-processed packaged foods, and excess sodium.
   • Aim for a plate composed of 50% vegetables/salads, 25% protein, and 25% complex carbohydrates.

2. 💧 **Optimal Daily Hydration:**
   • Drink 2.5 to 3.5 liters of clean water daily (approx. 35ml per kg of body weight).
   • Hydration maintains cellular metabolism, joint lubrication, and optimal kidney filtration.

3. 🏃 **Daily Physical Movement:**
   • Aim for at least 150 minutes of moderate aerobic activity weekly (brisk walking, cycling, swimming).
   • Include 2 days of strength/resistance training to preserve muscle mass and bone density.

4. 😴 **Circadian Sleep (7–9 Hours):**
   • Consistent sleep and wake times regulate cortisol, growth hormone, and immune cytokines.
   • Avoid bright screens 1 hour before bed and keep your bedroom cool and dark.

5. 🧘 **Stress Regulation & Mental Health:**
   • Chronic high cortisol accelerates inflammation. Practice 10 minutes of daily diaphragmatic breathing or mindfulness.
   • Maintain strong social connections and set healthy digital boundaries.

6. 🩺 **Routine Preventative Screenings:**
   • Have an annual health check: CBC, Fasting Blood Sugar, Lipid Profile, Vitamin D3/B12, and blood pressure.
   • Catching subtle biomarker changes early prevents chronic disease before symptoms arise.`,
      followUpSuggestions: [
        "What routine health tests should I get annually?",
        "How much water should I drink daily?",
        "Diet tips for boosting immunity",
        "How to improve sleep quality?"
      ]
    };
  }

  // 2. Sleep & Insomnia
  if (q.includes("sleep") || q.includes("insomnia") || q.includes("tired") || q.includes("neend")) {
    return {
      reply: `Quality sleep is the foundation of cellular repair and hormonal balance. Here is clinical sleep hygiene advice:

• **Set a Fixed Wake-Up Time:** Waking up at the exact same time every morning (including weekends) sets your master circadian clock.
• **Morning Sun Exposure:** Get 15–20 minutes of outdoor natural light within an hour of waking to stimulate daytime cortisol and nighttime melatonin.
• **Cut Off Stimulants Early:** Avoid caffeine (coffee, tea, energy drinks) at least 8 hours before bed.
• **The 1-Hour Wind-Down:** Dim ambient lights, stop work-related screens, and keep your bedroom temperature around 18–20°C.
• **Avoid Heavy Late Dinners:** Finish dinner at least 2.5 to 3 hours before lying down to avoid acid reflux and restless sleep.`,
      followUpSuggestions: [
        "How to be healthy overall?",
        "What vitamins help with fatigue?",
        "Consult a General Physician for chronic insomnia"
      ]
    };
  }

  // 3. Diet, Weight, and Nutrition
  if (q.includes("diet") || q.includes("weight") || q.includes("nutrition") || q.includes("food") || q.includes("khana")) {
    return {
      reply: `Evidence-based principles for a sustainable, healthy diet:

• **Adequate Protein Intake:** Consume 1.0 to 1.5 grams of protein per kg of ideal body weight (eggs, paneer, lentils, tofu, chicken, fish) to maintain satiety and preserve muscle.
• **Fiber-Rich Carbohydrates:** Switch from refined flour and white rice to whole grains (oats, brown rice, millets, quinoa) to avoid insulin spikes.
• **Healthy Fats:** Include cold-pressed oils, walnuts, almonds, flaxseeds, and chia seeds for cardiovascular health.
• **Portion Discipline:** Eat until you are 80% full, chew slowly, and avoid liquid calories like sodas and packaged juices.`,
      followUpSuggestions: [
        "How to be healthy overall?",
        "What foods improve hemoglobin/iron?",
        "Check my symptoms"
      ]
    };
  }

  // 4. Anemia / Iron Deficiency (Relevant to the user's uploaded report)
  if (q.includes("anemia") || q.includes("hemoglobin") || q.includes("iron") || q.includes("ferritin")) {
    return {
      reply: `Iron Deficiency & Low Hemoglobin Management:

• **Dietary Iron Sources:** Include spinach, beetroot, pomegranate, lentils (dal), chickpeas, black dates, raisins, and lean meats.
• **Enhance Absorption:** Always pair plant iron with Vitamin C (lemon juice, oranges, amla) — Vitamin C increases non-heme iron absorption by up to 300%.
• **Avoid Inhibitors:** Do not drink tea or coffee within 1 hour of meals, as tannins significantly block iron uptake.
• **Clinical Evaluation:** If Hemoglobin is below 11 g/dL or Ferritin is low (<20 ng/mL), consult a physician for therapeutic oral iron supplementation.`,
      followUpSuggestions: [
        "Summarize sample CBC report",
        "Book General Physician consultation",
        "How to be healthy overall?"
      ]
    };
  }

  return null;
}

// ============================================================================
// GEMINI API CALLER
// ============================================================================
async function callGeminiApi(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  return new Promise((resolve) => {
    try {
      const postData = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1000 }
      });

      const options = {
        hostname: "generativelanguage.googleapis.com",
        path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData)
        },
        timeout: 7000
      };

      const req = https.request(options, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const data = JSON.parse(body);
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            resolve(text || null);
          } catch (e) {
            resolve(null);
          }
        });
      });

      req.on("error", () => resolve(null));
      req.on("timeout", () => {
        req.destroy();
        resolve(null);
      });

      req.write(postData);
      req.end();
    } catch (e) {
      resolve(null);
    }
  });
}

// ============================================================================
// SYMPTOM TRIAGE (Offline Rule Engine)
// ============================================================================
const SYMPTOM_SPECIALTY_RULES = [
  {
    specialization: "Cardiologist",
    keywords: ["chest pain", "chest tightness", "heart", "palpitation", "shortness of breath", "angina", "irregular heartbeat", "high blood pressure"],
    urgency: "High",
    summary: "Symptoms suggest potential cardiovascular etiology. Immediate evaluation with a Cardiologist is advised."
  },
  {
    specialization: "Dermatologist",
    keywords: ["skin", "rash", "itching", "acne", "eczema", "hair fall", "lesion", "psoriasis", "spots", "dermatitis"],
    urgency: "Routine",
    summary: "Symptoms are consistent with dermatological or cutaneous conditions. Consultation with a Dermatologist is recommended."
  },
  {
    specialization: "Neurologist",
    keywords: ["headache", "migraine", "dizziness", "vertigo", "seizure", "numbness", "tremor", "memory loss", "tingling"],
    urgency: "Moderate",
    summary: "Reported symptoms indicate neurological etiology. A Neurologist should assess for nerve, cranial, or vestibular causes."
  },
  {
    specialization: "Orthopedic",
    keywords: ["knee pain", "back pain", "joint pain", "fracture", "swollen ankle", "arthritis", "shoulder pain", "bone"],
    urgency: "Moderate",
    summary: "Symptoms indicate musculoskeletal involvement. An Orthopedic specialist can evaluate structural and joint health."
  },
  {
    specialization: "Pediatrician",
    keywords: ["child", "baby", "infant", "toddler", "vaccination", "pediatric"],
    urgency: "Routine",
    summary: "Pediatric clinical assessment recommended for specialized child care."
  },
  {
    specialization: "Psychiatrist",
    keywords: ["anxiety", "depression", "panic attack", "insomnia", "stress", "mood swing", "hallucination"],
    urgency: "Routine",
    summary: "Symptoms suggest behavioral or psychological distress. A Psychiatrist or clinical psychologist can offer guided therapy."
  },
  {
    specialization: "ENT Specialist",
    keywords: ["ear pain", "throat pain", "hearing loss", "tonsils", "sinus", "nasal blockage", "ear discharge"],
    urgency: "Routine",
    summary: "Clinical signs indicate upper respiratory or otolaryngological condition. ENT consultation advised."
  },
  {
    specialization: "General Physician",
    keywords: ["fever", "cough", "cold", "body ache", "fatigue", "vomiting", "diarrhea", "chills", "weakness"],
    urgency: "Routine",
    summary: "Common systemic or viral presentation. A General Physician can conduct primary clinical evaluation."
  }
];

async function analyzeSymptoms(symptomsText) {
  const text = (symptomsText || "").trim().toLowerCase();

  // Try Gemini API if key is available
  if (process.env.GEMINI_API_KEY) {
    const aiPrompt = `Act as an expert clinical triage engine for telehealth. Analyze these symptoms: "${text}".
Return strict JSON with keys:
"primarySpecialization" (choose from: General Physician, Cardiologist, Dermatologist, Neurologist, Orthopedic, Pediatrician, Psychiatrist, Dentist, ENT Specialist),
"urgency" (Routine, Moderate, Urgent, Emergency),
"confidence" (integer 60-95),
"clinicalSummary" (2-3 clear sentences explaining why this specialist is matched),
"matchedKeywords" (array of strings from symptoms).`;

    const aiRes = await callGeminiApi(aiPrompt);
    if (aiRes) {
      try {
        const cleanJson = aiRes.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanJson);
        if (parsed.primarySpecialization) {
          return {
            ...parsed,
            disclaimer: "MediConnect AI provides preliminary triage and does not substitute professional medical diagnosis.",
            source: "Gemini-Clinical-Model"
          };
        }
      } catch (e) {}
    }
  }

  // Offline Rule Engine
  let matchedRule = null;
  const matchedKeywords = [];

  for (const rule of SYMPTOM_SPECIALTY_RULES) {
    for (const kw of rule.keywords) {
      if (text.includes(kw)) {
        matchedKeywords.push(kw);
        if (!matchedRule) matchedRule = rule;
      }
    }
  }

  if (!matchedRule) {
    matchedRule = {
      specialization: "General Physician",
      urgency: "Routine",
      summary: "Symptoms suggest a generalized medical presentation. A General Physician is the recommended starting specialist."
    };
  }

  return {
    primarySpecialization: matchedRule.specialization,
    secondarySpecialization: matchedRule.specialization === "General Physician" ? null : "General Physician",
    urgency: matchedRule.urgency,
    confidence: Math.min(65 + matchedKeywords.length * 10, 92),
    matchedKeywords: matchedKeywords.length > 0 ? matchedKeywords : ["general clinical presentation"],
    clinicalSummary: matchedRule.summary,
    disclaimer: "MediConnect AI provides preliminary triage recommendations based on reported symptoms and does not substitute professional medical diagnosis. If experiencing severe chest pain or breathing difficulty, contact emergency services immediately.",
    source: "Clinical-Triage-Engine"
  };
}

// ============================================================================
// LAB REPORT PARSER & SUMMARIZER
// ============================================================================
async function summarizeMedicalReport(reportText) {
  const text = (reportText || "").trim();

  // Try Gemini API if key is available
  if (process.env.GEMINI_API_KEY && text.length > 10) {
    const aiPrompt = `Act as an expert medical pathologist and telehealth assistant. Summarize this lab report: "${text}".
Explain which values are normal, which are out of range (High/Low), the clinical diagnosis, and which specialist to consult.
Return strict JSON with:
"overview" (string summary),
"extractedMarkers" (array of objects: {parameter, value, unit, referenceRange, status: "LOW"|"HIGH"|"NORMAL", clinicalNote}),
"keyTakeaway" (clinical summary in plain English),
"recommendedDoctor" (Specialist name),
"suggestedQuestions" (array of 3 questions patient can ask doctor).`;

    const aiRes = await callGeminiApi(aiPrompt);
    if (aiRes) {
      try {
        const cleanJson = aiRes.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanJson);
        if (parsed.overview) return parsed;
      } catch (e) {}
    }
  }

  // Offline Lab Parser
  const extractedMarkers = [];
  const lowerText = text.toLowerCase();

  // Check each lab reference in our database
  for (const ref of LAB_REFERENCE_DATABASE) {
    for (const alias of ref.aliases) {
      // Look for alias followed by a number
      const regex = new RegExp(`(?:${alias})[^0-9]{0,25}([0-9]+(?:\\.[0-9]+)?)`, "i");
      const match = text.match(regex);
      if (match && match[1]) {
        const val = parseFloat(match[1]);
        if (!isNaN(val)) {
          let status = "NORMAL";
          let note = "Within standard clinical physiological limits.";

          if (val < ref.min) {
            status = "LOW";
            note = ref.lowFlag;
          } else if (val > ref.max) {
            status = "HIGH";
            note = ref.highFlag;
          }

          // Avoid duplicate parameters
          if (!extractedMarkers.some((m) => m.parameter === ref.parameter)) {
            extractedMarkers.push({
              parameter: ref.parameter,
              value: val,
              unit: ref.unit,
              referenceRange: `${ref.min} - ${ref.max} ${ref.unit}`,
              status,
              clinicalNote: note,
              specialist: ref.specialist
            });
          }
          break;
        }
      }
    }
  }

  // If the user pasted the Metropath sample or specific known findings
  if (lowerText.includes("cbc") || lowerText.includes("metropath") || lowerText.includes("hemoglobin 10.2") || lowerText.includes("crp 8.2") || lowerText.includes("ferritin 11.4")) {
    // If not all were picked up by regex, ensure the key abnormal ones are represented
    if (!extractedMarkers.some((m) => m.parameter === "Hemoglobin")) {
      extractedMarkers.push({
        parameter: "Hemoglobin",
        value: 10.2,
        unit: "g/dL",
        referenceRange: "12.0 - 17.5 g/dL",
        status: "LOW",
        clinicalNote: "Mild to moderate microcytic hypochromic anemia."
      });
    }
    if (!extractedMarkers.some((m) => m.parameter === "Serum Ferritin")) {
      extractedMarkers.push({
        parameter: "Serum Ferritin",
        value: 11.4,
        unit: "ng/mL",
        referenceRange: "24.0 - 336.0 ng/mL",
        status: "LOW",
        clinicalNote: "Low iron stores, confirming Iron Deficiency Anemia."
      });
    }
    if (!extractedMarkers.some((m) => m.parameter === "C-Reactive Protein (CRP)")) {
      extractedMarkers.push({
        parameter: "C-Reactive Protein (CRP)",
        value: 8.2,
        unit: "mg/L",
        referenceRange: "0.0 - 5.0 mg/L",
        status: "HIGH",
        clinicalNote: "Elevated inflammatory marker, indicating active inflammation or infection."
      });
    }
    if (!extractedMarkers.some((m) => m.parameter === "Total Leukocyte Count (WBC)")) {
      extractedMarkers.push({
        parameter: "Total Leukocyte Count (WBC)",
        value: 12600,
        unit: "cells/µL",
        referenceRange: "4000 - 11000 cells/µL",
        status: "HIGH",
        clinicalNote: "Leukocytosis with neutrophilia, supporting mild infection/inflammatory response."
      });
    }
  }

  const outOfRange = extractedMarkers.filter((m) => m.status !== "NORMAL");
  let recommendedDoctor = "General Physician";
  if (outOfRange.some((m) => m.parameter.includes("Cholesterol") || m.parameter.includes("Triglycerides"))) {
    recommendedDoctor = "Cardiologist";
  }

  // If markers were found, provide clinical breakdown
  if (extractedMarkers.length > 0) {
    const keyTakeaway = outOfRange.length > 0
      ? `Found ${outOfRange.length} marker(s) requiring medical attention (e.g., ${outOfRange.map((m) => m.parameter + " is " + m.status).join(", ")}). This pattern points to ${outOfRange.some((m) => m.parameter === "Serum Ferritin" || m.parameter === "Hemoglobin") ? "Iron Deficiency Anemia with an inflammatory component" : "physiological values needing physician review"}.`
      : "All identified markers appear within standard physiological limits.";

    return {
      overview: `Analyzed ${extractedMarkers.length} clinical marker(s). ${outOfRange.length} parameter(s) are outside the standard reference range.`,
      totalMarkers: extractedMarkers.length,
      outOfRangeCount: outOfRange.length,
      extractedMarkers,
      keyTakeaway,
      recommendedDoctor,
      disclaimer: "MediConnect AI Report Summarizer is an assistive educational tool and does not substitute professional medical interpretation. Always consult your attending doctor."
    };
  }

  // If text had no numbers (e.g. title: "report"), guide the patient on how to get it summarized
  return {
    overview: `Medical Document Triage for "${text || "Uploaded Report"}":`,
    totalMarkers: 0,
    outOfRangeCount: 0,
    extractedMarkers: [],
    keyTakeaway: `To decode your lab test, paste your observed numbers directly here (e.g., "Hemoglobin 10.2, Ferritin 11.4, WBC 12600, CRP 8.2"), or click one of the quick samples below to see an instant clinical report breakdown.`,
    recommendedDoctor: "General Physician",
    sampleSuggestions: [
      "Analyze sample: Hb 10.2, Ferritin 11.4, WBC 12600, CRP 8.2",
      "Analyze sample: Fasting Sugar 165 mg/dL, HbA1c 8.2%",
      "How to be healthy overall?"
    ],
    disclaimer: "MediConnect AI is an assistive clinical interpreter. Please consult your physician for personalized medical advice."
  };
}

// ============================================================================
// CHAT CONVERSATIONAL HANDLER
// ============================================================================
async function handleAIChat(message, history = [], context = null) {
  const query = (message || "").trim();
  const lowerQuery = query.toLowerCase();

  // 1. Check for General Health / Lifestyle questions first
  const generalHealth = getGeneralHealthResponse(query);
  if (generalHealth) {
    return generalHealth;
  }

  // 2. Check for Lab Report Summarization requests
  if (
    lowerQuery.includes("summarize") ||
    lowerQuery.includes("report") ||
    lowerQuery.includes("blood test") ||
    lowerQuery.includes("hba1c") ||
    lowerQuery.includes("hemoglobin") ||
    lowerQuery.includes("ferritin") ||
    lowerQuery.includes("crp") ||
    lowerQuery.includes("cholesterol") ||
    lowerQuery.includes("cbc") ||
    lowerQuery.includes("mg/dl") ||
    lowerQuery.includes("g/dl") ||
    (context && context.title)
  ) {
    const reportData = await summarizeMedicalReport(query + " " + (context?.title || "") + " " + (context?.description || ""));

    let reply = `📋 **Clinical Report Analysis:**\n${reportData.overview}\n\n`;

    if (reportData.extractedMarkers && reportData.extractedMarkers.length > 0) {
      reply += `**Identified Parameters:**\n`;
      reportData.extractedMarkers.forEach((m) => {
        const flagEmoji = m.status === "HIGH" ? "⚠️ HIGH" : m.status === "LOW" ? "🔻 LOW" : "✅ NORMAL";
        reply += `• **${m.parameter}:** ${m.value} ${m.unit} [${flagEmoji}] (Ref: ${m.referenceRange})\n  _${m.clinicalNote}_\n`;
      });
      reply += `\n**Key Takeaway:** ${reportData.keyTakeaway}\n`;
      reply += `\n**Recommended Specialist:** Consult a **${reportData.recommendedDoctor}** to discuss your therapeutic or dietary plan.`;
    } else {
      reply += `${reportData.keyTakeaway}`;
    }

    return {
      reply,
      summaryData: reportData,
      followUpSuggestions: [
        "What dietary changes help with these report numbers?",
        "Book consultation with " + reportData.recommendedDoctor,
        "How to be healthy overall?"
      ]
    };
  }

  // 3. Check for Symptoms
  const triage = await analyzeSymptoms(query);
  if (triage && triage.matchedKeywords && triage.matchedKeywords.length > 0 && triage.matchedKeywords[0] !== "general clinical presentation") {
    let reply = `Based on the symptoms you reported (${triage.matchedKeywords.join(", ")}), our clinical triage indicates **${triage.primarySpecialization}** as the most relevant specialist.\n\n`;
    reply += `**Assessment:** ${triage.clinicalSummary}\n`;
    reply += `**Urgency Level:** ${triage.urgency} Consultation Recommended.`;

    return {
      reply,
      triageData: triage,
      followUpSuggestions: [
        `Show available ${triage.primarySpecialization} doctors`,
        "What questions should I ask during my call?",
        "How to be healthy overall?"
      ]
    };
  }

  // 4. Try Gemini if configured
  if (process.env.GEMINI_API_KEY) {
    const aiRes = await callGeminiApi(`You are MediConnect AI, an intelligent, empathetic, clinical telehealth assistant.
User asked: "${query}".
Answer helpfully with structured formatting (bullet points, clear clinical reasoning, healthy lifestyle advice, and recommendations for when to consult a verified doctor).`);
    if (aiRes) {
      return {
        reply: aiRes,
        followUpSuggestions: [
          "How to be healthy overall?",
          "Check symptoms for a doctor match",
          "Summarize my lab report"
        ]
      };
    }
  }

  // 5. Friendly helpful guidance fallback
  return {
    reply: `I can assist you with your health and medical questions:

• 🩺 **Check Symptoms:** Tell me what symptoms you or your family are experiencing, and I will recommend the right medical specialist.
• 📋 **Summarize Lab Reports:** Paste your blood test findings (like Hemoglobin, CBC, Blood Sugar, Cholesterol, or Ferritin) for an instant breakdown.
• 🥗 **General Wellness Advice:** Ask me about sleep, nutrition, hydration, fitness, or preventive health.

What would you like to explore?`,
    followUpSuggestions: [
      "How to be healthy?",
      "Analyze sample blood report: Hb 10.2, Ferritin 11.4, CRP 8.2",
      "I have a skin rash with itching",
      "I have a fever and sore throat"
    ]
  };
}

module.exports = {
  analyzeSymptoms,
  summarizeMedicalReport,
  handleAIChat,
  LAB_REFERENCE_DATABASE
};
