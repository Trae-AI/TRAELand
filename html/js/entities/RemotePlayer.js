// Copyright (c) 2026 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT
import Character from './Character.js';

export default class RemotePlayer extends Character {
    constructor(scene, x, y, playerId, nickname, tileX, tileY, texture) {
        const playerTexture = texture || 'doubao';
        super(scene, x, y, playerTexture, null, true, true);
        
        this.isPlayer = false;
        this.isRemote = true;
        this.playerId = playerId;
        this.nickname = nickname;
        this.targetX = x;
        this.targetY = y;
        this.targetTileX = tileX;
        this.targetTileY = tileY;
        this.remoteIsMoving = false;
        this.remoteDirection = 'down';
        this.path = [];
        this.currentPathIndex = 0;
        this.hasTarget = false;
        
        this.setCharacterName(nickname);
        this.setNameColor('#4a90d9');
        
        this.tileX = tileX;
        this.tileY = tileY;
    }

    updatePosition(x, y, tileX, tileY, direction, isMoving) {
        this.targetX = x;
        this.targetY = y;
        this.tileX = tileX;
        this.tileY = tileY;
        this.remoteIsMoving = isMoving;
        
        if (direction) {
            this.remoteDirection = direction;
            this.currentDirection = direction;
        }
        
        const animKey = `${this.textureKey}-${this.currentDirection}-${isMoving ? 'walk' : 'idle'}`;
        if (this.scene.anims.exists(animKey)) {
            this.anims.play(animKey, true);
        }
    }

    setTarget(x, y, tileX, tileY, targetX, targetY, targetTileX, targetTileY, direction, isMoving) {
        this.x = x;
        this.y = y;
        this.tileX = tileX;
        this.tileY = tileY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.targetTileX = targetTileX;
        this.targetTileY = targetTileY;
        this.remoteIsMoving = isMoving;
        this.hasTarget = true;
        
        if (direction) {
            this.remoteDirection = direction;
            this.currentDirection = direction;
        }
        
        if (this.scene.findPath) {
            this.path = this.scene.findPath(this.tileX, this.tileY, this.targetTileX, this.targetTileY);
            this.currentPathIndex = 0;
        }
        
        const animKey = `${this.textureKey}-${this.currentDirection}-${isMoving ? 'walk' : 'idle'}`;
        if (this.scene.anims.exists(animKey)) {
            this.anims.play(animKey, true);
        }
    }

    update(time, delta) {
        const isMoving = this.hasTarget && this.path && this.path.length > 0 && this.currentPathIndex < this.path.length;
        
        if (isMoving) {
            const targetTile = this.path[this.currentPathIndex];
            const targetX = targetTile.x * 32 + 16;
            const targetY = targetTile.y * 32 + 16;

            const dx = targetX - this.x;
            const dy = targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 2) {
                this.x = targetX;
                this.y = targetY;
                this.tileX = targetTile.x;
                this.tileY = targetTile.y;
                this.currentPathIndex++;

                if (this.currentPathIndex >= this.path.length) {
                    this.hasTarget = false;
                    this.path = [];
                    this.currentPathIndex = 0;
                }
            } else {
                const speed = 100;
                const moveX = (dx / distance) * speed * (delta / 1000);
                const moveY = (dy / distance) * speed * (delta / 1000);
                this.x += moveX;
                this.y += moveY;
                this.tileX = Math.floor(this.x / 32);
                this.tileY = Math.floor(this.y / 32);

                if (Math.abs(dx) > Math.abs(dy)) {
                    this.currentDirection = dx > 0 ? 'right' : 'left';
                } else {
                    this.currentDirection = dy > 0 ? 'down' : 'up';
                }
            }
        } else {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 2) {
                const speed = 200;
                const moveX = (dx / distance) * speed * (delta / 1000);
                const moveY = (dy / distance) * speed * (delta / 1000);
                
                this.x += moveX;
                this.y += moveY;
            } else {
                this.x = this.targetX;
                this.y = this.targetY;
            }
        }
        
        if (isMoving) {
            this.playWalkAnimation();
        } else {
            this.playIdleAnimation();
        }
        
        if (this.nameText) {
            const offsetY = this.isPlayer ? -45 : 35;
            this.nameText.setPosition(this.x, this.y + offsetY);
        }
        
        if (this.shadow) {
            this.shadow.setPosition(this.x, this.y + 10);
        }
    }

    destroy() {
        super.destroy();
    }
}
