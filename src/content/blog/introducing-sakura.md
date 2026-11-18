---
title: "Introducing Sakura: A Complete Coding Agent, Yours to Define"
date: 2026-11-18
tags:
  - Sakura
  - Coding Agents
---

[简体中文](/blog/introducing-sakura-zh-cn/)

**Don't build another Agent. Build with one.**

Sakura provides a complete Coding Agent that you can use directly or compose into the execution capabilities of your own software.

GitHub: <https://github.com/Vist233/Sakura>\
npm: `sakura-agent`

------------------------------------------------------------------------

## Part I — Why Sakura Exists

### 1. The Next Step for Coding Agents

Over the past year, Coding Agents have changed how we build software. We can give an agent a goal, let it inspect a project, modify files, run commands, and work through feedback until the task is complete.

When we started putting these capabilities inside software we build ourselves, the requirements changed. A Coding Agent is no longer only a standalone product that someone opens, prompts, and waits for. It can also become an execution unit inside another application.

An experiment platform may run several agents to explore different approaches. A code review system may create a Reviewer from a working agent. An automation platform may run agents in local or remote environments. Their business goals differ, but they need similar underlying capabilities: model decisions, tool execution, session history, and the ability to keep running or recover during long tasks.

What differs is how each application needs to organize and control those capabilities.

**If a complete Coding Agent already exists, why should developers rebuild an Agent execution system for every application?**

### 2. The Problem Is Not Intelligence

Consider a parallel experiment system. Multiple agents can independently explore approaches, modify code, run experiments, and continue optimizing from evaluation results. The hard part is not making a model call more tools. It is organizing those agents into a reliable software system.

We may want agents to share a model budget while keeping separate sessions; run many agents while allowing only a few heavy jobs to consume CPU; let a working agent modify files while a Reviewer can only read them; or let the Reviewer inherit existing context without inheriting all of the working agent's execution permissions. We may even want the Reviewer to retain model-side tool declarations and request prefixes while enforcing stricter permissions at actual execution time.

These requirements call for separate control over model requests, session history, tool execution, runtime environments, and additional policies.

Adopting a complete terminal agent means adapting the host application to its existing interaction model, tool system, and lifecycle. Building from model APIs means implementing the Agent Loop, tool protocol, context management, session persistence, error handling, and recovery all over again.

The first path may impose product constraints the application does not need. The second repeats a large amount of common infrastructure.

We need a different shape:

**A Coding Agent that is complete enough to work out of the box, while allowing developers to define how it executes.**

That is the problem Sakura is built to address.

### 3. Introducing Sakura

Sakura is a library-first, composable, embeddable Coding Agent Harness. It organizes the common execution machinery required by a complete agent into reusable components, while allowing applications to replace, extend, or compose parts of that machinery.

- **Complete: start without rebuilding the basics.** Developers can create a Coding Agent with a model, tools, a session, and an execution environment without first implementing an Agent Loop.
- **Composable: change only what needs to change.** Model clients, session storage, execution environments, and additional policies have explicit boundaries and can be replaced or combined independently.
- **Embeddable: the agent is part of the software.** A host application can create, configure, observe, and close agents. It decides how to organize multiple agents, manage resources, and connect them to business workflows.

Developers get a complete agent without having to accept a closed way of running it.

### 4. Define Only the Difference

Creating a complete Coding Agent can start with a few lines:

``` typescript
import { createAgent } from "sakura-agent";

// model is an already configured ModelConfig or LlmClient
const agent = await createAgent({ model });

const run = agent.run("Fix the failing tests.");

for await (const event of run.events) {
  // Observe the agent.
}

const result = await run.result;
await agent.close();
```

The default agent already provides the common capabilities of a Coding Agent. When creating a specialized agent, developers mainly define how it differs from the default rather than rewriting the execution machinery shared by all agents.

For example, a read-only Reviewer can use `tools: ["read"]` to limit the tools it receives. A remote agent can inject an SSH `Environment`. A task that must pass tests before completion can define `goal.verify`. What changes is the tool set, environment, or completion condition — not the Agent Loop.

``` typescript
const reviewer = await createAgent({
  model,
  cwd: "./project",
  tools: ["read"],
  rules: ["Review the code. Do not modify files."],
});
```

Remote execution only requires replacing the Environment:

``` typescript
import {
  createAgent,
  createSshEnvironment,
} from "sakura-agent";

const environment = await createSshEnvironment({
  host: "agent@server",
  cwd: "/srv/project",
});

const agent = await createAgent({
  model,
  environment,
});
```

A task with a verification condition can define its completion criteria directly:

``` typescript
const fixer = await createAgent({
  model,
  goal: {
    objective: "Make all tests pass",
    verify: "npm test",
  },
});
```

**We want developers to define what makes their agents different, not rebuild what every agent needs.**

### 5. The Agent Is Not the Machine

An agent's decisions, tool execution, session state, and compute resources are different concerns. An agent waiting for a model response does not need to keep a CPU busy. A Reviewer that only reads code does not need the same execution permissions as the agent doing the work.

Sakura uses a common `Environment` interface to access files, execute commands, and manage processes. Current implementations include Local, SSH, and Docker. The same Agent Loop can use different execution locations without rewriting the tools for each environment.

But an `Environment` is not a resource scheduler, and it does not automatically provide operating-system-level isolation. The number of agents, containers, heavy jobs, and model-request budgets are still organized by the host application according to its needs. Sakura provides execution boundaries that an application can control; it does not decide resource policy for every application.

If an application has twenty agents but wants only eight heavy experiments to run at once, it should limit the concurrency of heavy tool execution rather than limiting the number of agents to eight.

**Agent count, execution environment, and actual compute concurrency should not be forced into one number.**

### 6. One Problem, One Place

A Coding Agent needs to answer three basic questions:

- How does the model produce the next decision?
- How are things that have already happened recorded, read, and recovered?
- Where do tools execute, and how do they access the outside world?

Sakura assigns these questions to three core interfaces:

| Interface     | Question                                                          |
|---------------|-------------------------------------------------------------------|
| `LlmClient`   | How does the agent communicate with a model?                      |
| `Log`         | What has happened, and how can it be recovered?                   |
| `Environment` | Where do tools execute, and how do they access the outside world? |

The Kernel connects these capabilities, runs the Agent Loop, and maintains core execution semantics. The surrounding modules each own a different responsibility:

- **LLM** handles HTTP, SSE, retries, error classification, and provider differences.
- **Environment** handles Local, SSH, Docker, persistent Shells, background processes, and output limits.
- **Session** handles file logs, session branches, forks, and file locks.
- **Plugins** provide optional policies for context, tools, resilience, limits, review, redaction, sub-agents, and tracing.
- **Agent Assembly** combines configuration, core modules, and plugins into a runnable agent.

Across the codebase, these modules form five layers:

``` text
5  Products
   Sakura Code · Infinity · Evaluations
   Build products from existing capabilities without adding product logic to the common core

4  Assembly
   createAgent · corePlugins · compose
   Assemble configuration, modules, and plugins

3  Plugins
   context · tools · resilience · limits
   review · redaction · agents · toolset · trace
   Add optional policies for different applications

2  Core
   kernel · llm · env · session · testing
   Provide common execution mechanisms and stable interfaces

1  Data
   model records · compatibility · image formats · context window
   Define data structures shared across modules
```

The Products layer combines existing modules. Assembly connects them. Plugins add optional policies. Core provides common execution mechanisms. Data defines the contracts shared across modules. Product-specific logic should not flow back into the general-purpose Kernel.

These boundaries are checked by `scripts/check-boundaries.mjs`, not left to convention:

- The Kernel does not import other modules.
- LLM, Environment, Session, and Testing depend only on the Kernel.
- Plugins may depend on public Core package entry points, but cannot directly import other plugins.
- Modules cannot reach into another package through deep internal paths.
- Agent Assembly imports and composes the modules.

Interfaces are validated through contract tests. Different Environment implementations follow the same applicable public contract. A new implementation can be used as the same kind of execution environment only when it satisfies that contract.

The point is not the number of modules. It is that each kind of complexity has a clear owner. A provider changing its response protocol should not force changes to file tools. Adding a new execution environment should not require rewriting the model loop. Adding an application-wide budget controller should not require the Kernel to understand the application's business rules.

### 7. Plugin Composition: Reuse Without Coupling

The fact that plugins do not directly import one another's implementations does not mean they cannot reuse one another's capabilities. Sakura separates source-level dependencies from runtime composition.

The Kernel provides eight Hooks covering context construction, model requests, tool execution before and after, turn completion, errors, and events. Plugins use Hooks to participate in execution. `requires` and `provides` declare dependencies and capabilities. `compose()` expands bundles, deduplicates plugins, determines installation order, and checks for missing requirements, duplicate names, and dependency cycles before execution begins.

The same mechanism supports plugin reuse in SubAgents.

When a parent agent installs `reviewPlugin` and enables sub-agents with `subAgents: {}`, Agent Assembly passes the parent's inherited plugins to its child agents. By default, `review` and `redaction` are inherited. The default exclusions are `agents`, `limits`, `context`, and `tools`. Applications can change the inheritance set through `notInherited`, using plugin names.

``` typescript
import {
  createAgent,
  corePlugins,
  reviewPlugin,
} from "sakura-agent";

const agent = await createAgent({
  model,
  plugins: [
    ...corePlugins(),
    reviewPlugin({ llm: reviewerModel }),
  ],
  subAgents: {},
});
```

Here, `agents` creates and manages child agents, while `review` checks tool calls. They are implemented independently and composed by Agent Assembly.

A SubAgent can therefore reuse AutoReview without reimplementing the review logic and without making the `agents` plugin import the source code of the `review` plugin.

**Independent modules do not mean isolated capabilities. They mean reuse does not require source-level coupling.**

An application can also wrap `LlmClient` with a shared budget controller or limit heavy-command concurrency at `tool.run`. Request budgets, permission checks, context processing, resource limits, and tracing can live at their respective execution boundaries instead of adding a dedicated Kernel switch for every new requirement.

### 8. A Branch Reviewer: Composition in Infinity

Infinity has a more complex requirement: create an independent Reviewer from an agent that is already working. The Reviewer needs to inherit the existing session history and preserve selected model-request characteristics, while having different actual execution permissions. When the review is complete, it must return its advice to the main agent.

Creating the Reviewer from scratch would require rereading the project and task. Reusing the main agent directly would give it write and Shell permissions it does not need.

Infinity separates these requirements:

1.  Fork the existing session history.
2.  Create an independent Agent instance for the Reviewer.
3.  Use an execution-time Guard to limit what it can actually do.
4.  Wrap the model client to preserve request characteristics that need to be reused.
5.  Return the result through a separate advice channel.

The core assembly can be summarized as:

``` typescript
fork: (path) => live.fork(path),

openReviewer: (sessionFile, guard, wrapClient) =>
  build(
    sessionFile,
    [...corePlugins(), guard],
    wrapClient(deps.client)
  ),

advise: (text) => advice.deliver(text),
```

The Reviewer can retain model-side tool declarations without gaining the corresponding execution permissions. The Guard checks and rejects disallowed operations before the tools actually run.

The Reviewer uses an independent session and does not overwrite the main agent's history. It returns its review advice to the main agent, which decides whether to accept it.

The `build` function, review orchestration, structured results, lifecycle management, and advice delivery belong to Infinity. Sakura provides the reusable sessions, model client, plugins, and execution boundaries.

This case shows how an application can recombine the capabilities of a complete agent without implementing another Agent Loop.

------------------------------------------------------------------------

## Part II — What We Built and What We Measured

The first part explains why Sakura exists and how it lets agent execution capabilities be separated and recombined. The following data comes from Sakura Code, real Sakura usage records, and separate Infinity experiments. They represent different kinds of evidence and should not be combined into one benchmark.

### 9. Real Usage, Not a Demo

As of **2026-11-18 22:28**, the local aggregation contained 168 real sessions, spanning November 9 through November 18, with activity on nine days. The snapshot includes the session that was still running at the time, so the numbers may continue to grow.

| Metric                   |                                                                                      Snapshot |
|--------------------------|----------------------------------------------------------------------------------------------:|
| Sessions                 |                                                                  **168** across 9 active days |
| Wall-clock time          |                **167 hours**, including 89 hours of active work; the rest was waiting or idle |
| Model rounds             |                            **7,713**, across 1,154 user messages — about 7 rounds per message |
| Tool calls               |                            **7,150**: Bash 6,215 · Write 476 · Read 220 · Edit 182 · Other 57 |
| Tokens                   |                                        19.2M input · 6.2M output · 1.38B provider cache reads |
| Aggregate cache hit rate |                                         **98.63%**; the highest single long run reached 99.3% |
| Context and goals        |                                                     101 context compactions · 514 goal checks |
| Main model routes        | OpenCode / DeepSeek v4.1 Flash: 115 sessions · CommandCode / DeepSeek v4.1 Flash: 52 sessions |

The aggregate cache-hit rate is calculated as provider cache reads divided by cache reads plus uncached input:

`1.38B / (1.38B + 19.2M) = 98.63%`

This reflects request-prefix reuse in these long sessions. It depends on provider caching policies and the task itself; it should not be presented as cost savings independently created by Sakura.

### 10. Long-Running Sessions

The 168 sessions include several real development tasks that ran for hours. Five representative sessions are listed below:

| Session    |  Wall / active time | Model rounds | Tool calls | Reviews / denials | Work                                                                          |
|------------|--------------------:|-------------:|-----------:|------------------:|-------------------------------------------------------------------------------|
| `a7820a3f` | **43.7 h / 36.3 h** |        2,580 |      2,438 |           617 / 2 | Lean mathematics task; first 20.8 hours unattended                            |
| `89540059` |     19.5 h / 11.7 h |        1,153 |      1,160 |         1,160 / 9 | End-to-end acceptance of three desktop manuals and IMAP simulation            |
| `3547c6bc` |      19.2 h / 8.7 h |        1,108 |        782 |           782 / 5 | Traditional Chinese medicine prescription model optimization; 342 goal checks |
| `4966e09c` |      16.8 h / 5.4 h |          374 |        406 |          404 / 12 | Herb pipeline on a remote server                                              |
| `6c20ed20` |     11.6 h / 11.6 h |          932 |        647 |          647 / 10 | Infinity capacity experiment orchestration                                    |

The previously reported 20.8-hour run has also been rechecked. During the first 20.8 hours of `a7820a3f`, the agent completed **1,822 model rounds and 1,796 tool calls, with zero review denials**. The next 16.7 hours of the same session recorded 445 reviews. The full session eventually lasted 43.7 hours, with 2,580 model rounds, 2,438 tool calls, and 617 reviews, including two denials.

These records also show that long tasks do not depend on keeping an uncompressed context indefinitely. The work continued after 101 context compactions. The longest session reached 43.7 hours and 2,580 model rounds.

### 11. Tool Review in Real Development Work

Across the tracked usage, there were **5,314 tool-review decisions**: 5,239 allowed and 75 denied, for a denial rate of **1.41%**.

After reviewing the records individually, 42 of the 75 denials were classified as genuine risks. The rest were run cancellations, hard-rule false positives, or human / cache records.

| Denial category                                   |  Count | Description                                                       |
|---------------------------------------------------|-------:|-------------------------------------------------------------------|
| Destructive deletion or overwrite                 | **16** | Deleting or overwriting important files, directories, and results |
| Violating explicit instructions or self-expansion |  **8** | Acting beyond the user's explicit authorization                   |
| Credential access or disclosure                   |  **6** | Reading or exposing credentials                                   |
| Privilege escalation or unauthorized host access  |  **5** | Expanding privileges or accessing an unauthorized host            |
| Download-and-execute                              |  **4** | Directly executing downloaded, unreviewed code                    |
| Out-of-scope file access                          |  **3** | Reading or writing outside the project or into system directories |
| **Real risks intercepted**                        | **42** | **Classified after individual review**                            |
| Run cancelled during review                       |     18 | A technical cancellation, not a risk judgment                     |
| Hard-rule false positives                         |     13 | Including curl-to-Python pipe execution and heredoc cases         |
| Human / cache records                             |      2 | A human denial or cached duplicate                                |
| **All denials**                                   | **75** | **Total denials**                                                 |

Review decisions came from several layers:

- Hard rules made **1,144 decisions**, about 21.5% of the total. Of these, 815 were decided in 0 ms.
- The independent reviewer model made **4,157 decisions**, with p50 latency of **2.7 seconds**, p90 of 5.2 seconds, and p99 of 11.4 seconds.
- There were 6 human decisions and 7 cached decisions.

The reviewer model used approximately 3.7M input tokens and 422K output tokens. All six human decisions came from the ACP authorization test session `ed743255`; the long-running development tasks used automated review decisions.

One case illustrates what the review mechanism checks. Session `3547c6bc` attempted to execute `./clean_results.sh --apply`. The review denied the operation because the agent had only repeated “user approval pending” during a goal check. That statement was not user authorization. The command would have deleted 11 `.npy` files totaling about 365 MB.

Review is therefore not just a judgment about whether a command looks dangerous. It also checks whether the operation falls within the user's explicit authorization. This does not prove that no risk was missed. But these 5,314 records show that review was active in real tool execution and identified concrete risks involving deletion, privilege expansion, credentials, and downloaded code.

Review is an optional plugin, not a fixed cost every agent must incur.

### 12. Sakura Code and Infinity

**Sakura Code tests whether a complete agent can perform real development tasks.**

In a local first-round run of Terminal-Bench 2.1, Sakura Code completed **75 of 88 tasks, with a Pass@1 result of 85.23%**. This is a Sakura Code result, not a benchmark score for the Sakura framework. It is not a multi-run best result or an official leaderboard result.

**Infinity tests whether agent capabilities can become composable execution units inside a larger system.**

In a capacity experiment lasting about 4.5 hours on a 16-vCPU machine, the system used 16 agents and limited heavy jobs to 8 execution slots. Increasing agent concurrency by itself raised `load/core` from 1.63 to 1.97. The score varied by about 0.0022, without a stable quality improvement. Limiting heavy jobs to 8 slots brought `load/core` down to about 1.02, with CPU busy around 0.96. The time to the first scored result fell from 29.3 minutes to 16.5 minutes, a reduction of about **43.7%**. RTX 4090 utilization in this workload was close to zero; the main bottleneck was CPU work.

In the 8-slot exploration, six agents reached 0.319 while two remained at 0.251. The stalled members differed between two rounds, suggesting that the bottleneck was more likely the exploration method than compute capacity. Slot utilization increased from 86% to 97%, at the cost of increasing total queue time from 1.8 hours to 12.7 hours.

A separate targeted exploration used about 43% of the tokens and reached 98.7% of the best score, but the time to reach 0.32 increased from 39 minutes to 74 minutes. In another full-load record, 6,004 requests completed without throttling, dropped requests, or crashes. Peak `load1` was 18.4, or 1.15 times the core count on a 16-core machine, and memory usage reached 91.6%.

Together, these results show that resource control requires trade-offs among throughput, waiting time, and result quality. Simply increasing the number of agents is not a universal solution.

In the formal platform submission for the course task, Infinity ultimately scored **0.1888**, ranked first on the leaderboard, and improved **8.34%** over the platform baseline. Internal experiment scores did not transfer directly to the platform, so the reported result here is the actual platform score rather than the best internal result.

### 13. What These Results Say

These numbers answer different questions.

Sakura Code's 75/88 result shows that a capable Coding Agent can be built on Sakura. The 168 sessions and long-running tasks show that it has been used for sustained development work. The 5,314 review decisions show that execution policies can participate in real tool calls. Infinity's experiments show that agent concurrency, heavy-compute concurrency, and application scheduling can be organized separately by the host application.

They are not a single composite score claiming that Sakura is universally better, and they do not guarantee the same behavior in every environment.

They show that Sakura's architecture has been used to build a complete agent, run long tasks, and support multi-agent applications. It is not limited to interface design or a one-shot demonstration.

### 14. Build What Comes Next

Models will continue to improve, but more capable models will not remove software's need for permissions, resources, state, and execution boundaries.

A read-only Reviewer still should not have deployment permissions. One hundred agents still cannot consume a machine without limits. An external side effect that has already happened does not become reversible because the model is smarter.

We do not want Sakura's long-term value to depend on compensating for the weaknesses of one generation of models. We want it to provide a stable, composable execution foundation between model capabilities and real software systems.

Sakura Code and Infinity are two different products built with Sakura. One validates the practical capability of a complete Coding Agent. The other validates whether those capabilities can be recombined into a more complex system.

We want developers to use Sakura to build agents we have not thought of in advance.

A framework with real composability should not be limited to the products its authors have already designed.

``` bash
npm install sakura-agent
```

TypeScript · MIT License · Node.js 22.18+

GitHub: <https://github.com/Vist233/Sakura>

**Sakura — A complete Coding Agent, yours to define.**

------------------------------------------------------------------------

### Measurement Notes

- Snapshot time: 2026-11-18 22:28, including sessions that were still running at the time.
- Model rounds: assistant messages that contained `usage`.
- Tool calls: `tool_call` blocks in assistant messages.
- Active time: wall-clock duration minus gaps longer than 10 minutes.
- Review records exist from 2026-11-10 18:34 onward. Sessions on November 9 therefore have no review-event records.
- Provider cache reads are cumulative across requests. They should not be described as total context size or cost savings independently created by Sakura.
- The denial total includes cancellations and false positives. Do not describe all 75 denials as successful interceptions of dangerous operations.
