<!-- 1. 道号横幅（自建 SVG + SMIL 轮播动画） -->
<p align="center">
  <img src="images/banner.svg" width="480" alt="道号" />
</p>

<!-- 2. 洞府主人 -->
<div align="center">
  <img src="https://avatars.githubusercontent.com/Mitchll1214" width="120" style="border-radius:50%; border: 2px solid #8E8CD8;" alt="avatar" />
  <h3>👋 你好，我是 Mitch</h3>
  <p><sub>本洞府一切数据由 <b>GitHub Actions</b> 每日自动采集 · 零第三方服务</sub></p>
</div>

---

<!-- 3. 修仙档案 · 境界由注册时长自动定境（练气→飞升） -->
<div align="center">
  <h4>☯️ 修仙境界 · 自动定境</h4>
  <img src="images/realm.svg" width="480" alt="修仙档案" />
</div>

<br>

<!-- 4. 虚拟灵宠 · 小九（由近期活跃度驱动成长与心情） -->
<div align="center">
  <h4>🦊 虚拟灵宠 · 随活跃度成长</h4>
  <img src="images/pet.svg" width="480" alt="灵宠小九" />
</div>

---

<!-- 5. 修行年鉴 · 近一年贡献热力图（自建） -->
<div align="center">
  <h4>📅 修行年鉴</h4>
  <img src="images/graph.svg" width="480" alt="修行年鉴" />
</div>

<br>

<!-- 6. 修行记录 + 灵根（自建统计卡） -->
<div align="center">
  <img src="images/stats.svg" width="480" alt="修行记录" />
  <br><br>
  <img src="images/langs.svg" width="480" alt="灵根" />
</div>

---

<!-- 7. 灵蛇巡山 · 吃掉你的提交（自建 SMIL 动画） -->
<div align="center">
  <img src="images/snake.svg" width="480" alt="灵蛇巡山" />
</div>

<!-- 8. 修行成就 -->
<div align="center">
  <img src="images/trophy.svg" width="480" alt="修行成就" />
</div>

---

<details align="center">
  <summary>🧿 玩法说明 & 更新机制</summary>
  <p align="left">
    <b>灵宠「小九」</b>：以你的提交活跃度为食 —— 今日有提交它便静坐吐纳（修炼），久不提交会饿、会打盹、直至沉睡；<br>
    近一年贡献累计推动它从 <b>灵蛋 → 幼狐 → 青狐 → 成狐 → 九尾仙狐</b>；近 30 日贡献为灵力条，最长连续提交为亲密度。<br>
    <b>修仙境界</b>：以注册 GitHub 的时长自动定境（练气 → 筑基 → 金丹 → 元婴 → 化神 → 炼虚 → 合体 → 大乘 → 渡劫 → 飞升），境界内分初期/中期/后期。<br>
    <b>灵蛇巡山</b>：动画蛇在贡献热力图上巡游，吃掉一颗颗「灵气」（你的提交）。
  </p>
  <p align="left">
    <b>更新机制</b>：<code>.github/workflows/update-profile.yml</code> 每天 08:17（北京时间）用
    <code>GITHUB_TOKEN</code> 调 GitHub 官方 API（GraphQL）采集数据，重新渲染全部卡片并提交回仓库 —— 全程只依赖 GitHub 自身，不调用任何第三方平台。<br>
    本地预览：<code>node local/generate.js --mock</code>（合成数据）→ 查看 <code>images/</code> 下的 SVG；或 <code>node local/server.js</code> → <code>http://localhost:8787/preview</code>。
  </p>
</details>
