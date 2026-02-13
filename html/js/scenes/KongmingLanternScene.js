// Copyright (c) 2026 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT
import { GAME_CONFIG } from '../config.js';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export default class KongmingLanternScene extends Phaser.Scene {
    constructor() {
        super('KongmingLanternScene');
        
        this.playerLantern = null;
        this.backgroundLanterns = [];
        this.isRising = false;
        this.playerBlessing = '';
        this.blessingModal = null;
        
        this.threeScene = null;
        this.threeCamera = null;
        this.threeRenderer = null;
        this.playerLantern3D = null;
        this.backgroundLanterns3D = [];
        this.instancedLanterns = [];
        this.lanternInstanceData = [];
        this.stars = [];
        this.starData = [];
        this.animationId = null;
        this.textureLoader = null;
        this.kongmingTextures = [];
        this.focusedLantern = null;
        this.focusedLanternIndex = -1;
        this.composer = null;
        this.dummy = new THREE.Object3D();
        
        this.isDragging = false;
        this.hasDragged = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragStartTime = 0;
        this.manualAngle = 0;
        this.autoAngle = 0;
        this.autoAngleOffset = 0;
        
        this.cameraTargetX = 0;
        this.cameraTargetY = 0;
        this.cameraTargetZ = 0;
        this.lookAtTargetX = 0;
        this.lookAtTargetY = 0;
        this.lookAtTargetZ = 0;
        this.targetQuaternion = new THREE.Quaternion();
        
        this.blessingTextMeshes = [];
        this.blessingTextData = [];
        this.blessingTextureData = [];
        
        this.tempCameraDir = new THREE.Vector3();
        this.tempRight = new THREE.Vector3();
        this.tempUp = new THREE.Vector3(0, 1, 0);
        this.isCameraMoving = false;
        this.CAMERA_DISTANCE = 5;
        this.isExiting = false;
    }

    init(data) {
        this.playerX = data.x;
        this.playerY = data.y;
        this.playerBlessing = data.blessing || '';
        this.myLantern = data.myLantern || null;
        this.lanterns = data.lanterns || [];
        
        this.playerLantern = null;
        this.backgroundLanterns = [];
        this.isRising = false;
        this.focusedLantern = null;
        this.focusedLanternIndex = -1;
        this.focusedBackgroundAvatarLantern = null;
        this.isExiting = false;
        this.isDragging = false;
        this.hasDragged = false;
        this.isCameraMoving = false;
        this.autoAngle = 0;
        this.autoAngleOffset = 0;
        this.manualAngle = 0;
        
        this.cameraTargetX = 0;
        this.cameraTargetY = 0;
        this.cameraTargetZ = 0;
        this.lookAtTargetX = 0;
        this.lookAtTargetY = 0;
        this.lookAtTargetZ = 0;
        
        this.blessingTextMeshes = [];
        this.blessingTextData = [];
        this.blessingTextureData = [];
        this.avatarMesh = null;
        this.backgroundAvatarMeshes = [];
        
        this.backgroundLanterns3D = [];
        this.instancedLanterns = [];
        this.lanternInstanceData = [];
        this.stars = [];
        this.starData = [];
        this.kongmingTextures = [];
    }

    async create() {
        console.log('KongmingLanternScene create() 被调用');
        const fadeOverlay = document.getElementById('fade-overlay');
        const exitBtn = document.getElementById('kongming-exit-btn');
        const gameContainer = document.getElementById('game-container');

        if (gameContainer) {
            gameContainer.style.display = 'none';
        }

        this.backgroundLanterns3D = [];
        this.stars = [];
        this.kongmingTextures = [];

        this.textureLoader = new THREE.TextureLoader();
        await this.loadAllTextures();
        
        this.createThreeJSScene();
        this.createSkyBackground();
        this.createStars();
        this.createBackgroundLanterns();
        await this.createPlayerLantern();
        await this.createBackgroundLanternsWithAvatars();
        this.startRising();
        this.setupInput();

        if (exitBtn) {
            exitBtn.style.display = 'flex';
            exitBtn.onclick = () => this.returnToGame();
        }

        if (fadeOverlay) {
            setTimeout(() => {
                fadeOverlay.style.opacity = '0';
            }, 100);
        }
    }

    loadAllTextures() {
        // 使用 BootScene 中预加载的纹理
        const textureKeys = [
            'kongming_1',
            'kongming_3',
            'kongming_5'
        ];

        console.log('开始加载孔明灯纹理，数量:', textureKeys.length);

        // 从 Phaser 缓存中获取 Image 对象，并创建 Three.js 纹理
        textureKeys.forEach(key => {
            if (this.game.textures.exists(key)) {
                const img = this.game.textures.get(key).getSourceImage();
                const texture = new THREE.Texture(img);
                texture.needsUpdate = true; // 重要：标记纹理需要更新
                texture.encoding = THREE.sRGBEncoding;
                
                let aspectRatio = 1;
                if (key === 'kongming_1') {
                    aspectRatio = 119 / 135;
                } else if (key === 'kongming_3') {
                    aspectRatio = 260 / 340;
                } else if (key === 'kongming_5') {
                    aspectRatio = 355 / 352;
                }
                
                this.kongmingTextures.push({ texture, aspectRatio });
                console.log('纹理加载成功:', key, '宽高比:', aspectRatio);
            } else {
                console.error('Texture not found in Phaser cache:', key);
            }
        });

        console.log('孔明灯纹理加载完成，实际数量:', this.kongmingTextures.length);
        return Promise.resolve();
    }

    createThreeJSScene() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.threeScene = new THREE.Scene();

        this.threeCamera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
        this.threeCamera.position.set(0, 0, 10);

        this.threeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.threeRenderer.autoClear = false;
        this.threeRenderer.setSize(width, height);
        this.threeRenderer.setClearColor(0x0a0a14, 1);
        this.threeRenderer.domElement.style.position = 'fixed';
        this.threeRenderer.domElement.style.top = '0';
        this.threeRenderer.domElement.style.left = '0';
        this.threeRenderer.domElement.style.width = '100vw';
        this.threeRenderer.domElement.style.height = '100vh';
        this.threeRenderer.domElement.style.zIndex = '10';
        this.threeRenderer.domElement.style.pointerEvents = 'auto';
        document.body.appendChild(this.threeRenderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.threeScene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffff00, 1, 100);
        pointLight.position.set(0, 0, 10);
        this.threeScene.add(pointLight);

        this.composer = new EffectComposer(this.threeRenderer);
        const renderPass = new RenderPass(this.threeScene, this.threeCamera);
        this.composer.addPass(renderPass);

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(width, height),
            1.0,
            0.5,
            0.8
        );
        bloomPass.threshold = 0;
        bloomPass.strength = 0.5;
        bloomPass.radius = 0.5;
        this.composer.addPass(bloomPass);
    }

    createSkyBackground() {
        const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x0a0a14,
            side: THREE.BackSide
        });
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.threeScene.add(sky);
    }

    createStars() {
        const starCount = 5000;
        console.log('开始创建星星，数量:', starCount);

        this.starData = [];
        const starGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            const radius = 200 + Math.random() * 300;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);

            const brightness = 0.5 + Math.random() * 0.5;
            colors[i3] = brightness;
            colors[i3 + 1] = brightness;
            colors[i3 + 2] = brightness;

            const baseSize = 0.5 + Math.random() * 2;
            sizes[i] = baseSize;

            this.starData.push({
                baseSize: baseSize,
                twinkleOffset: Math.random() * Math.PI * 2,
                twinkleSpeed: 0.5 + Math.random() * 1.5,
                twinkleAmount: 0.3 + Math.random() * 0.5
            });
        }

        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const starMaterial = new THREE.PointsMaterial({
            size: 1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        const starField = new THREE.Points(starGeometry, starMaterial);
        this.threeScene.add(starField);
        this.stars.push(starField);

        console.log('星星创建完成');
    }

    updateStars(time) {
        if (this.stars.length === 0 || this.starData.length === 0) return;

        const starField = this.stars[0];
        const sizes = starField.geometry.attributes.size;

        for (let i = 0; i < this.starData.length; i++) {
            const data = this.starData[i];
            const twinkle = Math.sin(time * data.twinkleSpeed + data.twinkleOffset);
            sizes.array[i] = data.baseSize + twinkle * data.twinkleAmount;
        }

        sizes.needsUpdate = true;
    }

    createLanternSprite(color, isPlayer = false) {
        const group = new THREE.Group();

        let material;
        let aspectRatio = 1;
        if (this.kongmingTextures.length > 0) {
            const randomIndex = Math.floor(Math.random() * this.kongmingTextures.length);
            const textureData = this.kongmingTextures[randomIndex];
            material = new THREE.MeshBasicMaterial({
                map: textureData.texture,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide,
                depthWrite: true,
                alphaTest: 0.3
            });
            aspectRatio = textureData.aspectRatio;
        } else {
            material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide,
                depthWrite: true
            });
        }

        const geometry = new THREE.PlaneGeometry(aspectRatio, 1);
        const sprite = new THREE.Mesh(geometry, material);
        sprite.renderOrder = 0;
        group.add(sprite);

        const light = new THREE.PointLight(color, 1.5, 25);
        light.position.y = 0;
        group.add(light);

        return group;
    }

    createTextTextureAndData(text) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 256;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = 'bold 160px Arial, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const dots = [];
        const step = 9;
        const threshold = 20;

        for (let y = step; y < canvas.height - step; y += step) {
            for (let x = step; x < canvas.width - step; x += step) {
                const index = (y * canvas.width + x) * 4;
                const alpha = data[index + 3];
                if (alpha > threshold) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = 100 + Math.random() * 150;
                    const startX = 128 + Math.cos(angle) * distance;
                    const startY = 128 + Math.sin(angle) * distance;
                    
                    dots.push({
                        targetX: x,
                        targetY: y,
                        startX: startX,
                        startY: startY,
                        baseSize: 2.5 + Math.random() * 1.5,
                        baseAlpha: 0.5 + Math.random() * 0.2,
                        twinkleOffset: Math.random() * Math.PI * 2,
                        twinkleSpeed: 1.5 + Math.random() * 2.5,
                        twinkleAmount: 0.25 + Math.random() * 0.35,
                        delay: Math.random() * 0.5
                    });
                }
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.encoding = THREE.sRGBEncoding;
        return { texture, canvas, ctx, dots };
    }

    createCircularAvatarTexture(avatarUrl) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const size = 256;
            canvas.width = size;
            canvas.height = size;

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                ctx.clearRect(0, 0, size, size);
                
                ctx.beginPath();
                ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                
                const scale = Math.max(size / img.width, size / img.height);
                const x = (size - img.width * scale) / 2;
                const y = (size - img.height * scale) / 2;
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
                
                ctx.beginPath();
                ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 8;
                ctx.stroke();

                const texture = new THREE.CanvasTexture(canvas);
                texture.encoding = THREE.sRGBEncoding;
                resolve(texture);
            };
            img.onerror = (error) => {
                reject(error);
            };
            img.src = avatarUrl;
        });
    }

    updateTextTexture(textureData, time, animationProgress = 1) {
        const { canvas, ctx, dots } = textureData;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const dot of dots) {
            const localProgress = Math.max(0, Math.min(1, (animationProgress - dot.delay) / (1 - dot.delay)));
            const easeProgress = 1 - Math.pow(1 - localProgress, 3);
            
            const currentX = dot.startX + (dot.targetX - dot.startX) * easeProgress;
            const currentY = dot.startY + (dot.targetY - dot.startY) * easeProgress;
            
            const twinkle = Math.sin(time * dot.twinkleSpeed + dot.twinkleOffset);
            const size = dot.baseSize + twinkle * dot.twinkleAmount * 0.5;
            const alpha = (dot.baseAlpha + twinkle * dot.twinkleAmount) * easeProgress;
            
            if (alpha > 0.01) {
                ctx.beginPath();
                ctx.arc(currentX, currentY, Math.max(0.5, size), 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, alpha)})`;
                ctx.fill();
            }
        }

        textureData.texture.needsUpdate = true;
    }

    createBackgroundLanterns() {
        const lanternCount = 3000;
        const colors = [0xff6b6b, 0xffd93d, 0xff9f43, 0xff6b9d];

        console.log('开始创建背景孔明灯，数量:', lanternCount);

        this.lanternInstanceData = [];
        this.instancedLanterns = [];

        for (let textureIndex = 0; textureIndex < this.kongmingTextures.length; textureIndex++) {
            const textureData = this.kongmingTextures[textureIndex];
            const geometry = new THREE.PlaneGeometry(textureData.aspectRatio, 1);
            const material = new THREE.MeshBasicMaterial({
                map: textureData.texture,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide,
                depthWrite: true,
                alphaTest: 0.3
            });

            const instancedMesh = new THREE.InstancedMesh(geometry, material, lanternCount);
            instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            this.threeScene.add(instancedMesh);
            this.instancedLanterns.push(instancedMesh);
        }

        for (let i = 0; i < lanternCount; i++) {
            const t = Math.random();
            const y = -20 + 80 * Math.pow(t, 0.3);
            const heightFactor = (y + 20) / 80;
            const spreadFactor = 1 + heightFactor * 2;
            
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.pow(Math.random(), 0.5) * 25 * spreadFactor;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            const scale = 1;
            const textureIndex = Math.floor(Math.random() * this.kongmingTextures.length);

            this.lanternInstanceData.push({
                originalY: y,
                originalX: x,
                originalZ: z,
                scale: scale,
                textureIndex: textureIndex,
                floatOffset: Math.random() * Math.PI * 2,
                floatSpeed: 0.2 + Math.random() * 0.4,
                floatAmount: 0.3 + Math.random() * 0.5,
                swayOffset: Math.random() * Math.PI * 2,
                swaySpeed: 0.15 + Math.random() * 0.25,
                swayAmount: 0.2 + Math.random() * 0.3
            });
        }

        this.updateInstancedLanterns(0);

        console.log('背景孔明灯创建完成，实际数量:', this.lanternInstanceData.length);
    }

    updateInstancedLanterns(time) {
        const textureInstanceCounts = new Array(this.kongmingTextures.length).fill(0);

        for (let i = 0; i < this.lanternInstanceData.length; i++) {
            const data = this.lanternInstanceData[i];
            const textureIndex = data.textureIndex;
            const instanceIndex = textureInstanceCounts[textureIndex]++;

            const currentY = data.originalY + Math.sin(time * data.floatSpeed + data.floatOffset) * data.floatAmount;
            const currentX = data.originalX + Math.sin(time * data.swaySpeed + data.swayOffset) * data.swayAmount;

            this.dummy.position.set(currentX, currentY, data.originalZ);
            this.dummy.scale.set(data.scale, data.scale, data.scale);
            this.dummy.lookAt(this.threeCamera.position);
            this.dummy.updateMatrix();

            this.instancedLanterns[textureIndex].setMatrixAt(instanceIndex, this.dummy.matrix);
        }

        for (let i = 0; i < this.instancedLanterns.length; i++) {
            this.instancedLanterns[i].count = textureInstanceCounts[i];
            this.instancedLanterns[i].instanceMatrix.needsUpdate = true;
        }
    }

    async createPlayerLantern() {
        const colors = [0xff6b6b, 0xffd93d, 0xff9f43, 0xff6b9d];
        const color = colors[Math.floor(Math.random() * colors.length)];
        console.log('创建玩家孔明灯，颜色:', color.toString(16));

        this.playerLantern3D = this.createLanternSprite(color, false);
        this.playerLantern3D.position.set(0, -15, 0);
        const scale = 1;
        this.playerLantern3D.scale.set(scale, scale, scale);
        this.threeScene.add(this.playerLantern3D);

        if (this.myLantern && this.myLantern.avatar) {
            try {
                console.log('加载玩家头像:', this.myLantern.avatar);
                const avatarTexture = await this.createCircularAvatarTexture(this.myLantern.avatar);
                const avatarGeometry = new THREE.PlaneGeometry(0.3, 0.3);
                const avatarMaterial = new THREE.MeshBasicMaterial({
                    map: avatarTexture,
                    transparent: true,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                    depthTest: true
                });
                this.avatarMesh = new THREE.Mesh(avatarGeometry, avatarMaterial);
                this.avatarMesh.renderOrder = 1;
                this.avatarMesh.position.set(0, 0, 0.01);
                this.playerLantern3D.add(this.avatarMesh);
                console.log('玩家头像加载完成');
            } catch (error) {
                console.error('加载玩家头像失败:', error);
            }
        }

        this.blessingTextMeshes = [];
        this.blessingTextData = [];
        this.blessingTextureData = [];
        let characters = ['新', '年', '快', '乐'];
        if (this.playerBlessing && this.playerBlessing.length === 4) {
            characters = this.playerBlessing.split('');
            console.log('使用AI生成的祝福语:', characters);
        } else if (this.playerBlessing && this.playerBlessing.length > 0) {
            const blessing = this.playerBlessing.slice(0, 4).padEnd(4, '福');
            characters = blessing.split('');
            console.log('调整后的祝福语:', characters);
        }
        const baseY = -15;
        const distance = 0.8;

        const positions = [
            { x: 0, y: distance },
            { x: distance, y: 0 },
            { x: 0, y: -distance },
            { x: -distance, y: 0 }
        ];

        for (let i = 0; i < characters.length; i++) {
            const textureData = this.createTextTextureAndData(characters[i]);
            this.updateTextTexture(textureData, 0, 0);
            const geometry = new THREE.PlaneGeometry(0.7, 0.7);
            const material = new THREE.MeshBasicMaterial({
                map: textureData.texture,
                transparent: true,
                opacity: 0,
                side: THREE.DoubleSide,
                depthWrite: false,
                depthTest: false
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.renderOrder = 1000;
            
            const pos = positions[i];
            const randomOffset = (Math.random() - 0.5) * 0.15;
            const x = pos.x + randomOffset;
            const y = baseY + pos.y + randomOffset;
            const z = 0;
            
            mesh.position.set(x, y, z);
            this.threeScene.add(mesh);
            this.blessingTextMeshes.push(mesh);
            this.blessingTextureData.push(textureData);
            
            this.blessingTextData.push({
                originalX: pos.x,
                originalY: pos.y,
                originalZ: 0,
                floatOffset: Math.random() * Math.PI * 2,
                floatSpeed: 0.8 + Math.random() * 0.5,
                floatAmount: 0.06 + Math.random() * 0.05,
                swayOffset: Math.random() * Math.PI * 2,
                swaySpeed: 0.6 + Math.random() * 0.4,
                swayAmount: 0.04 + Math.random() * 0.04
            });
        }

        this.threeCamera.position.set(0, -15, 8);
        this.threeCamera.lookAt(0, -15, 0);
        
        this.cameraTargetX = 0;
        this.cameraTargetY = -15;
        this.cameraTargetZ = 8;
        this.lookAtTargetX = 0;
        this.lookAtTargetY = -15;
        this.lookAtTargetZ = 0;

        console.log('玩家孔明灯创建完成');
    }

    async createBackgroundLanternsWithAvatars() {
        if (!this.lanterns || this.lanterns.length === 0) {
            console.log('没有 lanterns 数据，跳过创建带头像的背景孔明灯');
            return;
        }

        const targetCount = 150;
        console.log(`开始创建 ${targetCount} 个带头像的背景孔明灯`);

        this.backgroundAvatarMeshes = [];

        const validLanterns = this.lanterns.filter(l => l.avatar);
        if (validLanterns.length === 0) {
            console.log('没有包含头像的 lanterns 数据');
            return;
        }

        const textureCache = new Map();
        for (const lanternData of validLanterns) {
            try {
                const texture = await this.createCircularAvatarTexture(lanternData.avatar);
                textureCache.set(lanternData.avatar, texture);
            } catch (error) {
                console.error('预加载头像纹理失败:', error);
            }
        }

        for (let i = 0; i < targetCount; i++) {
            const lanternIndex = i % validLanterns.length;
            const lanternData = validLanterns[lanternIndex];
            const avatarTexture = textureCache.get(lanternData.avatar);
            
            if (!avatarTexture) continue;

            try {
                const t = Math.random();
                const y = -20 + 80 * Math.pow(t, 0.3);
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.pow(Math.random(), 0.5) * 25;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                const scale = 1;

                const colors = [0xff6b6b, 0xffd93d, 0xff9f43, 0xff6b9d];
                const color = colors[Math.floor(Math.random() * colors.length)];
                const lanternGroup = this.createLanternSprite(color, false);
                lanternGroup.position.set(x, y, z);
                lanternGroup.scale.set(scale, scale, scale);
                this.threeScene.add(lanternGroup);

                const avatarGeometry = new THREE.PlaneGeometry(0.25, 0.25);
                const avatarMaterial = new THREE.MeshBasicMaterial({
                    map: avatarTexture,
                    transparent: true,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                    depthTest: true
                });
                const avatarMesh = new THREE.Mesh(avatarGeometry, avatarMaterial);
                avatarMesh.renderOrder = 1;
                avatarMesh.position.set(0, 0, 0.01);
                lanternGroup.add(avatarMesh);

                this.backgroundAvatarMeshes.push({
                    lanternGroup: lanternGroup,
                    avatarMesh: avatarMesh,
                    data: lanternData,
                    originalY: y,
                    originalX: x,
                    originalZ: z,
                    floatOffset: Math.random() * Math.PI * 2,
                    floatSpeed: 0.2 + Math.random() * 0.4,
                    floatAmount: 0.3 + Math.random() * 0.5,
                    swayOffset: Math.random() * Math.PI * 2,
                    swaySpeed: 0.15 + Math.random() * 0.25,
                    swayAmount: 0.2 + Math.random() * 0.3
                });

            } catch (error) {
                console.error('创建带头像的背景孔明灯失败:', error);
            }
        }

        console.log(`带头像的背景孔明灯创建完成，实际数量: ${this.backgroundAvatarMeshes.length}`);
    }

    startRising() {
        this.isRising = true;
        this.startTime = Date.now();
        this.duration = 8000;
        this.startY = -15;
        this.endY = 50;

        const kongmingSound = document.getElementById('kongming-sound');
        if (kongmingSound) {
            kongmingSound.currentTime = 0;
            // 确保非静音播放，并尝试播放
            kongmingSound.muted = false;
            kongmingSound.volume = 1.0;
            const playPromise = kongmingSound.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn('Auto-play was prevented:', error);
                    // 如果被阻止，尝试静音播放或者提示用户
                });
            }
        }

        this.animate();
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        const elapsed = Date.now() - this.startTime;
        const progress = Math.min(elapsed / this.duration, 1);
        const time = Date.now() * 0.001;
        const lerpFactor = 0.08;

        if (!this.isDragging) {
            this.autoAngle = time * 0.12 + this.autoAngleOffset;
        }
        const angle = this.isDragging ? this.manualAngle : this.autoAngle;

        if (this.focusedLantern) {
            let radius = this.CAMERA_DISTANCE;
            let targetX, targetY, targetZ;
            
            if (this.focusedBackgroundAvatarLantern) {
                const data = this.focusedBackgroundAvatarLantern;
                targetY = data.originalY + Math.sin(time * data.floatSpeed + data.floatOffset) * data.floatAmount;
                targetX = data.originalX + Math.sin(time * data.swaySpeed + data.swayOffset) * data.swayAmount;
                targetZ = data.originalZ;
            } else if (this.focusedLanternIndex >= 0 && this.focusedLanternIndex < this.lanternInstanceData.length) {
                const data = this.lanternInstanceData[this.focusedLanternIndex];
                targetY = data.originalY + Math.sin(time * data.floatSpeed + data.floatOffset) * data.floatAmount;
                targetX = data.originalX + Math.sin(time * data.swaySpeed + data.swayOffset) * data.swayAmount;
                targetZ = data.originalZ;
            } else {
                targetX = this.focusedLantern.position.x;
                targetY = this.focusedLantern.position.y;
                targetZ = this.focusedLantern.position.z;
            }

            this.cameraTargetX = targetX + Math.sin(angle) * radius;
            this.cameraTargetY = targetY;
            this.cameraTargetZ = targetZ + Math.cos(angle) * radius;
            this.lookAtTargetX = targetX;
            this.lookAtTargetY = targetY;
            this.lookAtTargetZ = targetZ;
        } else if (!this.isExiting && this.isRising && this.playerLantern3D) {
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentY = this.startY + (this.endY - this.startY) * easeProgress;
            this.playerLantern3D.position.y = currentY;

            const radius = this.CAMERA_DISTANCE;

            this.cameraTargetX = Math.sin(angle) * radius;
            this.cameraTargetY = currentY;
            this.cameraTargetZ = Math.cos(angle) * radius;
            this.lookAtTargetX = 0;
            this.lookAtTargetY = currentY;
            this.lookAtTargetZ = 0;

            if (progress >= 1) {
                this.isRising = false;
                this.showReturnHint();
            }
        } else if (!this.isExiting && !this.isRising && this.playerLantern3D) {
            const radius = this.CAMERA_DISTANCE;

            this.cameraTargetX = Math.sin(angle) * radius;
            this.cameraTargetY = this.endY;
            this.cameraTargetZ = Math.cos(angle) * radius;
            this.lookAtTargetX = 0;
            this.lookAtTargetY = this.endY;
            this.lookAtTargetZ = 0;
        }

        if (this.isRising || this.isDragging) {
            this.threeCamera.position.set(this.cameraTargetX, this.cameraTargetY, this.cameraTargetZ);
            this.threeCamera.lookAt(this.lookAtTargetX, this.lookAtTargetY, this.lookAtTargetZ);
        } else {
            this.threeCamera.position.x += (this.cameraTargetX - this.threeCamera.position.x) * lerpFactor;
            this.threeCamera.position.y += (this.cameraTargetY - this.threeCamera.position.y) * lerpFactor;
            this.threeCamera.position.z += (this.cameraTargetZ - this.threeCamera.position.z) * lerpFactor;

            const tempCamera = this.threeCamera.clone();
            tempCamera.position.copy(this.threeCamera.position);
            tempCamera.lookAt(this.lookAtTargetX, this.lookAtTargetY, this.lookAtTargetZ);
            this.targetQuaternion.copy(tempCamera.quaternion);

            this.threeCamera.quaternion.slerp(this.targetQuaternion, lerpFactor);
        }

        this.updateInstancedLanterns(time);
        this.updateStars(time);

        for (const lanternData of this.backgroundAvatarMeshes) {
            const currentY = lanternData.originalY + Math.sin(time * lanternData.floatSpeed + lanternData.floatOffset) * lanternData.floatAmount;
            const currentX = lanternData.originalX + Math.sin(time * lanternData.swaySpeed + lanternData.swayOffset) * lanternData.swayAmount;
            
            lanternData.lanternGroup.position.set(currentX, currentY, lanternData.originalZ);
            lanternData.lanternGroup.lookAt(this.threeCamera.position);
        }

        if (this.playerLantern3D) {
            this.playerLantern3D.position.x = Math.sin(time * 0.3) * 0.3;
            this.playerLantern3D.lookAt(this.threeCamera.position);
        }

        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentY = this.startY + (this.endY - this.startY) * easeProgress;
        const lanternX = Math.sin(time * 0.3) * 0.3;
        const distance = 0.8;

        this.threeCamera.getWorldDirection(this.tempCameraDir);
        this.tempCameraDir.y = 0;
        this.tempCameraDir.normalize();
        this.tempRight.crossVectors(this.tempCameraDir, this.tempUp);

        const particleAnimationProgress = Math.max(0, Math.min(1, (progress - 0.3) / 0.4));

        const cameraPos = this.threeCamera.position.clone();
        const lookAtPos = new THREE.Vector3(lanternX, currentY, 0);
        const toCamera = cameraPos.clone().sub(lookAtPos).normalize();
        const planeDistance = 0.5;
        const planeCenter = lookAtPos.clone().add(toCamera.clone().multiplyScalar(planeDistance));

        const planeRight = this.tempRight.clone();
        const planeUp = new THREE.Vector3(0, 1, 0);

        for (let i = 0; i < this.blessingTextMeshes.length; i++) {
            const mesh = this.blessingTextMeshes[i];
            const data = this.blessingTextData[i];
            const textureData = this.blessingTextureData[i];

            this.updateTextTexture(textureData, time, particleAnimationProgress);

            const floatY = Math.sin(time * data.floatSpeed + data.floatOffset) * data.floatAmount;
            const swayX = Math.sin(time * data.swaySpeed + data.swayOffset) * data.swayAmount;
            
            const posX = data.originalX + swayX;
            const posY = data.originalY + floatY;
            
            const worldPos = planeCenter.clone()
                .add(planeRight.clone().multiplyScalar(posX))
                .add(planeUp.clone().multiplyScalar(posY));
            
            mesh.position.copy(worldPos);
            mesh.material.opacity = particleAnimationProgress;

            mesh.quaternion.copy(this.threeCamera.quaternion);
        }

        this.threeRenderer.clear();
        this.composer.render();
        this.threeRenderer.render(this.threeScene, this.threeCamera);
    }

    setupInput() {
        if (this.threeRenderer && this.threeRenderer.domElement) {
            const canvas = this.threeRenderer.domElement;
            let dragTimer = null;
            
            canvas.addEventListener('click', (event) => {
                if (!this.isRising && !this.hasDragged) {
                    this.checkLanternClick(event);
                }
            });

            const handleStart = (clientX, clientY) => {
                this.dragStartX = clientX;
                this.dragStartY = clientY;
                this.dragStartTime = Date.now();
                this.hasDragged = false;
                this.manualAngle = this.autoAngle;
                
                dragTimer = setTimeout(() => {
                    this.isDragging = true;
                }, 200);
            };

            const handleMove = (clientX, clientY) => {
                if (this.isDragging) {
                    const deltaX = clientX - this.dragStartX;
                    const deltaY = clientY - this.dragStartY;
                    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                        this.hasDragged = true;
                    }
                    this.manualAngle = this.autoAngle - deltaX * 0.01;
                } else if (dragTimer) {
                    const deltaX = clientX - this.dragStartX;
                    const deltaY = clientY - this.dragStartY;
                    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                        clearTimeout(dragTimer);
                        dragTimer = null;
                        this.isDragging = true;
                        this.hasDragged = true;
                    }
                }
            };

            const handleEnd = () => {
                if (dragTimer) {
                    clearTimeout(dragTimer);
                    dragTimer = null;
                }
                if (this.isDragging) {
                    this.autoAngleOffset = this.manualAngle - (Date.now() * 0.001 * 0.12);
                }
                this.isDragging = false;
                setTimeout(() => {
                    this.hasDragged = false;
                }, 100);
            };

            canvas.addEventListener('mousedown', (event) => {
                handleStart(event.clientX, event.clientY);
            });

            canvas.addEventListener('mousemove', (event) => {
                handleMove(event.clientX, event.clientY);
            });

            canvas.addEventListener('mouseup', handleEnd);
            canvas.addEventListener('mouseleave', handleEnd);

            canvas.addEventListener('touchstart', (event) => {
                if (event.touches.length > 0) {
                    handleStart(event.touches[0].clientX, event.touches[0].clientY);
                }
            });

            canvas.addEventListener('touchmove', (event) => {
                if (event.touches.length > 0) {
                    handleMove(event.touches[0].clientX, event.touches[0].clientY);
                }
            });

            canvas.addEventListener('touchend', handleEnd);
        }

        this.input.keyboard.on('keydown-ESC', () => {
            this.returnToGame();
        });
    }

    checkLanternClick(event) {
        console.log('点击事件触发', event.clientX, event.clientY);
        
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const rect = this.threeRenderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        console.log('鼠标坐标', mouse.x, mouse.y);
        console.log('背景孔明灯数量', this.lanternInstanceData.length);
        console.log('玩家孔明灯', this.playerLantern3D);
        console.log('带头像的背景孔明灯数量', this.backgroundAvatarMeshes.length);

        raycaster.setFromCamera(mouse, this.threeCamera);

        const allObjects = [...this.instancedLanterns];
        if (this.playerLantern3D) {
            allObjects.push(this.playerLantern3D);
        }
        for (const lanternData of this.backgroundAvatarMeshes) {
            allObjects.push(lanternData.lanternGroup);
        }

        const intersects = raycaster.intersectObjects(allObjects, true);
        
        console.log('相交数量', intersects.length);

        if (intersects.length > 0) {
            console.log('点击到孔明灯了');
            
            this.focusedBackgroundAvatarLantern = null;
            
            const intersection = intersects[0];
            let targetPosition = null;
            let clickedIndex = -1;
            let clickedBlessing = null;
            let clickedNickname = null;
            let clickedAvatar = null;
            
            let foundBackgroundAvatarLantern = null;
            for (const lanternData of this.backgroundAvatarMeshes) {
                if (intersection.object.parent === lanternData.lanternGroup || 
                    intersection.object === lanternData.lanternGroup.children[0]) {
                    foundBackgroundAvatarLantern = lanternData;
                    break;
                }
            }
            
            if (foundBackgroundAvatarLantern) {
                const time = Date.now() * 0.001;
                const currentY = foundBackgroundAvatarLantern.originalY + Math.sin(time * foundBackgroundAvatarLantern.floatSpeed + foundBackgroundAvatarLantern.floatOffset) * foundBackgroundAvatarLantern.floatAmount;
                const currentX = foundBackgroundAvatarLantern.originalX + Math.sin(time * foundBackgroundAvatarLantern.swaySpeed + foundBackgroundAvatarLantern.swayOffset) * foundBackgroundAvatarLantern.swayAmount;
                targetPosition = new THREE.Vector3(currentX, currentY, foundBackgroundAvatarLantern.originalZ);
                clickedBlessing = foundBackgroundAvatarLantern.data.blessing;
                clickedNickname = foundBackgroundAvatarLantern.data.nickname;
                clickedAvatar = foundBackgroundAvatarLantern.data.avatar;
                this.focusedBackgroundAvatarLantern = foundBackgroundAvatarLantern;
            } else if (intersection.object.isInstancedMesh) {
                const instancedMesh = intersection.object;
                const instanceId = intersection.instanceId;
                const textureIndex = this.instancedLanterns.indexOf(instancedMesh);
                
                let count = 0;
                for (let i = 0; i < this.lanternInstanceData.length; i++) {
                    if (this.lanternInstanceData[i].textureIndex === textureIndex) {
                        if (count === instanceId) {
                            const data = this.lanternInstanceData[i];
                            const time = Date.now() * 0.001;
                            const currentY = data.originalY + Math.sin(time * data.floatSpeed + data.floatOffset) * data.floatAmount;
                            const currentX = data.originalX + Math.sin(time * data.swaySpeed + data.swayOffset) * data.swayAmount;
                            targetPosition = new THREE.Vector3(currentX, currentY, data.originalZ);
                            clickedIndex = i;
                            break;
                        }
                        count++;
                    }
                }
            } else if (this.playerLantern3D && intersection.object.parent === this.playerLantern3D) {
                targetPosition = this.playerLantern3D.position.clone();
                if (this.myLantern) {
                    clickedBlessing = this.myLantern.blessing;
                    clickedNickname = this.myLantern.nickname;
                    clickedAvatar = this.myLantern.avatar;
                }
            }
            
            if (targetPosition) {
                let isAlreadyFocused = (clickedIndex >= 0 && clickedIndex === this.focusedLanternIndex);
                
                let blessingToShow = clickedBlessing;
                let nicknameToShow = clickedNickname;
                if (!blessingToShow) {
                    const blessings = [
                        '愿你马年大吉，万事如意！',
                        '恭喜发财，红包拿来！',
                        '马到成功，前程似锦！',
                        '新年快乐，阖家幸福！',
                        '身体健康，天天开心！',
                        '学业进步，工作顺利！',
                        '心想事成，梦想成真！',
                        '平安喜乐，岁岁平安！'
                    ];
                    blessingToShow = blessings[Math.floor(Math.random() * blessings.length)];
                }
                
                if (isAlreadyFocused) {
                    this.showBlessingModal(blessingToShow, nicknameToShow, clickedAvatar);
                } else if (!this.isCameraMoving) {
                    this.isCameraMoving = true;
                    this.focusedLantern = { position: targetPosition };
                    this.focusedLanternIndex = clickedIndex;
                    
                    setTimeout(() => {
                        this.showBlessingModal(blessingToShow, nicknameToShow, clickedAvatar);
                    }, 800);
                    
                    setTimeout(() => {
                        this.isCameraMoving = false;
                    }, 2000);
                }
            }
        }
    }

    showBlessingModal(blessing, nickname, avatar) {
        const blessingModal = document.getElementById('blessing-modal');
        const blessingText = document.getElementById('blessing-text');
        const blessingNickname = document.getElementById('blessing-nickname');
        const blessingAvatarContainer = document.getElementById('blessing-avatar-container');
        const blessingAvatar = document.getElementById('blessing-avatar');
        
        if (blessingModal && blessingText) {
            this.isCameraMoving = true;
            blessingText.textContent = blessing;
            
            if (blessingAvatarContainer && blessingAvatar && avatar) {
                blessingAvatar.src = avatar;
                blessingAvatarContainer.style.display = 'block';
            } else if (blessingAvatarContainer) {
                blessingAvatarContainer.style.display = 'none';
            }
            
            if (blessingNickname && nickname) {
                blessingNickname.textContent = `— ${nickname}`;
                blessingNickname.style.display = 'block';
            } else if (blessingNickname) {
                blessingNickname.textContent = '';
                blessingNickname.style.display = 'none';
            }
            
            blessingModal.style.display = 'flex';
            
            const closeHandler = () => {
                blessingModal.style.display = 'none';
                blessingModal.removeEventListener('click', closeHandler);
                this.isCameraMoving = false;
            };
            
            blessingModal.addEventListener('click', closeHandler);
        }
    }

    showReturnHint() {
        if (!this.cameras || !this.cameras.main) {
            return;
        }
        const hint = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height - 50,
            '按 ESC 键或点击右上角按钮返回游戏',
            {
                fontSize: '18px',
                color: '#ffd700',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: { left: 20, right: 20, top: 10, bottom: 10 },
                borderRadius: 10
            }
        );
        hint.setOrigin(0.5);
        hint.setScrollFactor(0);
        hint.setDepth(2000);
    }

    returnToGame() {
        const blessingModal = document.getElementById('blessing-modal');
        if (blessingModal) {
            blessingModal.style.display = 'none';
        }

        const exitBtn = document.getElementById('kongming-exit-btn');
        if (exitBtn) {
            exitBtn.style.display = 'none';
            exitBtn.onclick = null;
        }

        this.focusedLantern = null;
        this.focusedLanternIndex = -1;
        this.focusedBackgroundAvatarLantern = null;
        this.isExiting = true;
        this.isRising = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        const fadeOverlay = document.getElementById('fade-overlay');
        const gameContainer = document.getElementById('game-container');
        if (fadeOverlay) {
            fadeOverlay.style.opacity = '1';
            setTimeout(() => {
                if (this.threeRenderer && this.threeRenderer.domElement) {
                    this.threeRenderer.domElement.remove();
                }
                this.scene.stop();
                
                setTimeout(() => {
                    if (gameContainer) {
                        gameContainer.style.display = 'block';
                    }
                    if (fadeOverlay) {
                        fadeOverlay.style.opacity = '0';
                    }
                    
                    const restartHint = document.getElementById('restart-hint');
                    if (restartHint) {
                        restartHint.classList.add('active');
                        this.setupRestartListeners();
                    }
                }, 100);
            }, 1000);
        } else {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
            if (this.threeRenderer && this.threeRenderer.domElement) {
                this.threeRenderer.domElement.remove();
            }
            if (gameContainer) {
                gameContainer.style.display = 'block';
            }
            this.scene.stop();
            
            const restartHint = document.getElementById('restart-hint');
            if (restartHint) {
                restartHint.classList.add('active');
                this.setupRestartListeners();
            }
        }
    }
    
    setupRestartListeners() {
        const restartGame = () => {
            this.removeRestartListeners();
            const restartHint = document.getElementById('restart-hint');
            if (restartHint) {
                restartHint.classList.remove('active');
            }
            window.location.reload();
        };
        
        this.restartHandler = restartGame;
        
        document.addEventListener('click', this.restartHandler);
        document.addEventListener('keydown', this.restartHandler);
        document.addEventListener('touchstart', this.restartHandler);
    }
    
    removeRestartListeners() {
        if (this.restartHandler) {
            document.removeEventListener('click', this.restartHandler);
            document.removeEventListener('keydown', this.restartHandler);
            document.removeEventListener('touchstart', this.restartHandler);
            this.restartHandler = null;
        }
    }

    shutdown() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.threeRenderer && this.threeRenderer.domElement) {
            this.threeRenderer.domElement.remove();
        }
        const exitBtn = document.getElementById('kongming-exit-btn');
        if (exitBtn) {
            exitBtn.style.display = 'none';
            exitBtn.onclick = null;
        }
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.style.display = 'block';
        }
        
        this.focusedLantern = null;
        this.focusedLanternIndex = -1;
        this.focusedBackgroundAvatarLantern = null;
        
        for (const mesh of this.blessingTextMeshes) {
            if (mesh.geometry) {
                mesh.geometry.dispose();
            }
            if (mesh.material) {
                if (mesh.material.map) {
                    mesh.material.map.dispose();
                }
                mesh.material.dispose();
            }
            if (this.threeScene) {
                this.threeScene.remove(mesh);
            }
        }
        this.blessingTextMeshes = [];
        this.blessingTextData = [];
        this.blessingTextureData = [];
        this.backgroundAvatarMeshes = [];
    }
}
