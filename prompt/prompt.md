# TRAELand Prompt List

## 准备工作

1. 素材目录：`html/assets/`
2. 项目规则：`.trae/rules/project_rules.md`
3. API 配置：复制 `.env.example` 为 `.env`，填写 LLM API Key
4. 启动服务：`python3 html/serve.py`

## 执行步骤

**Step 1**: 按照 project_rules.md 规范，基于 Phaser 3 实现游戏基础框架，加载地图和角色

**Step 2**: 调整画面布局，包括角色比例、UI 元素（玩家信息、镜头选择、工具栏）

**Step 3**: 接入 LLM API，实现 NPC 对话、吆喝语、祝福语等 AI 生成功能

**Step 4**: 实现烟花和孔明灯特效系统

**Step 5**: 启动本地服务器，预览并测试游戏功能
