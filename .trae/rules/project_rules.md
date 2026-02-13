你是一个专业游戏开发人员，擅长 H5 游戏开发，你需要根据项目规则生成游戏可运行的 HTML 文件和相关脚本文件。

# 项目设定
- 游戏名称：马年庙会
- 游戏类型：2D 像素风游戏，Top-Down 视角
- 游戏环境：游戏在浏览器中运行，玩家需要使用支持 HTML5 的浏览器

# 游戏设定
- 背景：中国农历新年马年到了，小镇上的所有角色都在庆祝新的一年。
- 画面
    - 游戏画面全屏自适应浏览器窗口大小
    - 左上角有玩家信息，显示玩家当前位置
    - 右上角有镜头选择下拉框，可以选择锁定到特定玩家或自由镜头
    - 右上角显示金钱显示（当锁定到玩家时）
    - 右下角有工具栏，包含孔明灯和烟花按钮
    - 有登录界面、排队界面、错误提示模态框等UI元素
- NPC 设定：
    - 固定NPC：通过 `npc-config.json` 配置
    - NPC 使用图集资源，有 idle 和 special 动画
- 玩家设定：游戏中有10个玩家角色，包括豆包（主角）、trae宝等，玩家可以锁定镜头到特定玩家
- 移动：角色使用 A* 寻路算法，支持8方向移动，z轴根据y坐标动态排序
- 镜头：支持跟随玩家或自由拖动
- 其它玩法：
    - 孔明灯玩法，具体说明查看 `docs/孔明灯.md`
    - 烟花玩法
    - 梅花雨效果
    - 自动消费系统

# 技术设定
- 开发语言：HTML + JavaScript (ES6+)
- 游戏引擎：`Phaser 3.90.0`
- 3D 引擎：`Three.js 0.160.0`（用于孔明灯场景）
- 服务端日志：凡是在 `server` 目录下的日志，必须使用 `logger` 组件（`server/utils/logger.js`），禁止使用 `console.log`。
- 代码模块化：使用 ES6 模块（import/export）
- 目录：
    - Http 服务根目录是 `html`
    - 素材根目录是 `html/assets`
    - 游戏逻辑在 `html/js/` 目录下


# 游戏素材
- 地图：基于 Tiled Map Editor 生成的地图文件和素材实现。地图文件是 `assets/map/new_year.json`
    - 图层 `Collisions` 是碰撞标记层
    - 图层 `Spawning-pinned` 是固定NPC生成点
    - 图层 `Spawning-moving` 是移动NPC生成点
    - 图层 `Objects` 包含玩家出生点等对象
    - 标记为不可见的图层不要显示
- 角色：角色素材目录是 `assets/characters`，每个角色素材是图集文件（.png + .atlas.json）
    - 主角用 `doubao.png`
- 孔明灯：`assets/kongming/` 目录下
- 烟花：`assets/firework/` 目录下
- 聊天气泡用 HTML 实现
