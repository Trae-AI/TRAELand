// Copyright (c) 2026 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT
import { GAME_CONFIG } from '../config.js';
import { MERCHANT_DATA } from '../data/MerchantData.js';
import AIService from '../utils/AIService.js';

const ANIMATION_STATE = {
    IDLE: 'idle',
    SPECIAL: 'special'
};

export default class NPCWithSpritesheet extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, npcConfig, npcData) {
        const textureKey = npcData.filename;
        const hasTexture = scene.textures.exists(textureKey);
        
        if (!hasTexture) {
            console.error(`[NPCWithSpritesheet] Texture not found: ${textureKey}, using placeholder`);
        }
        
        super(scene, x, y, hasTexture ? textureKey : null);
        
        this.scene = scene;
        this.npcConfig = npcConfig;
        this.npcData = npcData;
        this.textureKey = textureKey;
        this.hasValidTexture = hasTexture;
        
        this.animationState = ANIMATION_STATE.IDLE;
        this.specialTimer = 0;
        this.nextSpecialTime = 0;
        this.scheduleNextSpecial();
        
        this.npcName = npcData.name;
        this.type = npcData.type;
        this.homeX = npcData.position.x;
        this.homeY = npcData.position.y;
        
        const merchantData = MERCHANT_DATA[this.npcName];
        if (merchantData) {
            this.product = merchantData.product;
            this.price = merchantData.price;
        } else {
            this.product = null;
            this.price = 0;
        }
        
        this.path = [];
        this.pathIndex = 0;
        this.speed = GAME_CONFIG.PLAYER_SPEED;
        this.isMoving = false;
        this.targetX = x;
        this.targetY = y;
        this.nameText = null;
        this.shadow = null;
        
        this.isInteracting = false;
        this.interactingPlayer = null;
        this.interactionQueue = [];
        
        this.aiService = new AIService();
        this.hawkingBubble = null;
        this.hawkingBubbleBg = null;
        this.nextHawkingTime = 0;
        this.isGeneratingHawking = false;
        this.scheduleNextHawking();
        
        const frameConfig = npcConfig.frame;
        this.setOrigin(frameConfig.anchor.x, frameConfig.anchor.y);
        this.scene.add.existing(this);
        
        if (!this.hasValidTexture) {
            this.createPlaceholderTexture();
        }
        
        this.createShadow();
        this.createAnimations();
        this.createNameText();
        
        this.playIdleAnimation();
    }
    
    createPlaceholderTexture() {
        const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
        const size = this.npcConfig.frame.width;
        
        graphics.fillStyle(0x888888, 1);
        graphics.fillRect(0, 0, size, size);
        
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(size * 0.25, size * 0.25, size * 0.5, size * 0.5);
        
        graphics.fillStyle(0xff0000, 1);
        graphics.fillRect(size * 0.35, size * 0.35, size * 0.1, size * 0.1);
        graphics.fillRect(size * 0.55, size * 0.35, size * 0.1, size * 0.1);
        
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(size * 0.3, size * 0.6, size * 0.4, size * 0.1);
        
        const textureKey = `placeholder-${this.textureKey}`;
        graphics.generateTexture(textureKey, size, size);
        graphics.destroy();
        
        this.setTexture(textureKey);
    }
    
    createShadow() {
        const shadowWidth = 40;
        const shadowHeight = 20;
        
        this.shadow = this.scene.add.ellipse(this.x, this.y + 17, shadowWidth, shadowHeight, 0x000000, 0.3);
        this.shadow.setOrigin(0.5, 0.5);
        this.shadow.setDepth(0);
    }
    
    createNameText() {
        const offsetY = -60;
        this.nameText = this.scene.add.text(this.x, this.y + offsetY, this.npcName, {
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            padding: {
                left: 8,
                right: 8,
                top: 4,
                bottom: 4
            }
        });
        this.nameText.setOrigin(0.5, 1);
        this.nameText.setDepth(1000);
    }
    
    createAnimations() {
        if (!this.hasValidTexture) {
            return;
        }
        
        const animConfig = this.npcConfig.animation;
        
        if (!this.scene.anims.exists(`${this.textureKey}-idle`)) {
            this.scene.anims.create({
                key: `${this.textureKey}-idle`,
                frames: this.scene.anims.generateFrameNames(this.textureKey, {
                    prefix: 'idle.',
                    start: 0,
                    end: animConfig.idle.frames - 1,
                    zeroPad: 3
                }),
                frameRate: animConfig.idle.fps,
                repeat: animConfig.idle.loop ? -1 : 0
            });
        }
        
        if (!this.scene.anims.exists(`${this.textureKey}-special`)) {
            this.scene.anims.create({
                key: `${this.textureKey}-special`,
                frames: this.scene.anims.generateFrameNames(this.textureKey, {
                    prefix: 'special.',
                    start: 0,
                    end: animConfig.special.frames - 1,
                    zeroPad: 3
                }),
                frameRate: animConfig.special.fps,
                repeat: animConfig.special.loop ? -1 : 0
            });
        }
        
        this.on('animationcomplete', this.onAnimationComplete, this);
    }
    
    scheduleNextSpecial() {
        const minDelay = 5000;
        const maxDelay = 20000;
        this.nextSpecialTime = this.scene.time.now + Phaser.Math.Between(minDelay, maxDelay);
    }
    
    scheduleNextHawking() {
        const minDelay = 8000;
        const maxDelay = 20000;
        this.nextHawkingTime = this.scene.time.now + Phaser.Math.Between(minDelay, maxDelay);
    }
    
    playIdleAnimation() {
        this.animationState = ANIMATION_STATE.IDLE;
        if (this.hasValidTexture) {
            this.anims.play(`${this.textureKey}-idle`, true);
        }
    }
    
    playSpecialAnimation() {
        this.animationState = ANIMATION_STATE.SPECIAL;
        if (this.hasValidTexture) {
            this.anims.play(`${this.textureKey}-special`, true);
        }
    }
    
    onAnimationComplete(animation, frame) {
        if (animation.key === `${this.textureKey}-special`) {
            this.playIdleAnimation();
            this.scheduleNextSpecial();
        }
    }
    
    hasNearbyPlayers() {
        if (!this.scene || !this.scene.players) return false;
        
        const detectionRadius = 200;
        
        for (const player of this.scene.players) {
            const distance = Phaser.Math.Distance.Between(
                this.x, this.y,
                player.x, player.y
            );
            if (distance < detectionRadius) {
                return true;
            }
        }
        return false;
    }
    
    async generateAndShowHawking() {
        if (this.isGeneratingHawking || this.isInteracting) return;
        
        this.isGeneratingHawking = true;
        
        try {
            const hawkingText = await this.aiService.generateHawkingText(this.npcName);
            this.showHawkingBubble(hawkingText);
        } catch (error) {
            console.error(`[NPCWithSpritesheet] Error generating hawking for ${this.npcName}:`, error);
            const defaultText = this.product ? 
                `来看看${this.product}啦！` : 
                '快来看看啦！';
            this.showHawkingBubble(defaultText);
        }
        
        this.isGeneratingHawking = false;
        this.scheduleNextHawking();
    }
    
    showHawkingBubble(text) {
        if (this.hawkingBubble) {
            this.hawkingBubble.destroy();
        }
        if (this.hawkingBubbleBg) {
            this.hawkingBubbleBg.destroy();
        }
        
        const charWidth = 10;
        const maxCharsPerLine = 25;
        const wordWrapWidth = maxCharsPerLine * charWidth;
        const paddingX = 12;
        const paddingY = 8;
        const borderRadius = 10;
        const baseOffset = 70;
        
        this.hawkingBubble = this.scene.add.text(
            this.x,
            this.y - baseOffset,
            text,
            {
                fontSize: '16px',
                color: '#ffffff',
                fontFamily: 'Microsoft YaHei, sans-serif',
                fontStyle: 'normal',
                letterSpacing: 2,
                padding: { left: paddingX, right: paddingX, top: paddingY, bottom: paddingY },
                align: 'center',
                wordWrap: { width: wordWrapWidth, useAdvancedWrap: true },
                stroke: '#000000',
                strokeThickness: 3,
                shadow: null
            }
        );
        this.hawkingBubble.setOrigin(0.5, 1);
        this.hawkingBubble.setDepth(9999);
        
        const bounds = this.hawkingBubble.getBounds();
        const bgWidth = bounds.width + paddingX * 2;
        const bgHeight = bounds.height + paddingY * 2;
        const bgX = this.x;
        const bgY = this.y - baseOffset - bounds.height / 2;
        
        this.hawkingBubbleBg = this.scene.add.graphics();
        this.hawkingBubbleBg.fillStyle(0xe74c3c, 0.95);
        this.hawkingBubbleBg.fillRoundedRect(bgX - bgWidth / 2, bgY - bgHeight / 2, bgWidth, bgHeight, borderRadius);
        this.hawkingBubbleBg.lineStyle(2, 0x802010, 1);
        this.hawkingBubbleBg.strokeRoundedRect(bgX - bgWidth / 2, bgY - bgHeight / 2, bgWidth, bgHeight, borderRadius);
        this.hawkingBubbleBg.setDepth(9998);
        
        this.scene.time.delayedCall(4000, () => {
            if (this.hawkingBubble) {
                this.hawkingBubble.destroy();
                this.hawkingBubble = null;
            }
            if (this.hawkingBubbleBg) {
                this.hawkingBubbleBg.destroy();
                this.hawkingBubbleBg = null;
            }
        });
    }
    
    setPath(path) {
        this.path = path;
        this.pathIndex = 0;
        this.isMoving = path.length > 0;
        
        if (this.isMoving) {
            this.moveToNextPoint();
        }
    }
    
    moveToNextPoint() {
        if (this.pathIndex >= this.path.length) {
            this.stopMoving();
            return;
        }
        
        const point = this.path[this.pathIndex];
        this.targetX = point.x * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
        this.targetY = point.y * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
    }
    
    stopMoving() {
        this.isMoving = false;
        this.path = [];
        this.pathIndex = 0;
    }
    
    setPathTo(tileX, tileY) {
        const path = this.scene.findPath(this.getTileX(), this.getTileY(), tileX, tileY);
        if (path && path.length > 0) {
            this.setPath(path);
            return true;
        }
        return false;
    }
    
    clearPath() {
        this.stopMoving();
    }
    
    getTileX() {
        return Math.floor(this.x / GAME_CONFIG.TILE_SIZE);
    }
    
    getTileY() {
        return Math.floor(this.y / GAME_CONFIG.TILE_SIZE);
    }
    
    getTilePosition() {
        return {
            x: this.getTileX(),
            y: this.getTileY()
        };
    }
    
    update(time, delta) {
        if (this.animationState === ANIMATION_STATE.IDLE && time >= this.nextSpecialTime) {
            this.playSpecialAnimation();
        }
        
        if (!this.isInteracting && 
            !this.isGeneratingHawking && 
            time >= this.nextHawkingTime && 
            !this.hasNearbyPlayers() &&
            this.price > 0) {
            this.generateAndShowHawking();
        }
        
        if (this.isMoving && this.path.length > 0) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 2) {
                this.x = this.targetX;
                this.y = this.targetY;
                this.pathIndex++;
                this.moveToNextPoint();
            } else {
                const normalizedDx = dx / distance;
                const normalizedDy = dy / distance;
                const moveDistance = this.speed * (delta / 1000);
                this.x += normalizedDx * moveDistance;
                this.y += normalizedDy * moveDistance;
            }
        }
        
        if (this.nameText) {
            const offsetY = -60;
            this.nameText.setPosition(this.x, this.y + offsetY);
        }
        
        if (this.shadow) {
            this.shadow.setPosition(this.x, this.y + 17);
        }
        
        if (this.hawkingBubble && this.hawkingBubbleBg) {
            const paddingX = 12;
            const paddingY = 8;
            const baseOffset = 70;
            
            this.hawkingBubble.setPosition(this.x, this.y - baseOffset);
            
            const bounds = this.hawkingBubble.getBounds();
            const bgWidth = bounds.width + paddingX * 2;
            const bgHeight = bounds.height + paddingY * 2;
            const bgX = this.x;
            const bgY = this.y - baseOffset - bounds.height / 2;
            
            this.hawkingBubbleBg.clear();
            this.hawkingBubbleBg.fillStyle(0xe74c3c, 0.95);
            this.hawkingBubbleBg.fillRoundedRect(bgX - bgWidth / 2, bgY - bgHeight / 2, bgWidth, bgHeight, 10);
            this.hawkingBubbleBg.lineStyle(2, 0x802010, 1);
            this.hawkingBubbleBg.strokeRoundedRect(bgX - bgWidth / 2, bgY - bgHeight / 2, bgWidth, bgHeight, 10);
        }
    }
    
    addToQueue(player) {
        if (!this.isPlayerInQueue(player)) {
            this.interactionQueue.push(player);
        }
    }
    
    removeFromQueue(player) {
        const index = this.interactionQueue.indexOf(player);
        if (index !== -1) {
            this.interactionQueue.splice(index, 1);
        }
    }
    
    isPlayerInQueue(player) {
        return this.interactionQueue.includes(player);
    }
    
    getQueuePosition(player) {
        return this.interactionQueue.indexOf(player);
    }
    
    startInteraction(player) {
        this.isInteracting = true;
        this.interactingPlayer = player;
        
        if (this.hawkingBubble) {
            this.hawkingBubble.destroy();
            this.hawkingBubble = null;
        }
        if (this.hawkingBubbleBg) {
            this.hawkingBubbleBg.destroy();
            this.hawkingBubbleBg = null;
        }
    }
    
    endInteraction() {
        this.isInteracting = false;
        this.interactingPlayer = null;
        
        this.scheduleNextHawking();
        
        if (this.interactionQueue.length > 0) {
            const nextPlayer = this.interactionQueue.shift();
            if (nextPlayer.autoSpendingManager) {
                nextPlayer.autoSpendingManager.onNPCAvailable(this);
            }
        }
    }
    
    destroy() {
        if (this.nameText) {
            this.nameText.destroy();
            this.nameText = null;
        }
        if (this.shadow) {
            this.shadow.destroy();
            this.shadow = null;
        }
        if (this.hawkingBubble) {
            this.hawkingBubble.destroy();
            this.hawkingBubble = null;
        }
        if (this.hawkingBubbleBg) {
            this.hawkingBubbleBg.destroy();
            this.hawkingBubbleBg = null;
        }
        super.destroy();
    }
}
