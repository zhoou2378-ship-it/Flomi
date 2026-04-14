---
name: miniprogram-preview
description: "微信小程序页面预览工具。生成可在浏览器中预览的 HTML 静态页面，模拟小程序界面效果。"
metadata:
  openclaw:
    emoji: "📱"
---

# 小程序页面预览工具

将微信小程序页面转换为可在浏览器中预览的 HTML 静态页面。

## 使用场景

- 用户要求预览小程序页面
- 用户要求查看小程序效果
- 用户要求生成页面 mockup

## 工作流程

1. 读取小程序项目目录下的页面文件
2. 将 WXML 转换为 HTML 结构
3. 将 WXSS 转换为 CSS 样式
4. 模拟小程序组件（view, text, image, button 等）
5. 生成可在浏览器打开的 HTML 文件

## 小程序组件映射

| 小程序组件 | HTML 映射 |
|-----------|----------|
| view | div |
| text | span |
| image | img |
| button | button |
| input | input |
| scroll-view | div (overflow: auto) |
| swiper | div (carousel) |
| picker | select/input |

## 样式转换规则

- rpx → px (除以 2)
- page → body
- 组件选择器 → class 选择器

## 输出

生成 `preview.html` 文件，可直接在浏览器中打开查看效果。