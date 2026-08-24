# PUBLISH — Dreamin 作品发布记录

作品已接入 Dreamin 联机 SDK（纯静态、云端中继、无需自建服务器）。

## 固定信息

- **slug**: `nekketsu-storm-soccer`（全网唯一,更新必须复用,不得更改）
- **work 参数**: `nekketsu-storm-soccer`（src/net/dreamin.ts 中 WORK 常量,与 slug 一致）
- **title**: 热血风暴 NEKKETSU STORM SOCCER
- **author**: bucai
- **线上地址**(首发后): https://ai.dreamin.cn/works/nekketsu-storm-soccer/

## updateToken（首发成功后立即填到这里）

```
updateToken: <首发后从返回 JSON 或上传页面复制>
```

⚠️ token 是作品唯一修改凭证,泄露=他人可覆盖作品。只存本地,不要提交公开仓库。

## 发布步骤（路径 A：用户自行上传）

1. 构建并打包（已完成,产物为本目录 `nekketsu-work.zip`,根目录含 index.html）:
   ```
   npm run build
   python -c "import zipfile,os; [(z.write(os.path.join(r,f), os.path.relpath(os.path.join(r,f),'dist'))) for z in [zipfile.ZipFile('nekketsu-work.zip','w',zipfile.ZIP_DEFLATED)] for r,d,fs in [os.walk('dist')] for f in fs]"
   ```
2. 打开 https://ai.dreamin.cn/upload/ ,填表提交:
   - file: `nekketsu-work.zip`
   - slug: `nekketsu-storm-soccer`
   - title: `热血风暴 NEKKETSU STORM SOCCER`
   - author: `bucai`
   - desc: `致敬 FC 热血足球的原创 3v3 街机足球 · 必杀射门/花式过人/支持双人联机对战`
   - online: `1`（用了 Dreamin 联机 SDK,卡片显示「联机」徽章）
3. 首发成功后把 updateToken 复制回本文件保存。
4. 后续更新:重新构建打包后,**同一 slug** 再提交,表单会要求填 updateToken。

或用 curl 一键提交（Windows 下在 Git Bash 执行）:

```bash
curl -X POST https://ws.dreamin.cn/upload/ \
  -F "file=@nekketsu-work.zip" \
  -F "slug=nekketsu-storm-soccer" \
  -F "title=热血风暴 NEKKETSU STORM SOCCER" \
  -F "author=bucai" \
  -F "desc=致敬 FC 热血足球的原创 3v3 街机足球 · 必杀射门/花式过人/支持双人联机对战" \
  -F "online=1"
# 更新时追加: -F "token=<updateToken>"
```

## 上传限制核对（2026-08-24 回退 GLB 后实测）

| 项 | 限制 | 实际 |
|---|---|---|
| zip 大小 | ≤50MB | 0.17MB ✓ |
| 文件数 | ≤500 | 2 ✓ |
| 单文件 | ≤20MB | 0.17MB ✓ |
| 根目录 index.html | 必须 | ✓ |

## 联机红线遵守情况

- 房间 ≤20 人:1v1 对战仅 2 人 ✓
- sendState ≤30Hz:快照 20Hz、客机输入 15Hz ✓
- send(message) ≤10Hz:仅离散事件与 hello 握手 ✓
- 单条 ≤4KB:快照数组化 ~1.5KB、输入 ~60B ✓
- work/room 名:a-z0-9-,房间码规范化为 `n-XXXX` ✓
- 断线重连:同实例重新 room.join(),换新 room 对象重挂回调 ✓
