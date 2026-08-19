// ============================================================
// Helios 掉落排行榜 —— Cloudflare Worker + KV
//
// 部署步骤（全部在网页控制台操作，不需要装任何工具）：
//   1. dash.cloudflare.com → Workers & Pages → 创建 → Create Worker
//      → 名字随便（如 helios-board）→ Deploy
//   2. 左侧「存储与数据库」→ KV → 创建命名空间 → 名字如 helios-board-kv
//   3. 回到刚建的 Worker → 设置 → 变量 → KV 命名空间绑定：
//        变量名称: BOARD    KV 命名空间: helios-board-kv   → 保存
//   4. 点 Worker 的「编辑代码」，把本文件内容整个粘贴进去 → 部署
//   5. 复制 Worker 地址（形如 https://helios-board.xxx.workers.dev），
//      填到网站 index.html 里 CONFIG.leaderboardApi = '……'
//
// 接口：
//   GET  /   → 返回排行榜 JSON（按掉落数降序，最多 100 条）
//   POST /   → body: { name, count, device }  同设备自动覆盖旧记录
// ============================================================

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    };

    // KV 没绑定/绑错类型时的友好提示（改完绑定必须重新 Deploy 才生效）
    if (!env || !env.BOARD || typeof env.BOARD.get !== 'function') {
      return Response.json(
        {
          error: 'BOARD 绑定不正确：请在 Worker 设置 → 变量 → “KV 命名空间绑定”里添加绑定' +
            '（变量名 BOARD，选 KV 命名空间），而不是“环境变量”。保存后重新 Deploy。'
        },
        { status: 500, headers: cors }
      );
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method === 'GET') {
      const board = (await env.BOARD.get('board', 'json')) || [];
      return Response.json(board, { headers: cors });
    }

    if (request.method === 'POST') {
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return Response.json({ ok: false, error: 'bad json' }, { status: 400, headers: cors });
      }

      const count = Math.max(0, Math.min(100000000, body.count | 0));
      const name = String(body.name || '匿名').slice(0, 16);
      const device = String(body.device || '').slice(0, 64);

      let board = (await env.BOARD.get('board', 'json')) || [];
      if (!Array.isArray(board)) board = [];

      // 同一设备只保留最新一条（防重复上榜）
      if (device) board = board.filter(e => e.device !== device);
      board.push({ name, count, device, t: Date.now() });

      board.sort((a, b) => b.count - a.count);
      board = board.slice(0, 100);
      await env.BOARD.put('board', JSON.stringify(board));

      return Response.json({ ok: true, rank: board.findIndex(e => e.device === device && e.count === count && e.name === name) + 1 }, { headers: cors });
    }

    return new Response('not found', { status: 404, headers: cors });
  }
};
