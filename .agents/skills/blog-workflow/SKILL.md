---
name: blog-workflow
description: 在 Vist233/blog 仓库中新增或修改博客文章、调整 Astro 页面、预览渲染，并在用户要求发布时提交、推送和核验 GitHub Pages 部署。
---

# 博客工作流

在此独立仓库完成博客工作。当前本机目录是 `/Users/zhangyvjing/Agent/blog`，origin 是 `https://github.com/Vist233/blog.git`。它不属于 Obsidian 仓库，也不需要 submodule。在其他机器使用仓库实际根目录。

## 开始工作

查看 `git status --short --branch`、`git remote -v` 和相关文件。保留已有修改。需要更新远端状态时执行 `git fetch origin`；工作树干净时可用 `git pull --ff-only origin main`。有本地修改或分支分歧时先检查差异，不用 reset、强推或自动丢弃文件。

网站来源以 `package.json`、`astro.config.mjs`、`src/content.config.ts` 和 `.github/workflows/ci.yml` 为准。以下说明于 2026-10-05 核验；配置改变时随之更新本 skill。

## 写文章与调整页面

- 文章放在 `src/content/blog/<slug>.md`。现有路由使用 slug，文件改名会改变 URL，改名前检查引用。
- 每篇文章必须有 YAML frontmatter 的 `title` 和 `date`。`description` 可省略，`tags` 是字符串数组。
- 用标准 Markdown 链接与图片。当前项目没有 wikilink 转换；从 Obsidian 复制的 `[[链接]]` 和 `![[图片]]` 需转换，并核对资源。
- 本项目没有草稿过滤。放进文章目录的有效文章会进入构建；未准备公开的内容留在仓库外。
- 静态图片放在 `public/images/`。Markdown 中可使用 `![说明](/blog/images/example.png)`，保留 `/blog` 路径前缀。
- 页面在 `src/pages/`，布局在 `src/layouts/`，样式在 `src/styles/global.css`。只修改任务需要的部分。

新文章示例：

```markdown
---
title: 文章标题
date: 2026-10-05
description: 一句话说明文章内容。
tags:
  - engineering
---

文章正文。
```

核对 `PostLayout.astro` 如何显示标题，避免正文重复添加同一标题。日期使用实际文章日期，不照抄示例日期。

## 本地预览与构建

云端 CI 使用 Node.js 22；本地优先用相同主版本。首次使用或锁文件改变后，在仓库根目录执行：

```sh
npm ci
```

编辑时运行：

```sh
npm run dev
```

终端显示本地地址，通常是 `http://localhost:4321/blog/`。用户可用浏览器查看；Agent 操作浏览器仍遵守当前会话授权。开发服务会随保存自动更新。用 Ctrl+C 结束。

发布前构建：

```sh
npm run build
```

必须确认命令成功。`dist/` 是生成的静态网页，不能把它当文章源文件。需要查看实际构建产物时执行 `npm run preview`，按终端显示的地址访问，通常是 `http://localhost:4321/blog/`。

检查首页、改动文章、图片、链接和 RSS。CLI 检查 HTML 可验证输出内容，但不能声称完成视觉检查。`node_modules/`、`.astro/`、`dist/` 和 `.DS_Store` 不提交。依赖安装失败时先查网络；本机可按工作区约定临时使用 7897 代理环境变量，不能把该代理写进云端 CI。

## 手动提交与发布

只编辑或预览不等于发布。用户要求发布或推送时，完成构建后继续执行，无需重复询问已有授权。先核对分支和远端；下面命令适用于 main：

```sh
git diff
git status --short
git add src/content/blog/example.md
git diff --cached
git commit -m "docs: add example article"
git push origin main
```

将 example 路径和提交说明替换为实际内容；新增图片或页面时显式加入相应文件。已暂存内容若属于其他工作，不混入本次提交。文件改动还未提交时，单独 push 不会上传它们。被远端拒绝时 fetch 并检查分歧，保留本地修改，不强推。

main 推送后的现有自动流程：

1. GitHub Actions 的 `ci` 执行 `npm ci` 和 `npm run build`。
2. `peaceiris/actions-gh-pages` 将 `dist/` 推到 gh-pages 分支。
3. GitHub Pages 从 gh-pages 根目录提供网页，地址为 `https://zhangyvjing.com/blog/`。

因此用户不需要手动渲染、上传 HTML 或操作 gh-pages。不要为了部署修改 Pages 配置、创建新的托管服务或手动推送生成目录。推送其他分支不会触发当前 workflow；它也未配置 workflow_dispatch。

## 核验发布

用 `git rev-parse HEAD` 记录发布提交，然后查询：

```sh
gh run list --repo Vist233/blog --branch main --limit 5 --json databaseId,headSha,status,conclusion,url
gh run view RUN_ID --repo Vist233/blog
gh api repos/Vist233/blog/pages
```

选择 headSha 匹配发布提交的运行，检查结论。失败时用 `gh run view RUN_ID --repo Vist233/blog --log-failed` 查原因，不能用旧成功运行证明新提交已部署。CI 成功后继续核对 Pages 状态和线上改动文章；Pages 部署和缓存可能晚于 CI。只有实际线上结果符合预期才报告已上线，否则说明已推送及仍未核验的阶段。

## 交付

说明改动文件、预览或构建结果，以及是否提交、推送、上线。编辑请求默认完成编辑和必要核验；发布授权来自当次任务，不由这个 skill 自动授予。
