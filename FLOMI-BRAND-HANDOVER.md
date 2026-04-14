# Flomi 品牌设计规范 · 交接给代可行

> 设计师：Vin · 2026-04-08

---

## 一、品牌定位

**产品**：情绪记录小程序
**品牌语**：tudo floli · 万物皆流
**调性**：极简温暖 · 情绪疗愈 · 暖调治愈

---

## 二、品牌色

```
主色：#FFB5A7   (桃粉色)    rgb(255, 181, 167)
辅色：#FEC89A   (暖杏色)    rgb(254, 200, 154)
高光：#FFF8F5   (暖白)      rgb(255, 248, 245)
点缀：#FFDAB9   (浅桃)      rgb(255, 218, 185)
文字：#5C4A3D   (暖灰棕)    rgb(92,  74,  61)
```

> **注意**：主色是暖色系，**不要用冷色调**（蓝色、紫色等）。情绪界面保持温暖感。

---

## 三、Logo 文件清单

所有文件位于：`~/.qclaw/workspace-agent-e18f6903/design/flomi/`

### 3.1 App Icon（主图标）

| 文件名 | 尺寸 | 用途 |
|--------|------|------|
| `flomi-app-icon-1024.png` | 1024×1024 | 提交微信审核用 |
| `flomi-app-icon.svg` | 矢量 | 代码引用 |
| `flomi-icon-256.png` | 256×256 | 开发调试 |
| `flomi-icon-128.png` | 128×128 | 中等尺寸 |
| `flomi-icon-81.png`  | 81×81   | Android 适配 |
| `flomi-icon-64.png`  | 64×64   | 小尺寸展示 |
| `flomi-icon-48.png`  | 48×48   | 极小尺寸 |
| `flomi-icon-32.png`  | 32×32   | 系统图标 |
| `flomi-icon-16.png`  | 16×16   | favicon |

### 3.2 TabBar 图标（底部导航）

| 文件名 | 尺寸 | 用途 |
|--------|------|------|
| `flomi-tabbar-40.png` | 40×40 | TabBar 主尺寸 |
| `flomi-tabbar-32.png` | 32×32 | 小尺寸备选 |
| `flomi-tabbar-24.png` | 24×24 | 极小 |
| `flomi-tabbar-icon.svg` | 矢量 | 代码引用 |

> TabBar 图标**仅支持单色**（#FFB5A7），选中态同理。

### 3.3 品牌 Logo（含文字）

| 文件名 | 说明 |
|--------|------|
| `flomi-logo-main.png` | 暖白底版本（通用） |
| `flomi-logo-dark.png`   | 透明底（深色背景用） |
| `flomi-logo.svg`       | **矢量，推荐使用** |

---

## 四、UI 设计方向（待代可行实现）

### 4.1 整体风格
- **暖调治愈**：情绪界面全部使用暖白背景，不要用冷灰/冷蓝
- **极简留白**：减少视觉噪音，情绪信息一目了然
- **呼吸感**：组件间距充足，不要拥挤

### 4.2 情绪色卡（情绪坐标轴配色）

| 情绪区间 | 主色 | 文字色 |
|----------|------|--------|
| 平静/疗愈 | #B5EAD7 | #5C4A3D |
| 愉悦/开心 | #FFDAB9 | #5C4A3D |
| 温暖/满足 | #FFB5A7 | #5C4A3D |
| 焦虑/紧张 | #FEC89A | #5C4A3D |
| 悲伤/低落 | #C7CEEA | #4A4A4A |

> 情绪色卡径向渐变从当前位置向圆心扩散，用对应情绪色做透明度渐隐

### 4.3 待设计页面

| 页面 | 优先级 | 说明 |
|------|--------|------|
| 首页（情绪地图） | ✅ 已完成 | 保持现有交互逻辑 |
| 情绪历史记录 | 🔲 待设计 | 日历视图 + 情绪曲线 |
| 舒缓方案页 | 🔲 待设计 | 卡片式方案展示 |
| 个人设置 | 🔲 待设计 | 简洁设置项 |
| TabBar 4个图标 | ✅ 完成 | 见上方文件 |

---

## 五、已交付清单

- [x] App Icon（1024px + 多尺寸 PNG + SVG）
- [x] TabBar 图标（40/32/24px + SVG）
- [x] 品牌 Logo（含文字，PNG + SVG）
- [x] 品牌色规范（HEX / RGB / HSL）
- [x] 情绪色卡配色体系
- [x] UI 风格方向指引

---

## 六、交付文件路径

```
~/.qclaw/workspace-agent-e18f6903/design/flomi/
├── flomi-app-icon-1024.png   ← 微信审核提交用
├── flomi-app-icon.svg
├── flomi-icon-*.png           ← 多尺寸 PNG 合集
├── flomi-tabbar-*.png
├── flomi-tabbar-icon.svg
├── flomi-logo-main.png
├── flomi-logo-dark.png
├── flomi-logo.svg             ← 优先使用
└── flomi-logo-delivery-preview.png
```

---

**有问题直接问 Vin，我们一起搞定。**
