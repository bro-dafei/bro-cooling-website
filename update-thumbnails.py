#!/usr/bin/env python3
"""
更新所有视频缩略图脚本
1. 从 GitHub 获取当前数据
2. 为 Bilibili 视频获取缩略图
3. 为 YouTube 视频生成缩略图
4. 更新并推送回 GitHub
"""

import json
import urllib.request
import re
import sys

def fetch_bilibili_thumbnail(bvid):
    """从 Bilibili API 获取缩略图"""
    url = f"https://api.bilibili.com/x/web-interface/view?bvid={bvid}"
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://www.bilibili.com"
    })
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data.get("code") == 0:
                # 转换为 HTTPS
                thumb = data["data"]["pic"]
                if thumb.startswith("http://"):
                    thumb = thumb.replace("http://", "https://")
                return thumb
            else:
                print(f"  Bilibili API error for {bvid}: {data.get('message')}")
                return None
    except Exception as e:
        print(f"  Error fetching Bilibili {bvid}: {e}")
        return None

def get_youtube_thumbnail(link):
    """从 YouTube 链接生成缩略图 URL"""
    if not link:
        return None
    
    # 提取视频 ID
    video_id = None
    patterns = [
        r'[?&]v=([^&]+)',           # ?v=xxx
        r'youtu\.be/([^?]+)',       # youtu.be/xxx
        r'embed/([^?]+)',           # embed/xxx
    ]
    
    for pattern in patterns:
        match = re.search(pattern, link)
        if match:
            video_id = match.group(1)
            break
    
    if video_id:
        return f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
    return None

def main():
    print("正在更新视频缩略图...")
    
    # 1. 从 GitHub 获取当前数据
    github_url = "https://raw.githubusercontent.com/bro-dafei/bro-cooling-website/main/bro-data.json"
    try:
        req = urllib.request.Request(github_url)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"无法从 GitHub 获取数据: {e}")
        return
    
    # 2. 处理 YouTube 视频
    print("\n处理 YouTube 视频:")
    youtube_updated = 0
    for i, card in enumerate(data["video"]["youtube"]):
        if not card.get("thumb_url") and card.get("link"):
            thumb = get_youtube_thumbnail(card["link"])
            if thumb:
                data["video"]["youtube"][i]["thumb_url"] = thumb
                youtube_updated += 1
                print(f"  [{i}] 添加缩略图: {thumb[:60]}...")
    
    # 3. 处理 Bilibili 视频
    print("\n处理 Bilibili 视频:")
    bilibili_updated = 0
    for i, card in enumerate(data["video"]["bilibili"]):
        if not card.get("thumb_url") and card.get("link"):
            # 提取 BV ID
            bv_match = re.search(r'/video/(BV[^/?#]+)', card["link"])
            if bv_match:
                bvid = bv_match.group(1)
                thumb = fetch_bilibili_thumbnail(bvid)
                if thumb:
                    data["video"]["bilibili"][i]["thumb_url"] = thumb
                    bilibili_updated += 1
                    print(f"  [{i}] {bvid}: {thumb[:60]}...")
    
    # 4. 处理 Douyin 视频（需要手动，因为短链接需要解析）
    print("\n处理 Douyin 视频:")
    print("  Douyin 短链接需要手动解析，请在后台上传缩略图")
    
    # 5. 保存到本地
    with open("bro-data.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n完成！")
    print(f"  YouTube: 更新了 {youtube_updated} 个缩略图")
    print(f"  Bilibili: 更新了 {bilibili_updated} 个缩略图")
    print(f"  Douyin: 需要手动处理")
    print("\n文件已保存为 bro-data.json")
    print("请使用 git add, commit, push 推送到 GitHub")

if __name__ == "__main__":
    main()