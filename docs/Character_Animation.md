# 马年庙会 - 角色动画资源规范

**本文档专为大模型编写，用于指导大模型创建和配置游戏角色动画资源。**

## 概述

本文档定义了游戏中 NPC 角色动画资源的技术规范，包括文件格式、尺寸要求、动画状态、命名约定等。

---

## 1. 核心规范

### 1.1 像素画风格要求

- **风格**: 2D Pixel Art (2D 像素画)
- **颜色**: 建议使用有限的调色板（16-32 色）以保持像素艺术感
- **线条**: 清晰的像素边缘，避免模糊
- **比例**: 与现有角色保持一致的像素密度

### 1.2 资源规格 (仅一种方案)

| 项目 | 规格 |
|-----|------|
| Frame Size (帧尺寸) | 100x100 pixels |
| Anchor Point (锚点) | x=0.5, y=0.7 (底部中心，略微靠上) |
| Directions (方向) | 1 direction (仅正面) |
| Animation States (动画状态) | 2 states (idle / special) |
| Frames per Animation (每组动画帧数) | 6 frames |
| File Format (文件格式) | PNG-8 或 PNG-24 (支持透明背景) |

---

## 2. 文件格式

### 2.1 文件组成

每个 NPC 角色需要两个文件：

1. **Spritesheet Image**: `.png` 格式
2. **Atlas Configuration File**: `.atlas.json` 格式

### 2.2 命名约定

**文件命名** (使用英文):
```
aunt_wang.png          # 王大妈 spritesheet
aunt_wang.atlas.json   # 王大妈 atlas 配置
sun_er_niang.png       # 孙二娘 spritesheet
sun_er_niang.atlas.json # 孙二娘 atlas 配置
```

**帧命名约定**:
```
idle.{index}
special.{index}
```

示例:
- `idle.000` - Idle 第 1 帧
- `idle.001` - Idle 第 2 帧
- `special.000` - Special 动作第 1 帧
- `special.001` - Special 动作第 2 帧

---

## 3. 帧尺寸和布局

### 3.1 Frame Size (帧尺寸)

- **Size**: `100x100` pixels
- **Anchor Point**: `x=0.5, y=0.7` (底部中心，略微靠上)

### 3.2 Spritesheet Layout (精灵表布局)

**排列方式：4 行 × 3 列，帧之间无间距**:
```
Row 0: 3 frames of idle animation (idle.000, idle.001, idle.002)
Row 1: 3 frames of idle animation (idle.003, idle.004, idle.005)
Row 2: 3 frames of special animation (special.000, special.001, special.002)
Row 3: 3 frames of special animation (special.003, special.004, special.005)
```

**Total Size (总尺寸)**: 300x400 pixels (精确，无间距)

**Frame Dimensions (帧尺寸)**:
- 每一帧: 100x100 pixels (与角色原画完全匹配)

```
┌───────────────────────┐
│ idle.000 │ idle.001 │ idle.002 │ ← Row 0 (y=0)
│  100x100 │  100x100 │  100x100 │
├───────────────────────┤
│ idle.003 │ idle.004 │ idle.005 │ ← Row 1 (y=100)
│  100x100 │  100x100 │  100x100 │
├───────────────────────┤
│special.000│special.001│special.002│ ← Row 2 (y=200)
│  100x100 │  100x100 │  100x100 │
├───────────────────────┤
│special.003│special.004│special.005│ ← Row 3 (y=300)
│  100x100 │  100x100 │  100x100 │
└───────────────────────┘
```

**Frame Position Coordinates (帧坐标)**:
- idle.000: x=0, y=0, w=100, h=100
- idle.001: x=100, y=0, w=100, h=100
- idle.002: x=200, y=0, w=100, h=100
- idle.003: x=0, y=100, w=100, h=100
- idle.004: x=100, y=100, w=100, h=100
- idle.005: x=200, y=100, w=100, h=100
- special.000: x=0, y=200, w=100, h=100
- special.001: x=100, y=200, w=100, h=100
- special.002: x=200, y=200, w=100, h=100
- special.003: x=0, y=300, w=100, h=100
- special.004: x=100, y=300, w=100, h=100
- special.005: x=200, y=300, w=100, h=100

**重要提示**:
- 帧之间没有间距
- 总宽度: 100 × 3 = 300 pixels
- 总高度: 100 × 4 = 400 pixels
- 每一帧正好是 100x100 pixels，完美适配角色原画

---

## 4. 动画状态定义

### 4.1 Idle (待机)

- **目的**: 当角色静止站立时
- **帧数**: 6 frames
- **循环**: Yes
- **命名**: `idle.{index}` (例如 `idle.000`, `idle.001`)
- **播放速度**: 6-8 FPS
- **内容**: 可以包含微小的动作，如呼吸、眨眼等

### 4.2 Special (特殊动作)

- **目的**: 当 NPC 叫卖、说话或执行特殊动作时
- **帧数**: 6 frames
- **循环**: No (播放一次)
- **命名**: `special.{index}` (例如 `special.000`, `special.001`)
- **播放速度**: 8-10 FPS
- **触发**: 每 60 秒自动触发，或在玩家交互时触发
- **内容**: 挥手、叫卖、说话等

---

## 5. Atlas JSON 格式

### 5.1 完整结构

```json
{
  "frames": [
    {
      "filename": "idle.000",
      "frame": {
        "w": 100,
        "h": 100,
        "x": 0,
        "y": 0
      },
      "anchor": {
        "x": 0.5,
        "y": 0.7
      }
    }
  ]
}
```

### 5.2 字段说明

**frames array**:
- `filename`: 帧名称 (string)
- `frame`: 帧在 spritesheet 中的位置
  - `w`: 帧宽度 (pixels)
  - `h`: 帧高度 (pixels)
  - `x`: 帧左上角 X 坐标
  - `y`: 帧左上角 Y 坐标
- `anchor`: 锚点 (相对于帧尺寸)
  - `x`: 0.5 表示水平居中
  - `y`: 0.7 表示靠近底部

**meta object**:
- `description`: 描述信息
- `web`: 生成工具 URL

### 5.3 完整示例

```json
{
  "frames": [
    {
      "filename": "idle.000",
      "frame": { "w": 100, "h": 100, "x": 0, "y": 0 },
      "anchor": { "x": 0.5, "y": 0.7 }
    },
    {
      "filename": "idle.001",
      "frame": { "w": 100, "h": 100, "x": 100, "y": 0 },
      "anchor": { "x": 0.5, "y": 0.7 }
    },
    {
      "filename": "idle.002",
      "frame": { "w": 100, "h": 100, "x": 200, "y": 0 },
      "anchor": { "x": 0.5, "y": 0.7 }
    },
    {
      "filename": "idle.003",
      "frame": { "w": 100, "h": 100, "x": 0, "y": 100 },
      "anchor": { "x": 0.5, "y": 0.7 }
    },
    {
      "filename": "idle.004",
      "frame": { "w": 100, "h": 100, "x": 100, "y": 100 },
      "anchor": { "x": 0.5, "y": 0.7 }
    },
    {
      "filename": "idle.005",
      "frame": { "w": 100, "h": 100, "x": 200, "y": 100 },
      "anchor": { "x": 0.5, "y": 0.7 }
    },
    {
      "filename": "special.000",
      "frame": { "w": 100, "h": 100, "x": 0, "y": 200 },
      "anchor": { "x": 0.5, "y": 0.7 }
    },
    {
      "filename": "special.001",
      "frame": { "w": 100, "h": 100, "x": 100, "y": 200 },
      "anchor": { "x": 0.5, "y": 0.7 }
    },
    {
      "filename": "special.002",
      "frame": { "w": 100, "h": 100, "x": 200, "y": 200 },
      "anchor": { "x": 0.5, "y": 0.7 }
    },
    {
      "filename": "special.003",
      "frame": { "w": 100, "h": 100, "x": 0, "y": 300 },
      "anchor": { "x": 0.5, "y": 0.7 }
    },
    {
      "filename": "special.004",
      "frame": { "w": 100, "h": 100, "x": 100, "y": 300 },
      "anchor": { "x": 0.5, "y": 0.7 }
    },
    {
      "filename": "special.005",
      "frame": { "w": 100, "h": 100, "x": 200, "y": 300 },
      "anchor": { "x": 0.5, "y": 0.7 }
    }
  ],
  "config": {
    "noSpacing": true,
    "totalWidth": 300,
    "totalHeight": 400,
    "frameWidth": 100,
    "frameHeight": 100
  }
}
```

---

## 6. NPC 列表

需要制作动画资源的 NPC:

| NPC Name (NPC 名称) | English Filename (英文文件名) | Type (类型) | Notes (备注) |
|---------|-----------|------|------|
| 老村长 | village_head | Fixed NPC | 店主 |
| 王大妈 | aunt_wang | Fixed NPC | 店主 |
| 赵大爷 | uncle_zhao | Fixed NPC | 店主 |
| 钱老板 | boss_qian | Fixed NPC | 店主 |
| 管理员 | administrator | Fixed NPC | 管理员 |
| 王婆 | aunt_wang_po | Fixed NPC | 店主 |
| 张老师 | teacher_zhang | Fixed NPC | 店主 |
| 达阿姨 | aunt_da | Fixed NPC | 店主 |
| 孔明灯使者 | kongming_messenger | Fixed NPC | 店主 |
| 烟花使者 | firework_messenger | Fixed NPC | 店主 |
| 游客六 | tourist_six | Fixed NPC | 游客 |
| Trae | trae | Fixed NPC | 角色 |
| 百货郎 | department_store_owner | Fixed NPC | 店主 |
| 爆竹秦 | firework_owner | Fixed NPC | 店主 |
| 阿凡提 | afanti | Fixed NPC | 店主 |

---

## 7. 检查清单

完成后，请验证:

- [ ] Spritesheet 图片尺寸: 300x400 像素
- [ ] 单帧尺寸: 100x100 像素
- [ ] Idle (待机) 动画包含 6 帧
- [ ] Special (特殊) 动画包含 6 帧
- [ ] 帧命名符合约定 (idle.000 ~ idle.005, special.000 ~ special.005)
- [ ] Atlas JSON 文件格式正确，包含 config 字段
- [ ] 锚点设置: x=0.5, y=0.7
- [ ] PNG 图片支持透明背景
- [ ] 像素画风格保持一致
- [ ] 文件命名使用英文

---

## 8. 参考文件

项目中现有的参考资源:
- `assets/characters/doubao.png`
- `assets/characters/doubao.atlas.json`
- `assets/characters/trae.png`
- `assets/characters/trae.atlas.json`
- `assets/characters/village_head.png`
- `assets/characters/village_head.atlas.json`
- `assets/characters/aunt_wang.png`
- `assets/characters/aunt_wang.atlas.json`

---

**文档版本**: v2.1  
**最后更新**: 2026-02-12  
**作者**: Trae AI 助手
