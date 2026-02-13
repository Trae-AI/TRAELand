// Copyright (c) 2026 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT
export default class PlumBlossomRain {
    constructor(scene) {
        this.scene = scene;
        this.petals = [];
        this.isRunning = false;
        this.maxPetals = 25;
        this.spawnInterval = 100;
        this.lastSpawnTime = 0;
        this.petalTextures = [];
        
        this.createPetalTextures();
    }
    
    createPetalTextures() {
        const petalColors = [
            0xff69b4,
            0xff1493,
            0xffb6c1,
            0xffc0cb,
            0xff91a4
        ];
        
        for (let i = 0; i < 5; i++) {
            const color = petalColors[i];
            const textureKey = `plum_blossom_${i}`;
            
            const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
            this.drawPetalSimple(graphics, color);
            graphics.generateTexture(textureKey, 64, 64);
            graphics.destroy();
            
            this.petalTextures.push(textureKey);
        }
    }
    
    drawPetalSimple(graphics, color) {
        const x = 32;
        const y = 32;
        
        graphics.fillStyle(color, 1);
        
        graphics.fillEllipse(x, y, 15, 25);
        
        graphics.fillStyle(0xffffff, 0.3);
        graphics.fillEllipse(x - 3, y - 5, 4, 6);
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.petals = [];
        
        const camera = this.scene.cameras.main;
        const cameraX = camera.scrollX;
        const cameraY = camera.scrollY;
        const screenWidth = this.scene.scale.width;
        const screenHeight = this.scene.scale.height;
        
        for (let i = 0; i < this.maxPetals; i++) {
            this.spawnPetalAtPosition(cameraX, cameraY, screenWidth, screenHeight);
        }
    }
    
    spawnPetalAtPosition(cameraX, cameraY, screenWidth, screenHeight) {
        const petalIndex = Phaser.Math.Between(0, 4);
        const screenX = Phaser.Math.FloatBetween(-50, screenWidth + 50);
        const screenY = Phaser.Math.FloatBetween(-50, screenHeight + 50);
        
        const textureKey = this.petalTextures[petalIndex];
        
        const sprite = this.scene.add.sprite(cameraX + screenX, cameraY + screenY, textureKey);
        sprite.setOrigin(0.5, 0.5);
        sprite.setScale(Phaser.Math.FloatBetween(0.5, 1.2));
        sprite.setAlpha(Phaser.Math.FloatBetween(0.6, 1));
        sprite.setDepth(99998);
        
        const petal = {
            sprite: sprite,
            screenX: screenX,
            screenY: screenY,
            speedY: Phaser.Math.FloatBetween(50, 150),
            speedX: Phaser.Math.FloatBetween(-30, 30),
            rotation: Phaser.Math.FloatBetween(0, Math.PI * 2),
            rotationSpeed: Phaser.Math.FloatBetween(-1, 1),
            swayOffset: Phaser.Math.FloatBetween(0, Math.PI * 2),
            swaySpeed: Phaser.Math.FloatBetween(0.5, 2),
            swayAmount: Phaser.Math.FloatBetween(20, 50)
        };
        
        this.petals.push(petal);
    }
    
    stop() {
        this.isRunning = false;
        
        for (const petal of this.petals) {
            if (petal.sprite) {
                petal.sprite.destroy();
            }
        }
        this.petals = [];
    }
    
    update(time, delta) {
        if (!this.isRunning) return;
        
        const camera = this.scene.cameras.main;
        const cameraX = camera.scrollX;
        const cameraY = camera.scrollY;
        const screenWidth = this.scene.scale.width;
        const screenHeight = this.scene.scale.height;
        
        if (time - this.lastSpawnTime > this.spawnInterval && this.petals.length < this.maxPetals) {
            this.spawnPetal(cameraX, cameraY, screenWidth);
            this.lastSpawnTime = time;
        }
        
        for (let i = this.petals.length - 1; i >= 0; i--) {
            const petal = this.petals[i];
            this.updatePetal(petal, delta);
            
            if (petal.screenY > screenHeight + 50) {
                if (petal.sprite) {
                    petal.sprite.destroy();
                }
                this.petals.splice(i, 1);
            }
        }
    }
    
    spawnPetal(cameraX, cameraY, screenWidth) {
        const petalIndex = Phaser.Math.Between(0, 4);
        const screenX = Phaser.Math.FloatBetween(-50, screenWidth + 50);
        const screenY = -50;
        
        const textureKey = this.petalTextures[petalIndex];
        
        const sprite = this.scene.add.sprite(cameraX + screenX, cameraY + screenY, textureKey);
        sprite.setOrigin(0.5, 0.5);
        sprite.setScale(Phaser.Math.FloatBetween(0.5, 1.2));
        sprite.setAlpha(Phaser.Math.FloatBetween(0.6, 1));
        sprite.setDepth(99998);
        
        const petal = {
            sprite: sprite,
            screenX: screenX,
            screenY: screenY,
            speedY: Phaser.Math.FloatBetween(50, 150),
            speedX: Phaser.Math.FloatBetween(-30, 30),
            rotation: Phaser.Math.FloatBetween(0, Math.PI * 2),
            rotationSpeed: Phaser.Math.FloatBetween(-1, 1),
            swayOffset: Phaser.Math.FloatBetween(0, Math.PI * 2),
            swaySpeed: Phaser.Math.FloatBetween(0.5, 2),
            swayAmount: Phaser.Math.FloatBetween(20, 50)
        };
        
        this.petals.push(petal);
    }
    
    updatePetal(petal, delta) {
        const deltaSeconds = delta / 1000;
        const camera = this.scene.cameras.main;
        const cameraX = camera.scrollX;
        const cameraY = camera.scrollY;
        
        petal.screenY += petal.speedY * deltaSeconds;
        petal.rotation += petal.rotationSpeed * deltaSeconds;
        
        petal.swayOffset += petal.swaySpeed * deltaSeconds;
        const swayX = Math.sin(petal.swayOffset) * petal.swayAmount;
        
        if (petal.sprite) {
            petal.sprite.setPosition(cameraX + petal.screenX + swayX, cameraY + petal.screenY);
            petal.sprite.setRotation(petal.rotation);
        }
    }
}
