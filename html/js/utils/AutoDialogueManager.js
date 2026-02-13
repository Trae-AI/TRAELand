// Copyright (c) 2026 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT
import { MERCHANT_DATA } from '../data/MerchantData.js';

export default class AutoDialogueManager {
    constructor(scene, diaryManager = null) {
        this.scene = scene;
        this.diaryManager = diaryManager;
        this.isActive = false;
        this.currentNPC = null;
        this.currentPlayer = null;
        this.currentStep = 0;
        this.dialogueSteps = [];
        this.onComplete = null;
        this.npcBubble = null;
        this.npcBubbleBg = null;
        this.playerBubble = null;
        this.playerBubbleBg = null;
        this.npcLineCount = 1;
        this.playerLineCount = 1;
    }

    startDialogue(npc, player, onComplete) {
        if (this.isActive) return;
        
        this.isActive = true;
        this.currentNPC = npc;
        this.currentPlayer = player;
        this.currentStep = 0;
        this.onComplete = onComplete;
        
        const merchantData = MERCHANT_DATA[npc.npcName];
        if (!merchantData) {
            this.endDialogue();
            return;
        }
        
        this.dialogueSteps = {
            npc: merchantData.dialogues.npc,
            player: merchantData.dialogues.player
        };
        
        this.showCurrentDialogue();
    }

    showCurrentDialogue() {
        if (this.currentStep >= this.dialogueSteps.npc.length) {
            this.endDialogue();
            return;
        }
        
        const npcText = this.dialogueSteps.npc[this.currentStep];
        const playerText = this.dialogueSteps.player[this.currentStep];
        
        this.showBubble(npcText, 'npc');
        
        this.scene.time.delayedCall(1500, () => {
            this.showBubble(playerText, 'player');
            
            this.scene.time.delayedCall(1500, () => {
                this.currentStep++;
                this.showCurrentDialogue();
            }, [], this);
        }, [], this);
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

    endDialogue() {

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
        this.currentNPC = null;
        this.currentPlayer = null;
        this.currentStep = 0;
        this.dialogueSteps = [];
        
        if (this.onComplete) {
            this.onComplete();
            this.onComplete = null;
        }
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
}
