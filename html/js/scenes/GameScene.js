// Copyright (c) 2026 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT
import { GAME_CONFIG } from '../config.js';
import Pathfinding from '../utils/Pathfinding.js';
import Player from '../entities/Player.js';
import NPCWithSpritesheet from '../entities/NPCWithSpritesheet.js';
import WanderingNPC from '../entities/WanderingNPC.js';
import PlumBlossomRain from '../utils/PlumBlossomRain.js';
import Firework from '../utils/Firework.js';
import AutoSpendingManager from '../utils/AutoSpendingManager.js';
import DiaryManager from '../utils/DiaryManager.js';
import AIService from '../utils/AIService.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        
        this.map = null;
        this.collisionLayer = null;
        this.interactionLayer = null;
        this.pathfinding = null;
        this.players = [];
        this.lockedPlayer = null;
        this.npcs = [];
        this.wanderingNPCs = [];
        this.walkableGrid = null;
        this.usedSpawnPositions = new Set();
        this.plumBlossomRain = null;
        this.firework = null;
        this.autoSpendingManagers = [];
        this.isCameraDragging = false;
        this.cameraDragStart = { x: 0, y: 0 };
        this.returnedHomePlayers = new Set();
        this.gameEnded = false;
        this.diaryManager = null;
        this.aiService = new AIService();
    }

    create() {
        // 再次强制设置，防止被覆盖
        this.sound.pauseOnBlur = false;
        this.game.events.off('blur');
        this.game.events.off('hidden');
        this.game.events.off('visible');

        // 重新聚焦 canvas，解决下拉框选择后焦点丢失导致无法操作的问题
        const canvas = this.game.canvas;
        if (canvas) {
            canvas.addEventListener('pointerdown', () => {
                canvas.focus();
            });
            // 确保 DOM 元素不拦截 canvas 事件
            document.getElementById('game-ui').style.pointerEvents = 'none';
            document.getElementById('camera-select').style.pointerEvents = 'auto'; // 下拉框需要交互
        }
 
        const gameUI = document.getElementById('game-ui');
        if (gameUI) {
            gameUI.classList.remove('hidden');
        }
        
        this.diaryManager = new DiaryManager();
        this.diaryManager.onDiaryUpdate = (playerId) => {
            this.updateDiaryContent(playerId);
        };
        
        this.createMap();
        this.createPathfinding();
        this.createPlayers();
        this.createNPCs();
        this.createWanderingNPCs();
        this.setupCamera();
        this.createPlumBlossomRain();
        this.setupPlayerMovement();
        this.setupCameraDrag();
        this.createAutoSpendingManagers();
        this.setupCameraSelect();
        
        this.firework = new Firework(this);

        const fireworkMessenger = this.npcs.find(npc => npc.npcName === '爆竹秦');
        if (fireworkMessenger) {
            this.firework.setFireworkPosition(fireworkMessenger.x, fireworkMessenger.y);
        }

        this.events.on('wake', () => {
            const fadeOverlay = document.getElementById('fade-overlay');
            if (fadeOverlay) {
                setTimeout(() => {
                    fadeOverlay.style.opacity = '0';
                }, 100);
            }
        });

        this.setupShortcutKeys();
    }
    
    updateDiaryContent(playerId) {
        const diaryContent = document.getElementById('diary-content');
        const diaryDisplay = document.getElementById('diary-display');
        
        if (!diaryContent || !diaryDisplay) return;
        
        if (diaryDisplay.classList.contains('hidden')) return;
        
        if (!this.lockedPlayer || this.lockedPlayer.playerId !== playerId) return;
        
        const entries = this.diaryManager.getFormattedEntries(playerId);
        
        if (entries.length === 0) {
            diaryContent.innerHTML = '<div class="diary-empty">暂无记录</div>';
        } else {
            diaryContent.innerHTML = entries.map(entry => 
                `<div class="diary-entry">${this.formatDiaryEntry(entry)}</div>`
            ).join('');
            diaryContent.scrollTop = diaryContent.scrollHeight;
        }
    }
    
    formatDiaryEntry(entry) {
        const escapeHtml = (text) => {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };
        
        if (entry.type === 'dialogue') {
            if (entry.speakerName) {
                const speakerColor = entry.speakerName === entry.npcName ? '#ff6b6b' : '#4a90d9';
                return `[${escapeHtml(entry.timestamp)}] <span style="color: ${speakerColor};">${escapeHtml(entry.speakerName)}:</span>${escapeHtml(entry.content)}`;
            } else {
                const lines = entry.content.split('\n');
                const formattedLines = lines.map(line => {
                    if (line.startsWith(entry.npcName + ':')) {
                        const content = line.substring(entry.npcName.length + 1);
                        return `<span style="color: #ff6b6b;">${escapeHtml(entry.npcName)}:</span>${escapeHtml(content)}`;
                    } else if (line.startsWith(entry.playerName + ':')) {
                        const content = line.substring(entry.playerName.length + 1);
                        return `<span style="color: #4a90d9;">${escapeHtml(entry.playerName)}:</span>${escapeHtml(content)}`;
                    }
                    return escapeHtml(line);
                });
                return `[${escapeHtml(entry.timestamp)}] 与 <span style="color: #ff6b6b;">${escapeHtml(entry.npcName)}</span> 对话:<br>${formattedLines.join('<br>')}`;
            }
        } else if (entry.type === 'spending') {
            return `<span style="color: #ffd700;">[${escapeHtml(entry.timestamp)}] 在 <span style="color: #ff6b6b;">${escapeHtml(entry.npcName)}</span> 处花费 ${entry.amount}元 ${escapeHtml(entry.action)}</span>`;
        }
        return `[${escapeHtml(entry.timestamp)}] ${escapeHtml(entry.content || '')}`;
    }
    
    setupCameraSelect() {
        const cameraSelect = document.getElementById('camera-select');
        if (!cameraSelect) return;
        
        for (let i = 0; i < this.players.length; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = this.players[i].playerName;
            cameraSelect.appendChild(option);
        }
        
        if (this.lockedPlayer) {
            cameraSelect.value = this.lockedPlayer.playerId;
        }
        
        cameraSelect.addEventListener('change', (e) => {
            const value = e.target.value;
            if (value === 'free') {
                this.unlockPlayer();
            } else {
                const playerIndex = parseInt(value);
                if (playerIndex >= 0 && playerIndex < this.players.length) {
                    this.lockToPlayer(this.players[playerIndex]);
                }
            }
        });
    }

    createMap() {
        this.map = this.make.tilemap({ key: 'map' });
        
        const tilesets = [];
        tilesets.push(this.map.addTilesetImage('blocks', 'blocks'));
        tilesets.push(this.map.addTilesetImage('new_year_bg', 'new_year_bg'));
        tilesets.push(this.map.addTilesetImage('new_year_gate', 'new_year_gate'));
        
        const hiddenLayers = [
            'Collisions',
            'Spawning-pinned',
            'Spawning-moving'
        ];
        
        const foregroundLayers = [
            'Foreground'
        ];
        
        const layers = this.map.layers;
        this.backgroundLayers = [];
        this.foregroundLayers = [];
        this.pinnedSpawnPositions = [];
        this.movingSpawnPositions = [];
        this.playerSpawn = null;
        
        const objectsLayer = this.map.getObjectLayer('Objects');
        if (objectsLayer && objectsLayer.objects) {
            for (const obj of objectsLayer.objects) {
                if (obj.name === 'Player Spawn') {
                    this.playerSpawn = {
                        x: obj.x,
                        y: obj.y
                    };
                }
            }
        }
        
        const spawningPinnedLayer = this.map.getObjectLayer('Spawning-pinned');
        if (spawningPinnedLayer && spawningPinnedLayer.objects) {
            for (const obj of spawningPinnedLayer.objects) {
                if (obj.name) {
                    this.pinnedSpawnPositions.push({ 
                        x: Math.floor(obj.x / GAME_CONFIG.TILE_SIZE), 
                        y: Math.floor(obj.y / GAME_CONFIG.TILE_SIZE),
                        name: obj.name
                    });
                }
            }
        }
        
        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            if (!hiddenLayers.includes(layer.name)) {
                const createdLayer = this.map.createLayer(i, tilesets, 0, 0);
                if (createdLayer) {
                    if (foregroundLayers.includes(layer.name)) {
                        this.foregroundLayers.push(createdLayer);
                    } else {
                        this.backgroundLayers.push(createdLayer);
                    }
                }
            } else if (layer.name === 'Spawning-moving') {
                for (let y = 0; y < layer.height; y++) {
                    for (let x = 0; x < layer.width; x++) {
                        const tile = layer.data[y]?.[x];
                        if (tile && tile.index !== -1 && tile.index !== 0) {
                            this.movingSpawnPositions.push({ x, y });
                        }
                    }
                }

            }
        }
        
        this.collisionLayer = this.map.getLayer('Collisions');
        this.interactionLayer = this.map.getLayer('Object Interaction Blocks');
        
        this.createWalkableGrid();
    }

    createWalkableGrid() {
        const width = this.map.width;
        const height = this.map.height;
        
        this.walkableGrid = [];
        
        for (let y = 0; y < height; y++) {
            this.walkableGrid[y] = [];
            for (let x = 0; x < width; x++) {
                let isWalkable = true;
                
                for (const layer of this.map.layers) {
                    if (layer.name === 'Collisions') {
                        const tile = layer.data[y]?.[x];
                        if (tile && tile.index !== -1 && tile.index !== 0) {
                            isWalkable = false;
                            break;
                        }
                    }
                }
                
                this.walkableGrid[y][x] = isWalkable ? 0 : 1;
            }
        }
        
        console.log('Walkable grid created');
    }

    createPathfinding() {
        this.pathfinding = new Pathfinding(this.walkableGrid);
    }

    isWalkable(tileX, tileY) {
        if (tileX < 0 || tileX >= this.map.width || tileY < 0 || tileY >= this.map.height) {
            return false;
        }
        return this.walkableGrid[tileY][tileX] === 0;
    }

    findPath(startX, startY, endX, endY) {
        return this.pathfinding.findPath(startX, startY, endX, endY);
    }

    findSpawnPosition(positions, excludeUsed = false) {
        if (positions && positions.length > 0) {
            let availablePositions = positions;
            
            if (excludeUsed) {
                availablePositions = positions.filter(pos => {
                    const key = `${pos.x},${pos.y}`;
                    return !this.usedSpawnPositions.has(key);
                });
            }
            
            if (availablePositions.length > 0) {
                const randomIndex = Math.floor(Math.random() * availablePositions.length);
                const pos = availablePositions[randomIndex];
                
                if (excludeUsed) {
                    const key = `${pos.x},${pos.y}`;
                    this.usedSpawnPositions.add(key);
                }
                
                return { 
                    x: pos.x * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2, 
                    y: pos.y * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2,
                    tileX: pos.x,
                    tileY: pos.y,
                    name: pos.name
                };
            }
        }
        
        return null;
    }

    isNearPlayer(x, y, maxDistance = 500) {
        if (!this.player) return false;
        const dx = x - this.player.x;
        const dy = y - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= maxDistance;
    }

    createPlayers() {
        const playerNicknames = [
            'TRAE宝', '豆包', '小华', '小丽', '小强',
            '小芳', '小军', '小燕', '小龙', '小凤'
        ];
        
        const baseTileX = 32;
        const baseTileY = 84;
        
        for (let i = 0; i < 10; i++) {
            const offsetX = Math.floor(Math.random() * 15) - 7;
            const offsetY = Math.floor(Math.random() * 15) - 7;
            
            let tileX = baseTileX + offsetX;
            let tileY = baseTileY + offsetY;
            
            if (!this.isWalkable(tileX, tileY)) {
                tileX = baseTileX;
                tileY = baseTileY;
            }
            
            const spawnX = tileX * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
            const spawnY = tileY * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
            
            let playerTexture;
            if (i === 0) {
                playerTexture = 'trae';
            } else if (i === 1) {
                playerTexture = 'doubao';
            } else if (i === 2) {
                playerTexture = 'tourist_one';
            } else if (i === 3) {
                playerTexture = 'tourist_four';
            } else if (i === 4) {
                playerTexture = 'tourist_six';
            } else if (i === 5) {
                playerTexture = 'tourist_seven';
            } else if (i === 6) {
                playerTexture = 'tourist_two';
            } else if (i === 7) {
                playerTexture = 'tourist_eight';
            } else if (i === 8) {
                playerTexture = 'tourist_five';
            } else if (i === 9) {
                playerTexture = 'tourist_three';
            } else {
                const touristTextures = ['tourist_one', 'tourist_two', 'tourist_three', 'tourist_four', 'tourist_five', 'tourist_six', 'tourist_seven', 'tourist_eight'];
                playerTexture = touristTextures[Math.floor(Math.random() * touristTextures.length)];
            }
            
            const playerNickname = playerNicknames[i];
            
            const player = new Player(
                this, 
                spawnX, 
                spawnY, 
                playerTexture,
                tileX,
                tileY
            );
            player.setDepth(100);
            player.playerName = playerNickname;
            player.setCharacterName(playerNickname);
            player.playerId = i;
            
            this.players.push(player);
            
            if (this.diaryManager) {
                this.diaryManager.initPlayer(i, playerNickname);
            }
        }
        
        this.cameras.main.startFollow(this.players[0], true, 0.1, 0.1);
        this.lockedPlayer = this.players[0];
    }
    
    updatePlayerInfo(nickname, avatar) {
        const playerNameEl = document.getElementById('player-name');
        const playerAvatarEl = document.getElementById('player-avatar');
        
        if (playerNameEl) {
            playerNameEl.textContent = nickname;
        }
        
        if (playerAvatarEl && avatar) {
            playerAvatarEl.src = avatar;
        }
    }

    createNPCs() {
        let npcConfig = null;
        try {
            npcConfig = this.cache.json.get('npc-config');
        } catch (e) {
            console.warn('[GameScene] NPC config not found');
            return;
        }
        
        if (!npcConfig || !npcConfig.npcs) {
            console.warn('[GameScene] NPC config is invalid');
            return;
        }
        
        for (const npcData of npcConfig.npcs) {
            if (this.textures.exists(npcData.filename)) {
                console.log(`[GameScene] Using spritesheet for NPC: ${npcData.name}`);
                const npc = new NPCWithSpritesheet(
                    this,
                    npcData.position.x * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2,
                    npcData.position.y * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2,
                    npcConfig,
                    npcData
                );
                npc.setDepth(100);
                this.npcs.push(npc);
            } else {
                console.warn(`[GameScene] No spritesheet found for NPC: ${npcData.name}, skipping`);
            }
        }
    }

    createWanderingNPCs() {
        const wanderingNPCConfigs = [
            {
                name: '大黄',
                texture: 'tusong_quan',
                homeX: 35,
                homeY: 50,
                hasIdleAnimation: true
            },
            {
                name: '小橘',
                texture: 'orange_cat',
                homeX: 35,
                homeY: 20,
                hasIdleAnimation: true
            }
        ];

        for (const config of wanderingNPCConfigs) {
            if (this.textures.exists(config.texture)) {
                console.log(`[GameScene] Creating wandering NPC: ${config.name}`);
                const spawnX = config.homeX * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
                const spawnY = config.homeY * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
                
                const npc = new WanderingNPC(
                    this,
                    spawnX,
                    spawnY,
                    config.texture,
                    config.homeX,
                    config.homeY,
                    config.hasIdleAnimation
                );
                npc.setDepth(100);
                npc.setCharacterName(config.name);
                this.wanderingNPCs.push(npc);
            } else {
                console.warn(`[GameScene] No texture found for wandering NPC: ${config.name}, skipping`);
            }
        }
    }

    setupCamera() {
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.centerOn(32 * GAME_CONFIG.TILE_SIZE, 84 * GAME_CONFIG.TILE_SIZE);
    }
    
    setupCameraDrag() {
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown() && !this.lockedPlayer) {
                this.isCameraDragging = true;
                this.cameraDragStart.x = pointer.x;
                this.cameraDragStart.y = pointer.y;
            }
        });
        
        this.input.on('pointermove', (pointer) => {
            if (this.isCameraDragging && !this.lockedPlayer) {
                const dx = pointer.x - this.cameraDragStart.x;
                const dy = pointer.y - this.cameraDragStart.y;
                
                this.cameras.main.scrollX -= dx;
                this.cameras.main.scrollY -= dy;
                
                this.cameraDragStart.x = pointer.x;
                this.cameraDragStart.y = pointer.y;
            }
        });
        
        this.input.on('pointerup', () => {
            this.isCameraDragging = false;
        });
    }
    
    lockToPlayer(player) {
        this.lockedPlayer = player;
        this.cameras.main.startFollow(player, true, 0.1, 0.1);
        this.showMoneyDisplay(player.playerId);
        this.showDiaryDisplay(player.playerId);
        
        const cameraSelect = document.getElementById('camera-select');
        if (cameraSelect) {
            cameraSelect.value = player.playerId;
        }
    }
    
    unlockPlayer() {
        if (this.lockedPlayer) {
            this.cameras.main.stopFollow();
            this.lockedPlayer = null;
            this.hideMoneyDisplay();
            this.hideDiaryDisplay();
            
            const cameraSelect = document.getElementById('camera-select');
            if (cameraSelect) {
                cameraSelect.value = 'free';
            }
        }
    }
    
    showDiaryDisplay(playerId) {
        const diaryDisplay = document.getElementById('diary-display');
        if (diaryDisplay) {
            diaryDisplay.classList.remove('hidden');
            this.updateDiaryContent(playerId);
        }
    }
    
    hideDiaryDisplay() {
        const diaryDisplay = document.getElementById('diary-display');
        if (diaryDisplay) {
            diaryDisplay.classList.add('hidden');
        }
    }
    
    showMoneyDisplay(playerId) {
        const moneyEl = document.getElementById('money-display');
        if (moneyEl) {
            moneyEl.classList.remove('hidden');
            const manager = this.autoSpendingManagers[playerId];
            if (manager) {
                moneyEl.textContent = `剩余金额: ${manager.money}元`;
            }
        }
    }
    
    hideMoneyDisplay() {
        const moneyEl = document.getElementById('money-display');
        if (moneyEl) {
            moneyEl.classList.add('hidden');
        }
    }
    
    onPlayerReturnedHome(playerId) {
        if (this.gameEnded) return;
        
        this.returnedHomePlayers.add(playerId);
        
        if (this.returnedHomePlayers.size === this.players.length) {
            this.endGame();
        }
    }
    
    endGame() {
        if (this.gameEnded) return;
        
        this.gameEnded = true;
        
        this.unlockPlayer();
        
        this.cameras.main.stopFollow();
        
        this.isCameraDragging = false;
        this.input.off('pointerdown');
        this.input.off('pointermove');
        this.input.off('pointerup');
        
        for (const player of this.players) {
            player.disableInteractive();
        }
        
        for (const manager of Object.values(this.autoSpendingManagers)) {
            if (manager && manager.destroy) {
                manager.destroy();
            }
        }
        
        this.cameras.main.pan(
            33 * GAME_CONFIG.TILE_SIZE,
            14 * GAME_CONFIG.TILE_SIZE,
            2000,
            'Power2',
            true,
            (camera, progress) => {
                if (progress === 1) {
                    this.time.delayedCall(500, () => {
                        this.launchFinalKongmingLanterns();
                    }, [], this);
                }
            }
        );
    }
    
    async launchFinalKongmingLanterns() {
        const x = 33 * GAME_CONFIG.TILE_SIZE;
        const y = 14 * GAME_CONFIG.TILE_SIZE;
        
        let blessing;
        try {
            blessing = await this.aiService.generateBlessingText('kongming');
        } catch (error) {
            console.error('[GameScene] Error generating kongming blessing:', error);
            const blessings = [
                '马年大吉！',
                '万事如意！',
                '心想事成！',
                '步步高升！',
                '年年有余！',
                '马到成功！',
                '一马当先！',
                '龙马精神！',
                '车水马龙！',
                '天马行空！'
            ];
            blessing = blessings[Math.floor(Math.random() * blessings.length)];
        }
        
        this.scene.launch('KongmingLanternScene', {
            x: x,
            y: y,
            blessing: blessing,
            myLantern: null,
            lanterns: null
        });
    }

    createPlumBlossomRain() {
        this.plumBlossomRain = new PlumBlossomRain(this);
        this.plumBlossomRain.start();
    }

    setupPlayerMovement() {
    }

    createAutoSpendingManagers() {
        for (let i = 0; i < this.players.length; i++) {
            const manager = new AutoSpendingManager(this, this.players[i], this.diaryManager);
            manager.onMoneyChange = (money) => {
                if (this.lockedPlayer && this.lockedPlayer.playerId === i) {
                    this.showMoneyDisplay(i);
                }
            };
            manager.start();
            this.autoSpendingManagers.push(manager);
        }
        
        if (this.lockedPlayer) {
            this.showMoneyDisplay(this.lockedPlayer.playerId);
            this.showDiaryDisplay(this.lockedPlayer.playerId);
        }
    }

    update(time, delta) {
        for (const player of this.players) {
            player.update(time, delta);
        }
        
        for (const npc of this.npcs) {
            npc.update(time, delta);
        }
        
        for (const npc of this.wanderingNPCs) {
            npc.update(time, delta);
        }
        
        if (this.plumBlossomRain) {
            this.plumBlossomRain.update(time, delta);
        }
        
        if (this.firework) {
            this.firework.update(time, delta);
        }
        
        for (const manager of this.autoSpendingManagers) {
            manager.update(time, delta);
        }
        
        this.updateLayerDepths();
    }
    
    updateLayerDepths() {
        let depth = 0;
        
        for (const layer of this.backgroundLayers) {
            layer.setDepth(depth);
            depth++;
        }
        
        for (const player of this.players) {
            player.setDepth(depth + player.y);
            if (player.nameText) {
                player.nameText.setDepth(depth + player.y + 1);
            }
            if (player.shadow) {
                player.shadow.setDepth(depth + player.y - 1);
            }
        }
        
        for (const npc of this.npcs) {
            npc.setDepth(depth + npc.y);
            if (npc.nameText) {
                npc.nameText.setDepth(depth + npc.y + 1);
            }
            if (npc.shadow) {
                npc.shadow.setDepth(depth + npc.y - 1);
            }
        }
        
        for (const npc of this.wanderingNPCs) {
            npc.setDepth(depth + npc.y);
            if (npc.nameText) {
                npc.nameText.setDepth(depth + npc.y + 1);
            }
            if (npc.shadow) {
                npc.shadow.setDepth(depth + npc.y - 1);
            }
        }
        
        depth += this.map.heightInPixels;
        
        for (const layer of this.foregroundLayers) {
            layer.setDepth(depth);
            depth++;
        }
    }

    setupShortcutKeys() {
        this.keys = {
            O: this.input.keyboard.addKey('O'),
            K: this.input.keyboard.addKey('K')
        };

        this.input.keyboard.on('keydown', (event) => {
            if (this.keys.O.isDown && this.keys.K.isDown) {
                this.triggerGameEnd();
            }
        });
    }

    triggerGameEnd() {
        if (this.gameEnded) return;
        
        console.log('[GameScene] 快捷键触发游戏结束');
        
        for (const player of this.players) {
            this.returnedHomePlayers.add(player.playerId);
        }
        
        this.endGame();
    }
}