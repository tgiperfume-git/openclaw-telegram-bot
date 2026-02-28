const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Gemini Telegram Bot is successfully running!'));
app.listen(port, () => console.log(`Web server is listening on port ${port}`));

const token = process.env.TELEGRAM_BOT_TOKEN ? process.env.TELEGRAM_BOT_TOKEN.trim().replace(/^["']|["']$/g, '') : "";
const geminiApiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim().replace(/^["']|["']$/g, '') : "";

if (!token || !geminiApiKey) {
    console.error("ERROR: TELEGRAM_BOT_TOKEN or GEMINI_API_KEY is missing!");
    process.exit(1);
}

// Telegram Bot ကို ချိတ်ဆက်ခြင်း
const bot = new TelegramBot(token);
bot.deleteWebHook().then(() => {
    bot.startPolling();
    console.log("Bot is now polling and waiting for messages...");
});

// Render ၏ Deployment ကြောင့်ဖြစ်သော 409 Conflict Error ကို လျစ်လျူရှုရန်
bot.on('polling_error', (error) => {
    if (error.code === 'ETELEGRAM' && error.message.includes('409 Conflict')) {
        // အဟောင်းနှင့် အသစ် ထပ်နေချိန် ခဏသာဖြစ်သဖြင့် ဘာမှမလုပ်ဘဲ ကျော်သွားမည်
    } else {
        console.error("Polling error:", error.message);
    }
});

// Gemini ကို ချိတ်ဆက်ခြင်း (အခမဲ့ Key များအတွက် အသေချာဆုံးဖြစ်သော 1.5-flash ကို သုံးထားပါသည်)
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text) return; 

    try {
        bot.sendChatAction(chatId, 'typing');

        const result = await model.generateContent(text);
        const response = result.response.text();

        bot.sendMessage(chatId, response);
        
    } catch (error) {
        console.error("Error generating response:", error.message);
        bot.sendMessage(chatId, "ဆာဗာချိတ်ဆက်မှု အခက်အခဲဖြစ်နေပါသည်။ Error: " + error.message);
    }
});
