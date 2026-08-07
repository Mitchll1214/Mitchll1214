<!-- 1. 道号横幅（自建 SVG + SMIL 横向滚动字幕） -->
<div align="center">
  <h4>🪷 道号横幅 · 因果不虚</h4>
  <img src="images/banner.svg" width="480" alt="道号" />
</div>

<!-- 2. 洞府主人 -->
<div align="center">
  <img src="https://avatars.githubusercontent.com/Mitchll1214" width="120" style="border-radius:50%; border: 2px solid #8E8CD8;" alt="avatar" />
  <h3>👋 你好，我是 Mitchll</h3>
  <p><sub>本洞府一切数据皆由天道 <b>（GitHub Actions）</b> 每日自行采撷推演，不假外物，无染旁门。</sub></p>
</div>

---

<!-- 3. 修仙档案 · 境界由注册时长自动定境（练气→飞升） -->
<div align="center">
  <h4>☯️ 修仙境界 · 自动定境</h4>
  <img src="images/realm.svg" width="480" alt="修仙档案" />
</div>

<br>

<!-- 4. 虚拟灵宠 · 龙仔（由近期活跃度驱动成长与心情） -->
<div align="center">
  <h4>🐲 灵兽谱 · 以行饲之</h4>
  <img src="images/pet.svg" width="480" alt="灵宠龙仔" />
</div>

---

<!-- 5. 修行年鉴 · 近一年贡献热力图（自建） -->
<div align="center">
  <h4>📅 岁修录 · 天道铭之</h4>
  <img src="images/graph.svg" width="480" alt="岁修录 · 天道铭之" />
</div>

<br>

<!-- 6. 修行记录 + 灵根（自建统计卡） -->
<div align="center">
  <h4>📜 修行记录 · 六项指标</h4>
  <img src="images/stats.svg" width="480" alt="修行记录" />
  <br><br>
  <h4>🧬 灵根 · 语言分布</h4>
  <img src="images/langs.svg" width="480" alt="灵根" />
</div>

---

<!-- 7. 星图推衍 · 以行铸辰（历史累计提交 → 星图等级） -->
<div align="center">
  <h4>✨ 星图推衍 · 以行铸辰</h4>
  <img src="images/stars.svg" width="480" alt="星图推衍" />
</div>

<br>

<!-- 8. 今日星轨 · 勤修不辍（今日提交 → 今日星辰缀入星轨） -->
<div align="center">
  <h4>🌠 今日星轨 · 勤修不辍</h4>
  <img src="images/track.svg" width="480" alt="今日星轨" />
</div>

<!-- 9. 修行成就 -->
<div align="center">
  <h4>🏆 修行成就 · 称号一览</h4>
  <img src="images/trophy.svg" width="480" alt="修行成就" />
</div>

---

<details align="center">
  <summary>🧿 玩法说明 & 更新机制</summary>
  <p align="left">
    <b>☯ 修仙境界</b>（天道记录卡）：以注册 GitHub 的时长自动定境（练气 → 筑基 → 金丹 → 元婴 → 化神 → 炼虚 → 合体 → 大乘 → 渡劫 → 飞升），境界内分初期/中期/后期；寿元、洞府（仓库）、法宝（Star）、道众（粉丝）、灵根（常用语言）、灵力进度条均每日自动刷新。<br>
    <b>🐲 灵宠「龙仔」</b>：Q 萌小青龙，随活跃度成长 —— 近一年贡献推动它从 <b>龙蛋 → 幼龙 → 青龙 → 应龙 → 神龙</b>；近 30 日贡献为灵力条，最长连续提交为亲密度；今日有提交则"龙行云海"。<br>
    <b>📅 修行年鉴 / 📜 修行记录 / 🧬 灵根 / 🏆 修行成就</b>：近一年贡献热力图，以及年度提交、洞府、法宝、道众、论道（PR）、解惑（Issue）等指标一览；灵根即你最常用的编程语言。<br>
    <b>✨ 星图推衍 · 以行铸辰</b>：把每一次提交看作点亮一颗星辰，历史累计提交数按总量定级（星尘初现 → 星火燎原 → 星罗棋布 → 星河初成 → 星域纵横 → 万星朝宗），星辰数量随等级递增。<br>
    <b>🌠 今日星轨 · 勤修不辍</b>：今日提交沿微弱弧线缀入星轨（高亮金色大星并发光），今日无提交则显示一颗暗淡星与「今日未入道」。
  </p>
  <p align="left">
    <b>更新机制</b>：<code>.github/workflows/update-profile.yml</code> 定时（每天 08:00 / 12:00 / 15:00 / 17:00 / 22:00 北京时间）或手动触发，用 <code>GITHUB_TOKEN</code> 调 GitHub 官方 GraphQL API 实时采集数据，按 <code>api/</code>（修仙档案/灵宠）、<code>scripts/</code>（横幅/年鉴/记录/灵根/成就/星图）中的代码重新渲染全部卡片并提交回仓库 —— 全程只依赖 GitHub 自身，不调用任何第三方平台。<br>
    修改卡片样式：编辑 <code>api/</code> 或 <code>scripts/</code> 下的代码（<code>local/</code> 与 workflow 文件本身也在 push 触发范围内）后 push，workflow 会自动拉取最新数据、用新代码重新生成全部卡片；也可在仓库 Actions 页手动点击 <b>Run workflow</b> 立即刷新。<br>
    ⚠ <code>images/</code> 下的 SVG 均为自动生成产物：手动编辑会被下次生成覆盖；且仅改动 <code>README.md</code> 或 <code>images/</code> 不会触发自动更新。<br>
    本地预览：<code>node local/generate.js --mock</code>（合成数据）→ 查看 <code>images/</code> 下的 SVG；或 <code>node local/server.js</code> → <code>http://localhost:8787/preview</code>。
  </p>
</details>
