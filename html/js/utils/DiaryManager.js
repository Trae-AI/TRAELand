// Copyright (c) 2026 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT
export default class DiaryManager {
    constructor() {
        this.diaries = new Map();
        this.onDiaryUpdate = null;
    }

    initPlayer(playerId, playerName) {
        if (!this.diaries.has(playerId)) {
            this.diaries.set(playerId, {
                playerName: playerName,
                entries: []
            });
        }
    }

    addEntry(playerId, entry) {
        const diary = this.diaries.get(playerId);
        if (!diary) return;

        const timestamp = new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        diary.entries.push({
            timestamp: timestamp,
            ...entry
        });

        if (this.onDiaryUpdate) {
            this.onDiaryUpdate(playerId);
        }
    }

    addSingleDialogueLine(playerId, npcName, speakerName, text) {
        const diary = this.diaries.get(playerId);
        if (!diary) return;

        this.addEntry(playerId, {
            type: 'dialogue',
            npcName: npcName,
            playerName: diary.playerName,
            speakerName: speakerName,
            content: text
        });
    }

    addDialogueEntry(playerId, npcName, npcDialogues, playerDialogues) {
        const diary = this.diaries.get(playerId);
        if (!diary) return;

        const playerName = diary.playerName;
        const dialogueText = [];
        for (let i = 0; i < npcDialogues.length; i++) {
            if (npcDialogues[i]) {
                dialogueText.push(`${npcName}: ${npcDialogues[i]}`);
            }
            if (playerDialogues[i]) {
                dialogueText.push(`${playerName}: ${playerDialogues[i]}`);
            }
        }

        this.addEntry(playerId, {
            type: 'dialogue',
            npcName: npcName,
            playerName: playerName,
            content: dialogueText.join('\n')
        });
    }

    addSpendingEntry(playerId, npcName, amount, action) {
        const diary = this.diaries.get(playerId);
        if (!diary) return;

        this.addEntry(playerId, {
            type: 'spending',
            npcName: npcName,
            playerName: diary.playerName,
            amount: amount,
            action: action
        });
    }

    getDiary(playerId) {
        return this.diaries.get(playerId);
    }

    getFormattedEntries(playerId) {
        const diary = this.diaries.get(playerId);
        if (!diary) return [];

        return diary.entries.map(entry => {
            return entry;
        });
    }

    getAllPlayerIds() {
        return Array.from(this.diaries.keys());
    }
}
