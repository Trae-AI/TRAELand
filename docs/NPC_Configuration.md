# 如何添加新 NPC

**本文档专为大模型编写，用于指导大模型向游戏中添加新 NPC 角色。**

本文档说明如何向游戏中添加带有动画精灵的新 NPC 角色。

---

## 概述

添加新 NPC 涉及三个主要步骤：
1. 准备动画资源 (PNG + atlas JSON)
2. 更新配置文件
3. 更新游戏场景以使用新 NPC

---

## 步骤 1: 准备动画资源

首先，你需要根据 `character-animation-spec.md` 中的规范创建动画资源。

### 必需文件

每个 NPC 需要两个文件：
- `{npc_key}.png` - Spritesheet 图片
- `{npc_key}.atlas.json` - Atlas 配置文件

### 文件位置

将这些文件放置在：
```
assets/characters/
```

### 示例

对于名为 "王大妈" (Aunt Wang) 的 NPC，其 key 为 `aunt_wang`：
```
assets/characters/aunt_wang.png
assets/characters/aunt_wang.atlas.json
```

---

## 步骤 2: 更新配置文件

### 2.1 更新 `html/js/scenes/BootScene.js`

将新 NPC key 添加到 `NPC_FILENAMES` 数组中：

```javascript
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
```

### 2.2 更新 `html/js/data/npc-config.json`

将新 NPC 添加到 `npcs` 数组中：

```json
{
  "npcs": [
    {
      "name": "王大妈",
      "filename": "aunt_wang",
      "type": "pinned",
      "position": { "x": 30, "y": 50 }
    }
  ]
}
```

### 2.3 更新 `html/js/data/MerchantData.js`

添加新 NPC 的对话和商品信息：

```javascript
export const MERCHANT_DATA = {
    '王大妈': {
        product: '炸元宵',
        price: 25,
        dialogues: {
            npc: [
                '对话内容1',
                '对话内容2',
                '对话内容3',
                '对话内容4',
                '对话内容5',
                '对话内容6'
            ],
            player: [
                '对话内容1',
                '对话内容2',
                '对话内容3',
                '对话内容4',
                '对话内容5',
                '对话内容6'
            ]
        }
    }
};
```

**重要提示**: 确保 `npc` 和 `player` 的对话数量相同！

---

## 步骤 3: 测试 NPC

1. 启动游戏服务器：
   ```bash
   cd html
   python -m http.server 8000
   ```

2. 在浏览器中打开游戏：
   ```
   http://localhost:8000/index.html
   ```

3. 验证以下内容：
   - NPC 出现在正确位置
   - Idle 动画正确播放
   - NPC 说话时 Special 动画播放
   - 对话功能正常工作
   - 自动消费系统能与 NPC 交互

---

## 文件汇总

以下是所有需要修改或添加的文件的汇总：

### 需要添加的文件
- `assets/characters/{npc_key}.png`
- `assets/characters/{npc_key}.atlas.json`

### 需要修改的文件
1. `html/js/scenes/BootScene.js` - 添加到 `NPC_FILENAMES`
2. `html/js/data/npc-config.json` - 添加 NPC 配置
3. `html/js/data/MerchantData.js` - 添加 NPC 对话和商品

---

## 示例: 添加 "王大妈" (Aunt Wang)

### 1. 准备资源
```
assets/characters/aunt_wang.png
assets/characters/aunt_wang.atlas.json
```

### 2. 更新 `BootScene.js`
```javascript
const NPC_FILENAMES = [..., 'aunt_wang'];
```

### 3. 更新 `npc-config.json`
```json
{
  "name": "王大妈",
  "filename": "aunt_wang",
  "type": "pinned",
  "position": { "x": 30, "y": 50 }
}
```

### 4. 更新 `MerchantData.js`
```javascript
'王大妈': {
    product: '炸元宵',
    price: 25,
    dialogues: {
        npc: [
            '对话内容1',
            '对话内容2',
            '对话内容3',
            '对话内容4',
            '对话内容5',
            '对话内容6'
        ],
        player: [
            '对话内容1',
            '对话内容2',
            '对话内容3',
            '对话内容4',
            '对话内容5',
            '对话内容6'
        ]
    }
}
```

---

## 故障排除

### NPC 未显示
- 检查 atlas 文件是否在正确位置
- 验证 key 是否已添加到所有配置文件
- 检查浏览器控制台是否有加载错误

### 动画未播放
- 验证 atlas JSON 格式是否正确
- 检查帧名称是否符合规范 (`idle.000`, `special.000` 等)
- 确保 spritesheet 尺寸正确 (600x200 像素)

### 对话不工作
- 确保 `npc-config.json` 中的 NPC 名称与 `MerchantData.js` 中的 key 匹配
- 验证 `npc` 和 `player` 对话数量是否相同
- 检查浏览器控制台是否有错误

---

## 参考

- 动画资源规范: `character-animation-spec.md`
- 现有 NPC 示例: `village_head`, `aunt_wang`, `boss_qian` 等

---

**文档版本**: v2.1  
**最后更新**: 2026-02-12  
**作者**: Trae AI 助手
