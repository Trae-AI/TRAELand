// Copyright (c) 2026 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT
export const GAME_CONFIG = {
    GAME_WIDTH: 1280,
    GAME_HEIGHT: 720,
    TILE_SIZE: 32,
    MAP_WIDTH: 64,
    MAP_HEIGHT: 64,
    PLAYER_SPEED: 150,
    NPC_SPEED: 100,
    
    SHOPKEEPER_DIALOGUES: [
        '快来看看新鲜的年货啦！',
        '马年大吉，万事如意！',
        '新年好呀，里面请！',
        '本店商品应有尽有！',
        '恭喜发财，红包拿来！',
        '新春特惠，全场八折！',
        '过年好，需要点什么？',
        '马年行大运，好运连连！',
        '欢迎光临，随便看看！',
        '新年新气象，祝您新年快乐！'
    ],
    
    DIALOGUE_TEMPLATES: [
        {
            name: '买年货',
            lines: [
                { speaker: 'npc', text: '新年好呀！来看看我们家的年货吧！' },
                { speaker: 'player', text: '好的，都有什么好东西呀？' },
                { speaker: 'follower', text: '我也要我也要！我要吃糖葫芦！' },
                { speaker: 'npc', text: '好好好！都有都有！我们有春联、福字、灯笼，还有各种好吃的！' },
                { speaker: 'player', text: '那给我来一副春联和两个灯笼吧！' },
                { speaker: 'follower', text: '还有糖葫芦！别忘了糖葫芦！' },
                { speaker: 'npc', text: '好嘞好嘞！都给你们准备好！祝您马年大吉，万事如意！' }
            ]
        },
        {
            name: '拜年',
            lines: [
                { speaker: 'npc', text: '过年好！给您拜年啦！' },
                { speaker: 'player', text: '拜年拜年！您也新年好！' },
                { speaker: 'follower', text: '恭喜发财！红包拿来！' },
                { speaker: 'npc', text: '哈哈，这孩子真可爱！今年是马年，祝您马到成功！' },
                { speaker: 'player', text: '谢谢！也祝您生意兴隆！' },
                { speaker: 'follower', text: '祝老板生意兴隆，财源广进！' },
                { speaker: 'npc', text: '借你们吉言！有空常来坐啊！' }
            ]
        },
        {
            name: '问天气',
            lines: [
                { speaker: 'npc', text: '今天天气真不错，适合出来逛庙会！' },
                { speaker: 'player', text: '是啊，阳光明媚的！' },
                { speaker: 'follower', text: '就是有点冷，要是有热饮就好了！' },
                { speaker: 'npc', text: '听说明天还有舞龙舞狮表演呢！' },
                { speaker: 'player', text: '真的吗？那我明天一定要来看！' },
                { speaker: 'follower', text: '我也要来！我要坐最前面！' },
                { speaker: 'npc', text: '好啊！明天早点来，占个好位置！' }
            ]
        },
        {
            name: '聊美食',
            lines: [
                { speaker: 'npc', text: '逛累了吧？来尝尝我们家的糖葫芦！' },
                { speaker: 'follower', text: '糖葫芦！我最爱吃糖葫芦了！' },
                { speaker: 'player', text: '好呀！我也来一串！' },
                { speaker: 'npc', text: '还有糖画、捏面人，都是老手艺了！' },
                { speaker: 'follower', text: '哇！我要糖画！我要画一条龙！' },
                { speaker: 'player', text: '哇，这么多好吃的！我都要尝尝！' },
                { speaker: 'npc', text: '慢慢吃，别着急！庙会热闹着呢！' }
            ]
        },
        {
            name: '讨红包',
            lines: [
                { speaker: 'npc', text: '小朋友，过年好！' },
                { speaker: 'follower', text: '过年好！恭喜发财！红包拿来！' },
                { speaker: 'player', text: '叔叔阿姨过年好！恭喜发财！' },
                { speaker: 'npc', text: '真乖！来，给你们红包！' },
                { speaker: 'follower', text: '谢谢老板！老板大气！' },
                { speaker: 'player', text: '谢谢叔叔阿姨！' },
                { speaker: 'npc', text: '不客气！祝你们新的一年万事如意！' }
            ]
        },
        {
            name: '看表演',
            lines: [
                { speaker: 'npc', text: '前面广场有表演，快去看啊！' },
                { speaker: 'follower', text: '表演！什么表演？我要去看！' },
                { speaker: 'player', text: '是什么表演呀？' },
                { speaker: 'npc', text: '有踩高跷、扭秧歌，还有唱戏的！' },
                { speaker: 'follower', text: '这么精彩！快走快走！' },
                { speaker: 'player', text: '这么精彩！我现在就去！' },
                { speaker: 'npc', text: '快去吧！晚了就没好位置了！' }
            ]
        }
    ],
    
    NPC_COUNT: 10,
    NPC_CHAT_INTERVAL: { min: 5000, max: 15000 },
    NPC_CHAT_DURATION: 3000,
    NPC_MOVE_INTERVAL: { min: 3000, max: 8000 },
    
    FOLLOWER_DIALOGUES: [
        '哎，好无聊，你怎么不理我呀 😢',
        '你知道为什么马年要骑马吗？因为马上有钱！🐴💰',
        '哇！前面好热闹！我们去看看吧！👀',
        '从前有个人叫小明，小明没听见...',
        '走了这么久，腿都酸了，你不累吗？🦵',
        '我跟你说，我昨天吃了一碗面，叫"好想见你一面"🍜',
        '你看那个灯笼好漂亮！🏮',
        '你知道什么动物最容易摔倒吗？狐狸，因为它很狡猾（脚滑）🦊',
        '我觉得我今天有点怪，怪可爱的 😜',
        '哎，你走慢点等等我呀！',
        '你知道为什么海是蓝色的吗？因为小鱼在水里吐泡泡：blue blue blue...🐟',
        '这个糖葫芦看起来好好吃！🍡',
        '从前有座山，山里有座庙，庙里有个老和尚在给小和尚讲故事...',
        '你怎么不说话呀？是在想事情吗？🤔',
        '我跟你说个秘密，我其实是个隐形富豪，至今还没找到自己的钱 💸',
        '哇！有舞龙表演！🐲',
        '你知道什么东西越洗越脏吗？水！',
        '我觉得我们现在的关系就像数学题，解不开',
        '好累呀，我们找个地方休息一下吧？😴',
        '从前有只羊在草地上吃草，草吃完了羊就走了，猜一种水果：草莓（草没）🍓',
        '你知道为什么熊猫总是黑眼圈吗？因为它熬夜玩手机 🐼📱',
        '你看那个糖画好厉害！🍬',
        '我跟你说，我最近在减肥，但是越减越肥，因为我叫"不减" 😂',
        '哎，你有没有在听我说话呀？',
        '你知道什么东西有头没有脚吗？蒜！🧄',
        '这个福字写得真好！🧧',
        '从前有个人钓鱼，钓了一只鱿鱼，鱿鱼说："你放了我吧"，那个人说："我考你几个问题"，鱿鱼说："你考吧你考吧"，然后那个人就把鱿鱼烤了 🦑',
        '你知道为什么蜜蜂嗡嗡叫吗？因为它不会唱歌啊 🐝',
        '我跟你说，我昨天做了个梦，梦见自己在考试，醒来发现真的在考试 😱',
        '你知道什么动物最没有方向感吗？麋鹿（迷路）🦌',
        '从前有个包子走在路上，觉得饿了，就把自己吃了 🥟',
        '你知道为什么电脑永远不会感冒吗？因为它有Windows（窗户）💻',
        '哇！烟花好漂亮！🎆',
        '哎，好无聊，我们来玩个游戏吧？',
        '你看那个捏面人好可爱！🎭'
    ],
    FOLLOWER_CHAT_INTERVAL: { min: 5000, max: 10000 },
    
    KONGMING_LANTERN: {
        RISE_DURATION: 10000,
        BACKGROUND_LANTERN_COUNT: 40,
        STAR_COUNT: 200
    }
};
