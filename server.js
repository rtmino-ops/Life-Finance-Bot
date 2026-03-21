require("dotenv").config();

const express = require("express");
const app = express();

app.use(express.json({ limit: "20mb" }));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SYSTEM_PROMPT = `Ты нутрициолог. Оцени калорийность еды.
Ответь СТРОГО только JSON объектом, без пояснений, без markdown, без символов \`\`\`.
Пример ответа: {"title":"Тарелка борща","calories":250,"protein":8,"fat":10,"carbs":30,"comment":""}
Поля: title (строка, макс 40 символов), calories (целое число), protein (целое), fat (целое), carbs (целое), comment (строка, необязательно).
Только JSON, ничего кроме JSON.`;

async function askGemini(parts) {
  if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY не задан");

  const url = `${GEMINI_URL}?key=${GEMINI_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 300,
        responseMimeType: "application/json"
      }
    })
  });

  const raw = await response.text();
  console.log(`Gemini status: ${response.status}`);
  console.log(`Gemini raw: ${raw.slice(0, 500)}`);

  if (!response.ok) throw new Error(`Gemini error ${response.status}: ${raw}`);

  const data = JSON.parse(raw);
  return (data.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
}

function parseJSON(text) {
  // Убираем все возможные markdown обёртки
  const clean = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  // Берём первый JSON объект из текста
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`Нет JSON в ответе: ${clean}`);
  return JSON.parse(match[0]);
}

app.post("/api/calories/text", async (req, res) => {
  try {
    const { text } = req.body;
    console.log("TEXT request:", text);
    if (!text?.trim()) return res.status(400).json({ error: "Нет текста" });

    const raw = await askGemini([
      { text: SYSTEM_PROMPT },
      { text: `Определи калории для: ${text.trim()}` }
    ]);

    console.log("Parsed text:", raw);
    const result = parseJSON(raw);
    console.log("Result:", result);
    res.json(result);
  } catch (e) {
    console.error("TEXT ERROR:", e.message);
    res.status(500).json({ error: "Не удалось определить калории: " + e.message });
  }
});

app.post("/api/calories/photo", async (req, res) => {
  try {
    const { image, mediaType } = req.body;
    console.log("PHOTO request, type:", mediaType, "size:", image?.length);
    if (!image) return res.status(400).json({ error: "Нет фото" });

    const raw = await askGemini([
      { text: SYSTEM_PROMPT },
      { inlineData: { mimeType: mediaType || "image/jpeg", data: image } },
      { text: "Что на фото? Определи калории для всей еды на фото." }
    ]);

    console.log("Parsed photo:", raw);
    const result = parseJSON(raw);
    console.log("Result:", result);
    res.json(result);
  } catch (e) {
    console.error("PHOTO ERROR:", e.message);
    res.status(500).json({ error: "Не удалось распознать фото: " + e.message });
  }
});

app.get("/health", (req, res) => {
  res.json({ ok: true, provider: "gemini", key: GEMINI_KEY ? "set" : "MISSING" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Calories API (Gemini) on port ${PORT}`));