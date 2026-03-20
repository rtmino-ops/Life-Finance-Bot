require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const { createClient } = require("@supabase/supabase-js");

// ===== CONFIG =====
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

// ===== CATEGORY MAP =====
const categoryLabels = {
  salary: "Зарплата", parttime: "Подработка", gift: "Подарки",
  investment: "Инвестиции", other_income: "Прочее",
  food: "Еда", transport: "Транспорт", housing: "Жильё",
  fun: "Развлечения", health: "Здоровье", shopping: "Покупки",
  sport: "Спорт", other_expense: "Прочее"
};

// ===== HELPERS =====
function getMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function formatMoney(amount) {
  return Number(amount).toLocaleString("ru-RU") + " ₽";
}

// Сохраняем chat_id пользователя для рассылки
async function saveChatId(telegramId, chatId) {
  const { data } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (data) {
    // Обновляем chat_id если его нет
    if (!data.chat_id || data.chat_id !== chatId) {
      await supabase
        .from("notification_settings")
        .update({ chat_id: chatId })
        .eq("telegram_id", telegramId);
    }
  } else {
    await supabase.from("notification_settings").insert({
      telegram_id: telegramId,
      chat_id: chatId,
      reminders_enabled: true,
      finance_enabled: true,
      planner_enabled: true,
      timezone: "Europe/Moscow"
    });
  }
}

// ===== /start =====
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const user = msg.from;

  try {
    await saveChatId(user.id, chatId);

    await bot.sendMessage(
      chatId,
      `👋 Привет, ${user.first_name || "друг"}!\n\n` +
      `🎯 *MoneyLive* — твой ежедневник:\n` +
      `💰 Финансы и бюджет\n` +
      `🍽 Контроль питания\n` +
      `💪 Спорт и тренировки\n` +
      `📋 Задачи и привычки\n\n` +
      `Команды:\n` +
      `/reminders — напоминания\n` +
      `/stats — статистика за месяц\n` +
      `/budget — бюджет месяца\n` +
      `/help — помощь`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "📱 Открыть MoneyLive", web_app: { url: webAppUrl } }]
          ]
        }
      }
    );
  } catch (error) {
    console.error("start error:", error.message);
  }
});

// ===== /help =====
bot.onText(/\/help/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    `📖 *Команды MoneyLive:*\n\n` +
    `/start — главное меню\n` +
    `/reminders — напоминания на сегодня\n` +
    `/stats — статистика за месяц\n` +
    `/budget — бюджет и лимиты\n` +
    `/tasks — активные задачи\n` +
    `/habits — прогресс привычек\n` +
    `/notify_on — включить уведомления\n` +
    `/notify_off — выключить уведомления\n` +
    `/help — эта справка`,
    { parse_mode: "Markdown" }
  );
});

// ===== /stats =====
bot.onText(/\/stats/, async (msg) => {
  const userId = msg.from.id;
  const monthKey = getMonthKey();

  try {
    const { data: records } = await supabase
      .from("finance_records")
      .select("*")
      .eq("telegram_id", userId);

    const monthRecords = (records || []).filter(item => {
      const d = new Date(item.created_at);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === monthKey;
    });

    const income = monthRecords
      .filter(i => i.record_type === "income")
      .reduce((s, i) => s + Number(i.amount), 0);

    const expense = monthRecords
      .filter(i => i.record_type === "expense")
      .reduce((s, i) => s + Number(i.amount), 0);

    const balance = income - expense;

    // Топ расходов по категориям
    const expenseByCategory = {};
    monthRecords
      .filter(i => i.record_type === "expense")
      .forEach(i => {
        expenseByCategory[i.category] = (expenseByCategory[i.category] || 0) + Number(i.amount);
      });

    const topCategories = Object.entries(expenseByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cat, amount]) => `  • ${categoryLabels[cat] || cat}: ${formatMoney(amount)}`)
      .join("\n");

    // Спорт
    const { data: sportData } = await supabase
      .from("sport_records")
      .select("*")
      .eq("telegram_id", userId);

    const monthSport = (sportData || []).filter(i => {
      const d = new Date(i.created_at);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === monthKey;
    });

    // Еда за сегодня
    const today = getTodayDateString();
    const { data: foodData } = await supabase
      .from("food_records")
      .select("*")
      .eq("telegram_id", userId);

    const todayCalories = (foodData || [])
      .filter(i => i.created_at && i.created_at.startsWith(today))
      .reduce((s, i) => s + Number(i.calories || 0), 0);

    let text = `📊 *Статистика за ${monthKey}*\n\n`;
    text += `💰 Доходы: ${formatMoney(income)}\n`;
    text += `💸 Расходы: ${formatMoney(expense)}\n`;
    text += `📊 Баланс: ${formatMoney(balance)}\n`;
    text += `\n💪 Тренировок: ${monthSport.length}\n`;
    text += `🔥 Калории сегодня: ${todayCalories} ккал\n`;

    if (topCategories) {
      text += `\n📉 *Топ расходов:*\n${topCategories}`;
    }

    text += `\n\n📝 Операций за месяц: ${monthRecords.length}`;

    await bot.sendMessage(msg.chat.id, text);
  } catch (error) {
    console.error("stats error:", error.message);
    await bot.sendMessage(msg.chat.id, "❌ Ошибка получения статистики");
  }
});

// ===== /budget =====
bot.onText(/\/budget/, async (msg) => {
  const userId = msg.from.id;
  const monthKey = getMonthKey();

  try {
    const { data: budget } = await supabase
      .from("budgets")
      .select("*")
      .eq("telegram_id", userId)
      .eq("month_key", monthKey)
      .maybeSingle();

    if (!budget) {
      await bot.sendMessage(msg.chat.id, "📊 Бюджет на месяц не установлен.\nОткрой приложение → Финансы → Бюджет");
      return;
    }

    const { data: records } = await supabase
      .from("finance_records")
      .select("*")
      .eq("telegram_id", userId)
      .eq("record_type", "expense");

    const monthExpenses = (records || []).filter(item => {
      const d = new Date(item.created_at);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === monthKey;
    });

    const spent = monthExpenses.reduce((s, i) => s + Number(i.amount), 0);
    const total = Number(budget.total_budget);
    const left = total - spent;
    const percent = total > 0 ? Math.round((spent / total) * 100) : 0;

    // Прогресс-бар текстовый
    const barLength = 20;
    const filled = Math.round((percent / 100) * barLength);
    const bar = "█".repeat(Math.min(filled, barLength)) + "░".repeat(Math.max(barLength - filled, 0));

    let emoji = "🟢";
    if (percent >= 100) emoji = "🔴";
    else if (percent >= 80) emoji = "🟡";

    let text = `💼 *Бюджет ${monthKey}*\n\n`;
    text += `Лимит: ${formatMoney(total)}\n`;
    text += `Потрачено: ${formatMoney(spent)}\n`;
    text += `Осталось: ${formatMoney(left)}\n\n`;
    text += `${emoji} [${bar}] ${percent}%`;

    if (percent >= 100) text += "\n\n🚨 *Бюджет превышен!*";
    else if (percent >= 80) text += "\n\n⚠️ *Бюджет почти исчерпан*";

    // Лимиты по категориям
    const { data: catBudgets } = await supabase
      .from("category_budgets")
      .select("*")
      .eq("telegram_id", userId)
      .eq("month_key", monthKey);

    if (catBudgets && catBudgets.length) {
      text += "\n\n📊 *Лимиты по категориям:*";
      catBudgets.forEach(cb => {
        const catSpent = monthExpenses
          .filter(e => e.category === cb.category)
          .reduce((s, e) => s + Number(e.amount), 0);
        const catLimit = Number(cb.limit_amount);
        const catPercent = catLimit > 0 ? Math.round((catSpent / catLimit) * 100) : 0;
        const catEmoji = catPercent >= 100 ? "🔴" : catPercent >= 80 ? "🟡" : "🟢";
        text += `\n${catEmoji} ${cb.category}: ${formatMoney(catSpent)} / ${formatMoney(catLimit)}`;
      });
    }

    await bot.sendMessage(msg.chat.id, text, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("budget error:", error.message);
    await bot.sendMessage(msg.chat.id, "❌ Ошибка получения бюджета");
  }
});

// ===== /tasks =====
bot.onText(/\/tasks/, async (msg) => {
  const userId = msg.from.id;

  try {
    const { data: tasks } = await supabase
      .from("planner_tasks")
      .select("*")
      .eq("telegram_id", userId)
      .eq("is_done", false)
      .order("created_at", { ascending: false });

    if (!tasks || !tasks.length) {
      await bot.sendMessage(msg.chat.id, "✅ Нет активных задач!");
      return;
    }

    let text = `📋 *Активные задачи (${tasks.length}):*\n\n`;
    tasks.slice(0, 10).forEach((task, i) => {
      const due = task.due_date || "без срока";
      text += `${i + 1}. ${task.title}\n   📅 ${task.period_type} • ${due}\n\n`;
    });

    if (tasks.length > 10) {
      text += `\n... и ещё ${tasks.length - 10} задач`;
    }

    await bot.sendMessage(msg.chat.id, text, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("tasks error:", error.message);
    await bot.sendMessage(msg.chat.id, "❌ Ошибка получения задач");
  }
});

// ===== /habits =====
bot.onText(/\/habits/, async (msg) => {
  const userId = msg.from.id;

  try {
    const { data: habits } = await supabase
      .from("habits")
      .select("*")
      .eq("telegram_id", userId)
      .eq("is_active", true);

    if (!habits || !habits.length) {
      await bot.sendMessage(msg.chat.id, "🔁 Нет активных привычек");
      return;
    }

    const { data: logs } = await supabase
      .from("habit_logs")
      .select("*")
      .eq("telegram_id", userId);

    const today = getTodayDateString();
    const now = new Date();
    const monthKey = getMonthKey();

    let text = `🔁 *Привычки:*\n\n`;

    habits.forEach(habit => {
      let habitLogs = (logs || []).filter(l => Number(l.habit_id) === Number(habit.id));

      if (habit.period_type === "day") {
        habitLogs = habitLogs.filter(l => l.log_date === today);
      } else if (habit.period_type === "week") {
        const from = new Date();
        from.setDate(now.getDate() - 7);
        habitLogs = habitLogs.filter(l => new Date(l.log_date) >= from);
      } else if (habit.period_type === "month") {
        habitLogs = habitLogs.filter(l => {
          const d = new Date(l.log_date);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === monthKey;
        });
      }

      const done = habitLogs.length;
      const target = habit.target_count;
      const percent = target > 0 ? Math.round((done / target) * 100) : 0;
      const emoji = done >= target ? "✅" : "🔄";

      text += `${emoji} *${habit.title}*\n`;
      text += `   ${done}/${target} (${percent}%) • ${habit.period_type}\n\n`;
    });

    await bot.sendMessage(msg.chat.id, text, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("habits error:", error.message);
    await bot.sendMessage(msg.chat.id, "❌ Ошибка получения привычек");
  }
});

// ===== /reminders =====
bot.onText(/\/reminders/, async (msg) => {
  try {
    const text = await buildReminderText(msg.from.id);

    if (!text) {
      await bot.sendMessage(msg.chat.id, "🎉 Напоминаний нет! Всё под контролем.");
      return;
    }

    await bot.sendMessage(msg.chat.id, text, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("reminders error:", error.message);
    await bot.sendMessage(msg.chat.id, "❌ Не удалось получить напоминания");
  }
});

// ===== /notify_on & /notify_off =====
bot.onText(/\/notify_on/, async (msg) => {
  try {
    await supabase
      .from("notification_settings")
      .update({ reminders_enabled: true })
      .eq("telegram_id", msg.from.id);
    await bot.sendMessage(msg.chat.id, "🔔 Уведомления включены!");
  } catch (error) {
    await bot.sendMessage(msg.chat.id, "❌ Ошибка");
  }
});

bot.onText(/\/notify_off/, async (msg) => {
  try {
    await supabase
      .from("notification_settings")
      .update({ reminders_enabled: false })
      .eq("telegram_id", msg.from.id);
    await bot.sendMessage(msg.chat.id, "🔕 Уведомления выключены");
  } catch (error) {
    await bot.sendMessage(msg.chat.id, "❌ Ошибка");
  }
});

// ===== BUILD REMINDER TEXT =====
async function buildReminderText(userId) {
  const now = new Date();
  const today = now.getDate();
  const monthKey = getMonthKey();
  const messages = [];

  const { data: settings } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("telegram_id", userId)
    .maybeSingle();

  if (!settings || !settings.reminders_enabled) return null;

  // Регулярные платежи
  if (settings.finance_enabled) {
    const { data: recurring } = await supabase
      .from("recurring_payments")
      .select("*")
      .eq("telegram_id", userId)
      .eq("is_active", true);

    if (recurring) {
      // Грузим логи уже оплаченных в этом месяце
      const { data: paidLogs } = await supabase
        .from("recurring_payment_logs")
        .select("recurring_payment_id")
        .eq("telegram_id", userId)
        .eq("month_key", monthKey);
      const paidIds = new Set((paidLogs || []).map(l => Number(l.recurring_payment_id)));

      recurring.forEach(item => {
        // Не напоминаем если уже оплачено в этом месяце
        if (paidIds.has(Number(item.id))) return;
        if (item.day_of_month === today) {
          messages.push(`💳 *Сегодня:* ${item.title} — ${formatMoney(item.amount)}`);
        } else if (item.day_of_month > today && item.day_of_month - today <= 3) {
          messages.push(`⏰ *Скоро:* ${item.title} (${item.day_of_month} числа) — ${formatMoney(item.amount)}`);
        }
      });
    }

    // Бюджет
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
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === monthKey;
      });

      const spent = monthExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
      const totalBudget = Number(budget.total_budget);

      if (spent >= totalBudget) {
        messages.push(`🚨 *Бюджет превышен!* (${formatMoney(spent)} / ${formatMoney(totalBudget)})`);
      } else if (spent >= totalBudget * 0.8) {
        messages.push(`⚠️ *80%+ бюджета* (${formatMoney(spent)} / ${formatMoney(totalBudget)})`);
      }
    }
  }

  // Задачи
  if (settings.planner_enabled) {
    const { data: tasks } = await supabase
      .from("planner_tasks")
      .select("*")
      .eq("telegram_id", userId)
      .eq("is_done", false);

    if (tasks) {
      const urgent = tasks.filter(task => {
        if (!task.due_date) return false;
        const diff = Math.floor((new Date(task.due_date) - now) / 86400000);
        return diff <= 1;
      });

      urgent.slice(0, 3).forEach(task => {
        messages.push(`📋 *Срочно:* ${task.title}`);
      });

      const upcoming = tasks.filter(task => {
        if (!task.due_date) return true;
        const diff = Math.floor((new Date(task.due_date) - now) / 86400000);
        return diff > 1 && diff <= 3;
      });

      upcoming.slice(0, 3).forEach(task => {
        messages.push(`📝 Задача: ${task.title}`);
      });
    }

    // Привычки
    const { data: habits } = await supabase
      .from("habits")
      .select("*")
      .eq("telegram_id", userId)
      .eq("is_active", true);

    if (habits && habits.length) {
      const { data: logs } = await supabase
        .from("habit_logs")
        .select("*")
        .eq("telegram_id", userId)
        .eq("log_date", getTodayDateString());

      const todayLogIds = new Set((logs || []).map(l => Number(l.habit_id)));
      const dailyUndone = habits
        .filter(h => h.period_type === "day" && !todayLogIds.has(Number(h.id)));

      if (dailyUndone.length) {
        messages.push(`🔁 Невыполненных привычек: ${dailyUndone.length}`);
        dailyUndone.slice(0, 3).forEach(h => {
          messages.push(`   • ${h.title}`);
        });
      }
    }
  }

  if (!messages.length) return null;

  return `🔔 *Напоминания MoneyLive:*\n\n${messages.join("\n")}`;
}

// ===== AUTO REMINDERS (каждые 4 часа) =====
async function sendAutoReminders() {
  console.log("🔔 Проверка автоматических напоминаний...");

  try {
    const { data: users } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("reminders_enabled", true);

    if (!users || !users.length) {
      console.log("Нет пользователей для напоминаний");
      return;
    }

    let sent = 0;

    for (const user of users) {
      if (!user.chat_id) continue;

      try {
        const text = await buildReminderText(user.telegram_id);

        if (text) {
          await bot.sendMessage(
            user.chat_id,
            text + "\n\n_Авто-напоминание. /notify\\_off чтобы отключить_",
            { parse_mode: "Markdown" }
          );
          sent++;
        }
      } catch (err) {
        console.error(`Ошибка отправки для ${user.telegram_id}:`, err.message);
      }

      // Пауза между отправками (анти-спам)
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`✅ Отправлено напоминаний: ${sent} из ${users.length}`);
  } catch (error) {
    console.error("Auto reminders error:", error.message);
  }
}

// Запуск авто-напоминаний каждые 4 часа
const REMINDER_INTERVAL = 4 * 60 * 60 * 1000; // 4 часа

// Первая проверка через 1 минуту после старта
setTimeout(() => {
  sendAutoReminders();
  // Далее каждые 4 часа
  setInterval(sendAutoReminders, REMINDER_INTERVAL);
}, 60 * 1000);

// ===== DAILY MORNING REMINDER (в 9:00 по Москве) =====
function scheduleMorningReminder() {
  const now = new Date();
  // Московское время UTC+3
  const moscowOffset = 3 * 60 * 60 * 1000;
  const moscowNow = new Date(now.getTime() + moscowOffset);

  // Следующие 9:00
  const next9am = new Date(moscowNow);
  next9am.setHours(9, 0, 0, 0);

  if (moscowNow >= next9am) {
    next9am.setDate(next9am.getDate() + 1);
  }

  const delay = next9am.getTime() - moscowNow.getTime();

  console.log(`⏰ Утреннее напоминание через ${Math.round(delay / 60000)} мин`);

  setTimeout(async () => {
    console.log("🌅 Отправка утренних напоминаний...");
    await sendAutoReminders();
    // Перепланировать на завтра
    scheduleMorningReminder();
  }, delay);
}

scheduleMorningReminder();

// ===== ERROR HANDLING =====
bot.on("polling_error", (error) => {
  console.error("Polling error:", error.code, error.message);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
});

console.log("🚀 MoneyLive bot started!");
console.log(`📱 Web App: ${webAppUrl}`);