// Copyright (c) 2026 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT
import { 
    NPC_PROFILES, 
    TOURIST_PROFILES,
    buildSystemPrompt, 
    buildUserPrompt, 
    getFirstUserPrompt,
    getRandomTouristProfile
} from '../data/NPCProfilesRe.js';
import { MERCHANT_DATA } from '../data/MerchantData.js';

const API_PROXY_URL = '/api/chat';
const API_TIMEOUT = 15000;
const MAX_RETRIES = 3;

export default class AIService {
    static fireworkBlessingCache = [];
    static kongmingBlessingCache = [];
    static isPreloading = false;
    static requestQueue = [];
    static isProcessingQueue = false;

    constructor() {
        this.conversationHistory = new Map();
        this.roundCounter = new Map();
        
        if (!AIService.isPreloading) {
            AIService.isPreloading = true;
            // 立即开始预加载，不再延迟5秒
            (async () => {
                if (AIService.fireworkBlessingCache.length === 0) {
                    await this.preloadFireworkBlessings();
                }
                
                if (AIService.kongmingBlessingCache.length === 0) {
                    await this.preloadKongmingBlessings();
                }
                
                AIService.isPreloading = false;
            })();
        }
    }

    static async processQueue() {
        if (AIService.isProcessingQueue) return;
        AIService.isProcessingQueue = true;

        while (AIService.requestQueue.length > 0) {
            const { task, resolve, reject } = AIService.requestQueue.shift();
            
            // 立即触发请求，不等待结果返回
            task().then(resolve).catch(reject);

            // 仅等待1秒间隔，控制发送频率
            await new Promise(r => setTimeout(r, 1000));
        }

        AIService.isProcessingQueue = false;
    }

    static enqueueRequest(task) {
        return new Promise((resolve, reject) => {
            AIService.requestQueue.push({ task, resolve, reject });
            AIService.processQueue();
        });
    }

    async preloadFireworkBlessings() {
        console.log('[AIService] Starting firework blessings preload...');
        
        const prompt = `生成5句烟花祝福语。
【要求】
1. 每句控制在8字以内！必须简短！
2. 要喜庆、吉祥、有趣
3. 可以加入程序员黑话和梗，比如：无bug、不加班、上线顺利
4. 适合马年新年

【回复格式】
返回JSON：{"blessings": ["祝福语1", "祝福语2", ...]}`;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                console.log(`[AIService] Preloading firework blessings (Attempt ${attempt}/3)...`);
                
                const data = await this.callLLM(
                    [{ role: 'user', content: prompt }],
                    { temperature: 1.2, max_tokens: 200 } // 降低 max_tokens
                );

                const content = data.choices[0].message.content;
                let jsonStr = content;
                
                // 尝试提取 Markdown 代码块中的 JSON
                const mdMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
                if (mdMatch) {
                    jsonStr = mdMatch[1];
                } else {
                    const firstOpen = content.indexOf('{');
                    const lastClose = content.lastIndexOf('}');
                    if (firstOpen !== -1 && lastClose !== -1) {
                        jsonStr = content.substring(firstOpen, lastClose + 1);
                    }
                }

                try {
                    const parsed = JSON.parse(jsonStr);
                    if (parsed.blessings && Array.isArray(parsed.blessings)) {
                        AIService.fireworkBlessingCache = parsed.blessings;
                        console.log('[AIService] Firework blessings loaded:', AIService.fireworkBlessingCache);
                        return; // 成功则退出
                    } else {
                        throw new Error('Invalid JSON format: missing blessings array');
                    }
                } catch (e) {
                    console.error('[AIService] JSON parse error:', e, 'Content:', content);
                    throw e;
                }
            } catch (error) {
                console.error(`[AIService] Firework preload attempt ${attempt} failed:`, error.message);
                if (attempt < 3) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }
        console.warn('[AIService] Failed to preload firework blessings after 3 attempts');
    }

    async preloadKongmingBlessings(retryCount = 0) {
        if (AIService.kongmingBlessingCache.length > 0) return;

        console.log(`[AIService] Preloading kongming blessing... (Attempt ${retryCount + 1})`);
        
        // 简化 Prompt，减少无关描述，强制 JSON 格式，只需要1个
        const prompt = `生成1个新年孔明灯四字祝福语。
要求：
1. 必须是四字成语或四字短语（如：平安喜乐）。
2. 只返回纯 JSON 数组，包含1个字符串。
3. 格式示例：["平安喜乐"]`;

        try {
            const data = await this.callLLM(
                [{ role: 'user', content: prompt }], 
                { max_tokens: 30, temperature: 0.7 } // 减少 token
            );
            
            const content = data.choices[0].message.content;
            console.log('[AIService] Raw kongming response:', content);

            let blessings = [];
            
            // 1. 尝试直接解析
            try {
                blessings = JSON.parse(content);
            } catch (e) {
                // 2. 尝试提取 Markdown 代码块
                const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
                if (jsonMatch) {
                    try {
                        blessings = JSON.parse(jsonMatch[1]);
                    } catch (e2) {
                         console.warn('[AIService] Failed to parse extracted JSON block');
                    }
                }
                
                // 3. 如果还是失败，尝试提取数组部分
                if (!Array.isArray(blessings) || blessings.length === 0) {
                    const arrayMatch = content.match(/\[\s*".*"\s*\]/s); // 匹配 ["..."] 结构
                    if (arrayMatch) {
                        try {
                            blessings = JSON.parse(arrayMatch[0]);
                        } catch (e3) {
                            console.warn('[AIService] Failed to parse array pattern');
                        }
                    }
                }
            }

            // 过滤和验证
            if (Array.isArray(blessings)) {
                // 过滤非字符串和长度不符合的
                const validBlessings = blessings
                    .filter(b => typeof b === 'string' && b.length <= 6) // 放宽一点长度限制，后面截取
                    .map(b => b.substring(0, 4)); // 强制截取前4个字

                if (validBlessings.length > 0) {
                    AIService.kongmingBlessingCache = validBlessings;
                    console.log('[AIService] Successfully preloaded kongming blessings:', AIService.kongmingBlessingCache);
                    return;
                }
            }
            
            throw new Error('No valid blessings found in response');

        } catch (error) {
            console.error('[AIService] Failed to preload kongming blessings:', error);
            if (retryCount < 3) {
                console.log(`[AIService] Retrying in 2 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                await this.preloadKongmingBlessings(retryCount + 1);
            } else {
                 console.warn('[AIService] Max retries reached for kongming blessings. Using defaults.');
            }
        }
    }

    getProfile(npcName) {
        return NPC_PROFILES[npcName] || null;
    }

    async fetchWithTimeout(url, options, timeout = API_TIMEOUT) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('API request timeout');
            }
            throw error;
        }
    }

    async fetchWithRetry(url, options, timeout = API_TIMEOUT, maxRetries = MAX_RETRIES) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await this.fetchWithTimeout(url, options, timeout);
                return response;
            } catch (error) {
                lastError = error;
                console.warn(`[AIService] Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
                
                if (attempt < maxRetries) {
                    const delay = attempt * 1000;
                    console.log(`[AIService] Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError;
    }

    async callLLM(messages, options = {}) {
        return AIService.enqueueRequest(async () => {
            const response = await this.fetchWithRetry(
                API_PROXY_URL,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        messages: messages,
                        temperature: options.temperature ?? 1.0,
                        max_tokens: options.max_tokens ?? 500
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `API request failed: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            return data;
        });
    }

    async generateResponse(npcName, playerChoice = null, isFirstMessage = false, currentMood = 50) {
        const profile = this.getProfile(npcName);

        if (!this.conversationHistory.has(npcName)) {
            this.conversationHistory.set(npcName, []);
        }
        if (!this.roundCounter.has(npcName)) {
            this.roundCounter.set(npcName, 0);
        }

        const history = this.conversationHistory.get(npcName);
        let currentRound = this.roundCounter.get(npcName);

        if (isFirstMessage) {
            history.length = 0;
            currentRound = 1;
            this.roundCounter.set(npcName, 1);
        } else {
            currentRound += 1;
            this.roundCounter.set(npcName, currentRound);
        }

        let systemPrompt = buildSystemPrompt(npcName);
        if (!systemPrompt) {
            console.warn(`No profile found for NPC: ${npcName}, using generic prompt`);
            systemPrompt = this.buildGenericSystemPrompt(npcName);
        }

        const messages = [
            { role: 'system', content: systemPrompt }
        ];

        if (isFirstMessage) {
            const firstPrompt = getFirstUserPrompt(npcName);
            messages.push({ role: 'user', content: firstPrompt });
        } else if (playerChoice) {
            for (const msg of history) {
                messages.push(msg);
            }
            let userPrompt = buildUserPrompt(npcName, playerChoice, currentRound, currentMood);
            if (!userPrompt) {
                userPrompt = this.buildGenericUserPrompt(playerChoice, currentRound, currentMood);
            }
            messages.push({ role: 'user', content: userPrompt });
        }

        try {
            console.log(`[AIService] Calling API for ${npcName}, round ${currentRound}`);
            
            const data = await this.callLLM(messages, { temperature: 1.0, max_tokens: 500 });

            const content = data.choices[0].message.content;
            console.log(`[AIService] API response:`, content);

            let parsed;
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    parsed = JSON.parse(jsonMatch[0]);
                } catch (e) {
                    console.error(`[AIService] Failed to parse JSON:`, e);
                    throw new Error('Failed to parse LLM response as JSON');
                }
            } else {
                console.error(`[AIService] No JSON found in response:`, content);
                throw new Error('No JSON found in LLM response');
            }

            if (profile && currentRound >= profile.maxRounds) {
                parsed.isEnd = true;
                parsed.options = [];
            }

            if (isFirstMessage) {
                const firstPrompt = getFirstUserPrompt(npcName);
                history.push({ role: 'user', content: firstPrompt });
            } else if (playerChoice) {
                const userPrompt = buildUserPrompt(npcName, playerChoice, currentRound);
                history.push({ role: 'user', content: userPrompt });
            }
            history.push({ role: 'assistant', content: JSON.stringify(parsed) });

            return parsed;
        } catch (error) {
            console.error('[AIService] Error:', error.message);
            throw error;
        }
    }

    buildGenericSystemPrompt(npcName) {
        return `你是${npcName}，一个在中国农村庙会上的摊主/村民。

【场景背景】
现在是中国农历新年，你在老家的庙会上。玩家是一个在外地工作的年轻人，过年回老家，在庙会上遇到了你。
庙会上人来人往，很热闹，有各种小吃摊、游戏摊、年货摊。

【对话风格】
- 说话要口语化、接地气
- 可以关心年轻人在外面的情况
- 聊聊过年、庙会的话题

【最重要的要求】
1. npcText 必须控制在150字以内！简短、口语化！
2. 每个选项text控制在20字以内！

【回复格式】
用JSON格式回复：
{"npcText": "你说的话（150字以内）", "options": [{"text": "选项1", "tone": "agree"}, {"text": "选项2", "tone": "argue"}, {"text": "选项3", "tone": "evade"}], "isEnd": false}

【3种语气选项】
- agree：顺着说、附和
- argue：抬杠、反驳  
- evade：打马虎眼、敷衍`;
    }

    buildGenericUserPrompt(playerChoice, currentRound, currentMood) {
        let prompt = `玩家说："${playerChoice}"

请根据玩家的回复继续对话。

第${currentRound}轮对话。

【心情值判断 - 重要！】
当前NPC心情值：${currentMood}/100
请根据玩家回复的内容和语气，判断NPC心情值变化，在JSON中增加 "moodChange" 字段：
- 如果玩家顺着你说、附和你、夸你 → moodChange: +10到+20（正数，心情变好）
- 如果玩家怼你、抬杠、反驳你 → moodChange: -10到-20（负数，心情变差）
- 如果玩家敷衍、打马虎眼 → moodChange: -5到+5（小幅波动）

回复格式示例：
{"npcText": "xxx", "options": [...], "isEnd": false, "moodChange": 15}`;

        if (currentRound >= 5) {
            prompt += '\n\n注意：对话轮次较多了，可以考虑在接下来1-2轮内结束对话。';
        }
        if (currentRound >= 8) {
            prompt += '\n\n【重要】已达到最大对话轮次，请在本轮结束对话，设置isEnd为true。';
        }
        
        return prompt;
    }

    clearHistory(npcName) {
        if (this.conversationHistory.has(npcName)) {
            this.conversationHistory.delete(npcName);
        }
        if (this.roundCounter.has(npcName)) {
            this.roundCounter.delete(npcName);
        }
    }

    getCurrentRound(npcName) {
        return this.roundCounter.get(npcName) || 0;
    }

    async generateHawkingText(npcName) {
        const profile = NPC_PROFILES[npcName];
        const merchantData = MERCHANT_DATA[npcName];
        
        if (!merchantData) {
            return this.getDefaultHawkingText(npcName);
        }

        const systemPrompt = `你是${npcName}，在庙会上摆摊卖${merchantData.product}。
${profile ? profile.systemPrompt : ''}

【场景背景】
现在是中国农历新年庙会，你正在摊位前招揽顾客。摊位前暂时没有顾客。

【任务】
生成一句简短的吆喝语，吸引路过的游客来你的摊位。

【要求】
1. 吆喝语必须在30字以内！
2. 要体现你的性格特点和商品特色
3. 要口语化、接地气、有感染力
4. 可以包含价格信息：${merchantData.price}元

【回复格式】
直接返回JSON：{"hawkingText": "你的吆喝语"}`;

        try {
            const data = await this.callLLM(
                [{ role: 'user', content: systemPrompt }],
                { temperature: 1.0, max_tokens: 100 }
            );

            const content = data.choices[0].message.content;
            
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return parsed.hawkingText || this.getDefaultHawkingText(npcName);
            }
            return this.getDefaultHawkingText(npcName);
        } catch (error) {
            console.error('[AIService] generateHawkingText error:', error.message);
            return this.getDefaultHawkingText(npcName);
        }
    }

    getDefaultHawkingText(npcName) {
        const merchantData = MERCHANT_DATA[npcName];
        if (merchantData) {
            return `来看看${merchantData.product}啦！${merchantData.price}元一份！`;
        }
        return '快来看看啦！';
    }

    async generateTradeDialogue(npcName, touristProfile, touristMoney, dialogueHistory = [], isFirstRound = true) {
        const profile = NPC_PROFILES[npcName];
        const merchantData = MERCHANT_DATA[npcName];
        
        if (!merchantData) {
            return this.getDefaultTradeResponse(npcName, isFirstRound);
        }

        let systemPrompt = `你是${npcName}，在庙会上摆摊卖${merchantData.product}，售价${merchantData.price}元。
${profile ? profile.systemPrompt : ''}

【场景背景】
现在是中国农历新年庙会，有一位游客来到你的摊位前。

【游客信息】
- 游客类型：${touristProfile.name}
- 游客特点：${touristProfile.systemPrompt}
- 游客当前余额：${touristMoney}元

【对话规则】
1. 作为摊主，你要介绍商品、回应游客的问题
2. 可以适当讨价还价，但不要低于成本价（原价的70%）
3. 保持你的性格特点
4. npcText控制在80字以内

【回复格式】
返回JSON：
{
    "npcText": "你说的话",
    "finalPrice": ${merchantData.price},
    "canBuy": true,
    "isEnd": false
}

- finalPrice: 最终成交价格（如果同意降价）
- canBuy: 游客是否可以购买（余额是否足够）
- isEnd: 对话是否结束（成交或放弃）`;

        const messages = [{ role: 'system', content: systemPrompt }];
        
        for (const msg of dialogueHistory) {
            messages.push(msg);
        }

        if (isFirstRound) {
            messages.push({ role: 'user', content: '（游客走近摊位）请主动招呼游客，介绍你的商品。' });
        }

        try {
            const data = await this.callLLM(messages, { temperature: 1.0, max_tokens: 200 });

            const content = data.choices[0].message.content;
            
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                parsed.finalPrice = parsed.finalPrice || merchantData.price;
                parsed.canBuy = touristMoney >= parsed.finalPrice;
                return parsed;
            }
            return this.getDefaultTradeResponse(npcName, isFirstRound);
        } catch (error) {
            console.error('[AIService] generateTradeDialogue error:', error.message);
            return this.getDefaultTradeResponse(npcName, isFirstRound);
        }
    }

    getDefaultTradeResponse(npcName, isFirstRound) {
        const merchantData = MERCHANT_DATA[npcName];
        if (isFirstRound && merchantData) {
            return {
                npcText: `欢迎光临！来看看我的${merchantData.product}吧，${merchantData.price}元一份！`,
                finalPrice: merchantData.price,
                canBuy: true,
                isEnd: false
            };
        }
        return {
            npcText: '好嘞，成交！',
            finalPrice: merchantData ? merchantData.price : 0,
            canBuy: true,
            isEnd: true
        };
    }

    async generateTouristResponse(touristProfile, npcName, npcText, touristMoney, currentPrice, hasBargained = false) {
        const merchantData = MERCHANT_DATA[npcName];
        
        let bargainHint = '';
        if (!hasBargained) {
            bargainHint = `
【砍价策略】
你还没砍过价，可以尝试砍一次，问问能不能便宜点。
砍价幅度：建议砍3-5元，不要太狠。`;
        } else {
            bargainHint = `
【砍价策略】
你已经砍过一次价了，老板给的应该是底价了。
现在应该决定：买或者不买，不要再砍价了。`;
        }
        
        const systemPrompt = `你是一位游客，正在庙会上逛摊位。

【你的人设】
- 类型：${touristProfile.name}
- 特点：${touristProfile.systemPrompt}

【当前情况】
- 你在${npcName}的摊位前
- 摊主卖的是：${merchantData ? merchantData.product : '商品'}
- 当前报价：${currentPrice}元
- 你的余额：${touristMoney}元
${bargainHint}

【摊主刚才说】
"${npcText}"

【任务】
根据你的人设和当前情况，生成你的回复。

【要求】
1. 回复控制在25字以内，简洁自然
2. 过年逛庙会心情好，说话要热情友好
3. ${hasBargained ? '已经砍过价了，现在直接决定买或不买' : '可以尝试砍一次价，或者直接买'}

【回复格式】
返回JSON：
{
    "touristText": "你说的话",
    "action": "${hasBargained ? 'buy/leave' : 'bargain/buy/leave'}",
    "targetPrice": ${currentPrice}
}

- action: buy=决定购买, ${hasBargained ? '' : 'bargain=砍价（只能砍一次）, '}leave=离开
- targetPrice: 如果砍价，期望价格（比当前价低3-5元）`;

        try {
            const data = await this.callLLM(
                [{ role: 'user', content: systemPrompt }],
                { temperature: 1.0, max_tokens: 150 }
            );

            const content = data.choices[0].message.content;
            
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (touristMoney < currentPrice && parsed.action === 'buy') {
                    parsed.action = 'leave';
                    parsed.touristText = '钱不够了，下次再来吧...';
                }
                return parsed;
            }
            return { touristText: '好的，我买了！', action: 'buy', targetPrice: currentPrice };
        } catch (error) {
            console.error('[AIService] generateTouristResponse error:', error.message);
            return { touristText: '好的，我买了！', action: 'buy', targetPrice: currentPrice };
        }
    }

    async generateTouristDecision(touristProfile, touristMoney, availableNPCs, visitedNPCs) {
        const npcInfoList = availableNPCs.map(npc => {
            const merchantData = MERCHANT_DATA[npc.npcName];
            return {
                name: npc.npcName,
                product: merchantData ? merchantData.product : '未知商品',
                price: merchantData ? merchantData.price : 0,
                visited: visitedNPCs.has(npc.npcName)
            };
        }).filter(info => !info.visited && info.price <= touristMoney);

        if (npcInfoList.length === 0) {
            return null;
        }

        const hasFireworkNPC = npcInfoList.some(info => info.name === '爆竹秦');
        const fireworkNPC = availableNPCs.find(npc => npc.npcName === '爆竹秦');
        if (hasFireworkNPC && Math.random() < 0.5) {
            console.log('[AIService] 优先选择爆竹秦（50%概率触发）');
            return { npc: fireworkNPC, reason: '过年要放烟花才热闹！' };
        }

        const systemPrompt = `你是一位游客，正在决定下一个要逛的摊位。

【你的人设】
- 类型：${touristProfile.name}
- 特点：${touristProfile.systemPrompt}

【当前情况】
- 你的余额：${touristMoney}元
- 可选的摊位：
${npcInfoList.map(info => `  - ${info.name}：卖${info.product}，${info.price}元`).join('\n')}

【特别提示】
过年放烟花是传统习俗，爆竹秦那里有烟花卖，非常热闹！

【任务】
根据你的人设和喜好，选择下一个要去的摊位。

【回复格式】
返回JSON：{"selectedNPC": "摊主名字", "reason": "选择原因（20字以内）"}`;

        try {
            const data = await this.callLLM(
                [{ role: 'user', content: systemPrompt }],
                { temperature: 1.0, max_tokens: 100 }
            );

            const content = data.choices[0].message.content;
            
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                const selectedNPC = availableNPCs.find(npc => npc.npcName === parsed.selectedNPC);
                if (selectedNPC) {
                    return { npc: selectedNPC, reason: parsed.reason };
                }
            }
            return { npc: availableNPCs[Math.floor(Math.random() * availableNPCs.length)], reason: '随便逛逛' };
        } catch (error) {
            console.error('[AIService] generateTouristDecision error:', error.message);
            return { npc: availableNPCs[Math.floor(Math.random() * availableNPCs.length)], reason: '随便逛逛' };
        }
    }

    async generateFireworkBlessing(fireworkType = 'horse', touristProfile = null) {
        // 优先使用缓存的祝福语
        if (AIService.fireworkBlessingCache.length > 0) {
            const blessing = AIService.fireworkBlessingCache[Math.floor(Math.random() * AIService.fireworkBlessingCache.length)];
            console.log('[AIService] Using cached firework blessing:', blessing);
            return blessing;
        }

        console.log('[AIService] Cache empty, using default blessing');
        return this.getDefaultFireworkBlessing(fireworkType);
    }

    getDefaultFireworkBlessing(fireworkType) {
        const blessings = {
            horse: ['马到成功', '代码如马飞', '马上不加班', 'bug全跑马', '一马当先'],
            fish: ['年年有余', '摸鱼大吉', '内存有余', '年终奖有余', 'CPU有余'],
            '2026': ['2026大吉', 'new Year()', '新年快乐', 'git push 2026', '版本发布']
        };
        const list = blessings[fireworkType] || blessings.horse;
        return list[Math.floor(Math.random() * list.length)];
    }

    async generateBlessingText(type = 'firework', touristProfile = null) {
        if (type === 'kongming') {
            return await this.generateKongmingBlessing();
        }
        
        const typeDesc = '烟花祝福语';
        
        let prompt = `生成一句${typeDesc}。

【要求】
1. 祝福语控制在10字以内
2. 要喜庆、吉祥
3. 适合马年新年`;

        if (touristProfile) {
            prompt += `\n4. 符合游客特点：${touristProfile.name} - ${touristProfile.systemPrompt}`;
        }

        prompt += `\n\n【回复格式】
返回JSON：{"blessing": "祝福语"}`;

        try {
            const data = await this.callLLM(
                [{ role: 'user', content: prompt }],
                { temperature: 1.0, max_tokens: 50 }
            );

            const content = data.choices[0].message.content;
            
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return parsed.blessing || this.getDefaultBlessing(type);
            }
            return this.getDefaultBlessing(type);
        } catch (error) {
            console.error('[AIService] generateBlessingText error:', error.message);
            return this.getDefaultBlessing(type);
        }
    }

    async generateKongmingBlessing() {
        // 优先使用缓存的祝福语
        if (AIService.kongmingBlessingCache.length > 0) {
            const blessing = AIService.kongmingBlessingCache[Math.floor(Math.random() * AIService.kongmingBlessingCache.length)];
            console.log('[AIService] Using cached kongming blessing:', blessing);
            return blessing;
        }

        console.log('[AIService] Cache empty, using default kongming blessing');
        return this.getDefaultKongmingBlessing();
    }

    getDefaultKongmingBlessing() {
        const blessings = [
            '马年大吉',
            '代码无BUG',
            '永不加班',
            '年终翻倍',
            '一次过审',
            '需求不改',
            '马到成功',
            '心想事成'
        ];
        return blessings[Math.floor(Math.random() * blessings.length)];
    }

    getDefaultBlessing(type) {
        const blessings = [
            '马年大吉',
            '万事如意',
            '心想事成',
            '马到成功',
            '新年快乐',
            '龙马精神'
        ];
        return blessings[Math.floor(Math.random() * blessings.length)];
    }

    async generateTouristName() {
        const prompt = `生成一个中国风格的游客昵称。

【要求】
1. 昵称2-4个字
2. 可以是：小X、阿X、X哥/姐、或有趣的网名
3. 要有趣、接地气

【回复格式】
返回JSON：{"name": "昵称"}`;

        try {
            const data = await this.callLLM(
                [{ role: 'user', content: prompt }],
                { temperature: 1.2, max_tokens: 30 }
            );

            const content = data.choices[0].message.content;
            
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return parsed.name || '小游客';
            }
            return '小游客';
        } catch (error) {
            console.error('[AIService] generateTouristName error:', error.message);
            return '小游客';
        }
    }
}
