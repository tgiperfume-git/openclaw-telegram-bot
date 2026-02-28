const { execSync } = require("child_process");
const http = require("http");

// Render မှ ပေးသော Port (သို့မဟုတ်) 3000 ကို ဖွင့်ထားပေးခြင်း
const port = process.env.PORT || 3000;
http.createServer((req, res) => { 
    res.writeHead(200); 
    res.end("Render Bot is active!"); 
}).listen(port, () => {
    console.log(`Web server listening on port ${port}`);
});

const run = (cmd) => { 
    console.log("Running configuration...");
    execSync(cmd, { stdio: "inherit" }); 
};

try {
    run("npx openclaw config set gateway.mode local");
    run("npx openclaw config set agents.defaults.model google/gemini-1.5-pro");
    run("npx openclaw config set channels.telegram.enabled true");
    
    // Token မှ အပိုကွက်လပ်များနှင့် မျက်တောင်များကို ရှင်းလင်းပေးခြင်း
    let token = process.env.TELEGRAM_BOT_TOKEN ? process.env.TELEGRAM_BOT_TOKEN.trim() : "";
    token = token.replace(/^["']|["']$/g, '');

    if (token) {
        run(`npx openclaw config set channels.telegram.botToken "${token}"`);
    } else {
        console.error("ERROR: TELEGRAM_BOT_TOKEN is missing!");
    }

    console.log("Starting Openclaw Gateway on Render...");
    execSync("npx openclaw gateway --allow-unconfigured", {
        stdio: "inherit",
        env: { ...process.env, NODE_OPTIONS: "--dns-result-order=ipv4first" }
    });
} catch (e) {
    console.error("Startup failed:", e.message);
}
