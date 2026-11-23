---
name: grill
description: Interview Nathaniel in rounds about a plan, design, or decision until every open question is settled, recommending an answer to each, then record the answers in the plan. Use when he says "grill", "grill me", or "stress-test this", before turning a plan in docs/plans/ into slices, or when a slice reaches a question listed under the plan's "Not yet decided".
---

# /grill

Stage 1 of the loop in [`docs/how-we-work.md`](../../../docs/how-we-work.md). Adapted from Matt Pocock's `grilling` skill (MIT).

Interview Nathaniel until the two of you agree on the plan. Treat the plan as a tree of decisions: each decision opens the decisions that depend on it.

## Before the first round

1. Read the plan, or the conversation if there is no plan yet. Read the roadmap's design principles and any plan it depends on.
2. List the open questions. Split them:
   - **Facts:** what the CR says, what a card does, what the engine or game does now, what something costs or measures. These are your job. Use the `lookup` skill for CR and cards, the `cr-checker` agent for whether a behavior follows the CR, and an `Explore` subagent for code. Never ask him a fact you can look up.
   - **Decisions:** product, scope, priority, and taste. These are his.
3. Start the fact lookups in the background. A decision that depends on a pending fact waits for a later round; the rest do not.

## Each round

The frontier is every decision whose prerequisites are settled. Ask the whole frontier in one message, in plain words, without engineering jargon. Explain any term he needs, in one clause.

```
**Q1. <short title>**
<the question, with the choices and what each one means for a player or for the project>
Recommended: <your answer, and the one-line reason>

**Q2. ...**
```

Word each question so that "yes" accepts the recommendation. Cite CR rule numbers where they decide a question. Do not use `AskUserQuestion` for a round: it holds four questions, and a round may hold more.

After he answers, recompute the frontier: settled answers unblock the questions that hung on them. A question that depends on another question in the same round goes in the next round.

## Finishing

The grilling is done when the frontier is empty: every branch visited, nothing silently assumed. Then:

1. Summarize the decisions in a few lines and ask him to confirm that this is the shared understanding.
2. On his yes, write them into the plan: each under "Decisions for a human" with the date and reason, and anything knowingly put off under "Not yet decided", with the slice it blocks. Delete each answered bullet from "Waiting on you" and "Not yet decided"; do not cross it out. If the plan lacks a "Shared pieces" section and the answers name one, add it. The plan format is in `docs/how-we-work.md`.
3. Do not start building. Building is stage 3, in its own session.
