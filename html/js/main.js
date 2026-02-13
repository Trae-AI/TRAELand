// Copyright (c) 2026 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT
import { GAME_CONFIG } from './config.js';
import BootScene from './scenes/BootScene.js';
import GameScene from './scenes/GameScene.js';
import KongmingLanternScene from './scenes/KongmingLanternScene.js';

const randomNames = [
    '小明', '小红', '小华', '小丽', '小强', '小芳', '小军', '小燕',
    '小龙', '小凤', '小虎', '小兔', '小马', '小羊', '小猴', '小鸡',
    '小狗', '小猪', '小牛', '小蛇', '小老鼠', '小老虎', '小兔子', '小龙龙',
    '小蛇蛇', '小马马', '小羊羊', '小猴猴', '小鸡鸡', '小狗狗', '小猪猪', '小牛牛',
    '阿福', '阿寿', '阿喜', '阿财', '阿宝', '阿贝', '阿龙', '阿凤',
    '福星', '寿星', '喜星', '财星', '宝星', '贝星', '龙星', '凤星',
    '新春快乐', '恭喜发财', '万事如意', '心想事成', '步步高升', '年年有余',
    '马到成功', '一马当先', '龙马精神', '车水马龙', '天马行空', '快马加鞭'
];

function getRandomName() {
    return randomNames[Math.floor(Math.random() * randomNames.length)];
}

let playerNickname = getRandomName();
let playerAvatar = '';
let game = null;

const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;
const PORTRAIT_BASE_WIDTH = 720;
const PORTRAIT_BASE_HEIGHT = 1280;

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
}

const isMobile = isMobileDevice();
window.isMobileDevice = isMobile;

const config = {
    type: Phaser.AUTO,
    // 添加 autoFocus: true 恢复 Phaser 对焦点的自动管理，但通过 disableVisibilityChange 控制暂停
    autoFocus: true,
    width: isMobile ? PORTRAIT_BASE_WIDTH : BASE_WIDTH,
    height: isMobile ? PORTRAIT_BASE_HEIGHT : BASE_HEIGHT,
    parent: 'game-container',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    audio: {
        disableWebAudio: false
    },
    scene: [BootScene, GameScene, KongmingLanternScene],
    scale: {
        mode: Phaser.Scale.ENVELOP,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
            width: 320,
            height: 240
        },
        max: {
            width: 3840,
            height: 2160
        }
    }
};

function startGame() {
    game = new Phaser.Game(config);
}

window.getPlayerNickname = function() {
    return playerNickname;
};

window.getPlayerAvatar = function() {
    return playerAvatar;
};

window.getNetworkManager = function() {
    return null;
};

function showErrorModal(message) {
    const errorModal = document.getElementById('error-modal');
    const errorText = document.getElementById('error-text');
    const errorClose = document.getElementById('error-close');
    
    if (errorModal && errorText && errorClose) {
        errorText.textContent = message;
        errorModal.classList.add('active');
        
        const closeHandler = () => {
            errorModal.classList.remove('active');
            errorClose.removeEventListener('click', closeHandler);
            errorModal.removeEventListener('click', modalClickHandler);
        };
        
        const modalClickHandler = (e) => {
            if (e.target === errorModal) {
                closeHandler();
            }
        };
        
        errorClose.addEventListener('click', closeHandler);
        errorModal.addEventListener('click', modalClickHandler);
    }
}

window.showErrorModal = showErrorModal;

startGame();
