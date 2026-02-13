// Copyright (c) 2026 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT
import Character from './Character.js';
import { GAME_CONFIG } from '../config.js';

export default class Player extends Character {
    constructor(scene, x, y, texture, homeX, homeY) {
        const playerTexture = texture || 'tourist_one';
        super(scene, x, y, playerTexture, null, true, true);
        
        this.isPlayer = true;
        this.targetMarker = null;
        this.playerName = '玩家';
        this.characterTexture = texture;
        this.playerTexture = playerTexture;
        this.homeX = homeX !== undefined ? homeX : this.getTileX();
        this.homeY = homeY !== undefined ? homeY : this.getTileY();
        this.controlEnabled = true;
        this.networkManager = window.getNetworkManager ? window.getNetworkManager() : null;
        this.lastSentTargetTileX = this.getTileX();
        this.lastSentTargetTileY = this.getTileY();
        
        this.setCharacterName(this.playerName);
        this.setNameColor('#ffff00');
    }

    sendTargetUpdate() {
        if (!this.networkManager) return;
        
        const targetTilePos = this.getTargetTilePosition();
        const targetPos = this.getTargetPosition();
        
        if (targetTilePos.x !== this.lastSentTargetTileX || targetTilePos.y !== this.lastSentTargetTileY) {
            this.networkManager.sendSetTarget(
                this.x,
                this.y,
                this.getTileX(),
                this.getTileY(),
                targetPos.x,
                targetPos.y,
                targetTilePos.x,
                targetTilePos.y,
                this.currentDirection,
                this.isMoving
            );
            
            this.lastSentTargetTileX = targetTilePos.x;
            this.lastSentTargetTileY = targetTilePos.y;
        }
    }

    showTargetMarker(x, y) {
    }

    updatePlayerInfo() {
        const playerNameEl = document.getElementById('player-name');
        const playerPositionEl = document.getElementById('player-position');
        
        if (playerNameEl) {
            playerNameEl.textContent = this.playerName;
        }
        
        if (playerPositionEl) {
            const tileX = this.getTileX();
            const tileY = this.getTileY();
            playerPositionEl.textContent = `位置: (${tileX}, ${tileY})`;
        }
    }

    update(time, delta) {
        super.update(time, delta);
    }

    setControlEnabled(enabled) {
        this.controlEnabled = enabled;
        if (!enabled) {
            this.clearPath();
        }
    }

    destroy() {
        if (this.scene && this.scene.input) {
            this.scene.input.off('pointerdown', this.handlePointerDown, this);
        }
        if (this.targetMarker) {
            this.targetMarker.destroy();
        }
        super.destroy();
    }
}
