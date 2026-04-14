#!/usr/bin/env python3
"""
小程序页面预览生成器
将微信小程序页面转换为可在浏览器中预览的 HTML
"""

import os
import re
import sys
from pathlib import Path

def convert_wxml_to_html(wxml_content, page_name):
    """将 WXML 转换为 HTML"""
    
    # 基础替换
    html = wxml_content
    
    # 组件映射
    component_map = {
        '<view': '<div',
        '</view>': '</div>',
        '<text': '<span',
        '</text>': '</span>',
        '<image': '<img',
        '</image>': '',
        '<button': '<button',
        '</button>': '</button>',
        '<input': '<input',
        '<scroll-view': '<div class="scroll-view"',
        '</scroll-view>': '</div>',
        '<picker': '<div class="picker"',
        '</picker>': '</div>',
        '<swiper': '<div class="swiper"',
        '</swiper>': '</div>',
        '<swiper-item': '<div class="swiper-item"',
        '</swiper-item>': '</div>',
        '<icon': '<i',
        '</icon>': '</i>',
        '<progress': '<div class="progress"',
        '</progress>': '</div>',
        '<checkbox': '<input type="checkbox"',
        '<radio': '<input type="radio"',
        '<switch': '<div class="switch"',
        '</switch>': '</div>',
        '<slider': '<input type="range"',
        '<textarea': '<textarea',
        '</textarea>': '</textarea>',
        '<label': '<label',
        '</label>': '</label>',
        '<form': '<form',
        '</form>': '</form>',
        '<map': '<div class="map-placeholder"',
        '</map>': '</div>',
    }
    
    for wxml, html_tag in component_map.items():
        html = html.replace(wxml, html_tag)
    
    # 处理 wx:if → data-if (仅视觉标记)
    html = re.sub(r'wx:if="([^"]*)"', r'data-wx-if="\1"', html)
    html = re.sub(r'wx:else', 'data-wx-else', html)
    html = re.sub(r'wx:for="([^"]*)"', r'data-wx-for="\1"', html)
    
    # 处理 bindtap 等
    html = re.sub(r'bind(\w+)="([^"]*)"', r'data-bind-\1="\2"', html)
    html = re.sub(r'catch(\w+)="([^"]*)"', r'data-catch-\1="\2"', html)
    
    return html

def convert_wxss_to_css(wxss_content):
    """将 WXSS 转换为 CSS"""
    
    css = wxss_content
    
    # rpx → px (除以 2)
    def rpx_to_px(match):
        value = float(match.group(1)) / 2
        return f"{value}px"
    
    css = re.sub(r'([\d.]+)rpx', rpx_to_px, css)
    
    # page → body
    css = css.replace('page {', 'body {')
    css = css.replace('page,', 'body,')
    
    return css

def generate_preview_html(page_name, wxml_content, wxss_content, js_content=None):
    """生成完整的预览 HTML"""
    
    html_body = convert_wxml_to_html(wxml_content, page_name)
    css_styles = convert_wxss_to_css(wxss_content)
    
    # 小程序基础样式
    base_styles = """
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
        font-size: 14px;
        line-height: 1.6;
        background: #f5f5f5;
        min-height: 100vh;
    }
    .page {
        max-width: 375px;
        margin: 0 auto;
        background: #fff;
        min-height: 100vh;
        box-shadow: 0 0 20px rgba(0,0,0,0.1);
    }
    /* 小程序组件模拟 */
    .scroll-view { overflow: auto; }
    .swiper { overflow: hidden; position: relative; }
    .swiper-item { position: absolute; width: 100%; height: 100%; }
    .map-placeholder { background: #e0e0e0; min-height: 200px; display: flex; align-items: center; justify-content: center; }
    .map-placeholder::after { content: '🗺️ 地图区域'; color: #999; }
    .picker { border: 1px solid #ddd; padding: 8px 12px; border-radius: 4px; }
    .switch { width: 50px; height: 30px; background: #ddd; border-radius: 15px; position: relative; }
    .switch::after { content: ''; position: absolute; width: 26px; height: 26px; background: #fff; border-radius: 50%; top: 2px; left: 2px; }
    .progress { height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden; }
    /* 提示标记 */
    [data-wx-if]::before { content: '⚠️ 条件渲染'; font-size: 10px; color: #ff6b6b; position: absolute; top: 0; right: 0; }
    [data-wx-for]::before { content: '🔄 列表渲染'; font-size: 10px; color: #4ecdc4; position: absolute; top: 0; right: 0; }
    """
    
    html_template = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>小程序预览 - {page_name}</title>
    <style>
{base_styles}
{css_styles}
    </style>
</head>
<body>
    <div class="page">
{html_body}
    </div>
    
    <!-- 预览信息 -->
    <div style="position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.8); color: #fff; padding: 8px 16px; border-radius: 4px; font-size: 12px; z-index: 9999;">
        📱 小程序预览 - {page_name}
    </div>
    
    <script>
        // 模拟小程序 API
        const wx = {{
            showToast: (obj) => alert(obj.title || '提示'),
            showModal: (obj) => confirm(obj.content || '确认？'),
            navigateTo: (obj) => console.log('跳转:', obj.url),
            request: (obj) => console.log('请求:', obj.url),
        }};
        
        // 点击事件日志
        document.addEventListener('click', (e) => {{
            const target = e.target.closest('[data-bind-tap]');
            if (target) {{
                console.log('触发事件:', target.dataset.bindTap);
            }}
        }});
    </script>
</body>
</html>'''
    
    return html_template

def main():
    if len(sys.argv) < 2:
        print("用法: python miniprogram_preview.py <页面目录>")
        print("示例: python miniprogram_preview.py pages/index")
        sys.exit(1)
    
    page_path = Path(sys.argv[1])
    
    # 查找页面文件
    wxml_file = page_path / f"{page_path.name}.wxml"
    wxss_file = page_path / f"{page_path.name}.wxss"
    js_file = page_path / f"{page_path.name}.js"
    
    if not wxml_file.exists():
        print(f"错误: 找不到 {wxml_file}")
        sys.exit(1)
    
    # 读取内容
    wxml_content = wxml_file.read_text(encoding='utf-8')
    wxss_content = wxss_file.read_text(encoding='utf-8') if wxss_file.exists() else ''
    
    # 生成预览
    html = generate_preview_html(page_path.name, wxml_content, wxss_content)
    
    # 输出文件
    output_file = Path('preview.html')
    output_file.write_text(html, encoding='utf-8')
    
    print(f"✅ 预览文件已生成: {output_file.absolute()}")
    print(f"   在浏览器中打开查看效果")

if __name__ == '__main__':
    main()