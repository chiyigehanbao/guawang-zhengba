# 抖音小游戏 —— 🍉 瓜王争霸

基于 Claude Code Game Studios 工作流框架产出的抖音小游戏原型。

**技术栈**:纯 JavaScript + Canvas,零依赖,直接使用抖音小游戏 `tt.*` API。

## 玩法

- 双模式:经典闯关(关卡目标分) / 限时狂热(60 秒极限冲分)
- 点击屏幕任意位置,水果从顶部掉落
- 两个同等级水果**接触即合并**为更高等级,合成越高得分越高
- 2 秒内连续合成触发连击,连击越高单次得分加成越多
- **特殊球**随机掉落(概率随关卡/时间上升,落地/碰果后才起爆,下落途中不会引爆):
  - 💣 炸弹:落地后 1.4s 爆炸,清除周围局部区域(半径 82),每只计 基础分×2
  - 🧊 冰封:冻结场上全部水果 2.2s(定身不可动/不可合成),期间新掉落仍正常下落堆叠,解冻后整堆塌方连锁
  - ⭐ 双倍:后续 6 次合成得分 ×2
  - 🧲 磁吸:1.2s 内把全场水果吸向自身,引发连锁
- 经典模式:达成每关目标分即通关,掉落池解锁更高级水果、危险线上移;过关弹「通过插页」,点击或 1.4s 后进入下一关(防止瞬间跳关)
- **局内天赋**:经典每通关 5 关、狂热每过 15 秒弹出「天赋三选一」,选择后永久强化本局(连击/炸弹半径/双倍次数/磁吸·冻结时长/得分倍率/危险线容错等),形成流派
- 水果堆超过顶部危险线超过 1.2 秒则游戏结束(两模式各自独立最高分)
- 对局中可点右上角「❚❚」暂停:继续游戏 / 返回主页 / 退出游戏(`tt.exitMiniProgram`)
- 最高分与静音偏好通过 `tt.setStorageSync` 本地持久化

## 更多系统(焕新)

- **主动技能**:合成攒能量(普通 +8 / 皇冠 +16,满 100),HUD 底部「🔨」按钮敲碎场上最高水果(cost 见 `js/skills.js`)
- **每日任务**:每日 3 项增量制任务(合成/通关/技能/得分/局数/皇冠),并入「📜 任务」面板
- **玩家档案**:主菜单左上「👤」查看称号/金币/累计统计/成就/图鉴
- **金币商店**:主菜单「🛒 金币商店」,只用游戏内金币买开局道具(⚡满能量 / 🛡️护盾卡 / 💗复活卡),每日 3 次看广告领金币;不接任何真实支付
- **增长能力**:对局自动录屏,结算「🎬 分享录屏」走抖音视频分享(不足 3 秒或不支持时退回图片分享,分享不发奖励);主菜单「🎁 福利」:侧边栏复访每日 🪙100、添加到桌面(安卓)首次 🪙200
- **更多金币来源**:关卡首通(Boss 翻倍)/ 新水果首次发现 / 连击 5·10·15·20 里程碑 / 每日首局金币 ×2;周赛活动在「📅 每日挑战」面板
- **设置**:主菜单右上「⚙」切换音效、震动、减少动效、高对比、语言,并含「玩法帮助」「导出/导入存档」
- **技能升级**:成长面板底部「✦ 技能升级」用金币强化能量效率/重锤/陨石/洗牌
- **首次引导**:首局提示,首次掉落即完成并持久化
- **存档版本与迁移**:`js/save.js` 升级不丢档

## 成长收集

- **水果图鉴**:掉落/合成即点亮对应水果(共 11 种),「🏆 成就图鉴」面板查看解锁进度- **成就**:11 个成就(首通/首合西瓜/10 连击/通 5 关/通 20 关/通 50 关/通 100 关/狂热 5000/引爆炸弹/技能全开/图鉴全齐),达成时弹横幅+音效+震动
- **称号**:按成就数升级 6 档(水果萌新 → 果界传说),主菜单展示
- 全部本地持久化(`merge_watermelon_collection/achievements/max_combo/max_level/used_specials`)

## 局外成长(金币 · 永久升级)

- 每局结束按表现结算**金币**:`⌊分/100⌋ + 关卡×2 + 本局天赋数×5`(受「财源广进」加成,保底 1)
- 主菜单「⚙ 成长养成」面板用金币购买 **5 项永久升级**(跨局生效):🍀幸运之风(特殊球概率)/⚡节奏大师(连击窗口)/💪力量强化(得分)/🛡️安全护盾(危险线容错)/💰财源广进(金币收益)
- 永久升级在每局开局注入 `runMod` 基底,局内天赋再叠加
- 持久化:`merge_watermelon_coins` / `merge_watermelon_upgrades`

## 主题化皮肤

- **7 套主题**:🍉 夏日水果(默认)/ 🪐 星际太空 / 🥘 火锅集市 / 🧧 新春年货 / 👑 传说之金 / 🌐 赛博霓虹 / 🎉 焕新派对(16 成就或金币)
- 主题覆盖背景渐变、容器、危险线、HUD 文字、水果 emoji 与配色;选择即时生效并持久化(`merge_watermelon_theme`)
- **动态效果**:每主题带专属漂浮粒子(星际⭐、火锅💨、新春🎆、传说✨)与游走光晕,背景装饰 emoji 呼吸浮动
- **解锁门槛**按已达成成就数(2/4/6/9),未解锁主题在主菜单「🎨 主题」面板置灰并提示所需成就
- 实现见 `js/themes.js`(主题数据/解锁/存储),主题面板在 `js/ui/panels-economy.js`
- 主菜单标题为渐变+发光+呼吸缩放+扫光+✨点缀的动效标题

## 社交玩法

- **分享成绩**:结算面板「📤 分享成绩」自动绘制成绩封面(渐变底+🍉+分数+模式),经 `tt.shareAppMessage` 弹出分享面板,好友点开即进入游戏
- **好友排行**:主菜单/结算面板「👥 好友排行」打开排行榜浮层,通过开放数据域 `tt.getFriendCloudStorage` 拉取好友分数降序展示,点击任意处关闭
- 每次游戏结束自动把分数写入云存储(`tt.setUserCloudStorage`,键 `score`)
- ⚠️ 好友排行/云存储需**真机环境**联调;占位/未开放权限下只会看到「暂无好友数据」

## 运行方式

1. 打开 [抖音开发者工具](https://developer.open-douyin.com/) 并登录
2. 「导入项目」,选择本目录 `douyin-minigame/`
3. 已配置真实 AppID `tt16d7606a88ad815d02`(`project.config.json`),直接编译即可
4. 编译预览即可在模拟器中游玩;真机预览需在工具内扫码
5. 好友排行(开放数据域)需真机环境联调,且要在抖音开放平台申请「好友关系链」接口权限后才有数据

## 自动化冒烟测试

`tests/bot-test.js` —— 纯 Node、零依赖的机器人测试(681 条断言,已在本机 Node v24 跑通 ✅):mock 掉 `tt` 与 canvas,直接驱动
水果表 / 100 关曲线 / 主题解锁 / 11 项成就 / 物理合成 / 完整 Game(启动·掉落·合成·通关插页·
暂停·退出·静音·面板·排行·结算·狂热模式),并全程校验渲染无异常。

```bash
node tests/bot-test.js        # 退出码 0 = 全部通过
node tests/soak-test.js       # 300 局模糊 soak(面板/暂停/技能/机关),退出码 0 = 稳定性通过
node tests/audit-play.js      # 自玩自查(开门体验/第1关可通关/面板布局越界),退出码 0 = 通过
```

无 Node 时:在抖音开发者工具「命令行」执行,或把文件粘入 JS 面板运行,看末尾 PASS/FAIL 汇总。

## 项目结构

```
douyin-minigame/
├── game.json               # 抖音小游戏配置(竖屏、隐藏状态栏)
├── project.config.json     # 开发者工具工程配置(已填真实 AppID tt16d7606a88ad815d02)
├── game.js                 # 入口,new Game()
├── audio/                  # 程序生成的 WAV 音效(10 个)
└── js/
    ├── fruits.js           # 水果等级数据(半径/分数)
    ├── physics.js          # 圆形刚体物理:接触即合并/特殊球实体/冻结
    ├── audio.js            # 音频管理(每次重设 src + obeyMuteSwitch)
    ├── share.js            # 成绩上报 + 分享卡片(tt.setUserCloudStorage/tt.shareAppMessage)
    ├── leaderboard.js      # 主域排行榜浮层(与开放数据域通信)
    ├── achievements.js     # 图鉴/成就/称号(本地持久化 + 条件判定)
    ├── themes.js           # 主题数据/解锁判定/当前主题存储
    ├── levels.js           # 经典模式 100 关关卡曲线(章节/目标/掉落池/危险线)
    ├── perks.js            # 局内天赋池(10 天赋 + 运行修正 runMod)
    ├── progression.js      # 局外成长(金币 + 5 项永久升级)
    ├── liveops.js          # 每日挑战 + 每日签到
    ├── monetize.js         # 商业化(激励视频/插屏,优雅降级)
    ├── missions.js         # 任务线(累计里程碑 + 领取)
    ├── dailytasks.js       # 每日任务(刷新制)
    ├── skills.js           # 主动技能(能量 + 重锤)
    ├── settings.js         # 玩家偏好(震动/减少动效)
    ├── save.js             # 存档版本与迁移
    ├── seasonboard.js      # 本地周榜
    ├── account.js          # 账号经验与等级
    ├── history.js          # 本地历史最高分榜
    ├── weeklytasks.js      # 每周任务(刷新制)
    ├── i18n.js             # 本地化字符串表(zh/en 骨架)
    ├── cloud.js            # 云端接入骨架(云存储/好友)
    ├── skillup.js          # 技能升级树(金币强化技能)
    ├── shop.js             # 金币商店(金币道具 + 每日看广告领金币)
    ├── rewards.js          # 额外金币来源(首通/发现/连击/每日首局)
    ├── recorder.js         # 对局录屏 + 视频分享(GameRecorderManager)
    ├── sidebar.js          # 侧边栏复访奖励(checkScene/navigateToScene)
    ├── shortcut.js         # 添加到桌面(addShortcut,仅安卓)
    ├── dda.js              # 动态难度调整
    ├── weekevent.js        # 周赛活动(每周刷新)
    ├── notice.js           # 公告弹窗(首次展示)
    ├── gpexchange.js       # 成就点数(GP)兑换
    ├── openDataContext/    # 开放数据域:好友榜渲染(独立入口)
    ├── game.js             # 主逻辑:状态/双模式/特殊球/关卡/连击/结算(各 mixin 挂到 Game.prototype)
    ├── input.js            # 触摸路由:按界面层级分发 + 面板点击表 PANEL_TAP
    ├── meta-actions.js     # 局外操作:购买/领奖/签到/设置项/存档导入导出/福利/清档
    ├── game/
    │   └── shared.js       # 共享常量与工具(hitRect/配色/FRENZY_TOTAL/mixin)
    └── ui/
        ├── primitives.js   # 绘制基础件(圆角/卡片/渐变缓存/按钮/红点)
        ├── hud.js          # 局内渲染(render 入口/水果/粒子/HUD/暂停/过关/天赋)
        ├── screens.js      # 全屏界面(主菜单/结算/公告/隐私/图鉴详情)
        ├── panels-info.js  # 信息面板(面板框架/图鉴/成就/档案/设置/帮助/记录)
        └── panels-economy.js # 养成经济面板(成长/每日/任务/商店/主题/福利/清档)
```

## 特色排期

见 `../design/roadmap-douyin-minigame.md`:
- P1 特殊水果技能池 + 双模式(已完成)
- P2 社交分享与好友榜(已实现,待真机联调)
- P3 成长收集成就(已完成)
- P4 主题化皮肤(已完成)

## 调参入口

| 参数 | 位置 | 说明 |
|------|------|------|
| 水果等级/分数/半径 | `js/fruits.js` | 新增或调整等级 |
| 重力/合并阈值 | `js/physics.js` | `GRAVITY` / `MERGE_TOUCH`(接触即合并) |
| 特殊球半径/引信 | `js/physics.js` | `SPECIALS` 表(arm 后起爆) |
| 特殊球概率/种类解锁 | `js/game.js` | `specialChance` / `spawnSpecial` |
| 炸弹爆炸半径 | `js/game.js` | `explode` 的 `R = 82*scale` |
| 冰封时长/双倍次数/磁吸时长 | `js/game.js` | `activateIce/Star/Magnet` |
| 狂热时长/连击参数 | `js/game/shared.js` / `js/game.js` | `FRENZY_TOTAL` / `comboWindow` / `comboBonus` |
| 关卡目标/危险线上移 | `js/game.js` | `levelTarget` / `dangerLine` |
| 游戏结束判定 | `js/game.js` | `aboveTimer > 1.2` |
| 分享封面文案/尺寸 | `js/share.js` | `buildShareImage` / 300×400 |
| 排行榜云存储键 | `js/share.js` | `KVDataList` 的 key=`score` |
| 排行浮层尺寸 | `js/game.js` | `openLeaderboard` 的 `cssW/cssH` |
| 开放数据域入口 | `game.json` | `openDataContext` → `js/openDataContext/index.js` |
| 成就条件/阈值 | `js/achievements.js` | `DEFS` 数组(连击10/狂热5000/通5/20/50/100关等) |
| 称号档位 | `js/achievements.js` | `TITLES` / `getTitle` |
| 主题配色/水果表/解锁 | `js/themes.js` | `THEMES` 表(5 套,`ach` 为解锁门槛) |
| 关卡目标/危险线/掉落池 | `js/levels.js` | `STAGES`/`STAGE_MULT`/`getDropWeights`(100 关曲线) |
| 局内天赋池/效果 | `js/perks.js` | `POOL`(10 天赋)/`DEFAULT_MOD`/`apply` |
| 天赋触发与生效 | `js/game.js` | `openPerkDraft`/`applyPerk`/经典每 5 关·狂热 45/30/15s |
| 永久升级树/花费 | `js/progression.js` | `UPGRADES`(5 项)/`costOf`/`applyTo`/`coinsForRun` |
| 金币发币/购买 | `js/game.js` / `js/meta-actions.js` | `endGame` 发币 / `buyUpgrade` / 主菜单「⚙ 成长养成」 |
| 每日挑战池/签到奖励 | `js/liveops.js` | `DAILY_POOL`(5)/`DAILY_REWARD`/`CHECKIN_REWARDS` |
| 广告位/插屏频控 | `js/monetize.js` | `CONFIG`(adunitId / `interstitialEvery`) |
| 复活/金币翻倍 | `js/game.js` | `requestRevive`/`revive`/`requestDoubleCoins`(结算面板) |
| 任务定义/统计 | `js/missions.js` | `MISSIONS`(6)/`addStat`/`claim` |
| 每日任务池/目标 | `js/dailytasks.js` | `POOL`(6)/`TASK_COUNT`(3) |
| 主动技能/能量 | `js/skills.js` | `SKILLS`/`ENERGY_MAX`/`ENERGY_PER_MERGE` |
| 玩家偏好 | `js/settings.js` | `getPrefs`/`toggle`(震动/减少动效) |
| 存档版本 | `js/save.js` | `CURRENT_VERSION`/`migrate` |
| 物理宽相 | `js/physics.js` | `resolvePairs`(网格候选对) |

## 音效重新生成

音效由 `C:\Users\89898\AppData\Local\Temp\opencode\gen-audio.ps1`
用 PowerShell/.NET 生成(WAV, 22050Hz 单声道)。修改脚本中的音符后重新运行:

```powershell
powershell -File <脚本路径> -OutDir <本目录>\audio
```

## 后续接入框架工作流

本目录为可直接运行的可玩原型。如需按工作室框架继续迭代(设计文档 GDD、平衡性调整、QA、发布),可将原型产物作为输入,运行 `/reverse-document` 生成设计文档,再走 `/design-system` → `/create-stories` → `/dev-story` 标准流程。
