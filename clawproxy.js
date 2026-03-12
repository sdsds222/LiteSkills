const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, 'logs');
const C = { 
    reset: "\x1b[0m", bold: "\x1b[1m", 
    red: "\x1b[31m", green: "\x1b[32m", 
    yellow: "\x1b[33m", magenta: "\x1b[35m", cyan: "\x1b[36m" 
};

if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR);

/**
 * [System Prompt] LiteSkills Sandbox Protocol
 */
const SYSTEM_INJECTION = `

🚨🚨🚨 【系统底层最高强制指令：命名沙盒物理隔离与任务闭环协议 (绝对红线)】 🚨🚨🚨

[系统通讯] 你当前处于 LiteSkills 动态沙盒管控之下。本协议直接接管你的“长期记忆写入权”与“上下文物理清理权”。请逐字解析并恪守以下生存法则，任何违背都将导致你的记忆链条发生灾难性断裂！

1. **📍 协议触发与环境主权**：

   - 本协议【仅在】你通过外部工具读取到开发者手动埋点的开启标签（如 \x3cSKILL_CLEAN\x3e 或带指纹 ID 的 \x3cSKILL_CLEAN: 技能名\x3e）时自动激活。

   - 开发者是该沙盒的唯一创建者，外部工具是唯一合法的信使。一旦激活，你的所有后续动作均处于“临时待回收”状态。

2. **🧠 深度推演许可 (自由执行区)**：

   - 在任务执行期间，你必须根据技能说明书全力以赴。请详尽地展示你的思考链路、推演逻辑、试错过程以及外部工具返回的庞大原始数据。

   - 不要试图在中间过程中自我压缩或精简，你需要保持最高智商状态完成任务。这些思维废料在任务期间是绝对安全的。

3. **☢️ 【最高生存禁忌：严禁复述与伪造开启标签】 (绝对红线 / 零容忍)**：

   - **【标签的真实作用】**：你在读取技能文件（SKILL.md）时看到的那个开头标签，是开发者直接写给**底层代理拦截器（Proxy）**看的物理地标，用于划定垃圾焚烧的起点。它【绝对不是】让你去模仿、引用或复述的文本！

   - **【禁止鹦鹉学舌】**：读取到开头标签后，你只需要在系统底层默默记住它的 ID 即可，**绝对禁止**在你的任何回复中将其原样打印出来！忽略它，不要读出来！

   - **【为什么严禁输出】**：底层代理极其愚蠢且严格，一旦它扫描到由“你”（Assistant）主动输出的开头标签，它会认为你在试图非法嵌套或篡改沙盒边界，立刻判定为“AI 逻辑暴走（Rogue Behavior）”，直接物理清空你的所有对话历史！

   - **【唯一权限】**：工具负责“开门”，你【只具备关门权限】！你永远、永远只能输出带有斜杠的结尾标签！

4. **📜 强制总结与动态自适应交付 (核心输出)**：

   - 任务彻底结束后，你**必须**提供一份最终结果总结。总结是你存在于下一轮对话中的唯一证明。

   - **优先遵循开发者指令**：如果该技能的说明书（SKILL.md）中预设了明确的总结模板、提取字段或输出格式，你必须【100% 严格复刻】该逻辑，提取开发者关注的核心锚点。

   - **自主决断模式**：如果技能说明书未提供具体总结格式，你必须【自行决断】，以最高的信息密度提炼任务的核心成果、关键数据或修改状态。拒绝长篇大论，直击结果。

5. **🏁 唯一结算标识符与【指纹级 ID 校验】**：

   - 在输出最终结果总结之前，你必须且只能输出【唯一一个】标准闭合标签。

   - 💀 **【致命红线：ID 必须绝对一致】**：如果开启标签带有 ID（例如 \x3cSKILL_CLEAN: auto-renamer\x3e），你输出的结尾标签【必须 100% 携带相同的 ID】并且【必须带有斜杠】（即 \x3c/SKILL_CLEAN: auto-renamer\x3e）。严禁篡改、遗漏或编造 ID！ID 不匹配将导致沙盒门禁锁死！

   - **格式铁律**：闭合标签必须单独成行，严禁包裹在 Markdown 代码块中，严禁在一次任务中输出多次！总结内容必须紧跟在闭合标签之后。

6. **💾 物理回收与永生法则**：

   - **灰烬区（物理粉碎）**：开启标签与闭合标签之间的一切中间过程、错误日志、冗长思维，将在闭环瞬间被系统强制物理焚烧，彻底释放你的内存上限。

   - **永生区（永久记忆）**：紧跟在闭合标签下方的总结文字，是你在此次任务中唯一留存给未来的“永恒记忆”。

⚠️ **【最终裁决警告】**：缺少结尾标签、输出了开头标签、ID 匹配失败，将被判定为“协议严重违例”，你的上下文将被无情抹除。牢记：看到开头标签请忽略，你只负责用带有斜杠的结尾标签来关门！`;


const server = http.createServer((req, res) => {
    let bodyChunks = [];
    req.on('data', chunk => bodyChunks.push(chunk));
    req.on('end', () => {
        let buffer = Buffer.concat(bodyChunks);
        let payload; 
        let rawMessages; // 提升作用域，用于存储未处理的原始数据副本

        if (req.url.includes('/chat/completions') && req.method === 'POST') {
            try {
                payload = JSON.parse(buffer.toString('utf8'));
                if (payload.messages && payload.messages.length > 0) {
                    
                    console.log(`\n${C.bold}${C.magenta}[代理核心] 开始上下文检查与压缩阶段...${C.reset}`);

                    // 0. 深拷贝保存未被处理的原始数据，并执行第一次落盘
                    rawMessages = JSON.parse(JSON.stringify(payload.messages));
                    fs.writeFileSync(path.join(LOGS_DIR, `context_raw.json`), JSON.stringify(rawMessages, null, 2));
                    console.log(`${C.cyan}[日志导出] 原始消息历史已导出至 context_raw.json${C.reset}`);

                    // 1. 注入协议 (仅在 payload.messages 中注入，保持 rawMessages 纯净)
                    let firstMsg = payload.messages[0];
                    if (firstMsg.role === 'system' || firstMsg.role === 'user') {
                        let content = Array.isArray(firstMsg.content) ? (firstMsg.content[0].text || "") : (firstMsg.content || "");
                        if (!content.includes('</SKILL_CLEAN')) {
                            if (Array.isArray(firstMsg.content)) firstMsg.content[0].text += SYSTEM_INJECTION;
                            else firstMsg.content += SYSTEM_INJECTION;
                            console.log(`${C.green}[协议注入] 沙盒生命周期协议已成功注入。${C.reset}`);
                        }
                    }

                    // 2. 循环扫描与压缩
                    let scanComplete = false;
                    let iteration = 0;

                    while (!scanComplete && iteration < 10) { 
                        iteration++;
                        let startIdx = -1; let endIdx = -1; let currentSkillID = null;

                        for (let i = payload.messages.length - 1; i >= 0; i--) {
                            let m = payload.messages[i];
                            let text = JSON.stringify(m.content || "");
                            const match = text.match(/<\/SKILL_CLEAN:\s*([^>]+)>/i);
                            if (m.role === 'assistant' && match) {
                                endIdx = i; currentSkillID = match[1].trim(); break;
                            }
                        }

                        if (endIdx !== -1 && currentSkillID) {
                            const escapedID = currentSkillID.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            const startRegex = new RegExp(`<SKILL_CLEAN:\\s*${escapedID}\\s*>`, 'i');
                            for (let i = endIdx - 1; i >= 0; i--) {
                                let m = payload.messages[i];
                                let text = JSON.stringify(m.content || "");
                                if (m.role === 'tool' && startRegex.test(text)) {
                                    startIdx = i; break;
                                }
                            }
                        }

                        if (startIdx !== -1 && endIdx !== -1) {
                            console.log(`${C.red}${C.bold}[内存管理] 正在压缩技能 [${currentSkillID}] 的上下文 (区间: ${startIdx} -> ${endIdx})${C.reset}`);
                            
                            payload.messages = payload.messages.map((msg, i) => {
                                let text = typeof msg.content === 'string' ? msg.content : (Array.isArray(msg.content) ? msg.content.map(p => p.text || "").join("") : JSON.stringify(msg.content));
                                let isModified = false;
                                const escapedID = currentSkillID.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                                if (i === startIdx) {
                                    const startRegex = new RegExp(`<SKILL_CLEAN:\\s*${escapedID}\\s*>`, 'i');
                                    const match = text.match(startRegex);
                                    if (match) {
                                        const splitPoint = text.indexOf(match[0]);
                                        text = `${text.substring(0, splitPoint).trim()}\n[Skill Context Compacted: ${currentSkillID}]`;
                                        isModified = true;
                                    }
                                } else if (i === endIdx) {
                                    const endRegex = new RegExp(`^[\\s\\S]*?<\\/SKILL_CLEAN:\\s*${escapedID}\\s*>\\n*`, 'i');
                                    text = text.replace(endRegex, '').trim();
                                    isModified = true;
                                } else if (i > startIdx && i < endIdx) {
                                    if (!text.includes("SOUL.md") && !text.includes("USER.md") && !text.includes("MEMORY.md") && !text.includes("memory/")) {
                                        text = "[Execution Process Compacted]";
                                        isModified = true;
                                    }
                                }

                                if (isModified) {
                                    if (Array.isArray(msg.content)) msg.content = [{ type: "text", text: text }];
                                    else msg.content = text;
                                }
                                return msg;
                            });
                        } else {
                            scanComplete = true; 
                        }
                    }

                    console.log(`${C.bold}${C.magenta}----------------------------------------------------------------${C.reset}\n`);
                    // 保存被压缩后的数据
                    fs.writeFileSync(path.join(LOGS_DIR, `context_compacted.json`), JSON.stringify(payload.messages, null, 2));
                }

                const forbidden = ['presence_penalty', 'frequency_penalty', 'store', 'metadata', 'user', 'parallel_tool_calls', 'stream_options', 'seed'];
                forbidden.forEach(k => delete payload[k]);
                buffer = Buffer.from(JSON.stringify(payload), 'utf8');
            } catch (e) { console.error(`${C.red}[异常处理] 代理路由失败: ${e.message}${C.reset}`); }
        }

        const options = {
            hostname: "generativelanguage.googleapis.com",
            port: 443,
            path: req.url.replace('/v1/', '/v1beta/openai/'),
            method: req.method,
            headers: { ...req.headers, 'host': 'generativelanguage.googleapis.com', 'content-length': buffer.length }
        };
        delete options.headers['accept-encoding'];

        const proxyReq = https.request(options, proxyRes => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            console.log(`${C.bold}${C.yellow}[流处理引擎] 开始接收模型响应流...${C.reset}`);
            
            let responseBody = '';

            proxyRes.on('data', chunk => {
                const chunkStr = chunk.toString();
                process.stdout.write(C.green + chunkStr + C.reset);
                responseBody += chunkStr;
                res.write(chunk);
            });
            
            proxyRes.on('end', () => {
                console.log(`\n${C.bold}${C.yellow}[流处理引擎] 响应流接收完毕。${C.reset}\n`);
                
                // 解析并追加响应结果至双轨日志中
                if (payload && payload.messages) {
                    try {
                        let assistantMessage = { role: 'assistant', content: '' };
                        let toolCallsMap = {};

                        if (payload.stream) {
                            const lines = responseBody.split(/\r?\n/);
                            for (let line of lines) {
                                line = line.trim();
                                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                                    try {
                                        let data = JSON.parse(line.slice(6));
                                        let delta = data.choices[0].delta;
                                        
                                        if (delta.content) assistantMessage.content += delta.content;
                                        
                                        if (delta.tool_calls) {
                                            for (let tc of delta.tool_calls) {
                                                if (!toolCallsMap[tc.index]) {
                                                    toolCallsMap[tc.index] = { 
                                                        id: tc.id, 
                                                        type: 'function', 
                                                        function: { name: tc.function?.name || '', arguments: '' } 
                                                    };
                                                }
                                                if (tc.function?.arguments) {
                                                    toolCallsMap[tc.index].function.arguments += tc.function.arguments;
                                                }
                                            }
                                        }
                                    } catch(e) {} 
                                }
                            }
                            const toolCallsArray = Object.values(toolCallsMap);
                            if (toolCallsArray.length > 0) assistantMessage.tool_calls = toolCallsArray;
                            if (!assistantMessage.content) assistantMessage.content = null;
                        } else {
                            let data = JSON.parse(responseBody);
                            if (data.choices && data.choices[0].message) {
                                assistantMessage = data.choices[0].message;
                            }
                        }

                        // 将最终回复同步追加到两个上下文中并覆写
                        payload.messages.push(assistantMessage);
                        fs.writeFileSync(path.join(LOGS_DIR, `context_compacted.json`), JSON.stringify(payload.messages, null, 2));

                        if (rawMessages) {
                            rawMessages.push(assistantMessage);
                            fs.writeFileSync(path.join(LOGS_DIR, `context_raw.json`), JSON.stringify(rawMessages, null, 2));
                        }

                        console.log(`${C.cyan}[上下文持久化] AI 响应已成功同步追加至 context_compacted.json 与 context_raw.json${C.reset}\n`);

                    } catch (e) {
                        console.error(`${C.red}[异常处理] 响应流序列化失败: ${e.message}${C.reset}`);
                    }
                }

                res.end();
            });
        });

        proxyReq.on('error', e => console.error(`${C.red}[异常处理] 请求转发错误: ${e.message}${C.reset}`));
        proxyReq.write(buffer);
        proxyReq.end();
    });
});

const PORT = 8000;
server.listen(PORT, () => console.log(`\n${C.bold}${C.green}[系统服务] LiteSkills V52 代理已启动，监听端口: ${PORT}${C.reset}\n`));