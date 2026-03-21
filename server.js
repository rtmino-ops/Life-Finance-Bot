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

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

// Бесплатная модель с поддержкой фото
const MODEL = "google/gemma-3-27b-it:free";

const SYSTEM_PROMPT = `Ты нутрициолог. Оцени калорийность еды.
Ответь СТРОГО только JSON объектом без пояснений, без markdown, без символов \`\`\`.
Пример: {"title":"Тарелка борща","calories":250,"protein":8,"fat":10,"carbs":30,"comment":"стандартная порция"}
Поля: title (строка макс 40 символов), calories (целое число), protein (целое), fat (целое), carbs (целое), comment (строка необязательно).
Только JSON, ничего кроме JSON.`;

async function askOpenRouter(messages) {
  if (!OPENROUTER_KEY) throw new Error("OPENROUTER_API_KEY не задан");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.WEB_APP_URL || "https://life-finance-bot.vercel.app",
      "X-Title": "MoneyLive Calories"
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: 300,
      temperature: 0.1
    })
  });

  const raw = await response.text();
  console.log(`OpenRouter status: ${response.status}`);
  console.log(`OpenRouter raw: ${raw.slice(0, 300)}`);

  if (!response.ok) throw new Error(`OpenRouter error ${response.status}: ${raw}`);

  const data = JSON.parse(raw);
  return (data.choices?.[0]?.message?.content || "").trim();
}

function parseJSON(text) {
  const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`Нет JSON в ответе: ${clean.slice(0, 200)}`);
  return JSON.parse(match[0]);
}

// ===== TEXT =====
app.post("/api/calories/text", async (req, res) => {
  try {
    const { text } = req.body;
    console.log("TEXT request:", text);
    if (!text?.trim()) return res.status(400).json({ error: "Нет текста" });

    const raw = await askOpenRouter([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Определи калории для: ${text.trim()}` }
    ]);

    const result = parseJSON(raw);
    console.log("Result:", result);
    res.json(result);
  } catch (e) {
    console.error("TEXT ERROR:", e.message);
    res.status(500).json({ error: "Не удалось определить калории: " + e.message });
  }
});

// ===== PHOTO =====
app.post("/api/calories/photo", async (req, res) => {
  try {
    const { image, mediaType } = req.body;
    console.log("PHOTO request, type:", mediaType, "size:", image?.length);
    if (!image) return res.status(400).json({ error: "Нет фото" });

    const raw = await askOpenRouter([
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${mediaType || "image/jpeg"};base64,${image}` }
          },
          {
            type: "text",
            text: "Что на фото? Определи калории для всей еды."
          }
        ]
      }
    ]);

    const result = parseJSON(raw);
    console.log("Result:", result);
    res.json(result);
  } catch (e) {
    console.error("PHOTO ERROR:", e.message);
    res.status(500).json({ error: "Не удалось распознать фото: " + e.message });
  }
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    provider: "openrouter",
    model: MODEL,
    key: OPENROUTER_KEY ? "set" : "MISSING"
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Calories API (OpenRouter) on port ${PORT}`));