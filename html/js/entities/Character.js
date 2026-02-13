// Copyright (c) 2026 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT
import { GAME_CONFIG } from '../config.js';

class Character extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, texture, frame, useAtlas = false, isPlayer = false, hasIdleAnimation = false) {
        super(scene, x, y, texture, frame);
        
        this.scene = scene;
        this.textureKey = texture;
        this.path = [];
        this.pathIndex = 0;
        this.baseSpeed = 120 + Math.random() * 60;
        this.speed = this.baseSpeed;
        this.isMoving = false;
        this.currentDirection = 'down';
        this.targetX = x;
        this.targetY = y;
        this.characterName = '';
        this.nameText = null;
        this.nameColor = '#ffffff';
        this.useAtlas = useAtlas;
        this.isPlayer = isPlayer;
        this.hasIdleAnimation = hasIdleAnimation;
        
        if (this.textureKey === 'tourist_six' || this.textureKey === 'doubao' || this.textureKey === 'tourist_one' || this.textureKey === 'tourist_five' || this.textureKey === 'tourist_four' || this.textureKey === 'tourist_three' || this.textureKey === 'tourist_two' || this.textureKey === 'tourist_seven' || this.textureKey === 'tourist_eight' || this.textureKey === 'tusong_quan' || this.textureKey === 'orange_cat') {
            this.setOrigin(0.5, 0.7);
        } else {
            this.setOrigin(0.5, 0.5);
        }
        this.scene.add.existing(this);
        
        if (this.useAtlas) {
            if (this.textureKey === 'tourist_six' || this.textureKey === 'doubao' || this.textureKey === 'tourist_one' || this.textureKey === 'tourist_five' || this.textureKey === 'tourist_four' || this.textureKey === 'tourist_three' || this.textureKey === 'tourist_two' || this.textureKey === 'tourist_seven' || this.textureKey === 'tourist_eight' || this.textureKey === 'tusong_quan' || this.textureKey === 'orange_cat') {
                this.setScale(1);
            } else if (this.textureKey === 'trae') {
                this.setScale((90 / 192) * 2);
            } else {
                this.setScale((90 / 192) * (this.isPlayer ? 1 : 2));
            }
        } else {
            if (!this.isPlayer) {
                this.setScale(2);
            }
        }
        
        this.createShadow();
        this.createAnimations();
        this.createNameText();
    }

    createShadow() {
        let shadowWidth = 20;
        let shadowHeight = 10;
        
        if (this.useAtlas) {
            if (this.textureKey === 'orange_cat') {
                shadowWidth = 20;
                shadowHeight = 10;
            } else if (this.textureKey === 'tourist_six' || this.textureKey === 'doubao' || this.textureKey === 'tourist_one' || this.textureKey === 'tourist_five' || this.textureKey === 'tourist_four' || this.textureKey === 'tourist_three' || this.textureKey === 'tourist_two' || this.textureKey === 'tourist_seven' || this.textureKey === 'tourist_eight' || this.textureKey === 'tusong_quan') {
                shadowWidth = 40;
                shadowHeight = 20;
            } else if (this.textureKey === 'trae') {
                shadowWidth = 35;
                shadowHeight = 18;
            } else {
                shadowWidth = 25;
                shadowHeight = 12;
            }
        }
        
        if (!this.isPlayer && this.textureKey !== 'trae' && this.textureKey !== 'tourist_six' && this.textureKey !== 'doubao' && this.textureKey !== 'tourist_one' && this.textureKey !== 'tourist_five' && this.textureKey !== 'tourist_four' && this.textureKey !== 'tourist_three' && this.textureKey !== 'tourist_two' && this.textureKey !== 'tourist_seven' && this.textureKey !== 'tourist_eight' && this.textureKey !== 'tusong_quan' && this.textureKey !== 'orange_cat') {
            shadowWidth *= 2;
            shadowHeight *= 2;
        }
        
        let shadowOffsetY = 10;
        if (this.textureKey === 'orange_cat') {
            shadowOffsetY = 12;
        } else if (this.textureKey === 'tourist_six' || this.textureKey === 'doubao' || this.textureKey === 'tourist_one' || this.textureKey === 'tourist_five' || this.textureKey === 'tourist_four' || this.textureKey === 'tourist_three' || this.textureKey === 'tourist_two' || this.textureKey === 'tourist_seven' || this.textureKey === 'tourist_eight' || this.textureKey === 'tusong_quan') {
            shadowOffsetY = 17;
        }
        this.shadow = this.scene.add.ellipse(this.x, this.y + shadowOffsetY, shadowWidth, shadowHeight, 0x000000, 0.3);
        this.shadow.setOrigin(0.5, 0.5);
        this.shadow.setDepth(0);
    }

    createNameText() {
        const offsetY = -60;
        this.nameText = this.scene.add.text(this.x, this.y + offsetY, this.characterName, {
            fontSize: '16px',
            color: this.nameColor,
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

    setCharacterName(name) {
        this.characterName = name;
        if (this.nameText) {
            this.nameText.setText(name);
        }
    }

    setNameColor(color) {
        this.nameColor = color;
        if (this.nameText) {
            this.nameText.setColor(color);
        }
    }

    createAnimations() {
        if (this.useAtlas) {
            this.createAtlasAnimations();
        } else {
            this.createSpritesheetAnimations();
        }
    }
    
    createAtlasAnimations() {
        const directions = ['down', 'left', 'right', 'up'];
        
        if (this.textureKey === 'tourist_six' || this.textureKey === 'doubao' || this.textureKey === 'tourist_one' || this.textureKey === 'tourist_five' || this.textureKey === 'tourist_four' || this.textureKey === 'tourist_three' || this.textureKey === 'tourist_two' || this.textureKey === 'tourist_seven' || this.textureKey === 'tourist_eight' || this.textureKey === 'tusong_quan' || this.textureKey === 'orange_cat') {
            directions.forEach(dir => {
                if (!this.scene.anims.exists(`${this.textureKey}-${dir}-walk`)) {
                    this.scene.anims.create({
                        key: `${this.textureKey}-${dir}-walk`,
                        frames: [
                            { key: this.textureKey, frame: `${dir}.step1` },
                            { key: this.textureKey, frame: `${dir}.stand` },
                            { key: this.textureKey, frame: `${dir}.step2` },
                            { key: this.textureKey, frame: `${dir}.stand` }
                        ],
                        frameRate: 8,
                        repeat: -1
                    });
                }
                
                if (this.hasIdleAnimation) {
                    if (!this.scene.anims.exists(`${this.textureKey}-${dir}-idle`)) {
                        this.scene.anims.create({
                            key: `${this.textureKey}-${dir}-idle`,
                            frames: [
                                { key: this.textureKey, frame: `${dir}.idle1` },
                                { key: this.textureKey, frame: `${dir}.idle2` },
                                { key: this.textureKey, frame: `${dir}.idle3` }
                            ],
                            frameRate: 6,
                            repeat: -1
                        });
                    }
                } else {
                    if (!this.scene.anims.exists(`${this.textureKey}-${dir}-idle`)) {
                        this.scene.anims.create({
                            key: `${this.textureKey}-${dir}-idle`,
                            frames: [{ key: this.textureKey, frame: `${dir}.stand` }],
                            frameRate: 1
                        });
                    }
                }
            });
            
            this.setFrame('down.stand');
        } else {
            directions.forEach(dir => {
                if (!this.scene.anims.exists(`${this.textureKey}-${dir}-walk`)) {
                    this.scene.anims.create({
                        key: `${this.textureKey}-${dir}-walk`,
                        frames: this.scene.anims.generateFrameNames(this.textureKey, {
                            prefix: `${dir}-walk.`,
                            start: 0,
                            end: 3,
                            zeroPad: 3
                        }),
                        frameRate: 8,
                        repeat: -1
                    });
                }
                
                if (!this.scene.anims.exists(`${this.textureKey}-${dir}-idle`)) {
                    this.scene.anims.create({
                        key: `${this.textureKey}-${dir}-idle`,
                        frames: [{ key: this.textureKey, frame: dir }],
                        frameRate: 1
                    });
                }
            });
            
            this.setFrame('down');
        }
    }
    
    createSpritesheetAnimations() {
        const directions = ['down', 'left', 'right', 'up'];
        const framesPerDirection = 3;
        const startFrames = [0, 3, 6, 9];
        
        directions.forEach((dir, dirIndex) => {
            const startFrame = startFrames[dirIndex];
            
            if (!this.scene.anims.exists(`${this.textureKey}-${dir}-walk`)) {
                this.scene.anims.create({
                    key: `${this.textureKey}-${dir}-walk`,
                    frames: this.scene.anims.generateFrameNumbers(this.textureKey, {
                        start: startFrame,
                        end: startFrame + framesPerDirection - 1
                    }),
                    frameRate: 8,
                    repeat: -1
                });
            }
            
            if (!this.scene.anims.exists(`${this.textureKey}-${dir}-idle`)) {
                this.scene.anims.create({
                    key: `${this.textureKey}-${dir}-idle`,
                    frames: [{ key: this.textureKey, frame: startFrame }],
                    frameRate: 1
                });
            }
        });
        
        this.setFrame(0);
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
        this.playIdleAnimation();
    }

    updateDirection(dx, dy) {
        if (Math.abs(dx) > Math.abs(dy)) {
            this.currentDirection = dx > 0 ? 'right' : 'left';
        } else {
            this.currentDirection = dy > 0 ? 'down' : 'up';
        }
    }

    playWalkAnimation() {
        this.anims.play(`${this.textureKey}-${this.currentDirection}-walk`, true);
    }

    playIdleAnimation() {
        this.anims.play(`${this.textureKey}-${this.currentDirection}-idle`, true);
    }

    update(time, delta) {
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
                this.updateDirection(dx, dy);
                this.playWalkAnimation();
                
                this.speed = this.baseSpeed + (Math.random() - 0.5) * 20;
                
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
            let shadowOffsetY = 10;
            if (this.textureKey === 'orange_cat') {
                shadowOffsetY = 12;
            } else if (this.textureKey === 'tourist_six' || this.textureKey === 'doubao' || this.textureKey === 'tourist_one' || this.textureKey === 'tourist_five' || this.textureKey === 'tourist_four' || this.textureKey === 'tourist_three' || this.textureKey === 'tourist_two' || this.textureKey === 'tourist_seven' || this.textureKey === 'tourist_eight' || this.textureKey === 'tusong_quan') {
                shadowOffsetY = 17;
            }
            this.shadow.setPosition(this.x, this.y + shadowOffsetY);
        }
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

    getTargetTilePosition() {
        if (this.path && this.path.length > 0) {
            const lastPoint = this.path[this.path.length - 1];
            return {
                x: lastPoint.x,
                y: lastPoint.y
            };
        }
        return {
            x: this.getTileX(),
            y: this.getTileY()
        };
    }

    getTargetPosition() {
        if (this.path && this.path.length > 0) {
            const lastPoint = this.path[this.path.length - 1];
            return {
                x: lastPoint.x * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2,
                y: lastPoint.y * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2
            };
        }
        return {
            x: this.x,
            y: this.y
        };
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

    destroy() {
        if (this.nameText) {
            this.nameText.destroy();
            this.nameText = null;
        }
        if (this.shadow) {
            this.shadow.destroy();
            this.shadow = null;
        }
        super.destroy();
    }
}

export default Character;
