const { execSync } = require("child_process");
const http = require("http");

// Render မှ တောင်းဆိုသော Port ကို ဖွင့်ပေးထားခြင်း
const port = process.env.PORT || 3000;
http.createServer((req, res) => { 
    res.writeHead(200); 
    res.end("Render Bot is running successfully!"); 
}).listen(port, () => {
    console.log(`Render web server listening on port ${port}`);
});

const run = (cmd, useMemoryLimit = false) => { 
    let safeCmd = cmd;
    if (process.env.TELEGRAM_BOT_TOKEN) {
        safeCmd = safeCmd.replace(process.env.TELEGRAM_BOT_TOKEN.trim(), "***");
    }
    console.log("Running:", safeCmd);
    
    // Memory မလောက်သော Error ကို ဖြေရှင်းရန် Node.js ၏ RAM အသုံးပြုမှုကို ကန့်သတ်ခြင်း (256MB)
    const options = { stdio: "inherit" };
    if (useMemoryLimit) {
        options.env = { 
            ...process.env, 
            NODE_OPTIONS: "--max-old-space-size=256 --dns-result-order=ipv4first" 
        };
    }
    execSync(cmd, options); 
};

try {
    // ပျောက်ဆုံးနေသော gaxios module အပါအဝင် လိုအပ်သည်များကို အတင်းပြန်သွင်းခိုင်းခြင်း
    console.log("Installing missing modules...");
    execSync("npm install gaxios google-auth-library", { stdio: "inherit" });

    // Settings များကို Memory သတ်မှတ်ချက်မပါဘဲ Run ခြင်း
    run("npx openclaw config set gateway.mode local");
    run("npx openclaw config set agents.defaults.model google/gemini-1.5-pro");
    run("npx openclaw config set channels.telegram.enabled true");
    
    let token = process.env.TELEGRAM_BOT_TOKEN ? process.env.TELEGRAM_BOT_TOKEN.trim() : "";
    token = token.replace(/^["']|["']$/g, '');

    if (token) {
        run(`npx openclaw config set channels.telegram.botToken "${token}"`);
    } else {
        console.error("ERROR: TELEGRAM_BOT_TOKEN is missing!");
    }

    console.log("Starting Openclaw Gateway on Render (with memory optimization)...");
    
    // Gateway ကို Run သည့်အခါမှသာ Memory Optimization ကို အသုံးပြုခြင်း
    run("npx openclaw gateway --allow-unconfigured", true);

} catch (e) {
    console.error("Startup failed:", e.message);
}
