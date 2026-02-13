// Copyright (c) 2026 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT
import Character from './Character.js';
import { GAME_CONFIG } from '../config.js';

const WANDERING_STATE = {
    IDLE: 'idle',
    MOVING: 'moving'
};

export default class WanderingNPC extends Character {
    constructor(scene, x, y, texture, homeX, homeY, hasIdleAnimation = false) {
        super(scene, x, y, texture, null, true, false, hasIdleAnimation);
        
        this.homeX = homeX;
        this.homeY = homeY;
        this.wanderingState = WANDERING_STATE.IDLE;
        this.idleEndTime = 0;
        this.wanderRange = 15;
        
        this.scheduleNextWander();
    }
    
    scheduleNextWander() {
        const minDelay = 3000;
        const maxDelay = 10000;
        this.idleEndTime = this.scene.time.now + Phaser.Math.Between(minDelay, maxDelay);
    }
    
    findRandomWanderTarget() {
        const halfRange = Math.floor(this.wanderRange / 2);
        const minX = this.homeX - halfRange;
        const maxX = this.homeX + halfRange;
        const minY = this.homeY - halfRange;
        const maxY = this.homeY + halfRange;
        
        for (let attempts = 0; attempts < 50; attempts++) {
            const targetX = Phaser.Math.Between(minX, maxX);
            const targetY = Phaser.Math.Between(minY, maxY);
            
            if (this.scene.isWalkable(targetX, targetY)) {
                const path = this.scene.findPath(this.getTileX(), this.getTileY(), targetX, targetY);
                if (path && path.length > 0) {
                    return { x: targetX, y: targetY };
                }
            }
        }
        
        return null;
    }
    
    startWandering() {
        const target = this.findRandomWanderTarget();
        if (target) {
            this.wanderingState = WANDERING_STATE.MOVING;
            this.setPathTo(target.x, target.y);
        } else {
            this.scheduleNextWander();
        }
    }
    
    update(time, delta) {
        super.update(time, delta);
        
        if (this.wanderingState === WANDERING_STATE.IDLE && time >= this.idleEndTime) {
            this.startWandering();
        }
        
        if (this.wanderingState === WANDERING_STATE.MOVING && !this.isMoving) {
            this.wanderingState = WANDERING_STATE.IDLE;
            this.scheduleNextWander();
        }
    }
}
