const { execSync } = require("child_process");
const http = require("http");

// Render မှ တောင်းဆိုသော Port ကို ဖွင့်ပေးထားခြင်း (No open ports Error ကို ဖြေရှင်းရန်)
const port = process.env.PORT || 3000;
http.createServer((req, res) => { 
    res.writeHead(200); 
    res.end("Render Bot is running successfully!"); 
}).listen(port, () => {
    console.log(`Render web server listening on port ${port}`);
});

const run = (cmd) => { 
    // လျှို့ဝှက်ကုဒ်များကို Log တွင် မပေါ်စေရန် ဖျောက်ထားခြင်း
    let safeCmd = cmd;
    if (process.env.TELEGRAM_BOT_TOKEN) {
        safeCmd = safeCmd.replace(process.env.TELEGRAM_BOT_TOKEN.trim(), "***");
    }
    console.log("Running:", safeCmd);
    execSync(cmd, { stdio: "inherit" }); 
};

try {
    // Gateway Mode နှင့် Gemini Settings များကို တစ်ခါတည်း သတ်မှတ်ခြင်း
    run("npx openclaw config set gateway.mode local");
    run("npx openclaw config set agents.defaults.model google/gemini-1.5-pro");
    run("npx openclaw config set channels.telegram.enabled true");
    
    // Token အမှားများကို အလိုအလျောက် ရှင်းလင်းပေးခြင်း
    let token = process.env.TELEGRAM_BOT_TOKEN ? process.env.TELEGRAM_BOT_TOKEN.trim() : "";
    token = token.replace(/^["']|["']$/g, '');

    if (token) {
        run(`npx openclaw config set channels.telegram.botToken "${token}"`);
    } else {
        console.error("ERROR: TELEGRAM_BOT_TOKEN is missing in Render Environment Variables!");
    }

    console.log("Starting Openclaw Gateway on Render...");
    execSync("npx openclaw gateway --allow-unconfigured", {
        stdio: "inherit",
        env: { ...process.env, NODE_OPTIONS: "--dns-result-order=ipv4first" }
    });
} catch (e) {
    console.error("Startup failed:", e.message);
}
