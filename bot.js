console.log("Life Finance bot started...");
const TelegramBot = require("node-telegram-bot-api");
const { createClient } = require("@supabase/supabase-js");

const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEB_APP_URL;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!token) throw new Error("BOT_TOKEN is not set");
if (!webAppUrl) throw new Error("WEB_APP_URL is not set");
if (!supabaseUrl) throw new Error("SUPABASE_URL is not set");
if (!supabaseKey) throw new Error("SUPABASE_ANON_KEY is not set");

const bot = new TelegramBot(token, { polling: true });
const supabase = createClient(supabaseUrl, supabaseKey);

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const user = msg.from;

  try {
    const { data } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("telegram_id", user.id)
      .maybeSingle();

    if (!data) {
      await supabase.from("notification_settings").insert({
        telegram_id: user.id,
        reminders_enabled: true,
        finance_enabled: true,
        planner_enabled: true,
        timezone: "Europe/Moscow"
      });
    }

    await bot.sendMessage(
      chatId,
      "Добро пожаловать в Life Finance.\nОткрой приложение по кнопке ниже:",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Открыть Life Finance", web_app: { url: webAppUrl } }]
          ]
        }
      }
    );
  } catch (error) {
    console.error("start error:", error.message);
  }
});

async function buildReminderText(userId) {
  const now = new Date();
  const today = now.getDate();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const messages = [];

  const { data: settings } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("telegram_id", userId)
    .maybeSingle();

  if (!settings || !settings.reminders_enabled) {
    return null;
  }

  if (settings.finance_enabled) {
    const { data: recurring } = await supabase
      .from("recurring_payments")
      .select("*")
      .eq("telegram_id", userId)
      .eq("is_active", true);

    if (recurring) {
      recurring.forEach(item => {
        if (item.day_of_month === today) {
          messages.push(`💸 Сегодня регулярный платеж: ${item.title} — ${item.amount}`);
        } else if (item.day_of_month > today && item.day_of_month - today <= 3) {
          messages.push(`⏰ Скоро платеж: ${item.title} (${item.day_of_month} числа)`);
        }
      });
    }

    const { data: budget } = await supabase
      .from("budgets")
      .select("*")
      .eq("telegram_id", userId)
      .eq("month_key", monthKey)
      .maybeSingle();

    if (budget) {
      const { data: expenses } = await supabase
        .from("finance_records")
        .select("*")
        .eq("telegram_id", userId)
        .eq("record_type", "expense");

      const monthExpenses = (expenses || []).filter(item => {
        const d = new Date(item.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return key === monthKey;
      });

      const spent = monthExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
      const totalBudget = Number(budget.total_budget);

      if (spent >= totalBudget) {
        messages.push("🚨 Бюджет месяца превышен");
      } else if (spent >= totalBudget * 0.8) {
        messages.push("⚠️ Использовано более 80% бюджета");
      }
    }
  }

  if (settings.planner_enabled) {
    const { data: planner } = await supabase
      .from("planner_tasks")
      .select("*")
      .eq("telegram_id", userId)
      .eq("is_done", false);

    if (planner && planner.length) {
      planner.slice(0, 5).forEach(task => {
        messages.push(`📝 Задача: ${task.title}`);
      });
    }
  }

  if (!messages.length) return null;

  return `Напоминания Life Finance:\n\n${messages.join("\n")}`;
}

async function sendDailyReminders() {
  try {
    const { data: users, error } = await supabase
      .from("notification_settings")
      .select("telegram_id, reminders_enabled");

    if (error) {
      console.error("settings load error:", error.message);
      return;
    }

    for (const user of users || []) {
      if (!user.reminders_enabled) continue;

      try {
        const text = await buildReminderText(user.telegram_id);
        if (!text) continue;

        await bot.sendMessage(user.telegram_id, text);
        console.log(`Reminder sent to ${user.telegram_id}`);
      } catch (err) {
        if (err.response && err.response.body && err.response.body.error_code === 403) {
          console.log(`User ${user.telegram_id} blocked the bot`);
        } else {
          console.error(`Reminder error for ${user.telegram_id}:`, err.message);
        }
      }
    }
  } catch (error) {
    console.error("sendDailyReminders error:", error.message);
  }
}

// ТЕСТОВЫЙ ИНТЕРВАЛ ДЛЯ ПРОВЕРКИ
// сейчас раз в 5 минут
setInterval(() => {
  sendDailyReminders();
}, 5 * 60 * 1000);

console.log("Life Finance bot started...");
bot.onText(/\/reminders/, async (msg) => {
  try {
    const text = await buildReminderText(msg.from.id);

    if (!text) {
      await bot.sendMessage(msg.chat.id, "Напоминаний сейчас нет.");
      return;
    }

    await bot.sendMessage(msg.chat.id, text);
  } catch (error) {
    console.error("reminders command error:", error.message);
    await bot.sendMessage(msg.chat.id, "Не удалось получить напоминания.");
  }
});