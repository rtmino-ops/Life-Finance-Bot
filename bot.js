const TelegramBot = require("node-telegram-bot-api");

const token = "8621355036:AAHhADF8l3hhwP1aeznkL63j7qCmBb-Eo4s";
const webAppUrl = "https://life-finance-bot.vercel.app/";

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Добро пожаловать в Life Finance.\nОткрой приложение по кнопке ниже:",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Открыть Life Finance", web_app: { url: webAppUrl } }]
        ]
      }
    }
  );
});

console.log("Life Finance bot started...");