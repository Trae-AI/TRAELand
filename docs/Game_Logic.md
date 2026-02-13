# 游戏核心逻辑 (Gameplay) 文档

本文档详细说明了《马年庙会》项目的核心游戏逻辑，包括场景管理、玩家移动、地图交互、角色日记、自动消费以及特色的孔明灯玩法。

## 1. 场景架构

游戏基于 **Phaser 3** 引擎开发，主要包含以下场景：

*   **BootScene**: 负责加载游戏资源（图片、地图数据、音频等）。
*   **GameScene** ([html/js/scenes/GameScene.js](html/js/scenes/GameScene.js)): 核心 2D 游戏世界，处理地图渲染、角色移动、NPC交互。
*   **KongmingLanternScene** ([html/js/scenes/KongmingLanternScene.js](html/js/scenes/KongmingLanternScene.js)): 独立的 3D 孔明灯祈福场景，混合了 Three.js 渲染。

## 2. 核心玩法逻辑 (GameScene)

### 2.1 地图与层级管理

地图使用 Tiled Map JSON 格式 (`assets/map/new_year.json`) 加载。`GameScene.js` 中的 `createMap` 函数负责解析地图：

*   **碰撞层 (Collisions)**: 用于生成可行走区域数据 (`walkableGrid`)，不可见。
*   **功能层**: `Spawning-pinned`（固定NPC位置）、`Spawning-moving`（移动NPC区域）、`Objects`（玩家出生点等）。
*   **深度排序 (Z-Sorting)**:
    角色的渲染层级与其 Y 坐标绑定，Y 值越大（越靠下），层级越高，从而遮挡住 Y 值较小的物体。

### 2.2 玩家移动与寻路

*   **寻路算法**: 采用 **A* (A-Star)** 算法。
*   **网格系统**: 地图被划分为 32x32 的网格。`createWalkableGrid` 解析 `Collisions` 层生成 0/1 矩阵。
*   **角色速度随机性**:
    - 每个角色的基础速度在 120-180 之间随机
    - 每帧速度有 ±10 的波动
*   **流程**:
    1.  托管角色通过 `AutoSpendingManager` 自动选择目标 NPC
    2.  客户端计算从当前位置到目标位置的最短路径 (`Pathfinding` 类)
    3.  角色沿路径节点移动

### 2.3 NPC系统

NPC配置统一使用 `html/js/data/npc-config.json`：

*   **固定NPC**: 通过 `npc-config.json` 配置，包含名称、资源文件名、类型、位置
*   **NPC对话**: 通过 `html/js/data/MerchantData.js` 配置，包含商品、价格、对话内容
*   **NPC动画**: 使用图集资源，有 idle 和 special 动画
*   **现有NPC**:
    - 老村长 (30,53) - 手工糖画
    - 王大妈 (13,14) - 炸元宵
    - 钱老板 (54,14) - 饰品
    - 泥人张 (40,35) - 泥人
    - 李百万 (15,35) - 套圈
    - 万兽王 (52,35) - 小动物
    - 王婆 (43,14) - 蔬菜
    - 爆竹秦 (33,27) - 烟花
    - 百货郎 (23,14) - 小物件
    - 阿凡提 (25,35) - 烤串
    - 孔明灯使者 (33,10) - 孔明灯

### 2.4 角色日记系统

*   **DiaryManager** ([html/js/utils/DiaryManager.js](html/js/utils/DiaryManager.js)): 管理角色日记的核心类
*   **记录内容**:
    - 对话记录：记录角色与NPC的对话内容
    - 消费记录：记录角色购买了什么商品、花费多少钱
*   **UI显示**:
    - 在右上角剩余金额下方显示
    - 纵向文本scrollview
    - 支持实时更新
    - 只显示当前选择角色的日志

### 2.5 自动消费系统

*   **AutoSpendingManager** ([html/js/utils/AutoSpendingManager.js](html/js/utils/AutoSpendingManager.js)): 管理托管角色的自动消费行为
*   **初始金额**: 200元
*   **流程**:
    1.  随机选择一个未访问过的、价格在预算内的NPC
    2.  移动到NPC位置
    3.  与NPC对话（通过 `AutoDialogueManager`）
    4.  完成购买，扣除金额
    5.  记录到角色日记
    6.  继续选择下一个NPC
*   **特殊NPC**:
    - 爆竹秦：对话完成后触发烟花效果
    - 孔明灯使者：对话完成后触发孔明灯场景

### 2.6 烟花系统

*   **Firework** ([html/js/utils/Firework.js](html/js/utils/Firework.js)): 管理烟花效果
*   **触发方式**: 与爆竹秦对话完成后自动触发
*   **效果**:
    - 烟花从爆竹秦位置发射
    - 爆炸后显示文字（马年快乐、年年有余、新年快乐）
    - 显示图片（马、鱼、2026）
    - 有发射和爆炸音效

### 2.7 梅花雨效果

*   **PlumBlossomRain** ([html/js/utils/PlumBlossomRain.js](html/js/utils/PlumBlossomRain.js)): 管理梅花雨效果
*   **效果**: 随机生成梅花花瓣，从屏幕上方飘落

### 2.8 游戏重启功能

*   **触发时机**: 孔明灯场景点击退出后
*   **UI显示**: 在主场景之上显示"点击任意键重启庙会"文字，带闪烁效果
*   **触发方式**: 点击鼠标、键盘、触摸任意操作都触发游戏重启
*   **实现**: 使用 `window.location.reload()` 重启游戏

## 3. 孔明灯玩法 (Three.js 混合开发)

这是一个特色的 3D 视觉体验场景，技术上实现了 Phaser 与 Three.js 的共存。

### 3.1 混合渲染架构

*   `KongmingLanternScene` 是一个 Phaser 场景，但在 `create` 中初始化了一个全屏的 `THREE.WebGLRenderer`。
*   Three.js 的 Canvas 覆盖在 Phaser 游戏层之上 (`z-index: 10`)。
*   **资源加载**: 独立加载孔明灯纹理 (`loadAllTextures`)。

### 3.2 核心特性

*   **粒子系统**: 创建 5000+ 个星星粒子构成背景星空。
*   **海量孔明灯**: 渲染 2000+ 个背景孔明灯，每个都带有独立的浮动 (`float`) 和摇摆 (`sway`) 动画参数，模拟自然飘升效果。
*   **后期处理**: 使用 `UnrealBloomPass` 实现辉光效果，增强视觉唯美感。
*   **摄像机控制**:
    *   **上升阶段**: 摄像机自动跟随玩家的孔明灯从地面升至高空。
    *   **交互阶段**: 支持鼠标/触摸拖拽旋转视角 (`isDragging` 逻辑)。
*   **交互**: 使用 `THREE.Raycaster` 检测点击，点击孔明灯可弹出随机祝福语。

## 4. 总结

*   **模块化**: 场景、实体 (Player/NPC)、日记管理 (DiaryManager)、自动消费 (AutoSpendingManager) 职责分离。
*   **混合技术栈**: 2D 游戏逻辑与 3D 视觉特效无缝结合，利用了 Phaser 的易用性和 Three.js 的 3D 表现力。
*   **特色玩法**: 角色日记、自动消费、烟花、梅花雨、孔明灯等多种玩法。
