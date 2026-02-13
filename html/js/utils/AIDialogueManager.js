// Copyright (c) 2026 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT
import AIService from './AIService.js';
import { MERCHANT_DATA } from '../data/MerchantData.js';
import { getRandomTouristProfile } from '../data/NPCProfilesRe.js';

export default class AIDialogueManager {
    constructor(scene, diaryManager = null) {
        this.scene = scene;
        this.diaryManager = diaryManager;
        this.aiService = new AIService();
        this.isActive = false;
        this.currentNPC = null;
        this.currentPlayer = null;
        this.currentTouristProfile = null;
        this.dialogueHistory = [];
        this.currentPrice = 0;
        this.dialogueRound = 0;
        this.maxRounds = 3;
        this.hasBargained = false;
        this.onComplete = null;
        this.npcBubble = null;
        this.npcBubbleBg = null;
        this.playerBubble = null;
        this.playerBubbleBg = null;
        this.isProcessing = false;
        this.purchaseResult = null;
        this.npcLineCount = 1;
        this.playerLineCount = 1;
    }

    async startDialogue(npc, player, touristProfile, onComplete) {
        if (this.isActive || this.isProcessing) return;
        
        this.isActive = true;
        this.isProcessing = true;
        this.currentNPC = npc;
        this.currentPlayer = player;
        this.currentTouristProfile = touristProfile || getRandomTouristProfile();
        this.dialogueHistory = [];
        this.dialogueRound = 0;
        this.hasBargained = false;
        this.onComplete = onComplete;
        this.purchaseResult = null;
        
        const merchantData = MERCHANT_DATA[npc.npcName];
        this.currentPrice = merchantData ? merchantData.price : 0;
        
        await this.runDialogueLoop();
    }

    async runDialogueLoop() {
        try {
            const npcResponse = await this.aiService.generateTradeDialogue(
                this.currentNPC.npcName,
                this.currentTouristProfile,
                this.currentPlayer.autoSpendingManager ? this.currentPlayer.autoSpendingManager.money : 50,
                this.dialogueHistory,
                this.dialogueRound === 0
            );
            
            this.showBubble(npcResponse.npcText, 'npc');
            this.dialogueHistory.push({ role: 'assistant', content: JSON.stringify(npcResponse) });
            
            if (npcResponse.finalPrice) {
                this.currentPrice = npcResponse.finalPrice;
            }
            
            await this.delay(2000);
            
            if (npcResponse.isEnd) {
                this.purchaseResult = {
                    success: npcResponse.canBuy !== false,
                    price: this.currentPrice
                };
                this.endDialogue();
                return;
            }
            
            this.dialogueRound++;
            
            if (this.dialogueRound >= this.maxRounds) {
                this.purchaseResult = { success: true, price: this.currentPrice };
                this.endDialogue();
                return;
            }
            
            const touristMoney = this.currentPlayer.autoSpendingManager ? 
                this.currentPlayer.autoSpendingManager.money : 50;
            
            const touristResponse = await this.aiService.generateTouristResponse(
                this.currentTouristProfile,
                this.currentNPC.npcName,
                npcResponse.npcText,
                touristMoney,
                this.currentPrice,
                this.hasBargained
            );
            
            this.showBubble(touristResponse.touristText, 'player');
            this.dialogueHistory.push({ role: 'user', content: touristResponse.touristText });
            
            await this.delay(2000);
            
            if (touristResponse.action === 'buy') {
                this.purchaseResult = { success: true, price: this.currentPrice };
                this.endDialogue();
                return;
            }
            
            if (touristResponse.action === 'leave') {
                this.purchaseResult = { success: false, price: 0 };
                this.endDialogue();
                return;
            }
            
            if (touristResponse.action === 'bargain') {
                if (this.hasBargained) {
                    this.purchaseResult = { success: true, price: this.currentPrice };
                    this.endDialogue();
                    return;
                }
                this.hasBargained = true;
            }
            
            await this.runDialogueLoop();
            
        } catch (error) {
            console.error('[AIDialogueManager] Error in dialogue loop:', error);
            this.purchaseResult = { success: true, price: this.currentPrice };
            this.endDialogue();
        }
    }

    showBubble(text, type) {
        const charWidth = 10;
        const maxCharsPerLine = 25;
        const wordWrapWidth = maxCharsPerLine * charWidth;
        const lineHeight = 20;
        const baseOffset = 70;
        const paddingX = 12;
        const paddingY = 8;
        const borderRadius = 10;
        
        const estimatedLines = Math.ceil(text.length / maxCharsPerLine);
        const extraOffset = (estimatedLines - 1) * lineHeight;
        const totalOffset = baseOffset + extraOffset;
        
        if (type === 'npc') {
            if (this.npcBubble) {
                this.npcBubble.destroy();
            }
            if (this.npcBubbleBg) {
                this.npcBubbleBg.destroy();
            }
            if (this.playerBubble) {
                this.playerBubble.destroy();
            }
            if (this.playerBubbleBg) {
                this.playerBubbleBg.destroy();
            }
            
            if (!this.currentNPC) return;
            
            this.npcLineCount = estimatedLines;
            
            const bubble = this.scene.add.text(
                this.currentNPC.x,
                this.currentNPC.y - totalOffset,
                text,
                {
                    fontSize: '16px',
                    color: '#ffffff',
                    fontFamily: 'Microsoft YaHei, sans-serif',
                    fontStyle: 'bold',
                    letterSpacing: 2,
                    padding: { left: paddingX, right: paddingX, top: paddingY, bottom: paddingY },
                    align: 'center',
                    wordWrap: { width: wordWrapWidth, useAdvancedWrap: true },
                    stroke: '#000000',
                    strokeThickness: 2,
                    shadow: {
                        offsetX: 2,
                        offsetY: 2,
                        color: 'rgba(0, 0, 0, 0.5)',
                        blur: 4,
                        stroke: true,
                        fill: true
                    }
                }
            );
            bubble.setOrigin(0.5, 1);
            bubble.setDepth(10001);
            
            const bounds = bubble.getBounds();
            const bgWidth = bounds.width + paddingX * 2;
            const bgHeight = bounds.height + paddingY * 2;
            const bgX = this.currentNPC.x;
            const bgY = this.currentNPC.y - totalOffset - bounds.height / 2;
            
            const bg = this.scene.add.graphics();
            bg.fillStyle(0xff6b6b, 0.95);
            bg.fillRoundedRect(bgX - bgWidth / 2, bgY - bgHeight / 2, bgWidth, bgHeight, borderRadius);
            bg.lineStyle(2, 0x992222, 1);
            bg.strokeRoundedRect(bgX - bgWidth / 2, bgY - bgHeight / 2, bgWidth, bgHeight, borderRadius);
            bg.setDepth(10000);
            
            this.npcBubble = bubble;
            this.npcBubbleBg = bg;
            
            if (this.diaryManager && this.currentNPC && this.currentPlayer) {
                this.diaryManager.addSingleDialogueLine(
                    this.currentPlayer.playerId,
                    this.currentNPC.npcName,
                    this.currentNPC.npcName,
                    text
                );
            }
        } else {
            if (this.npcBubble) {
                this.npcBubble.destroy();
            }
            if (this.npcBubbleBg) {
                this.npcBubbleBg.destroy();
            }
            if (this.playerBubble) {
                this.playerBubble.destroy();
            }
            if (this.playerBubbleBg) {
                this.playerBubbleBg.destroy();
            }
            
            if (!this.currentPlayer) return;
            
            this.playerLineCount = estimatedLines;
            
            const bubble = this.scene.add.text(
                this.currentPlayer.x,
                this.currentPlayer.y - totalOffset,
                text,
                {
                    fontSize: '16px',
                    color: '#ffffff',
                    fontFamily: 'Microsoft YaHei, sans-serif',
                    fontStyle: 'bold',
                    letterSpacing: 2,
                    padding: { left: paddingX, right: paddingX, top: paddingY, bottom: paddingY },
                    align: 'center',
                    wordWrap: { width: wordWrapWidth, useAdvancedWrap: true },
                    stroke: '#000000',
                    strokeThickness: 2,
                    shadow: {
                        offsetX: 2,
                        offsetY: 2,
                        color: 'rgba(0, 0, 0, 0.5)',
                        blur: 4,
                        stroke: true,
                        fill: true
                    }
                }
            );
            bubble.setOrigin(0.5, 1);
            bubble.setDepth(10001);
            
            const bounds = bubble.getBounds();
            const bgWidth = bounds.width + paddingX * 2;
            const bgHeight = bounds.height + paddingY * 2;
            const bgX = this.currentPlayer.x;
            const bgY = this.currentPlayer.y - totalOffset - bounds.height / 2;
            
            const bg = this.scene.add.graphics();
            bg.fillStyle(0x4a90d9, 0.95);
            bg.fillRoundedRect(bgX - bgWidth / 2, bgY - bgHeight / 2, bgWidth, bgHeight, borderRadius);
            bg.lineStyle(2, 0x1a4070, 1);
            bg.strokeRoundedRect(bgX - bgWidth / 2, bgY - bgHeight / 2, bgWidth, bgHeight, borderRadius);
            bg.setDepth(10000);
            
            this.playerBubble = bubble;
            this.playerBubbleBg = bg;
            
            if (this.diaryManager && this.currentNPC && this.currentPlayer) {
                this.diaryManager.addSingleDialogueLine(
                    this.currentPlayer.playerId,
                    this.currentNPC.npcName,
                    this.currentPlayer.playerName,
                    text
                );
            }
        }
    }

    delay(ms) {
        return new Promise(resolve => this.scene.time.delayedCall(ms, resolve));
    }

    endDialogue() {

        this.scene.time.delayedCall(1500, () => {
            if (this.npcBubble) {
                this.npcBubble.destroy();
                this.npcBubble = null;
            }
            if (this.npcBubbleBg) {
                this.npcBubbleBg.destroy();
                this.npcBubbleBg = null;
            }
            
            if (this.playerBubble) {
                this.playerBubble.destroy();
                this.playerBubble = null;
            }
            if (this.playerBubbleBg) {
                this.playerBubbleBg.destroy();
                this.playerBubbleBg = null;
            }
            
            this.isActive = false;
            this.isProcessing = false;
            this.currentNPC = null;
            this.currentPlayer = null;
            this.currentTouristProfile = null;
            this.dialogueHistory = [];
            this.dialogueRound = 0;
            
            if (this.onComplete) {
                this.onComplete(this.purchaseResult);
                this.onComplete = null;
            }
        });
    }

    update() {
        const lineHeight = 20;
        const baseOffset = 70;
        const paddingX = 12;
        const paddingY = 8;
        
        if (this.npcBubble && this.npcBubbleBg && this.currentNPC) {
            const extraOffset = (this.npcLineCount - 1) * lineHeight;
            const totalOffset = baseOffset + extraOffset;
            this.npcBubble.setPosition(this.currentNPC.x, this.currentNPC.y - totalOffset);
            
            const bounds = this.npcBubble.getBounds();
            const bgWidth = bounds.width + paddingX * 2;
            const bgHeight = bounds.height + paddingY * 2;
            const bgX = this.currentNPC.x;
            const bgY = this.currentNPC.y - totalOffset - bounds.height / 2;
            
            this.npcBubbleBg.clear();
            this.npcBubbleBg.fillStyle(0xff6b6b, 0.95);
            this.npcBubbleBg.fillRoundedRect(bgX - bgWidth / 2, bgY - bgHeight / 2, bgWidth, bgHeight, 10);
            this.npcBubbleBg.lineStyle(2, 0x992222, 1);
            this.npcBubbleBg.strokeRoundedRect(bgX - bgWidth / 2, bgY - bgHeight / 2, bgWidth, bgHeight, 10);
        }
        
        if (this.playerBubble && this.playerBubbleBg && this.currentPlayer) {
            const extraOffset = (this.playerLineCount - 1) * lineHeight;
            const totalOffset = baseOffset + extraOffset;
            this.playerBubble.setPosition(this.currentPlayer.x, this.currentPlayer.y - totalOffset);
            
            const bounds = this.playerBubble.getBounds();
            const bgWidth = bounds.width + paddingX * 2;
            const bgHeight = bounds.height + paddingY * 2;
            const bgX = this.currentPlayer.x;
            const bgY = this.currentPlayer.y - totalOffset - bounds.height / 2;
            
            this.playerBubbleBg.clear();
            this.playerBubbleBg.fillStyle(0x4a90d9, 0.95);
            this.playerBubbleBg.fillRoundedRect(bgX - bgWidth / 2, bgY - bgHeight / 2, bgWidth, bgHeight, 10);
            this.playerBubbleBg.lineStyle(2, 0x1a4070, 1);
            this.playerBubbleBg.strokeRoundedRect(bgX - bgWidth / 2, bgY - bgHeight / 2, bgWidth, bgHeight, 10);
        }
    }

    getPurchaseResult() {
        return this.purchaseResult;
    }
}