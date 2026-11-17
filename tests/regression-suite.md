# 回归测试套件 Regression Suite

> **Maintained by**: `/regression-suite` · **Last Updated**: 2026-10-08
> 运行:`node tests/bot-test.js`(退出码 0 = 全绿)。当前 **681 断言 / 36 段**。

## 覆盖矩阵(测试段 → 系统 → GDD)

| 段 | 名称 | 覆盖系统 | GDD |
|----|------|----------|-----|
| A | fruits.js 水果表 | 水果等级数据表 | `merge-core.md` |
| B | levels.js 100 关曲线 | 关卡体系 | `level-progression.md` |
| C | themes.js 主题与解锁 | 主题皮肤 | `themes-cosmetics.md` |
| D | achievements.js 判定与持久化 | 成长收集 | `achievements-collection.md` |
| E | physics.js 物理与合成 | 物理引擎 | `physics-engine.md` |
| F | Game 集成:启动/掉落/合成/计分 | 合成核心循环 | `merge-core.md` |
| G | 暂停与退出 | 合成核心循环 / 表现 | `merge-core.md` |
| H | 静音开关 | 音频系统 | `audio-system.md` |
| I | 面板导航与主题切换 | 表现 / 主题 / 成就 | `presentation-feedback.md` |
| J | 好友排行(主域遮罩) | 社交分享与好友榜 | `social-sharing.md` |
| K | 结算/重开/分享 | 合成核心循环 / 社交 | `merge-core.md` |
| L | 限时狂热模式 | 合成核心循环(双模式) | `merge-core.md` |
| M | 全场景渲染冒烟 | 表现与反馈 | `presentation-feedback.md` |
| N | perks.js 局内天赋 | 局内天赋 | `in-run-perks.md` |
| O | progression.js 局外成长 | 局外成长 | `progression-meta.md` |
| P | liveops.js 每日挑战 + 签到 | Live-Ops | `liveops-daily.md` |
| Q | monetize.js 变现 | 商业化 | `monetization.md` |
| R | 优化加固(叠加上限/概率钳制/发币去重/每日即时) | 多系统 | — |
| S | missions.js 任务线 | 任务线 | `missions.md` |
| T | 存档/设置/技能/每日任务/档案/引导(十步扩展) | 多系统 | `save-versioning.md` 等 |
| U | 周榜/导出/高对比/帮助/菜单进商店 | 周榜·设置 | — |
| V | Boss 关/新主题/每日奖励双倍 | 关卡·主题·变现 | `level-progression.md` 等 |
| W | 暂停重开/导入存档/结算统计 | 核心·存档·表现 | `merge-core.md` 等 |
| X | 账号经验/历史榜/每周任务/成就奖励 | 账号·任务 | `account-history.md` 等 |
| Y | 定向重锤/称号/每日换一个/本地记录/Boss成就 | 技能·成就·留存 | `skills-active.md` 等 |
| Z | 洗牌/Boss加成/菜单红点/成就筛选 | 技能·关卡·UI | `skills-active.md` 等 |
| AA | 障碍方块/i18n/云骨架 | 物理·本地化·平台 | `obstacles.md` 等 |
| AB | 陨石技能/派对主题门槛/语言切换 | 技能·主题·设置 | `skills-active.md` 等 |
| AC | 技能升级树/粒子对象池 | 技能升级·性能 | `skillup.md` |
| AD | 弹床机关/全成就奖励/徽章墙/金币商店 | 物理·成就·商店 | `obstacles.md`/`shop.md` |
| AE | DDA/多语言/成就分类/传送带·毒刺/周赛(每日面板) | 多系统 | `dda.md`/`weekevent.md` 等 |
| AF | 新手保护/帮助分页/存档校验/标题i18n/分享 | 核心·存档·本地化 | `merge-core.md` 等 |
| AG | 每日连胜/清档/图鉴详情/性能降级/暂停统计 | 留存·设置·表现 | `liveops-daily.md` 等 |
| AH | 公告/皮肤金币解锁/成就点数/色盲/时间线 | 公告·主题·成就·无障碍 | `notice.md` 等 |
| AI | GP 兑换/小贴士/图鉴奖励/进度环 | 成就经济·表现 | `gpexchange.md` |
| AJ | 音量/连击进度条/天赋稀有保底 | 设置·表现·天赋 | `audio-system.md` 等 |
| AK | 隐私授权/切后台/健康忠告/掉落冷却/新手关卡曲线 | 合规·手感 | — |
| AL | 金币道具/看广告领金币/首通/新水果/连击/每日首局 | 商店·经济 | `shop.md` |
| AM | 录屏分享/侧边栏复访/添加到桌面 | 增长·平台 | `growth-platform.md` |

## 关键不变量(每次改动必须保持)

- 水果半径/分值严格递增;王(10)不进掉落池、不再合成。
- 关卡危险线全程单调不升且保底 80;目标分章内单调不降;掉落权重符合公式。
- 接触即合并(阈值 1.08);特殊球接触后 arm 才起爆。
- 双模式最高分独立持久化;静音偏好持久化。
- 主菜单既有三按钮点击坐标(80/190/300, 490)不被新按钮破坏。
- 抽选/暂停/结算/面板/排行各模态互斥,不误触。
- 广告不可用时全流程降级、无未捕获异常。

## 缺陷回归登记

| 缺陷 | 回归断言 | 状态 |
|------|----------|------|
| `getCollection` 未导出导致成就面板崩溃 | I 段「成就列表渲染无异常」 | ✅ 已覆盖 |
| 「挨着不合并」(相切不触发) | E 段合并 + F 段合成 | ✅ 已覆盖 |
| 第二关即结束(危险线压缩过快) | B 段危险线保底/单调 | ✅ 已覆盖 |
| 复活后再结算重复发币 | R 段「复活后再结算不重复发币」 | ✅ 已修复并覆盖 |
| 每日挑战需等结算才标记 | R 段「经典达标即时标记」 | ✅ 已修复并覆盖 |
| 天赋尾期乘法无限叠加 | R 段「全满后不再产生抽选」 | ✅ 已修复并覆盖 |
| `save.migrate` 缺少 `firstRun` 字段(二次调用) | T 段「非首次运行」 | ✅ 已修复并覆盖 |

## 长程稳定性(独立)

- `tests/soak-test.js`:300 局无头**模糊**测试(随机开面板/暂停/技能/机关/Boss/双模式/结算),校验无 NaN、无渲染异常、粒子/实体规模有界(退出码 0 = 通过)。
  `node tests/soak-test.js`。上线前与每次重要改动后运行;真机 30–60 分钟 soak 另见 `commercialization-playbook.md §5`。
- `tests/audit-play.js`:**自玩+自查**——开门体验(公告→主菜单→各面板渲染)、第 1 关可通关(确定性 8/8,防新手墙)、面板布局越界审计。`node tests/audit-play.js`。

## 待补(Phase 5 后)

- [ ] 真机测试:好友关系链、广告位、云存储(自动化不可覆盖)。
- [ ] 长时间 soak(局数/内存/掉帧)见 `soak-test` 协议。
- [ ] 每日挑战跨日边界(依赖系统时间,建议真机手测)。
