## 实现方案

### 1. 修复AIService.js依赖问题
- 将导入路径从 `NPCProfiles.js` 改为 `NPCProfilesRe.js`

### 2. 扩展NPCProfilesRe.js
- 添加NPC吆喝prompt生成函数
- 添加NPC交易对话prompt生成函数
- 添加游客行为决策prompt生成函数
- 添加祝福语生成prompt

### 3. 创建新的AI对话管理器 (AIDialogueManager.js)
- 替代原有的AutoDialogueManager
- 实现异步AI对话流程
- 支持NPC和游客双向AI对话

### 4. 扩展AIService.js
- 添加生成吆喝文本的方法
- 添加生成交易对话的方法
- 添加生成游客决策的方法
- 添加生成祝福语的方法

### 5. 修改AutoSpendingManager.js
- 使用AI决定游客下一个目标摊位
- 集成AI对话管理器

### 6. 修改NPCWithSpritesheet.js
- 添加定时AI吆喝功能
- 检测附近是否有游客

### 7. 整合MerchantData.js
- 将商品信息整合到AI prompt中
- 保留价格数据用于交易逻辑

### 文件修改列表
1. `html/js/utils/AIService.js` - 修复依赖，添加新方法
2. `html/js/data/NPCProfilesRe.js` - 添加新的prompt生成函数
3. `html/js/utils/AIDialogueManager.js` - 新建，AI对话管理器
4. `html/js/utils/AutoSpendingManager.js` - 集成AI功能
5. `html/js/entities/NPCWithSpritesheet.js` - 添加AI吆喝功能
6. `html/js/scenes/GameScene.js` - 必要的集成修改