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

// သင့် API Key ဖြင့် အသုံးပြုနိုင်သော Model များကို Google ထံမှ တိုက်ရိုက်လှမ်းမေးပြီး Log တွင် ပြသပေးမည့်စနစ်
fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`)
    .then(res => res.json())
    .then(data => {
        if (data.models) {
            const textModels = data.models
                .filter(m => m.supportedGenerationMethods.includes("generateContent"))
                .map(m => m.name.replace('models/', ''));
            console.log("✅ သင့် API Key ဖြင့် သုံးနိုင်သော Model အမည်များ:", textModels.join(", "));
        } else {
            console.log("❌ API Key ပြဿနာရှိနေပါသည်။ Model စာရင်း ဆွဲယူ၍မရပါ။");
        }
    }).catch(err => console.log("Fetch error:", err.message));

const bot = new TelegramBot(token);
bot.deleteWebHook().then(() => {
    bot.startPolling();
    console.log("Bot is now polling and waiting for messages...");
});

bot.on('polling_error', (error) => {
    if (error.code !== 'ETELEGRAM') console.error("Polling error:", error.message);
});

// လက်ရှိ နောက်ဆုံးပေါ် Gemini 2.0 ကို ပြောင်းလဲချိတ်ဆက်ထားပါသည်
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); 

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
