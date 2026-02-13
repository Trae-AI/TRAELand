// Copyright (c) 2026 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT
import Character from './Character.js';
import { GAME_CONFIG } from '../config.js';
import { MERCHANT_DATA } from '../data/MerchantData.js';

const NPC_STATE = {
    IDLE: 'idle',
    WALKING: 'walking'
};

export default class NPC extends Character {
    constructor(scene, x, y, texture, name, homeX, homeY, type = 'moving', isFollower = false) {
        const useAtlas = texture === 'doubao' || texture === 'trae';
        super(scene, x, y, texture, undefined, useAtlas, false);
        
        this.npcName = name;
        this.type = type;
        this.isFollower = isFollower;
        this.state = NPC_STATE.IDLE;
        this.stateTimer = 0;
        this.nextStateTime = 0;
        this.walkTarget = null;
        this.homeX = homeX !== undefined ? homeX : this.getTileX();
        this.homeY = homeY !== undefined ? homeY : this.getTileY();
        this.maxDistanceFromHome = 8;
        this.shouldGoHome = false;
        this.lastHomeTime = 0;
        this.homeInterval = 60000;
        
        this.isInteracting = false;
        this.interactingPlayer = null;
        this.interactionQueue = [];
        
        const merchantData = MERCHANT_DATA[this.npcName];
        if (merchantData) {
            this.product = merchantData.product;
            this.price = merchantData.price;
        } else {
            this.product = null;
            this.price = 0;
        }
        
        this.setCharacterName(this.npcName);
        this.setNameColor('#ffffff');
        
        this.setupStateMachine();
    }
    
    setupStateMachine() {
        this.scheduleNextState();
    }

    scheduleNextState() {
        if (this.type === 'pinned') {
            this.nextStateTime = this.scene.time.now + 1000;
        } else {
            const minTime = 2000;
            const maxTime = 5000;
            this.nextStateTime = this.scene.time.now + Phaser.Math.Between(minTime, maxTime);
        }
    }

    update(time, delta) {
        if (!this.scene) {
            return;
        }
        
        super.update(time, delta);
        
        this.stateTimer = time;
        
        if (this.isFollower) {
            this.followPlayer();
        } else if (this.type !== 'pinned') {
            if (this.stateTimer >= this.nextStateTime) {
                this.transitionState();
            }
        }
    }
    
    followPlayer() {
        if (!this.scene || !this.scene.player) return;
        
        const player = this.scene.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const followDistance = 100;
        const stopDistance = 60;
        
        if (distance > followDistance) {
            const targetTileX = player.getTileX();
            const targetTileY = player.getTileY();
            
            const offsets = [
                { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
                { x: 1, y: 1 }, { x: -1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: -1 }
            ];
            
            let foundTarget = false;
            for (const offset of offsets) {
                const testX = targetTileX + offset.x;
                const testY = targetTileY + offset.y;
                if (this.scene.isWalkable(testX, testY)) {
                    if (!this.path || this.path.length === 0) {
                        this.setPathTo(testX, testY);
                    }
                    foundTarget = true;
                    break;
                }
            }
            
            if (!foundTarget && (!this.path || this.path.length === 0)) {
                this.setPathTo(targetTileX, targetTileY);
            }
        } else if (distance < stopDistance) {
            this.clearPath();
        }
    }

    transitionState() {
        switch (this.state) {
            case NPC_STATE.IDLE:
                this.chooseNextStateFromIdle();
                break;
            case NPC_STATE.WALKING:
                this.chooseNextStateFromWalking();
                break;
        }
        
        this.scheduleNextState();
    }

    chooseNextStateFromIdle() {
        if (this.type !== 'pinned') {
            const rand = Math.random();
            if (rand < 0.6) {
                this.startWalking();
            }
        }
    }

    chooseNextStateFromWalking() {
        if (this.type !== 'pinned') {
            const rand = Math.random();
            if (rand < 0.5) {
                this.stopWalking();
            } else {
                this.continueWalking();
            }
        }
    }

    startWalking() {
        this.state = NPC_STATE.WALKING;
        this.findRandomWalkTarget();
    }

    findRandomWalkTarget() {
        const currentTile = this.getTilePosition();
        const currentTime = this.scene.time.now;
        
        if (currentTime - this.lastHomeTime >= this.homeInterval) {
            this.shouldGoHome = true;
            this.lastHomeTime = currentTime;
        }
        
        const distanceFromHome = Math.sqrt(
            Math.pow(currentTile.x - this.homeX, 2) + 
            Math.pow(currentTile.y - this.homeY, 2)
        );
        
        if (distanceFromHome > this.maxDistanceFromHome) {
            this.shouldGoHome = true;
        }
        
        if (this.shouldGoHome) {
            if (this.scene.isWalkable(this.homeX, this.homeY)) {
                this.setPathTo(this.homeX, this.homeY);
                this.walkTarget = { x: this.homeX, y: this.homeY };
                this.shouldGoHome = false;
                return;
            }
        }
        
        const maxDistance = Math.min(6, this.maxDistanceFromHome - distanceFromHome);
        const minDistance = 2;
        
        let attempts = 0;
        const maxAttempts = 50;
        
        while (attempts < maxAttempts) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Phaser.Math.Between(minDistance, Math.max(minDistance + 1, maxDistance));
            const targetX = Math.floor(currentTile.x + Math.cos(angle) * distance);
            const targetY = Math.floor(currentTile.y + Math.sin(angle) * distance);
            
            const targetDistanceFromHome = Math.sqrt(
                Math.pow(targetX - this.homeX, 2) + 
                Math.pow(targetY - this.homeY, 2)
            );
            
            if (targetDistanceFromHome <= this.maxDistanceFromHome && this.scene.isWalkable(targetX, targetY)) {
                this.setPathTo(targetX, targetY);
                this.walkTarget = { x: targetX, y: targetY };
                return;
            }
            
            attempts++;
        }
    }

    continueWalking() {
        if (this.path && this.path.length > 0) {
            return;
        }
        this.findRandomWalkTarget();
    }

    stopWalking() {
        this.state = NPC_STATE.IDLE;
        this.clearPath();
        this.walkTarget = null;
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
    }
    
    endInteraction() {
        this.isInteracting = false;
        this.interactingPlayer = null;
        
        if (this.interactionQueue.length > 0) {
            const nextPlayer = this.interactionQueue.shift();
            if (nextPlayer.autoSpendingManager) {
                nextPlayer.autoSpendingManager.onNPCAvailable(this);
            }
        }
    }
    
    destroy() {
        super.destroy();
    }
}
