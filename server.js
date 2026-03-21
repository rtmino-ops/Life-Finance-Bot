require("dotenv").config();

const express = require("express");
const app = express();

app.use(express.json({ limit: "20mb" }));

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const SYSTEM_PROMPT = `Ты нутрициолог-помощник. Оцени калорийность еды.
Отвечай ТОЛЬКО в формате JSON без markdown и без \`\`\`.
Формат:
{
  "title": "короткое название (макс 40 символов)",
  "calories": целое_число,
  "protein": граммы_белка_целое,
  "fat": граммы_жира_целое,
  "carbs": граммы_углеводов_целое,
  "comment": "короткая заметка (макс 60 символов, необязательно)"
}
Если количество не указано — используй стандартную порцию.
Только JSON, ничего больше.`;

async function askGemini(parts) {
  const url = `${GEMINI_URL}?key=${GEMINI_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 300 }
    })
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini error ${response.status}: ${err}`);
  }
  const data = await response.json();
  return (data.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
}

app.post("/api/calories/text", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: "Нет текста" });
    const raw = await askGemini([
      { text: SYSTEM_PROMPT },
      { text: `Определи калории для: ${text.trim()}` }
    ]);
    res.json(JSON.parse(raw.replace(/```json|```/g, "").trim()));
  } catch (e) {
    console.error("text error:", e.message);
    res.status(500).json({ error: "Не удалось определить калории" });
  }
});

app.post("/api/calories/photo", async (req, res) => {
  try {
    const { image, mediaType } = req.body;
    if (!image) return res.status(400).json({ error: "Нет фото" });
    const raw = await askGemini([
      { text: SYSTEM_PROMPT },
      { inlineData: { mimeType: mediaType || "image/jpeg", data: image } },
      { text: "Что на фото? Определи калории для всей еды." }
    ]);
    res.json(JSON.parse(raw.replace(/```json|```/g, "").trim()));
  } catch (e) {
    console.error("photo error:", e.message);
    res.status(500).json({ error: "Не удалось распознать фото" });
  }
});

app.get("/health", (req, res) => res.json({ ok: true, provider: "gemini" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Calories API (Gemini) on port ${PORT}`));