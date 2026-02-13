// Copyright (c) 2026 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT
class ChatBubble {
    constructor(scene, character, text) {
        this.scene = scene;
        this.character = character;
        this.container = document.getElementById('chat-bubbles');
        this.bubble = null;
        this.lineCount = 1;
        
        this.createBubble(text);
    }

    wrapText(text, maxLength = 30) {
        if (!text) return '';
        const lines = [];
        let currentLine = '';
        
        for (let i = 0; i < text.length; i++) {
            currentLine += text[i];
            if (currentLine.length >= maxLength) {
                lines.push(currentLine);
                currentLine = '';
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        this.lineCount = lines.length;
        return lines.join('\n');
    }

    createBubble(text) {
        this.bubble = document.createElement('div');
        this.bubble.className = 'chat-bubble';
        this.bubble.textContent = this.wrapText(text);
        this.bubble.style.whiteSpace = 'pre-wrap';
        
        this.container.appendChild(this.bubble);
        this.updatePosition();
    }

    updateText(text) {
        if (this.bubble) {
            this.bubble.textContent = this.wrapText(text);
            this.updatePosition();
        }
    }

    updatePosition() {
        if (!this.bubble || !this.scene || !this.scene.cameras || !this.scene.cameras.main) return;

        const camera = this.scene.cameras.main;
        const screenX = this.character.x - camera.scrollX;
        const screenY = this.character.y - camera.scrollY;
        const baseOffsetY = this.character.useAtlas ? 15 : 20;
        const lineHeight = 14;
        const offsetY = baseOffsetY + (this.lineCount - 1) * lineHeight;
        
        this.bubble.style.left = `${screenX}px`;
        this.bubble.style.top = `${screenY - offsetY}px`;
    }

    destroy() {
        if (this.bubble) {
            this.bubble.remove();
            this.bubble = null;
        }
    }
}

export default ChatBubble;
