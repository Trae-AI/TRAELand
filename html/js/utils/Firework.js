// Copyright (c) 2026 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT
export default class Firework {
    constructor(scene) {
        this.scene = scene;
        this.fireworks = [];
        this.graphics = null;
        this.flashSprites = [];
        this.queue = [];
        this.isPlaying = false;
        this.fireworkPosition = null;
    }

    setFireworkPosition(x, y) {
        this.fireworkPosition = { x, y };
    }

    enqueue(text = '', imageKey = null) {
        this.queue.push({ text, imageKey });
        this.processQueue();
    }

    processQueue() {
        if (this.isPlaying || this.queue.length === 0) {
            return;
        }

        if (!this.fireworkPosition) {
            console.warn('[Firework] Firework position not set');
            return;
        }

        this.isPlaying = true;
        const config = this.queue.shift();
        this.launch(this.fireworkPosition.x, this.fireworkPosition.y, config.text, config.imageKey);
    }

    launch(x, y, text = '', imageKey = null) {
        const color = this.getRandomColor();
        const targetY = y - Phaser.Math.Between(300, 500);
        const distance = y - targetY;
        const speed = distance / 1.5;
        
        const firework = {
            x: x,
            y: y,
            targetY: targetY,
            color: color,
            speed: speed,
            exploded: false,
            particles: [],
            trail: [],
            launchParticles: [],
            flashParticles: [],
            textParticles: [],
            imageParticles: [],
            text: text,
            imageKey: imageKey,
            wobblePhase: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.05 + Math.random() * 0.03,
            hue: Math.random() * 360
        };

        console.log('[Firework] Launching firework at:', x, y, 'targetY:', targetY, 'text:', text, 'imageKey:', imageKey);
        if (this.scene.cache.audio.exists('firework_launch')) {
            this.scene.sound.play('firework_launch', { volume: 0.5 });
        }
        this.fireworks.push(firework);
        console.log('[Firework] Firework added, total fireworks:', this.fireworks.length);
    }

    getRandomColor() {
        const colors = [
            0xff0000, 0x00ff00, 0x0000ff,
            0xffff00, 0xff00ff, 0x00ffff,
            0xff8800, 0xff0088, 0x88ff00
        ];
        return colors[Phaser.Math.Between(0, colors.length - 1)];
    }

    hslToRgb(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return (Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255);
    }

    createLaunchParticle(x, y, color) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Phaser.Math.FloatBetween(20, 60);
        const size = Phaser.Math.FloatBetween(1, 3);
        
        return {
            x: x,
            y: y,
            velocityX: Math.cos(angle) * speed,
            velocityY: Math.sin(angle) * speed,
            alpha: 1,
            size: size,
            color: color,
            brightness: 0.7 + Math.random() * 0.3,
            brightnessPhase: Math.random() * Math.PI * 2,
            brightnessSpeed: 0.1 + Math.random() * 0.1
        };
    }

    createFlashParticle(x, y, color, scaleMultiplier = 1, fromText = false) {
        const sprite = this.scene.add.sprite(x, y, 'flash');
        sprite.setOrigin(0.5, 0.5);
        sprite.setDepth(99999);
        sprite.setBlendMode(Phaser.BlendModes.ADD);
        
        const bloomSprite = this.scene.add.sprite(x, y, 'flash');
        bloomSprite.setOrigin(0.5, 0.5);
        bloomSprite.setDepth(99998);
        bloomSprite.setTint(0xffffff);
        bloomSprite.setBlendMode(Phaser.BlendModes.ADD);
        
        const particle = {
            sprite: sprite,
            bloomSprite: bloomSprite,
            x: x,
            y: y,
            velocityX: Phaser.Math.FloatBetween(-50, 50),
            velocityY: Phaser.Math.FloatBetween(-50, 50),
            alpha: 1,
            baseScale: Phaser.Math.FloatBetween(0.1, 0.2) * scaleMultiplier,
            scalePhase: Math.random() * Math.PI * 2,
            scaleSpeed: 0.1 + Math.random() * 0.1,
            alphaPhase: Math.random() * Math.PI * 2,
            alphaSpeed: 0.08 + Math.random() * 0.08,
            life: 1,
            color: 0xffffff,
            fromText: fromText  
        };
        
        sprite.setTint(0xffffff);
        return particle;
    }

    createTextParticles(x, y, text, color) {
        const particles = [];
        
        if (!text || text.trim() === '') {
            return particles;
        }
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const fontSize = 96;
        canvas.width = 1000;
        canvas.height = 400;
        
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        const step = 3;
        const scale = 0.8;
        const offsetX = x - (canvas.width * scale) / 2;
        const offsetY = y - (canvas.height * scale) / 2;
        
        for (let i = 0; i < canvas.height; i += step) {
            for (let j = 0; j < canvas.width; j += step) {
                const index = (i * canvas.width + j) * 4;
                const alpha = data[index + 3];
                
                if (alpha > 100) {
                    const targetX = offsetX + j * scale;
                    const targetY = offsetY + i * scale;
                    
                    const normalizedX = j / canvas.width;
                    const normalizedY = i / canvas.height;
                    const gradientValue = (normalizedX + normalizedY) / 2;
                    const hue = gradientValue * 360;
                    const lightness = 35 + Math.random() * 65;
                    const particleColor = this.hslToRgb(hue, 100, lightness);
                    
                    const particle = {
                        x: x,
                        y: y,
                        startX: x,
                        startY: y,
                        targetX: targetX,
                        targetY: targetY,
                        alpha: 0,
                        size: 1.8,
                        color: particleColor,
                        baseHue: hue,
                        baseLightness: lightness,
                        progress: 0,
                        delay: Math.random() * 0.5
                    };
                    
                    particles.push(particle);
                }
            }
        }
        
        return particles;
    }

    createImageParticles(x, y, imageKey = null) {
        const particles = [];
        let selectedImageKey = imageKey;
        if (!selectedImageKey) {
            const imageKeys = ['firework_fish', 'firework_horse', 'firework_2026'];
            selectedImageKey = imageKeys[Phaser.Math.Between(0, imageKeys.length - 1)];
        }
        
        console.log('[Firework] Creating image particles with:', selectedImageKey);
        const texture = this.scene.textures.get(selectedImageKey);
        if (!texture || !texture.source) {
            console.warn('[Firework] Texture not found or invalid:', selectedImageKey);
            return particles;
        }
        
        const source = texture.source[0];
        if (!source || !source.image) {
            console.warn('[Firework] Texture source or image not found:', selectedImageKey);
            return particles;
        }
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const targetSize = 280;
        canvas.width = targetSize;
        canvas.height = targetSize;
        
        try {
            ctx.drawImage(source.image, 0, 0, targetSize, targetSize);
        } catch (e) {
            console.error('[Firework] Failed to draw image:', e);
            return particles;
        }
        
        const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
        const data = imageData.data;
        
        const step = 3;
        const scale = 1.0;
        const offsetX = x - (targetSize * scale) / 2;
        const offsetY = y - (targetSize * scale) / 2;
        
        for (let i = 0; i < targetSize; i += step) {
            for (let j = 0; j < targetSize; j += step) {
                const index = (i * targetSize + j) * 4;
                const alpha = data[index + 3];
                
                if (alpha > 128) {
                    const targetX = offsetX + j * scale;
                    const targetY = offsetY + i * scale;
                    
                    const normalizedX = j / targetSize;
                    const normalizedY = i / targetSize;
                    const gradientValue = (normalizedX + normalizedY) / 2;
                    const hue = gradientValue * 360;
                    const lightness = 40 + Math.random() * 50;
                    const particleColor = this.hslToRgb(hue, 100, lightness);
                    
                    const particle = {
                        x: x,
                        y: y,
                        startX: x,
                        startY: y,
                        targetX: targetX,
                        targetY: targetY,
                        alpha: 0,
                        size: 1.8,
                        color: particleColor,
                        baseHue: hue,
                        baseLightness: lightness,
                        progress: 0,
                        delay: Math.random() * 0.5
                    };
                    
                    particles.push(particle);
                }
            }
        }
        
        console.log('[Firework] Image particles created:', particles.length);
        return particles;
    }

    createExplosion(x, y, color) {
        const particles = [];
        const particleCount = 100;

        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = Phaser.Math.Between(100, 200);
            const size = Phaser.Math.FloatBetween(2, 5);

            const particle = {
                x: x,
                y: y,
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed,
                alpha: 1,
                size: size,
                gravity: 200,
                color: color,
                trail: [],
                flashParticles: []
            };

            particles.push(particle);
        }

        return particles;
    }

    update(time, delta) {
        const deltaSeconds = delta / 1000;

        for (let i = this.fireworks.length - 1; i >= 0; i--) {
            const firework = this.fireworks[i];

            if (!firework.exploded) {
                firework.wobblePhase += firework.wobbleSpeed;
                const wobbleX = Math.sin(firework.wobblePhase) * 0.5;
                
                firework.hue = (firework.hue + 2) % 360;
                const currentColor = this.hslToRgb(firework.hue, 100, 60);
                
                firework.trail.push({ x: firework.x, y: firework.y, color: currentColor });
                if (firework.trail.length > 50) {
                    firework.trail.shift();
                }

                firework.x += wobbleX;
                firework.y -= firework.speed * deltaSeconds;

                if (Math.random() < 0.8) {
                    for (let j = 0; j < 3; j++) {
                        firework.launchParticles.push(this.createLaunchParticle(firework.x, firework.y, currentColor));
                    }
                }

                if (Math.random() < 0.4) {
                    for (let j = 0; j < 2; j++) {
                        firework.flashParticles.push(this.createFlashParticle(firework.x, firework.y, currentColor));
                    }
                }

                for (let j = firework.launchParticles.length - 1; j >= 0; j--) {
                    const particle = firework.launchParticles[j];
                    particle.x += particle.velocityX * deltaSeconds;
                    particle.y += particle.velocityY * deltaSeconds;
                    particle.alpha -= deltaSeconds * 0.5;
                    particle.brightnessPhase += particle.brightnessSpeed;
                    particle.brightness = 0.5 + Math.sin(particle.brightnessPhase) * 0.5;

                    if (particle.alpha <= 0) {
                        firework.launchParticles.splice(j, 1);
                    }
                }

                if (firework.y <= firework.targetY) {
                    console.log('[Firework] Exploding at:', firework.x, firework.y);
                    firework.exploded = true;
                    firework.explodedTime = 0;
                    if (this.scene.cache.audio.exists('firework_explode')) {
                        this.scene.sound.play('firework_explode', { volume: 0.5 });
                    }
                    firework.particles = this.createExplosion(firework.x, firework.y, firework.color);
                    console.log('[Firework] Created explosion particles:', firework.particles.length);
                    
                    for (let j = 0; j < 40; j++) {
                        firework.flashParticles.push(this.createFlashParticle(firework.x, firework.y, firework.color));
                    }
                    console.log('[Firework] Created flash particles:', firework.flashParticles.length);
                    
                    firework.imageParticles = this.createImageParticles(firework.x, firework.y + 180, firework.imageKey);
                    console.log('[Firework] Created image particles:', firework.imageParticles.length);
                    
                    if (firework.text && firework.text.trim() !== '') {
                        firework.textParticles = this.createTextParticles(firework.x, firework.y, firework.text, firework.color);
                        console.log('[Firework] Created text particles:', firework.textParticles.length);
                    }
                }
            } else {
                if (firework.explodedTime !== undefined) {
                    firework.explodedTime += deltaSeconds;
                }
                
                for (let j = firework.particles.length - 1; j >= 0; j--) {
                    const particle = firework.particles[j];

                    particle.trail.push({ x: particle.x, y: particle.y, color: particle.color });
                    if (particle.trail.length > 15) {
                        particle.trail.shift();
                    }

                    particle.velocityY += particle.gravity * deltaSeconds;
                    particle.x += particle.velocityX * deltaSeconds;
                    particle.y += particle.velocityY * deltaSeconds;
                    particle.alpha -= deltaSeconds * 0.8;

                    if (Math.random() < 0.3) {
                        firework.flashParticles.push(this.createFlashParticle(particle.x, particle.y, particle.color));
                    }

                    if (particle.alpha <= 0) {
                        firework.particles.splice(j, 1);
                    }
                }

                for (let j = firework.launchParticles.length - 1; j >= 0; j--) {
                    const particle = firework.launchParticles[j];
                    particle.x += particle.velocityX * deltaSeconds;
                    particle.y += particle.velocityY * deltaSeconds;
                    particle.alpha -= deltaSeconds * 0.5;
                    particle.brightnessPhase += particle.brightnessSpeed;
                    particle.brightness = 0.5 + Math.sin(particle.brightnessPhase) * 0.5;

                    if (particle.alpha <= 0) {
                        firework.launchParticles.splice(j, 1);
                    }
                }
            }

            for (let j = firework.textParticles.length - 1; j >= 0; j--) {
                const particle = firework.textParticles[j];
                
                if (firework.explodedTime !== undefined && firework.explodedTime < 2) {
                    continue;
                }
                
                if (particle.delay > 0) {
                    particle.delay -= deltaSeconds;
                    continue;
                }
                
                particle.progress += deltaSeconds * 1.5;
                
                if (particle.wobblePhase === undefined) {
                    particle.wobblePhase = Math.random() * Math.PI * 2;
                    particle.wobbleSpeed = 0.08 + Math.random() * 0.05;
                    particle.sizeWobblePhase = Math.random() * Math.PI * 2;
                    particle.sizeWobbleSpeed = 0.1 + Math.random() * 0.06;
                    particle.alphaWobblePhase = Math.random() * Math.PI * 2;
                    particle.alphaWobbleSpeed = 0.12 + Math.random() * 0.07;
                    particle.lightnessWobblePhase = Math.random() * Math.PI * 2;
                    particle.lightnessWobbleSpeed = 0.08 + Math.random() * 0.05;
                }
                
                particle.wobblePhase += particle.wobbleSpeed;
                particle.sizeWobblePhase += particle.sizeWobbleSpeed;
                particle.alphaWobblePhase += particle.alphaWobbleSpeed;
                particle.lightnessWobblePhase += particle.lightnessWobbleSpeed;
                
                const wobbleX = Math.sin(particle.wobblePhase) * 1.5;
                const wobbleY = Math.cos(particle.wobblePhase * 1.3) * 1.5;
                const sizeWobble = 0.3 + Math.sin(particle.sizeWobblePhase) * 0.3;
                const alphaWobble = 0.5 + Math.sin(particle.alphaWobblePhase) * 0.5;
                const lightnessWobble = 0.5 + Math.sin(particle.lightnessWobblePhase) * 0.5;
                const currentLightness = particle.baseLightness + lightnessWobble * 35 - 17.5;
                particle.color = this.hslToRgb(particle.baseHue, 100, Math.max(25, Math.min(95, currentLightness)));
                
                if (particle.progress < 1) {
                    const ease = 1 - Math.pow(1 - particle.progress, 3);
                    particle.x = particle.startX + (particle.targetX - particle.startX) * ease + wobbleX;
                    particle.y = particle.startY + (particle.targetY - particle.startY) * ease + wobbleY;
                    particle.alpha = particle.progress * alphaWobble;
                } else if (particle.progress < 3) {
                    particle.x = particle.targetX + wobbleX;
                    particle.y = particle.targetY + wobbleY;
                    particle.alpha = alphaWobble;
                } else if (particle.progress < 4) {
                    particle.x = particle.targetX + wobbleX;
                    particle.y = particle.targetY + wobbleY;
                    const fadeProgress = (particle.progress - 3) / 1;
                    particle.alpha = (1 - fadeProgress) * alphaWobble;
                }
                
                particle.displaySize = particle.size + sizeWobble;
                
                if (particle.progress >= 1 && particle.progress < 3 && Math.random() < 0.002) {
                    firework.flashParticles.push(this.createFlashParticle(particle.x, particle.y, 0xffffff, 1, true));
                }
                
                if (particle.progress > 4) {
                    if (particle.bloomSprite) {
                        particle.bloomSprite.destroy();
                    }
                    firework.textParticles.splice(j, 1);
                }
            }

            for (let j = firework.imageParticles.length - 1; j >= 0; j--) {
                const particle = firework.imageParticles[j];
                
                if (firework.explodedTime !== undefined && firework.explodedTime < 2) {
                    continue;
                }
                
                if (particle.delay > 0) {
                    particle.delay -= deltaSeconds;
                    continue;
                }
                
                particle.progress += deltaSeconds * 1.5;
                
                if (particle.wobblePhase === undefined) {
                    particle.wobblePhase = Math.random() * Math.PI * 2;
                    particle.wobbleSpeed = 0.08 + Math.random() * 0.05;
                    particle.sizeWobblePhase = Math.random() * Math.PI * 2;
                    particle.sizeWobbleSpeed = 0.1 + Math.random() * 0.06;
                    particle.alphaWobblePhase = Math.random() * Math.PI * 2;
                    particle.alphaWobbleSpeed = 0.12 + Math.random() * 0.07;
                    particle.lightnessWobblePhase = Math.random() * Math.PI * 2;
                    particle.lightnessWobbleSpeed = 0.08 + Math.random() * 0.05;
                }
                
                particle.wobblePhase += particle.wobbleSpeed;
                particle.sizeWobblePhase += particle.sizeWobbleSpeed;
                particle.alphaWobblePhase += particle.alphaWobbleSpeed;
                particle.lightnessWobblePhase += particle.lightnessWobbleSpeed;
                
                const wobbleX = Math.sin(particle.wobblePhase) * 1.5;
                const wobbleY = Math.cos(particle.wobblePhase * 1.3) * 1.5;
                const sizeWobble = 0.3 + Math.sin(particle.sizeWobblePhase) * 0.3;
                const alphaWobble = 0.5 + Math.sin(particle.alphaWobblePhase) * 0.5;
                const lightnessWobble = 0.5 + Math.sin(particle.lightnessWobblePhase) * 0.5;
                const currentLightness = particle.baseLightness + lightnessWobble * 35 - 17.5;
                particle.color = this.hslToRgb(particle.baseHue, 100, Math.max(25, Math.min(95, currentLightness)));
                
                if (particle.progress < 1) {
                    const ease = 1 - Math.pow(1 - particle.progress, 3);
                    particle.x = particle.startX + (particle.targetX - particle.startX) * ease + wobbleX;
                    particle.y = particle.startY + (particle.targetY - particle.startY) * ease + wobbleY;
                    particle.alpha = particle.progress * alphaWobble;
                } else if (particle.progress < 3) {
                    particle.x = particle.targetX + wobbleX;
                    particle.y = particle.targetY + wobbleY;
                    particle.alpha = alphaWobble;
                } else if (particle.progress < 4) {
                    particle.x = particle.targetX + wobbleX;
                    particle.y = particle.targetY + wobbleY;
                    const fadeProgress = (particle.progress - 3) / 1;
                    particle.alpha = (1 - fadeProgress) * alphaWobble;
                }
                
                particle.displaySize = particle.size + sizeWobble;
                if (particle.progress >= 1 && particle.progress < 3 && Math.random() < 0.002) {
                    firework.flashParticles.push(this.createFlashParticle(particle.x, particle.y, 0xffffff, 1, true));
                }
                
                if (particle.progress > 4) {
                    firework.imageParticles.splice(j, 1);
                }
            }

            for (let j = firework.flashParticles.length - 1; j >= 0; j--) {
                const particle = firework.flashParticles[j];
                if (!particle.fromText) {
                    particle.x += particle.velocityX * deltaSeconds;
                    particle.y += particle.velocityY * deltaSeconds;
                }
                particle.life -= deltaSeconds * 0.5;
                particle.scalePhase += particle.scaleSpeed;
                particle.alphaPhase += particle.alphaSpeed;
                
                const scaleVariation = 0.015 + Math.sin(particle.scalePhase) * 0.015;
                const alphaVariation = Math.sin(particle.alphaPhase) > 0 ? 1 : 0;
                
                particle.sprite.setPosition(particle.x, particle.y);
                particle.sprite.setScale(particle.baseScale + scaleVariation);
                particle.sprite.setAlpha(particle.life * alphaVariation);
                
                particle.bloomSprite.setPosition(particle.x, particle.y);
                particle.bloomSprite.setScale((particle.baseScale + scaleVariation) * 3);
                particle.bloomSprite.setAlpha(particle.life * alphaVariation * 0.3);

                if (particle.life <= 0) {
                    particle.sprite.destroy();
                    particle.bloomSprite.destroy();
                    firework.flashParticles.splice(j, 1);
                }
            }

            const shouldRemove = !firework.exploded 
                ? false 
                : (firework.particles.length === 0 && 
                   firework.launchParticles.length === 0 && 
                   firework.flashParticles.length === 0 && 
                   firework.textParticles.length === 0 && 
                   firework.imageParticles.length === 0);

            if (shouldRemove) {
                console.log('[Firework] Removing firework, all particles empty');
                this.fireworks.splice(i, 1);
                if (this.fireworks.length === 0) {
                    this.isPlaying = false;
                    this.processQueue();
                }
            }
        }

        this.draw();
    }

    draw() {
        if (!this.graphics) {
            this.graphics = this.scene.make.graphics({ x: 0, y: 0, add: true });
            this.graphics.setDepth(99999);
        }

        this.graphics.clear();

        for (const firework of this.fireworks) {
            if (!firework.exploded) {
                if (firework.trail.length > 1) {
                    for (let i = 1; i < firework.trail.length; i++) {
                        const alpha = (i / firework.trail.length) * 0.8;
                        const lineWidth = 2 + (i / firework.trail.length) * 3;
                        
                        this.graphics.lineStyle(lineWidth, firework.trail[i].color, alpha);
                        this.graphics.beginPath();
                        this.graphics.moveTo(firework.trail[i - 1].x, firework.trail[i - 1].y);
                        this.graphics.lineTo(firework.trail[i].x, firework.trail[i].y);
                        this.graphics.strokePath();
                    }
                }

                for (const particle of firework.launchParticles) {
                    this.graphics.fillStyle(particle.color, particle.alpha * particle.brightness);
                    this.graphics.fillCircle(particle.x, particle.y, particle.size);
                }

                const currentHeadColor = this.hslToRgb(firework.hue, 100, 70);
                
                for (let i = 5; i >= 0; i--) {
                    const size = 3 + i * 3;
                    const alpha = 1 - i * 0.18;
                    const color = i === 0 ? 0xffffff : currentHeadColor;
                    this.graphics.fillStyle(color, alpha);
                    this.graphics.fillCircle(firework.x, firework.y, size);
                }
            } else {
                for (const particle of firework.launchParticles) {
                    this.graphics.fillStyle(particle.color, particle.alpha * particle.brightness);
                    this.graphics.fillCircle(particle.x, particle.y, particle.size);
                }

                for (const particle of firework.particles) {
                    if (particle.trail && particle.trail.length > 1) {
                        for (let i = 1; i < particle.trail.length; i++) {
                            const alpha = (i / particle.trail.length) * particle.alpha * 0.6;
                            const lineWidth = 1 + (i / particle.trail.length) * 2;
                            
                            this.graphics.lineStyle(lineWidth, particle.trail[i].color, alpha);
                            this.graphics.beginPath();
                            this.graphics.moveTo(particle.trail[i - 1].x, particle.trail[i - 1].y);
                            this.graphics.lineTo(particle.trail[i].x, particle.trail[i].y);
                            this.graphics.strokePath();
                        }
                    }
                    
                    this.graphics.fillStyle(particle.color, particle.alpha);
                    this.graphics.fillCircle(particle.x, particle.y, particle.size);
                }
                
                if (firework.explodedTime === undefined || firework.explodedTime >= 2) {
                    for (const particle of firework.textParticles) {
                        if (particle.alpha > 0) {
                            const size = particle.displaySize !== undefined ? particle.displaySize : particle.size;
                            this.graphics.fillStyle(particle.color, particle.alpha);
                            this.graphics.fillCircle(particle.x, particle.y, size);
                        }
                    }
                    for (const particle of firework.imageParticles) {
                        if (particle.alpha > 0) {
                            const size = particle.displaySize !== undefined ? particle.displaySize : particle.size;
                            this.graphics.fillStyle(particle.color, particle.alpha);
                            this.graphics.fillCircle(particle.x, particle.y, size);
                        }
                    }
                }
            }
        }
    }

    destroy() {
        if (this.graphics) {
            this.graphics.destroy();
            this.graphics = null;
        }
        
        for (const firework of this.fireworks) {
            for (const particle of firework.flashParticles) {
                if (particle.sprite) {
                    particle.sprite.destroy();
                }
                if (particle.bloomSprite) {
                    particle.bloomSprite.destroy();
                }
            }
            for (const particle of firework.textParticles) {
                if (particle.bloomSprite) {
                    particle.bloomSprite.destroy();
                }
            }
        }
        
        this.fireworks = [];
    }
}
