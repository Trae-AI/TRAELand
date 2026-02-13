// Copyright (c) 2026 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT
import AIDialogueManager from './AIDialogueManager.js';
import AIService from './AIService.js';
import { GAME_CONFIG } from '../config.js';
import { MERCHANT_DATA } from '../data/MerchantData.js';
import { getRandomTouristProfile } from '../data/NPCProfilesRe.js';

const KONGMING_TEXTS = [
    '还没开始么？',
    '再等等，再等等……',
    '孔明灯真漂亮啊！',
    '2026码上有钱！',
    '人还真多！',
    '别挤我，往那边站站',
    '听说还能放孔明灯？',
    '下次一定带个小板凳来。',
    '我等的花都谢了',
    '你等多久了？',
    '快四十分钟了。'
];

export default class AutoSpendingManager {
    constructor(scene, player, diaryManager = null) {
        this.scene = scene;
        this.player = player;
        this.diaryManager = diaryManager;
        // this.money = 150;
        this.money = 100;
        this.visitedNPCs = new Set();
        this.isActive = false;
        this.currentNPC = null;
        this.dialogueManager = null;
        this.aiService = new AIService();
        this.touristProfile = null;
        this.onMoneyChange = null;
        this.isReturningHome = false;
        this.hasReturnedHome = false;
        this.homeTileX = 33;
        this.homeTileY = 14;
        this.isWaitingInQueue = false;
        this.queuedNPC = null;
        this.isDecidingNextNPC = false;
        this.homeBubble = null;
        this.homeBubbleBg = null;
        this.homeBubbleTimer = null;
        this.homeBubbleLineCount = 1;
        
        this.player.autoSpendingManager = this;
    }

    async start() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.dialogueManager = new AIDialogueManager(this.scene, this.diaryManager);
        this.touristProfile = getRandomTouristProfile();
        
        console.log(`[AutoSpendingManager] Player ${this.player.playerId} is a ${this.touristProfile.name}`);
        
        this.updateMoneyDisplay();
        await this.decideNextNPC();
    }

    async decideNextNPC() {
        if (!this.isActive || this.isDecidingNextNPC) return;
        
        this.isDecidingNextNPC = true;
        
        const availableNPCs = this.scene.npcs.filter(npc => {
            return npc.type === 'pinned' && 
                   npc.price > 0 && 
                   npc.price <= this.money && 
                   !this.visitedNPCs.has(npc.npcName);
        });
        
        if (availableNPCs.length === 0) {
            this.isDecidingNextNPC = false;
            this.endSpending();
            return;
        }
        
        if (this.player.playerName === 'TRAE宝' && this.visitedNPCs.size === 0) {
            const baozhuQin = availableNPCs.find(npc => npc.npcName === '爆竹秦');
            if (baozhuQin) {
                this.currentNPC = baozhuQin;
                console.log(`[AutoSpendingManager] Player TRAE宝 first time, chose: 爆竹秦`);
                this.isDecidingNextNPC = false;
                
                if (this.currentNPC.isInteracting) {
                    this.currentNPC.addToQueue(this.player);
                    this.isWaitingInQueue = true;
                    this.queuedNPC = this.currentNPC;
                    this.moveToQueuePosition(this.currentNPC);
                } else {
                    this.moveToNPC(this.currentNPC);
                }
                return;
            }
        }
        
        const npcsByQueue = availableNPCs.map(npc => {
            const queueLen = (npc.isInteracting ? 1 : 0) + (npc.interactionQueue ? npc.interactionQueue.length : 0);
            return { npc, queueLen };
        }).sort((a, b) => a.queueLen - b.queueLen);
        
        const minQueueLen = npcsByQueue[0].queueLen;
        const leastBusyNPCs = npcsByQueue.filter(item => item.queueLen === minQueueLen);
        
        if (minQueueLen === 0) {
            const randomIndex = Math.floor(Math.random() * leastBusyNPCs.length);
            this.currentNPC = leastBusyNPCs[randomIndex].npc;
            console.log(`[AutoSpendingManager] Player ${this.player.playerId} chose idle NPC: ${this.currentNPC.npcName}`);
        } else {
            try {
                const decision = await this.aiService.generateTouristDecision(
                    this.touristProfile,
                    this.money,
                    availableNPCs,
                    this.visitedNPCs
                );
                
                if (decision && decision.npc) {
                    this.currentNPC = decision.npc;
                    console.log(`[AutoSpendingManager] Player ${this.player.playerId} (LLM) decided: ${decision.npc.npcName} - ${decision.reason}`);
                } else {
                    const randomIndex = Math.floor(Math.random() * leastBusyNPCs.length);
                    this.currentNPC = leastBusyNPCs[randomIndex].npc;
                }
            } catch (error) {
                console.error('[AutoSpendingManager] LLM error, fallback to random:', error);
                const randomIndex = Math.floor(Math.random() * leastBusyNPCs.length);
                this.currentNPC = leastBusyNPCs[randomIndex].npc;
            }
        }
        
        this.isDecidingNextNPC = false;
        
        if (this.currentNPC.isInteracting) {
            this.currentNPC.addToQueue(this.player);
            this.isWaitingInQueue = true;
            this.queuedNPC = this.currentNPC;
            this.moveToQueuePosition(this.currentNPC);
        } else {
            this.moveToNPC(this.currentNPC);
        }
    }
    
    moveToQueuePosition(npc) {
        const queuePosition = npc.getQueuePosition(this.player);
        const offsetDistance = 100 + queuePosition * 80;
        
        const angle = Phaser.Math.Angle.Between(npc.x, npc.y, this.player.x, this.player.y);
        const targetX = npc.x + Math.cos(angle) * offsetDistance;
        const targetY = npc.y + Math.sin(angle) * offsetDistance;
        
        const targetTileX = Math.floor(targetX / GAME_CONFIG.TILE_SIZE);
        const targetTileY = Math.floor(targetY / GAME_CONFIG.TILE_SIZE);
        
        if (this.scene.isWalkable(targetTileX, targetTileY)) {
            const pathFound = this.player.setPathTo(targetTileX, targetTileY);
            if (pathFound) {
                this.player.showTargetMarker(
                    targetTileX * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2,
                    targetTileY * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2
                );
            }
        }
    }
    
    onNPCAvailable(npc) {
        if (this.isWaitingInQueue && this.queuedNPC === npc) {
            this.isWaitingInQueue = false;
            this.queuedNPC = null;
            this.currentNPC = npc;
            this.moveToNPC(npc);
        }
    }

    moveToNPC(npc) {
        const tileX = Math.floor(npc.x / GAME_CONFIG.TILE_SIZE);
        const tileY = Math.floor(npc.y / GAME_CONFIG.TILE_SIZE);
        
        let targetTileX = tileX;
        let targetTileY = tileY + 2;
        
        if (!this.scene.isWalkable(targetTileX, targetTileY)) {
            targetTileY = tileY - 2;
            if (!this.scene.isWalkable(targetTileX, targetTileY)) {
                targetTileX = tileX - 2;
                targetTileY = tileY;
                if (!this.scene.isWalkable(targetTileX, targetTileY)) {
                    targetTileX = tileX + 2;
                    targetTileY = tileY;
                    if (!this.scene.isWalkable(targetTileX, targetTileY)) {
                        targetTileX = tileX;
                        targetTileY = tileY + 1;
                        if (!this.scene.isWalkable(targetTileX, targetTileY)) {
                            targetTileY = tileY - 1;
                        }
                    }
                }
            }
        }
        
        if (this.scene.isWalkable(targetTileX, targetTileY)) {
            const pathFound = this.player.setPathTo(targetTileX, targetTileY);
            if (pathFound) {
                this.player.showTargetMarker(
                    targetTileX * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2,
                    targetTileY * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2
                );
            }
        }
    }

    checkArrival() {
        if (!this.isActive) return;
        
        if (this.isWaitingInQueue && this.queuedNPC) {
            const queuePosition = this.queuedNPC.getQueuePosition(this.player);
            if (queuePosition === 0 && !this.queuedNPC.isInteracting) {
                this.onNPCAvailable(this.queuedNPC);
            }
            return;
        }
        
        if (!this.currentNPC) return;
        
        const distance = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            this.currentNPC.x, this.currentNPC.y
        );
        
        if (distance < 150) {
            this.startDialogue();
        }
    }

    async startDialogue() {
        if (!this.currentNPC) return;
        
        if (this.currentNPC.isInteracting && this.currentNPC.interactingPlayer !== this.player) {
            this.currentNPC.addToQueue(this.player);
            this.isWaitingInQueue = true;
            this.queuedNPC = this.currentNPC;
            this.currentNPC = null;
            this.moveToQueuePosition(this.queuedNPC);
            return;
        }
        
        this.currentNPC.startInteraction(this.player);
        
        await this.dialogueManager.startDialogue(
            this.currentNPC, 
            this.player, 
            this.touristProfile,
            (result) => {
                this.completePurchase(result);
            }
        );
    }
    
    completePurchase(result) {
        if (!this.currentNPC) return;
        
        const npcName = this.currentNPC.npcName;
        const merchantData = MERCHANT_DATA[npcName];
        
        console.log(`[AutoSpendingManager] completePurchase for ${npcName}, result:`, result);
        
        if (result && result.success) {
            const price = Math.round(result.price || (merchantData ? merchantData.price : 0));
            this.money -= price;
            this.money = Math.round(this.money);
            this.visitedNPCs.add(npcName);
            this.updateMoneyDisplay();
            
            console.log(`[AutoSpendingManager] Player ${this.player.playerId} bought from ${npcName}, price: ${price}, remaining: ${this.money}`);
            
            if (this.diaryManager) {
                const action = merchantData ? `购买了${merchantData.product}` : '进行了消费';
                this.diaryManager.addSpendingEntry(
                    this.player.playerId,
                    npcName,
                    price,
                    action
                );
            }
            
            if (npcName === '爆竹秦' && this.scene.firework) {
                console.log(`[AutoSpendingManager] Triggering firework from 爆竹秦!`);
                this.launchFireworkWithAIBlessing();
            }
        } else {
            console.log(`[AutoSpendingManager] Player ${this.player.playerId} did not buy from ${npcName}`);
            this.visitedNPCs.add(npcName);
        }
        
        const finishedNPC = this.currentNPC;
        this.currentNPC = null;
        
        finishedNPC.endInteraction();
        
        this.scene.time.delayedCall(1000, () => {
            this.decideNextNPC();
        }, [], this);
    }
    
    async launchFireworkWithAIBlessing() {
        const fireworkTypes = [
            { type: 'horse', image: 'firework_horse' },
            { type: 'fish', image: 'firework_fish' },
            { type: '2026', image: 'firework_2026' }
        ];
        const selected = fireworkTypes[Phaser.Math.Between(0, fireworkTypes.length - 1)];
        
        try {
            console.log(`[AutoSpendingManager] Generating ${selected.type} firework blessing...`);
            const blessing = await this.aiService.generateFireworkBlessing(selected.type, this.touristProfile);
            console.log(`[AutoSpendingManager] Firework blessing: ${blessing}`);
            this.scene.firework.enqueue(blessing, selected.image);
        } catch (error) {
            console.error('[AutoSpendingManager] Error generating firework blessing:', error);
            const defaultBlessing = this.aiService.getDefaultFireworkBlessing(selected.type);
            this.scene.firework.enqueue(defaultBlessing, selected.image);
        }
    }

    updateMoneyDisplay() {
        if (this.onMoneyChange) {
            this.onMoneyChange(this.money);
        }
    }

    endSpending() {
        this.isActive = false;
        this.currentNPC = null;
        
        if (this.isWaitingInQueue && this.queuedNPC) {
            this.queuedNPC.removeFromQueue(this.player);
            this.isWaitingInQueue = false;
            this.queuedNPC = null;
        }
        
        this.isReturningHome = true;
        console.log('消费结束！剩余金额：', this.money);
        
        this.returnHome();
    }
    
    returnHome() {
        let targetTileX = this.homeTileX;
        let targetTileY = this.homeTileY;
        
        const offsetX = Math.floor(Math.random() * 5) - 2;
        const offsetY = Math.floor(Math.random() * 5) - 2;
        
        targetTileX += offsetX;
        targetTileY += offsetY;
        
        if (!this.scene.isWalkable(targetTileX, targetTileY)) {
            targetTileX = this.homeTileX;
            targetTileY = this.homeTileY;
        }
        
        if (this.scene.isWalkable(targetTileX, targetTileY)) {
            const pathFound = this.player.setPathTo(targetTileX, targetTileY);
            if (pathFound) {
                this.player.showTargetMarker(
                    targetTileX * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2,
                    targetTileY * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2
                );
            }
        }
    }
    
    checkArrivalHome() {
        if (!this.isReturningHome || this.hasReturnedHome) return;
        
        const distance = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            this.homeTileX * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2,
            this.homeTileY * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2
        );
        
        if (distance < 100 && !this.player.isMoving) {
            this.hasReturnedHome = true;
            this.isReturningHome = false;
            
            if (this.scene.onPlayerReturnedHome) {
                this.scene.onPlayerReturnedHome(this.player.playerId);
            }
            
            this.startHomeBubbles();
        }
    }

    startHomeBubbles() {
        this.showRandomKongmingBubble();
        
        this.homeBubbleTimer = this.scene.time.addEvent({
            delay: 8000 + Math.random() * 7000,
            callback: this.showRandomKongmingBubble,
            callbackScope: this,
            loop: true
        });
    }

    showRandomKongmingBubble() {
        if (this.homeBubble) {
            this.homeBubble.destroy();
        }
        if (this.homeBubbleBg) {
            this.homeBubbleBg.destroy();
        }
        
        const randomIndex = Math.floor(Math.random() * KONGMING_TEXTS.length);
        const text = KONGMING_TEXTS[randomIndex];
        
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
        
        this.homeBubbleLineCount = estimatedLines;
        
        this.homeBubble = this.scene.add.text(
            this.player.x,
            this.player.y - totalOffset,
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
        this.homeBubble.setOrigin(0.5, 1);
        this.homeBubble.setDepth(10001);
        
        const bounds = this.homeBubble.getBounds();
        const bgWidth = bounds.width + paddingX * 2;
        const bgHeight = bounds.height + paddingY * 2;
        const bgX = this.player.x;
        const bgY = this.player.y - totalOffset - bounds.height / 2;
        
        this.homeBubbleBg = this.scene.add.graphics();
        this.homeBubbleBg.fillStyle(0x4a90d9, 0.95);
        this.homeBubbleBg.fillRoundedRect(bgX - bgWidth / 2, bgY - bgHeight / 2, bgWidth, bgHeight, borderRadius);
        this.homeBubbleBg.lineStyle(2, 0x1a4070, 1);
        this.homeBubbleBg.strokeRoundedRect(bgX - bgWidth / 2, bgY - bgHeight / 2, bgWidth, bgHeight, borderRadius);
        this.homeBubbleBg.setDepth(10000);
        
        this.scene.time.delayedCall(2500, () => {
            if (this.homeBubble) {
                this.homeBubble.destroy();
                this.homeBubble = null;
            }
            if (this.homeBubbleBg) {
                this.homeBubbleBg.destroy();
                this.homeBubbleBg = null;
            }
        }, [], this);
    }

    update(time, delta) {
        if (this.isActive) {
            this.checkArrival();
            
            if (this.dialogueManager) {
                this.dialogueManager.update();
            }
        }
        
        if (this.isReturningHome) {
            this.checkArrivalHome();
        }
        
        if (this.homeBubble && this.homeBubbleBg) {
            const lineHeight = 20;
            const baseOffset = 70;
            const paddingX = 12;
            const paddingY = 8;
            const extraOffset = (this.homeBubbleLineCount - 1) * lineHeight;
            const totalOffset = baseOffset + extraOffset;
            
            this.homeBubble.setPosition(this.player.x, this.player.y - totalOffset);
            
            const bounds = this.homeBubble.getBounds();
            const bgWidth = bounds.width + paddingX * 2;
            const bgHeight = bounds.height + paddingY * 2;
            const bgX = this.player.x;
            const bgY = this.player.y - totalOffset - bounds.height / 2;
            
            this.homeBubbleBg.clear();
            this.homeBubbleBg.fillStyle(0x4a90d9, 0.95);
            this.homeBubbleBg.fillRoundedRect(bgX - bgWidth / 2, bgY - bgHeight / 2, bgWidth, bgHeight, 10);
            this.homeBubbleBg.lineStyle(2, 0x1a4070, 1);
            this.homeBubbleBg.strokeRoundedRect(bgX - bgWidth / 2, bgY - bgHeight / 2, bgWidth, bgHeight, 10);
        }
    }

    destroy() {
        if (this.homeBubble) {
            this.homeBubble.destroy();
            this.homeBubble = null;
        }
        if (this.homeBubbleBg) {
            this.homeBubbleBg.destroy();
            this.homeBubbleBg = null;
        }
        if (this.homeBubbleTimer) {
            this.homeBubbleTimer.remove();
            this.homeBubbleTimer = null;
        }
    }
    
    getTouristProfile() {
        return this.touristProfile;
    }
}