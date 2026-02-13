# 🎪 TRAELand

[中文文档](./README_zh.md)

![TRAELand Demo](./docs/images/demo.gif)

## 🎮 About

**TRAELand · Year of the Horse Temple Fair** is a 2D pixel-art top-down game set during Chinese New Year celebrations. Players explore a traditional temple fair, interact with AI-powered NPCs, and experience authentic Chinese New Year festivities including fireworks and sky lanterns.

## ✨ Features

### 🤖 AI-Powered NPCs
- **11 unique NPCs** with distinct personalities powered by LLM (Large Language Model)
- Dynamic dialogue generation based on NPC personalities
- AI-generated hawking calls when no customers are nearby
- Intelligent bargaining and trading conversations

### 🎆 Fireworks System
- Three themed firework patterns: **Horse**, **Fish**, **2026**
- AI-generated blessings with programmer humor
- Example blessings: "No Bugs in Horse Year", "Memory Overflow of Fortune"

### 🏮 Sky Lantern Scene
- Stunning 3D scene powered by **Three.js**
- GPU Instancing for 3000+ background lanterns
- 5000 twinkling stars
- AI-generated 4-character blessings

### 🛒 Auto-Shopping System
- 10 AI-controlled tourists with different personalities
- Smart decision-making for shop visits
- Realistic bargaining dialogues
- Queue management at popular stalls

## 🛠️ Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Game Engine | Phaser 3 | 3.90.0 |
| 3D Engine | Three.js | 0.160.0 |
| AI Service | Doubao/OpenAI | - |

## 📁 Project Structure

```
├── html/                    # Frontend
│   ├── js/
│   │   ├── scenes/         # Game scenes
│   │   ├── entities/       # Game entities (Player, NPC)
│   │   ├── utils/          # Utilities (AI, Pathfinding, Effects)
│   │   └── data/           # Game data & NPC profiles
│   └── assets/             # Game assets
```

## 🚀 Quick Start

### Prerequisites
- Python 3.x (for local server)
- LLM API Key (Doubao or OpenAI)

### Configure API Key

```bash
# Copy the environment template
cp .env.example .env

# Edit .env and fill in your API key
```

Available LLM providers:
| Provider | Environment Variables |
|----------|----------------------|
| Doubao | `LLM_PROVIDER=doubao`<br>`DOUBAO_API_KEY=your-key` |
| OpenAI | `LLM_PROVIDER=openai`<br>`OPENAI_API_KEY=your-key` |

### Run Locally

```bash
# Start the game
cd html
python3 serve.py
# Open http://localhost:8000 in browser
```

## 🎭 NPC Characters

| NPC | Role | Personality |
|-----|------|-------------|
| Aunt Wang | Fried Tangyuan Seller | Gossipy, loves comparing |
| Boss Qian | Jewelry Seller | Marriage-obsessed |
| Clay Zhang | Clay Figurine Maker | Humble, worried about son |
| Li Million | Ring Toss Owner | Humble-bragger |
| Beast King | Pet Seller | Promotes civil service jobs |
| Matchmaker Wang | Vegetable & Matchmaking | Enthusiastic matchmaker |
| Firecracker Qin | Firework Seller | Loves festivities |
| Afanti | BBQ Skewer Seller | Humorous, generous |

## 🎯 Game Flow

```
Game Start
    ↓
10 tourists spawn with random personalities
    ↓
Each tourist:
    → AI decides next shop to visit
    → Walk to shop (A* pathfinding)
    → AI dialogue with NPC
    → Purchase & trigger effects
    → Repeat until money runs out
    ↓
All tourists return home
    ↓
Sky Lantern finale scene
```

## 🎨 Tourist Types

| Type | Characteristics |
|------|-----------------|
| Foodie | Passionate about food |
| New Year Shopper | Budget-conscious, compares prices |
| Collector | Can't resist buying |
| Party Youth | Loves the crowd |
| Homebody | Forced out by parents |
| City Kid | Curious about rural fairs |

## 🔧 AI Functions

| Function | Description |
|----------|-------------|
| `generateHawkingText()` | Generate NPC hawking calls |
| `generateTradeDialogue()` | Generate trading dialogues |
| `generateTouristResponse()` | Generate tourist responses |
| `generateTouristDecision()` | AI decides which shop to visit |
| `generateFireworkBlessing()` | Generate firework blessings (with programmer jokes) |
| `generateKongmingBlessing()` | Generate 4-character lantern blessings |

## 🎇 Firework Blessing Examples

| Firework Type | Blessing Examples |
|---------------|-------------------|
| Horse | "No Bugs in Horse Year", "Code Runs Like Horse" |
| Fish | "Bonus Overflow", "Happy Slacking", "Memory Surplus" |
| 2026 | "2026.release()", "git push NewYear" |

## 📝 License

Copyright (c) 2026 Bytedance Ltd. and/or its affiliates. All rights reserved.
Licensed under the [MIT License](https://opensource.org/licenses/MIT).

---

## 🐴 Year of the Horse · Programmer's Cyber Couplet

**May your code be**  
As **fast** as Red Hare —— O(1) algorithm, zero latency  
As **stable** as Dilu —— 100% test coverage, never crashes  
As **lasting** as Jueying —— Zero tech debt, maintained till retirement  

```python
while year_of_horse:
    coffee.brew()
    code.write()
    if product_manager.change_requirements():
        git.stash()
        refactor()
    else:
        print("Hello, slacking~")
    git.push("--force-with-lease")  # No breaking main in Horse Year
```

**Happy Year of the Horse! No Bugs, No Overtime!** 🐴🎊💻
