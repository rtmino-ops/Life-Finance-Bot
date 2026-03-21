require("dotenv").config();

const express = require("express");
const app = express();

app.use(express.json({ limit: "20mb" }));

// CORS — разрешаем запросы с Vercel фронта
app.use((req, res, next) => {
  const allowed = process.env.WEB_APP_URL || "*";
  res.header("Access-Control-Allow-Origin", allowed);
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

// ===== ОБЩАЯ ФУНКЦИЯ ЗАПРОСА К CLAUDE =====
async function askClaude(messages) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || "";
}

// ===== СИСТЕМНЫЙ ПРОМПТ =====
const SYSTEM_PROMPT = `Ты нутрициолог-помощник. Твоя задача — оценить калорийность еды.
Отвечай ТОЛЬКО в формате JSON, без объяснений, без markdown, без \`\`\`.
Формат ответа:
{
  "title": "короткое название блюда/продуктов (макс 40 символов)",
  "calories": число_калорий_целое,
  "protein": граммы_белка_целое,
  "fat": граммы_жира_целое,
  "carbs": граммы_углеводов_целое,
  "comment": "короткая заметка (необязательно, макс 60 символов)"
}
Калории должны быть реалистичной оценкой для указанного количества еды.
Если количество не указано — используй стандартную порцию.
Отвечай только JSON, ничего больше.`;

// ===== /api/calories/text — по описанию =====
app.post("/api/calories/text", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Нет текста" });
    }

    const raw = await askClaude([
      {
        role: "user",
        content: `${SYSTEM_PROMPT}\n\nОпредели калории для: ${text.trim()}`
      }
    ]);

    const result = JSON.parse(raw.trim());
    res.json(result);
  } catch (e) {
    console.error("calories/text error:", e.message);
    res.status(500).json({ error: "Не удалось определить калории" });
  }
});

// ===== /api/calories/photo — по фото (base64) =====
app.post("/api/calories/photo", async (req, res) => {
  try {
    const { image, mediaType } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Нет фото" });
    }

    const raw = await askClaude([
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType || "image/jpeg",
              data: image
            }
          },
          {
            type: "text",
            text: `${SYSTEM_PROMPT}\n\nЧто на фото? Определи калории для всей еды на фото.`
          }
        ]
      }
    ]);

    const result = JSON.parse(raw.trim());
    res.json(result);
  } catch (e) {
    console.error("calories/photo error:", e.message);
    res.status(500).json({ error: "Не удалось распознать еду на фото" });
  }
});

// ===== Healthcheck =====
app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🍽 Calories API server running on port ${PORT}`);
});
