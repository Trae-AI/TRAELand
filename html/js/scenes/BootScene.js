// Copyright (c) 2026 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT
import { GAME_CONFIG } from '../config.js';

const LOAD_PHASES = {
    METADATA: 1,
    MAP_RESOURCES: 2,
    OTHER_RESOURCES: 3
};

const NPC_FILENAMES = [
    'village_head',
    'aunt_wang',
    'uncle_zhao',
    'boss_qian',
    'administrator',
    'aunt_wang_po',
    'teacher_zhang',
    'aunt_da',
    'kongming_messenger',
    'firework_messenger',
    'tourist_six',
    'trae',
    'department_store_owner',
    'firework_owner',
    'afanti'
];

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
        this.loadedNPCs = new Set();
        this.mapData = null;
        this.phase = LOAD_PHASES.METADATA;
    }

    preload() {
        console.log('[BootScene] Starting preload: metadata phase...');
        this.load.on('filecomplete', (key, type, data) => {
            console.log(`[BootScene] Loaded: ${key} (${type})`);
            this.onFileComplete(key, type, data);
        });
        this.load.on('loaderror', (file) => {
            console.error(`[BootScene] Failed to load: ${file.key}`);
            this.onLoadError(file);
        });
        
        this.load.json('npc-config', '/js/data/npc-config.json');
        this.load.json('map-json', '/assets/map/new_year.json');
        
        this.createLoadingBar();
    }
    
    onFileComplete(key, type, data) {
        if (type === 'atlasjson' && NPC_FILENAMES.includes(key)) {
            this.loadedNPCs.add(key);
        }
        if (key === 'map-json' && type === 'json') {
            this.mapData = data;
        }
    }
    
    onLoadError(file) {
        console.error(`[NPC Asset] Failed to load: ${file.key}`);
    }
    
    loadMapResources() {
        if (!this.mapData || !this.mapData.tilesets) {
            console.error('[BootScene] No map data or tilesets found');
            return;
        }
        
        const mapBasePath = '/assets/map/';
        
        this.mapData.tilesets.forEach(tileset => {
            const key = tileset.name;
            const imagePath = mapBasePath + tileset.image;
            console.log(`[BootScene] Loading tileset: ${key} from ${imagePath}`);
            this.load.image(key, imagePath);
        });
    }
    
    loadOtherResources() {
        const charactersPath = '/assets/characters/';
        
        this.load.atlas('doubao', charactersPath + 'doubao.png', charactersPath + 'doubao.atlas.json');
        this.load.atlas('trae', charactersPath + 'trae.png', charactersPath + 'trae.atlas.json');
        this.load.atlas('tourist_six', charactersPath + 'tourist_six.png', charactersPath + 'tourist_six.atlas.json');
        this.load.atlas('tourist_one', charactersPath + 'tourist_one.png', charactersPath + 'tourist_one.atlas.json');
        this.load.atlas('tourist_five', charactersPath + 'tourist_five.png', charactersPath + 'tourist_five.atlas.json');
        this.load.atlas('tourist_four', charactersPath + 'tourist_four.png', charactersPath + 'tourist_four.atlas.json');
        this.load.atlas('tourist_three', charactersPath + 'tourist_three.png', charactersPath + 'tourist_three.atlas.json');
        this.load.atlas('tourist_two', charactersPath + 'tourist_two.png', charactersPath + 'tourist_two.atlas.json');
        this.load.atlas('tourist_seven', charactersPath + 'tourist_seven.png', charactersPath + 'tourist_seven.atlas.json');
        this.load.atlas('tourist_eight', charactersPath + 'tourist_eight.png', charactersPath + 'tourist_eight.atlas.json');
        this.load.atlas('tusong_quan', charactersPath + 'tusong_quan.png', charactersPath + 'tusong_quan.atlas.json');
        this.load.atlas('orange_cat', charactersPath + 'orange_cat.png', charactersPath + 'orange_cat.atlas.json');
        
        this.load.image('flash', '/assets/firework/flash.png');
        this.load.image('firework_fish', '/assets/firework/images/fish.png');
        this.load.image('firework_horse', '/assets/firework/images/horse.png');
        this.load.image('firework_2026', '/assets/firework/images/2026.png');
        this.load.image('kongming_1', '/assets/kongming/1.png');
        this.load.image('kongming_3', '/assets/kongming/3.png');
        this.load.image('kongming_5', '/assets/kongming/5.png');
        this.load.audio('firework_launch', '/assets/firework/launch.wav');
        this.load.audio('firework_explode', '/assets/firework/explode.mp3');
        NPC_FILENAMES.forEach(filename => {
            const basePath = charactersPath + filename;
            this.load.atlas(filename, basePath + '.png', basePath + '.atlas.json');
        });
    }

    createLoadingBar() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        this.progressBar = this.add.graphics();
        this.progressBox = this.add.graphics();
        
        this.progressBox.fillStyle(0x222222, 0.8);
        this.progressBox.fillRect(width / 2 - 160, height / 2 - 30, 320, 50);
        
        this.loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Loading...',
            style: {
                font: '20px monospace',
                fill: '#ffffff'
            }
        });
        this.loadingText.setOrigin(0.5, 0.5);
        
        this.percentText = this.make.text({
            x: width / 2,
            y: height / 2,
            text: '0%',
            style: {
                font: '18px monospace',
                fill: '#ffffff'
            }
        });
        this.percentText.setOrigin(0.5, 0.5);
    }
    
    updateLoadingBar(value) {
        if (this.percentText && this.progressBar) {
            this.percentText.setText(parseInt(value * 100) + '%');
            this.progressBar.clear();
            this.progressBar.fillStyle(0xffffff, 1);
            const width = this.cameras.main.width;
            const height = this.cameras.main.height;
            this.progressBar.fillRect(width / 2 - 150, height / 2 - 20, 300 * value, 30);
        }
    }
    
    destroyLoadingBar() {
        if (this.progressBar) this.progressBar.destroy();
        if (this.progressBox) this.progressBox.destroy();
        if (this.loadingText) this.loadingText.destroy();
        if (this.percentText) this.percentText.destroy();
    }

    create() {
        // 恢复 pauseOnBlur = false 以确保后台播放，但移除之前过于激进的 off 调用
        this.sound.pauseOnBlur = false;
        
        // 关键：禁用可见性改变时的暂停，替代之前的事件移除
        this.game.events.off('blur');
        this.game.events.off('hidden');
        this.game.events.off('visible');
        
        // 确保音频上下文在用户交互后恢复（针对现代浏览器的自动播放策略）
        if (this.sound.context.state === 'suspended') {
            this.input.once('pointerdown', () => {
                this.sound.context.resume();
            });
        }
        
        // this.createAnimations(); // 移除这行，因为 BootScene 中没有定义这个方法

        console.log('[BootScene] Metadata phase complete, starting map resources phase...');
        
        this.load.on('progress', (value) => {
            this.updateLoadingBar(value);
        });
        
        this.load.on('complete', () => {
            if (this.phase === LOAD_PHASES.MAP_RESOURCES) {
                console.log('[BootScene] Map resources phase complete, starting other resources phase...');
                this.phase = LOAD_PHASES.OTHER_RESOURCES;
                this.loadOtherResources();
                this.load.tilemapTiledJSON('map', '/assets/map/new_year.json');
                this.load.start();
            } else if (this.phase === LOAD_PHASES.OTHER_RESOURCES) {
                console.log('[BootScene] All resources loaded!');
                this.destroyLoadingBar();
                this.scene.start('GameScene');
            }
        });
        
        this.phase = LOAD_PHASES.MAP_RESOURCES;
        this.loadMapResources();
        this.load.start();
    }
}
