# Simple-Study 🎓

一个轻量级的在线学习平台，支持**汉语拼音**点读听写和**英语字母**学习。

> 访问地址：https://study.mintypisces.cn

## 功能

### 🔤 汉语拼音
- **声母、韵母、整体认读音节** — 卡片点读听发音
- **听写练习** — 选择范围，全屏手写练习
- **无限模式** — 无限制刷题
- **练习报告** — 手写图片留存，逐一批改
- **学习证书** — 全部批改完成可查看保存

### 🔠 英语字母
- **元音/辅音** — 颜色区分（粉色/蓝色卡片）
- **进度追踪** — 标记已学会，localStorage 持久保存
- **描红书写** — 画布上显示淡色参考字母引导书写
- **练习批改** — 与拼音一致的手写批改流程

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | 原生 HTML + CSS + JavaScript（单页应用） |
| 后端 | Flask（Python） |
| 服务器 | Nginx + Let's Encrypt SSL |
| 音频缓存 | 浏览器 Cache API（30天） |
| 证书截图 | html2canvas |

## 本地运行

```bash
# 进入项目
cd /var/www/study

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install flask

# 运行
python server.py
```

访问 `http://localhost:5001`

> ⚠ 音频文件未包含在仓库中，需自行获取。文件名格式：`audio/{拼音}.mp3`（如 `audio/a.mp3`）

## 部署

服务器配置在 `/etc/nginx/sites-available/study.mintypisces.cn`，Nginx 反向代理至 `127.0.0.1:5001`，SSL 证书通过 Let's Encrypt 自动续期。

## 项目结构

```
study/
├── index.html              # 主页面（全部功能）
├── server.py               # Flask 后端
├── audio/                  # 拼音音频文件
├── icons/                  # 批改图标（correct.svg / wrong.svg）
└── download_audio.py       # 音频下载辅助脚本
```
