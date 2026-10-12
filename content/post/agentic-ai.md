+++
title = "What Happens When AI Stops Waiting for Your Prompts?"
description = "My notes on agentic AI: profile, memory, planning, multi-agent coordination, evaluation, and how it connects back to the PEAS framework from AI coursework."
date = 2026-03-14T14:00:00+05:00
weight = 1
showAuthor = false
showTableOfContents = false
showWordCount = false
tags = ["Agentic AI", "AI", "Research Notes"]
featureimage = "https://dev-to-uploads.s3.amazonaws.com/uploads/articles/rvcgu574tz3xx50n4ch0.png"
featureimagealt = "Cover artwork for an article about agentic AI"
articletype = "Research notes"
sourceurl = "https://dev.to/aazan_noor_khuwaja/what-happens-when-ai-stops-waiting-for-your-prompts-d91"
+++

I recently read a research paper titled **The Rise of Agentic AI**, and it changed how I think about the direction AI systems are moving.

I use generative AI almost every day. It can be extremely capable, but the normal interaction is still passive: I provide a prompt, it produces a response, and then it waits again. The paper introduced a different model — **agentic AI**, where the system is designed around pursuing a goal rather than only responding to one instruction at a time.

## From passive generation to goal-directed action

The easiest way I found to think about the difference is this:

A normal generative-AI workflow waits for the next prompt. An agentic system is given an objective, breaks that objective into smaller steps, interacts with tools or an environment, observes what happened, and adjusts its plan when something goes wrong.

The example that made the idea concrete for me was travel planning. Instead of only suggesting an itinerary, an agent could theoretically work through the larger task: research options, compare them against a budget, make decisions, and continue until the goal is complete.

## What gives an agent its "brain"?

The paper breaks the architecture into several modules that helped me understand where this behavior comes from.

### Profile

The agent can be given a role or operating identity such as a **Senior Python Developer** or **Financial Analyst**. That profile influences the context in which it reasons and acts.

### Memory

The system can keep information about the current task, while also retaining useful information from earlier interactions. The long-term part is especially interesting because it gives the agent a way to remember previous mistakes or outcomes instead of treating every attempt as completely new.

### Planning and action

This was the part I found most interesting. The agent takes a larger objective and decomposes it into smaller actions. If code execution fails or a web-search step does not work, the system does not necessarily have to stop and wait for a person. It can inspect the failure, revise the plan, and try again.

That loop — **plan, act, observe, revise** — is what made the idea feel very different from a normal chatbot interaction.

## When agents work as a team

The paper also discusses **multi-agent systems**.

Instead of one agent doing everything, several specialized agents can collaborate. A manager-style agent might decompose a software project, a developer agent might work on implementation, and a tester agent might evaluate the output.

What interested me here was not simply the number of agents, but the coordination problem. Once multiple autonomous components can exchange information and make decisions, the system starts to resemble a small software organization rather than a single model answering questions.

## How do you evaluate an autonomous agent?

A system like this cannot be judged only by whether its final sentence looks correct.

The paper highlights metrics such as:

- **Task Success Rate:** did the system actually complete the objective?
- **Efficiency:** how much unnecessary work, including API calls or actions, did it perform?
- **Robustness:** what happens when an unexpected error appears?

That evaluation perspective stood out to me because autonomy makes the process itself important, not only the final output.

## The difficult part: autonomy also creates risk

The same capabilities that make agents interesting also make them harder to control.

If an agent can browse the web, call tools, or execute scripts, security becomes much more important. Multi-agent systems can also run into coordination problems, including agents getting stuck in unproductive loops.

And there is a more fundamental question: if an autonomous system makes a costly decision, deletes something important, or performs the wrong action, **who is responsible for that outcome?**

The paper made it clear to me that autonomy is not simply "more powerful AI." It creates a different engineering problem around permissions, reliability, evaluation, and accountability.

## Connecting it back to PEAS

This was the part that connected the research directly to my AI course.

We study rational agents using the **PEAS framework: Performance, Environment, Actuators, and Sensors**. Agentic AI made that classroom model feel much more concrete.

In a modern web-based agent, APIs and software tools can behave like actuators, while live data and tool responses can behave like sensors. The environment is no longer a simple grid or toy problem; it can be a complex digital system.

That connection helped me see agentic AI less as a completely new idea and more as a modern scaling of agent concepts we already study in AI fundamentals.

## My NotebookLM "aha" moment

When I first looked at the architecture diagrams in the paper, the coordination loops felt dense. I uploaded the paper to Google NotebookLM and asked it to explain the difference between reactive and deliberative behavior more simply.

The analogy it produced compared reactive behavior to a human reflex and deliberative behavior to strategic planning. That explanation helped me build a mental model before going back to the technical diagrams.

The experience also reminded me that AI tools are most useful to me when they help me **understand difficult material**, not when they replace the process of understanding it.

## Takeaway

The most important idea I took from the paper is that agentic AI changes the interaction model. The system is no longer only waiting for the next instruction; it is designed to pursue an objective through planning, action, feedback, and adaptation.

That makes the technology more interesting — and also makes reliability, security, coordination, and evaluation much more important.
