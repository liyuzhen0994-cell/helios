
<<<<<<< HEAD
=======
点击掉落 Helios 玩偶的交互小站：Canvas + Matter.js 物理堆叠，玩偶全部是 **GIF 动图**逐帧播放（每只相位错开），带稀有度抽卡、语音彩蛋和隐藏菜单。零构建、单文件页面，直接部署 GitHub Pages。

## 本地预览

```bash
node dev/server.js
# 浏览器打开 http://127.0.0.1:8787/（端口被占用时：PowerShell 里先 $env:PORT=8899）
```

> 注意：直接双击 index.html 打开会因为 file:// 协议下 fetch 被浏览器拦截而无法加载 GIF，务必用上面的本地服务器预览。

## 部署到 GitHub Pages

1. 新建仓库（如 `helios`），把本目录全部内容推上去；
2. 仓库 **Settings → Pages** → Source 选 `main` 分支根目录 → Save；
3. 稍等片刻，访问 `https://<用户名>.github.io/helios/`；
4. （可选）绑自定义域名：仓库根目录放一个 `CNAME` 文件（内容为域名一行，如 `helios.example.com`），再到域名 DNS 加一条 CNAME 记录指向 `<用户名>.github.io`。

## 素材与玩法配置

所有可调项集中在 `index.html` 顶部 `CONFIG` 块：

```js
const CONFIG = {
  normalGifs: [...],   // 普通款 GIF 列表（每只随机挑一张，等概率）
  specials: [          // 特殊款：gif + 音频 + 概率（1/N，数字越大越稀有）
    { gif: 'assets/special/special1.gif', audios: ['assets/audio/special1.mp3'], rarity: 250 },
    { gif: 'assets/special/special2.gif', audios: ['assets/audio/special2.mp3'], rarity: 100 },
    { gif: 'assets/special/special3.gif', audios: ['assets/audio/special1.mp3', 'assets/audio/special2.mp3'], rarity: 40 },
  ],
  weiAudio: 'assets/audio/wei.mp3', // 每次点击/连发都放一次 wei
  maxPlushies: 100,   // 默认上限
  holdDelay: 350,     // 按住多久开始连发 ms
  spawnCooldown: 70,  // 连发间隔 ms
  cacheMaxSide: 256,  // GIF 帧缓存最大边长（内存/显存上限，改大更清晰改小更省内存）
  plushSize: [110, 150],       // 玩偶直径范围 px（桌面基准）
  plushScaleDivisor: 800,      // 屏幕宽度 ÷ 此值 = 缩放系数（≤1）
  plushScaleMin: 0.45          // 缩放系数下限（手机上玩偶变小）
};
```

当前素材映射（按你的分类整理）：

| 目录 | 用途 |
|---|---|
| `assets/normal/normal1-4.gif` | 普通款（4 张透明底动图，随机） |
| `assets/special/special1.gif` | 特殊款 1/250，配 `special1.mp3` |
| `assets/special/special3.gif` | 特殊款 1/40，配 `special2.mp3` |
| `assets/audio/wei.mp3` | 每次生成播放 |

想换素材：把新文件放进对应目录，改 `CONFIG` 里的路径即可。特殊 3 想要独立音频：把它 `audios` 数组换成新文件路径。

## 隐藏彩蛋

右下角最角落有一个**隐约可见的“⋯”按钮**，悬停变实，点开后：

- **Unlimited Helios Works** —— 解除 100 只上限（单向开启），显示计数器，镜头随堆高自动缩小、物理墙壁同步外扩；
- **Mobile Gravity Mode** —— 手机摇一摇散射玩偶 + 倾斜手机改变重力方向（支持上下颠倒，以开启瞬间的姿态校准）；
- **Takeoff Mode 起飞** —— 手机摇一摇，全场玩偶飞起再缓缓落下（桌面可按 **T** 键模拟摇一摇）；
- **Audio** —— 语音开关（默认开）；
- **📊 掉落排行榜** —— 面板顶部有 Helios 动图、本机累计掉落数、全站排行（需配置后端，见下）与成就列表。

## 成就系统（三枚，存本机）

| 成就 | 解锁条件 |
|---|---|
| 🐣 初次wei面 | 掉落第 1 只 Helios |
| 🚀 wei到飞起 | 长按连发超过 5 秒 |
| ☀️ 太阳神能飞~ | 首次开启重力模式后晃动手机 |

解锁时屏幕顶部弹金色提示 + 播放音效；进度随时在排行榜面板的"🏆 成就"区查看。

## 掉落排行榜（可选，跨设备全站排行）

纯静态站没有服务器，排行需要一个极小的免费后端：**Cloudflare Worker + KV**（免费额度完全够用）。

1. [Cloudflare 控制台](https://dash.cloudflare.com) → **Workers & Pages** → 创建 → **Create Worker** → 命名（如 `helios-board`）→ Deploy；
2. 左侧 **存储与数据库** → **KV** → 创建命名空间（如 `helios-board-kv`）；
3. 回到 Worker → **设置** → **变量** → KV 命名空间绑定：变量名 `BOARD`，选刚建的命名空间 → 保存；
4. Worker 点 **编辑代码**，把 `dev/leaderboard-worker.js` 的内容整个粘贴进去 → **部署**；
5. 复制 Worker 地址（形如 `https://helios-board.xxx.workers.dev`），填进 `index.html` 的：

```js
leaderboardApi: 'https://heloba.lancan.xyz/z',  // 当前使用的后端；留空 = 不联网
```

之后：每只掉落的累计数存在玩家本机（localStorage），昵称首次自动生成（"软乎乎训练员#1234"风格），可在排行榜面板里改；打开排行榜自动上报、关页面时补报一次；同一设备只保留一条记录（防重复上榜），榜单按掉落数降序显示前 20。

> 说明：这是玩具级排行榜，没有防作弊（懂行的人可以伪造请求），供粉丝朋友娱乐用完全够。

## 技术要点

- 页面内置**自写 GIF 解码器**（LZW + disposal 帧合成，零外部依赖），加载时两遍解码：第一遍算全帧透明包围盒，第二遍按包围盒裁剪 + 缩放到 `cacheMaxSide` 缓存，玩偶贴图更紧凑；
- 每只玩偶独立相位（`spawnedAt + random phase` 取模动画时长），堆叠后动画不会同步闪；
- wei 音频复用单实例重触发（点一下就响一次、连发不叠加糊成一团）；特殊音频每次新实例（可重叠、完整播完）；
- 特殊款生成时带一圈星光粒子；
- 加载界面分两阶段进度：下载（字节数）40% + 解码（帧数）60%。

## 目录结构

```
├── index.html          ← 全部代码（HTML/CSS/JS 单文件）
├── favicon.png
├── assets/
│   ├── normal/         ← 普通款 GIF
│   ├── special/        ← 特殊款 GIF
│   └── audio/          ← wei + 特殊音频
└── dev/
    ├── server.js       ← 本地预览服务器
    └── *.js            ← 开发期验证脚本（解码器测试等，不影响线上）
```
>>>>>>> abb987e (新增掉落排行榜：本机计数+昵称+Cloudflare Worker 云端榜单，接入 helios-board)
