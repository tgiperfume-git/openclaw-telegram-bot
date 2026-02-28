const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');

// Render အတွက် Web Server ဖွင့်ပေးခြင်း
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Gemini Telegram Bot is successfully running!'));
app.listen(port, () => console.log(`Web server is listening on port ${port}`));

// လျှို့ဝှက်ကုဒ်များကို Render မှတဆင့် ဆွဲယူခြင်း (အပိုကွက်လပ်များနှင့် မျက်တောင်များကို ဖြတ်ထုတ်ခြင်း)
const token = process.env.TELEGRAM_BOT_TOKEN ? process.env.TELEGRAM_BOT_TOKEN.trim().replace(/^["']|["']$/g, '') : "";
const geminiApiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim().replace(/^["']|["']$/g, '') : "";

if (!token || !geminiApiKey) {
    console.error("ERROR: TELEGRAM_BOT_TOKEN or GEMINI_API_KEY is missing!");
    process.exit(1);
}

// Telegram Bot ကို ချိတ်ဆက်ခြင်း (Webhook အဟောင်းများကို အရင်ဖျက်ပါမည်)
const bot = new TelegramBot(token);
bot.deleteWebHook().then(() => {
    bot.startPolling();
    console.log("Old webhooks cleared. Bot is now polling and waiting for messages...");
});

// Gemini ကို ချိတ်ဆက်ခြင်း (-latest ထည့်သွင်း၍ 404 Error ကို ဖြေရှင်းထားပါသည်)
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

// Telegram မှ စာဝင်လာတိုင်း Gemini ထံပို့ပြီး အဖြေပြန်ပေးမည့်စနစ်
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text) return; // စာသားမဟုတ်ပါက ကျော်သွားမည်

    try {
        // စာရိုက်နေကြောင်း (Typing...) ပြသခြင်း
        bot.sendChatAction(chatId, 'typing');

        // Gemini ထံမှ အဖြေတောင်းခြင်း
        const result = await model.generateContent(text);
        const response = result.response.text();

        // ရလာသောအဖြေကို Telegram သို့ ပြန်ပို့ခြင်း
        bot.sendMessage(chatId, response);
        
    } catch (error) {
        console.error("Error generating response:", error.message);
        bot.sendMessage(chatId, "ဆာဗာချိတ်ဆက်မှု အနည်းငယ် အခက်အခဲရှိနေပါသည်။ ခဏနေမှ ထပ်စမ်းကြည့်ပါ။");
    }
});
