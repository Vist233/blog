---
title: "Introducing Sakura: A Complete Coding Agent, Yours to Define"
date: 2026-11-18
tags:
  - Sakura
  - Coding Agents
---

**Don't build another Agent. Build with one.**

一个完整的 Coding Agent，可以直接使用，也可以成为其他软件内部可自由组合的执行能力。

GitHub：[Vist233/Sakura](https://github.com/Vist233/Sakura)\
npm：`sakura-agent`

---

## Part I — Why Sakura Exists

### 1. The Next Step for Coding Agents

过去一年，Coding Agent 改变了我们开发软件的方式。我们可以把一个目标交给 Agent，让它读取项目、修改文件、运行命令，并在不断获得反馈的过程中完成任务。

当我们开始把这些能力放进自己开发的软件时，需求发生了变化。Coding Agent 不再只是一个供人打开、输入任务、等待结果的独立产品；它也可以成为软件内部的一个执行单元。

实验平台可以让多个 Agent 探索不同方案，代码审查系统可以从工作 Agent 派生 Reviewer，自动化平台可以让不同 Agent 在本地或远程环境中执行任务。它们的业务目标不同，但都需要模型决策、工具执行、会话记录，以及在长任务中继续运行和恢复的能力。

真正不同的是：每个应用需要怎样组织和控制这些能力。

**如果一个完整的 Coding Agent 已经存在，为什么开发者还要为每一种应用重新建设一套 Agent 执行系统？**

### 2. The Problem Is Not Intelligence

以并行实验系统为例。多个 Agent 可以独立探索、修改代码、运行实验，再根据评价结果继续优化。难点不在于让模型多调用几次工具，而在于如何把这些 Agent 组织成一个可靠的软件系统。

我们可能希望多个 Agent 共享模型预算，却保留独立会话；同时运行很多 Agent，却只允许少量重型任务占用 CPU；让工作 Agent 可以修改文件，而 Reviewer 只能读取；让 Reviewer 继承已有上下文，却不继承工作 Agent 的全部执行权限。甚至还希望 Reviewer 保留模型侧的工具声明和请求前缀，同时在真实执行时受到更严格的限制。

这些需求要求模型请求、会话历史、工具执行、运行环境和附加策略能够分别控制。

直接采用完整的终端 Agent，开发者需要适配它已经确定的交互方式、工具体系和运行生命周期；从模型 API 开始构建，则又要重新实现 Agent Loop、工具协议、上下文管理、会话持久化、错误处理和恢复机制。

前者可能带来不需要的产品约束，后者则重复建设大量通用能力。我们需要一种中间形态：**完整到可以直接工作的 Coding Agent，同时允许开发者定义它的执行方式。**

这就是 Sakura 要解决的问题。

### 3. Introducing Sakura

Sakura 是一个 Library-first、可组合、可嵌入的 Coding Agent Harness。它把完整 Agent 所需的通用执行机制组织成可复用的核心，同时允许应用替换、扩展或组合其中的部分能力。

- **Complete：不从零开始。** 开发者可以直接创建具备模型、工具、会话和执行环境的 Coding Agent，不必先实现 Agent Loop。
- **Composable：只改变需要改变的部分。** 模型客户端、会话存储、执行环境和附加策略具有明确边界，可以分别替换或组合。
- **Embeddable：Agent 是软件的一部分。** 宿主应用可以创建、配置、观察和关闭 Agent，并决定如何组织多个 Agent、管理资源和连接业务流程。

开发者获得的是一个完整 Agent，但不必接受一个封闭的运行方式。

### 4. Define Only the Difference

创建一个完整的 Coding Agent，可以从几行代码开始：

```typescript
import { createAgent } from "sakura-agent";

const agent = await createAgent({ model });
const run = agent.run("Fix the failing tests.");

for await (const event of run.events) {
  // Observe the agent.
}

const result = await run.result;
await agent.close();
```

默认 Agent 已经具备常见的 Coding Agent 能力。创建专用 Agent 时，开发者主要定义它与默认 Agent 的差异，而不必重写共同的执行机制。

例如，只读 Reviewer 可以通过 `tools: ["read"]` 限定实际可用工具；远程 Agent 可以注入 SSH `Environment`；需要通过测试才能完成的任务可以设置 `goal.verify`。变化的是工具、环境或完成条件，不是 Agent Loop。

```typescript
const reviewer = await createAgent({
  model,
  cwd: "./project",
  tools: ["read"],
  rules: ["Review the code. Do not modify files."],
});
```

**我们希望开发者定义的是 Agent 之间的差异，而不是重复建设它们共同需要的部分。**

### 5. The Agent Is Not the Machine

Agent 的决策、工具执行、会话状态和计算资源，是不同的问题。一个正在等待模型响应的 Agent，不需要持续占用 CPU；一个只负责阅读代码的 Reviewer，也不需要拥有与工作 Agent 相同的执行权限。

Sakura 通过统一的 `Environment` 接口访问文件、执行命令和管理进程，当前提供 Local、SSH 和 Docker 实现。相同的 Agent Loop 可以使用不同的执行位置，不必为每种环境重写工具。

但 `Environment` 不是资源调度器，也不自动提供操作系统级安全隔离。Agent 数量、容器数量、重型任务并发和模型请求预算，仍由宿主应用按实际需求组织。Sakura 提供可供应用控制的执行边界，而不是替所有应用决定资源策略。

如果应用有二十个 Agent，却只希望同时运行八个重型实验，就应该限制重型工具的执行并发，而不是把 Agent 数量也限制为八个。**Agent 的数量、执行环境和实际计算并发，不应该被强制绑定。**

### 6. A Small Core, Explicit Boundaries

一个 Coding Agent 需要回答三个基础问题：模型如何产生下一步决策；已经发生的事情如何记录、读取和恢复；工具在哪里执行，又如何访问外部世界。Sakura 将它们分别交给 `LlmClient`、`Log` 和 `Environment`，由 Kernel 连接这些能力并运行 Agent Loop。

| Module | Hides | Public contract | Approx. size |
|---|---|---|---:|
| `kernel` | Agent Loop、事件、恢复、上下文压缩、目标检查 | `run(log, input)`、events、hooks | 1,650 lines |
| `llm` | HTTP、SSE、重试、错误分类、供应商差异 | `LlmClient.stream(request)` | 620 lines |
| `env` | Local/SSH/Docker、持久 Shell、后台进程、输出限制 | `Environment` | 1,420 lines |
| `session` | 文件日志、分支、fork、文件锁 | `Log` | 490 lines |
| `plugins` | 上下文、工具、恢复、限制、审核、脱敏、子 Agent、Trace 等策略 | `setup(api)`、hooks | 9 plugins; 100–500 each |
| `agent` | 默认配置与组件装配 | `createAgent(config)` | 580 lines |

从整个代码库看，这些模块构成五层：

```text
5  Products   Sakura Code · Vesper · Infinity · evals
              使用已有能力构建产品，不向通用核心增加业务机制
4  Assembly   createAgent · corePlugins · compose
              装配配置、模块和插件
3  Plugins    context · tools · resilience · limits · review
              redaction · agents · toolset · trace
              为不同应用增加可选策略
2  Core       kernel · llm · env · session · testing
              提供通用执行机制和稳定接口
1  Data       model records · compatibility · image formats · context window
              定义跨模块使用的数据结构
```

产品层组合已有模块；Assembly 负责装配；Plugins 增加可选策略；Core 提供通用执行机制；Data 定义跨模块的数据契约。产品专用逻辑不应反向进入通用 Kernel。

这些边界由 `scripts/check-boundaries.mjs` 在构建检查中执行，而不是只靠约定：Kernel 不依赖其他模块；LLM、Environment、Session 和 Testing 只依赖 Kernel；插件包可以依赖 Kernel、LLM、Environment 和 Session 的公开入口，但不能相互导入，也不能深入引用其他包的内部文件。Agent Assembly 则负责导入并装配这些插件。每个模块还可以独立运行 `test:isolated`；端到端覆盖规则要求每个模块至少出现在三个场景中，当前测试超过 5,000 项，且不调用真实模型。

### 7. Plugins: Reuse Without Coupling

插件之间不直接导入彼此的实现，不代表它们不能复用彼此的能力。Sakura 将源码依赖与运行时组合分开处理。

Kernel 提供八个 Hook，覆盖上下文构造、模型请求、工具执行前后、回合结束、错误和事件处理。插件通过 Hook 介入执行过程；`requires` 和 `provides` 声明所需依赖与提供的能力；`compose()` 展开 Bundle、去重并确定安装顺序，在运行前检查缺失依赖、重名和循环依赖。

这使不同插件可以各自实现，再由 Assembly 组合。例如，SubAgent 可以直接复用 AutoReview，而不需要重新实现审核逻辑，也不需要导入 `review` 插件的源码。

Sakura 的 SubAgent 默认继承父 Agent 已安装的插件，但会排除 `agents`、`limits`、`context` 和 `tools`；因此，父 Agent 安装的 `review` 和 `redaction` 默认会继续作用于子 Agent。应用还可以通过 `notInherited` 指定不继承的插件。

```typescript
import { createAgent, corePlugins, reviewPlugin } from "sakura-agent";

const agent = await createAgent({
  model,
  plugins: [...corePlugins(), reviewPlugin({ llm: reviewerModel })],
  subAgents: {},
});
```

这里，`agents` 负责创建和管理子 Agent，`review` 负责审核工具调用。两者独立实现，由 Agent Assembly 将它们组合起来。模块独立不意味着能力孤立；它意味着复用不必以源码耦合为代价。

同样，应用可以在 `LlmClient` 外包装共享预算控制器，也可以在 `tool.run` 阶段限制重型命令并发。请求预算、权限检查、上下文处理、资源限制和 Trace 可以放在各自的执行边界，不必为每个新需求向 Kernel 添加专用开关。

### 8. A Branch Agent: Putting Composition to Work

Infinity 中有一个更复杂的需求：从正在工作的 Agent 派生一个独立 Reviewer。它需要继承已有会话历史，保持需要复用的模型请求特征，却拥有不同的实际执行权限；完成检查后，再把建议交还给主 Agent。

从头创建 Reviewer，会重复读取项目和任务；直接复用主 Agent，又会继承不需要的写入和 Shell 权限。Infinity 因此将这些要求拆开处理：通过 `fork` 继承会话历史；创建独立 Agent；用执行前 Guard 限制实际操作；用模型客户端包装保留需要复用的请求特征；再通过独立结果通道返回建议。

核心装配可以概括为：

```typescript
fork: (path) => live.fork(path),

openReviewer: (sessionFile, guard, wrapClient) =>
  build(
    sessionFile,
    [...corePlugins(), guard],
    wrapClient(deps.client)
  ),

advise: (text) => advice.deliver(text),
```

Reviewer 可以保留模型侧的工具声明，但这不代表它拥有相应的实际执行权限；Guard 会在工具真正运行前检查并拒绝不允许的操作。Reviewer 使用独立会话，不覆盖主 Agent 的历史，最终只把审查建议交回主 Agent，由主 Agent 决定是否采纳。

这里的 `build`、审核调度、结构化结果、生命周期和建议处理属于 Infinity；Sakura 提供可复用的会话、模型客户端、插件和执行边界。这个案例说明，应用可以重新组合完整 Agent 的能力，而不必重新实现一套 Agent Loop。

---

## Part II — What We Built and What We Measured

前半部分说明 Sakura 为什么存在，以及它如何让 Agent 的执行能力被拆分和重新组合。下面的数据来自 Sakura Code、Sakura 的真实运行记录和 Infinity 的独立实验，分别代表不同层面的证据，不应混成一个 Benchmark。

### 1. Real Usage, Not a Demo

截至 **2026-11-18 22:28**，本机聚合了 168 个真实会话，覆盖 11 月 9 日至 11 月 18 日。数据包含正在运行的会话，仍会缓慢增长。

| Dimension | Snapshot |
|---|---:|
| Sessions | **168** across 9 active days |
| Wall-clock time | **167 hours**; 89 hours of active work, the rest waiting or idle |
| Model requests | **7,713** across 1,154 user messages, about 7 requests per message |
| Tool calls | **7,150**: Bash 6,215 · Write 476 · Read 220 · Edit 182 · other 57 |
| Tokens | 19.2M input · 6.2M output · 1.38B provider cache reads |
| Aggregate cache hit | **98.63%**; highest single long run 99.3% |
| Context and goals | 101 compactions · 514 goal checks |
| Main model routes | OpenCode / DeepSeek v4.1 Flash: 115 sessions · CommandCode / DeepSeek v4.1 Flash: 52 sessions |

按缓存读取量除以缓存读取量与未命中输入量之和计算，约为 `1.38B / (1.38B + 19.2M) = 98.63%`。它反映这批长会话中的请求前缀复用情况，受模型供应商缓存策略和具体任务影响，不应直接等同于 Sakura 单独带来的成本节省。

### 2. Long-Running Sessions

这 168 个会话中，有多次持续数小时的真实开发任务。以下列出五个具有代表性的长会话：

| Session | Wall / active | Model requests | Tool calls | Reviews / denials | Work |
|---|---:|---:|---:|---:|---|
| `a7820a3f` | **43.7 h / 36.3 h** | 2,580 | 2,438 | 617 / 2 | Lean 数学任务；前 20.8 小时无人值守 |
| `89540059` | 19.5 h / 11.7 h | 1,153 | 1,160 | 1,160 / 9 | 三本桌面手册端到端验收、IMAP 模拟 |
| `3547c6bc` | 19.2 h / 8.7 h | 1,108 | 782 | 782 / 5 | 中药处方模型优化，342 次 goal check |
| `4966e09c` | 16.8 h / 5.4 h | 374 | 406 | 404 / 12 | 远端服务器上的 herb pipeline |
| `6c20ed20` | 11.6 h / 11.6 h | 932 | 647 | 647 / 10 | Infinity-capacity 实验编排 |

README 中的 20.8 小时运行记录也已重新核对：`a7820a3f` 前 20.8 小时实际完成 **1,822 次模型请求、1,796 次工具调用，0 次审核拒绝**；整条会话最终持续 43.7 小时。原先“之后 15 小时 445 次审核”的描述应修正为 **16.7 小时 445 次审核**；整条会话最终记录 617 次审核、2 次拒绝。

这批记录还显示，长任务并不依赖一直保留一个未压缩的上下文：101 次上下文压缩后，任务继续执行；最长会话达到 43.7 小时、2,580 轮模型请求。

### 3. Tool Review in Real Work

168 个会话累计产生 **5,314 次工具调用审核**：5,239 次放行、75 次拒绝，拒绝率 **1.41%**。逐条复核后，75 次拒绝中有 42 次属于真实风险，其余是运行取消、误拦或人工/缓存记录。

| Review outcome | Count | Meaning |
|---|---:|---|
| Destructive deletion or overwrite | **16** | 破坏性删除、覆盖 |
| Violating explicit instructions / self-expansion | **8** | 违背用户明令或自行扩权 |
| Credential access or disclosure | **6** | 凭据读取或外传 |
| Privilege escalation / unauthorized host | **5** | 越权提权、未授权主机 |
| Download-and-execute | **4** | 下载后直接执行未审代码 |
| Out-of-scope file access | **3** | 项目外或系统目录读写 |
| **Real risks intercepted** | **42** | **真实风险拦截** |
| Run cancelled during review | 18 | 技术性拒绝，不代表风险判断 |
| Hard-rule false positives | 13 | 误拦，包括 `curl ... \| python3` 和 heredoc |
| Human / cache | 2 | 人工拒绝或缓存重复 |
| **All denials** | **75** | **全部拒绝** |

审核由多层决策组成：约 **22%** 由硬规则决策，共 **1,144 次**，其中 **815 次在 0 ms 内完成**；独立审核模型处理 **4,157 次**，决策延迟 p50 为 **2.7 秒**；另有 6 次人工决策和 7 次缓存决策。6 次人工决策全部来自 ACP 授权测试会话，长跑任务没有人工 defer。审核模型累计使用约 3.7M 输入 Token 和 422K 输出 Token。

因此，审核并不是简单判断命令看起来是否危险。它还要判断操作是否符合用户明确给出的授权范围。它不能证明没有漏拦，但这 5,314 条真实记录表明，审核机制已经在实际工具调用中运行，并识别出删除、越权、凭据和下载执行等具体风险。审核作为插件按需启用，不是每个 Agent 都必须承担的固定成本。

### 4. Sakura Code and Infinity

**Sakura Code 验证完整 Agent 能否完成实际开发任务。** 在 Terminal-Bench 2.1 本地第一轮评测中，Sakura Code 完成 **75/88，Pass@1 为 85.23%**。这是 Sakura Code 的成绩，不是 Sakura 框架本身的 Benchmark，也不是多轮取最好或官方榜单成绩。

**Infinity 验证 Agent 能否成为更大系统中的可组合执行单元。** 在一组持续约 4.5 小时的 16 vCPU 容量实验中，16 个 Agent 配合 8 个重型执行槽位运行。单纯提高 Agent 并发时，`load/core` 从 1.63 升至 1.97，评分变化跨度约为 0.0022，没有带来稳定的质量提升；将重型任务限制在 8 个槽位后，`load/core` 降至约 1.02，CPU busy 约为 0.96。首个评分结果从 29.3 分钟提前到 16.5 分钟，缩短约 **43.7%**。这组任务的 RTX 4090 利用率接近 0%，主要瓶颈是 CPU 工作负载。

在 8 个槽位的探索中，6 个 Agent 达到 0.319，另外 2 个停在 0.251；两轮中停滞的成员不同，瓶颈更可能在探索方法，而不是算力。槽位利用率从 86% 提高到 97%，代价是排队总时长从 1.8 小时增加到 12.7 小时。另一组定向探索使用约 43% 的 Token，得到最好分数的 98.7%，但达到 0.32 的时间从 39 分钟延长到 74 分钟。另一次满负载记录中，6,004 次请求没有出现 throttle、丢请求或崩溃，`load1` 峰值为 18.4（16 核机器的 1.15 倍），内存占用达到 91.6%；这些结果共同说明，资源控制需要在吞吐、等待时间和结果质量之间取舍，而不是简单追求更多 Agent。

### 5. What These Results Say

这些数字回答的是不同问题：Sakura Code 的 75/88 说明基于 Sakura 可以构建具备实际任务能力的 Coding Agent；168 个会话和多次长跑说明它已用于持续开发工作；5,314 次审核说明执行策略可以进入真实工具路径；Infinity 的实验则说明 Agent 并发、重型计算并发和业务调度可以由宿主应用分别组织。

它们不是一组用来宣称全面领先的综合跑分，也不能证明所有环境下都具有相同表现。它们证明的是：Sakura 的架构已经被用于构建完整 Agent、长时间执行和多 Agent 应用，而不是停留在接口设计或单次演示。

### 6. Build What Comes Next

模型会继续变强，但更强的模型不会消除软件对权限、资源、状态和执行边界的要求。只读 Reviewer 仍然不应该拥有部署权限；一百个 Agent 仍然不能无限制地占用同一台机器；已经发生的外部副作用，也不会因为模型更聪明就自动撤销。

我们不希望 Sakura 的长期价值建立在弥补某一代模型的缺陷之上。我们希望它成为模型能力与真实软件系统之间稳定、可组合的执行基础。

Sakura Code 和 Infinity 是使用 Sakura 构建的两个不同产品：一个验证完整 Coding Agent 的实际能力，另一个验证这些能力能否被重新组合，成为更复杂系统的一部分。

我们希望开发者能够用 Sakura 构建更多我们没有预先想到的 Agent。一个真正具有组合能力的框架，不应该只能构建框架作者已经设计好的产品。

```bash
npm install sakura-agent
```

TypeScript · MIT License · Node.js 22.18+

GitHub：[Vist233/Sakura](https://github.com/Vist233/Sakura)

**Sakura — A complete Coding Agent. Yours to define.**
