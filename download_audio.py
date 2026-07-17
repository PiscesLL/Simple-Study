#!/usr/bin/env python3
"""Download all pinyin audio files."""
import urllib.request
import os
import sys

AUDIO_DIR = "/root/study-mintypisces/audio"
BASE_URL = "http://du.hanyupinyin.cn/du/pinyin"

# 声母 (23)
shengmu = "b p m f d t n l g k h j q x zh ch sh r z c s y w".split()

# 韵母 (24)  
yunmu = "a o e i u ü ai ei ui ao ou iu ie üe er an en in un ün ang eng ing ong".split()

# 整体认读音节 (16)
zhengti = "zhi chi shi ri zi ci si yi wu yu ye yue yuan yin yun ying".split()

os.makedirs(AUDIO_DIR, exist_ok=True)

def download(name, suffix=""):
    url = f"{BASE_URL}/{name}{suffix}.mp3"
    path = os.path.join(AUDIO_DIR, f"{name}.mp3")
    try:
        urllib.request.urlretrieve(url, path)
        size = os.path.getsize(path)
        print(f"  ✓ {name}.mp3 ({size/1024:.1f}KB)")
        return True
    except Exception as e:
        print(f"  ✗ {name}.mp3: {e}")
        return False

print("=== 声母 ===")
ok = 0
for py in shengmu:
    if download(py):
        ok += 1
print(f"声母: {ok}/{len(shengmu)}")

print("\n=== 韵母 ===")
ok = 0
for py in yunmu:
    if download(py):
        ok += 1
print(f"韵母: {ok}/{len(yunmu)}")

print("\n=== 整体认读音节 ===")
ok = 0
for py in zhengti:
    if download(py, "1"):
        ok += 1
print(f"整体认读: {ok}/{len(zhengti)}")

print("\n全部完成!")
