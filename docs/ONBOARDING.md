# Onboarding — CaddieIQ

**Status:** First-run guidance · **Owner:** Product & UX · **Last updated:** v1.0

---

## Overview

This document defines the onboarding experience for new CaddieIQ users. Rather than a single long tutorial, onboarding is **contextual, in-app, and progressive** — users learn concepts at the moment they're most relevant, through micro-interactions, smart defaults, and guided tours.

---

## 0. First-Run Flow

When a new user logs in for the first time:

1. **Welcome screen** — brief, mission-driven statement of what CaddieIQ is and what they can do with it.
2. **Quick tour** — 60-90 second walkthrough of the main navigation and primary features.
3. **Guided entry point** — users are routed to the **Players** page with a "Get Started" prompt offering three paths:
   - Explore a tournament
   - Browse players
   - Try the AI Caddie

Each path has a 2-3 minute soft introduction to that feature, with contextual tooltips and an "I've got it" button to dismiss guidance.

---

## 1. What is CaddieIQ? (30 seconds)

**First-run screen content:**

> **Build Better Models. Make Better Picks.**
>
> CaddieIQ is a professional golf analytics platform built for serious handicappers, bettors, and analysts. We give you the same caliber of data, modeling tools, and transparency that professional betting syndicates use — so you can combine player form, course fit, conditions, and market data into your own models, then measure those models against history.
>
> **Every ranking you make is explainable.** Every score shows its reasoning. No black boxes.
>
> [Explore a Tournament] [Browse Players] [Try the AI Caddie]

**Supporting imagery:** Show a player card with a score and the "Why?" button highlighted. Show the Decision Trace modal partially open to suggest "transparency."

---

## 2. How Overall Rating Works (Contextual Tooltip)

**Trigger:** When a user hovers over or clicks an Overall Rating score (0–100) on a player card.

**Tooltip content:**

> **Overall Rating**
>
> A player's score on a 0–100 scale combining multiple forms of golf intelligence:
> - **Player Skill** — career performance across conditions and tour types.
> - **Recent Form** — how they've played in the last 4–12 weeks.
> - **Course Fit** — their historical performance at this course or similar layouts.
> - **Tournament Context** — field strength and the player's likelihood to compete.
>
> The score is equal-weighted across available signals. Missing data is honest: if form is unavailable, the score reflects that limitation.
>
> [Learn why with "Why?" →]

**Call-to-action:** Highlight the "Why?" button (see Decision Trace section below).

---

## 3. How Confidence Works (Contextual Label + Popover)

**Trigger:** On any score or recommendation that carries a confidence badge (High / Medium / Low / None).

**Badge styling:** Colored pill or icon next to the score.

**Popover (on click/hover):**

> **Confidence: [High|Medium|Low|None]**
>
> How much we trust this score or recommendation. Confidence is driven by:
> - **Data availability** — how recent and complete the input data is.
> - **Signal strength** — how predictive this signal historically has been.
> - **Historical alignment** — whether similar player profiles have performed as expected.
>
> **What it means:**
> - **High** — We've seen this pattern consistently; trust this signal.
> - **Medium** — We have reasonable data, but some signals are degraded or limited.
> - **Low** — Limited history or unusual circumstances; use this as context only.
> - **None** — We cannot compute a score right now; missing critical data.

**Visual cue:** Color the badge contextually (green for High, yellow for Medium, etc.).

---

## 4. How Decision Trace Works (Guided Tour on First Use)

**Trigger:** The first time a user clicks the "Why?" button on a score.

**Modal/Sheet structure:**

The Decision Trace is a **vertical timeline** showing how the model reasoned, step by step. Each stage is labeled with an icon (Player Skill → Form → Course Fit → Market → Final Score), plus a brief explanation of how it impacted the score.

**Tour overlay (first-time only):**

1. **Headline (top of trace):** "This shows you every step in the model's reasoning."
2. **First stage:** "Each stage shows a signal — where it sits, how strong it is, and whether it pushed the score up or down."
3. **Weight stars:** "The number of stars shows how much this stage influenced the score (1–5 stars = weak to strong)."
4. **Direction arrow:** "The arrow shows direction — did this signal help (+) or hurt (−) the player's score?"
5. **Limitations panel:** "Honest gaps — missing data, degraded confidence, unmodeled areas. We never hide limitations."
6. **Final stage:** "The final score restates the headline."

**Dismiss:** "Got it" or "Learn more" (link to Decision Trace Engine docs).

**Subsequent visits:** The tour is hidden; users see the clean timeline with no guidance overlay.

---

## 5. How AI Caddie Works (Contextual Introduction)

**Trigger 1:** User navigates to the `/caddie` page for the first time.

**Trigger 2:** User hovers over the "Ask the Caddie" widget in the Tournament Command Center.

**Soft introduction (non-modal, right-side guidance panel):**

> **Ask the Caddie**
>
> The AI Caddie answers natural-language questions by querying verified intelligence engines. Every answer is grounded in real data and cited with a source.
>
> **Try asking:**
> - "Best cash plays?"
> - "Who fits the course?"
> - "Who benefits from the wind?"
> - "Compare X and Y"
> - "Why is X rated that way?"
>
> The Caddie works over a specific tournament. Use the tournament selector to explore other events.
>
> [Understand how it works →] [Dismiss]

**"Understand how it works" link:** Opens a brief modal explaining:

> **How the AI Caddie Works**
>
> The Caddie is **not** a generative AI. It never invents facts.
>
> 1. You ask a question (natural language).
> 2. The Caddie classifies your intent (are you asking about plays, fit, form, etc.?).
> 3. It queries the relevant verified engine (DFS Value, Course Fit, Weather, etc.).
> 4. It returns a structured answer: headline, supporting bullets, source, confidence.
> 5. It names the source engine and states confidence — always honest.
>
> If an engine doesn't have data for the active tournament, it says so.

**Prompt suggestions:** Show 2–3 starter prompts as chips the user can click:
- "Best cash plays?"
- "Who fits the course?"
- "What can you do?"

---

## 6. How Compare Works (In-Context Discovery)

**Trigger:** User navigates to `/players` and selects a player card. A "Compare" button or icon appears on the player detail view.

**Tooltip on hover:**

> **Compare**
>
> Select another player to see a side-by-side breakdown: Overall Rating, Recent Form, Course Fit, and more. The comparison includes a verdict showing which player has the edge for this tournament.

**After comparison table loads:**

If it's the first comparison:

> **Comparison Verdict**
>
> The table above shows every metric side-by-side. Below, you'll see a breakdown of which player has the edge and why. This is powered by the same reasoning engines that drive the Overall Rating — fully explainable.

**Dismiss:** Users can close the guidance or just start exploring the table.

---

## 7. Progressive Disclosure

New users don't need to understand everything at once. The onboarding uses **progressive disclosure**:

| Feature | Trigger | Format | Dismissal |
| --- | --- | --- | --- |
| **Overall Rating** | First hover on score | Tooltip | Click away or "Learn why" |
| **Confidence** | First click on badge | Popover | Click away |
| **Decision Trace** | First click "Why?" | Guided tour overlay | "Got it" button |
| **AI Caddie** | First visit to `/caddie` | Right-side panel | Dismiss button |
| **Compare** | First use of Compare | Tooltip → modal | Acknowledge or explore |

Each is **optional** — users can always dismiss guidance and come back to learn later via the docs or context-sensitive help (e.g., "Learn more" links).

---

## 8. Guidance Dismissal & Settings

**First-run toggles (in Settings):**

Users can opt out of first-run guidance with a single setting:

> **Onboarding**
>
> ☐ Show first-run guidance for new features
>
> This includes interactive tours, tooltips, and "getting started" prompts. You can always access these guides manually via Help.

**Help center link:**

Every page has a `?` icon linking to the contextual help documentation (specific to that page or feature).

---

## 9. Interactive Walkthrough (Optional Deep Dive)

For users who want more structure, there's an **optional guided tour** available from the Help menu:

> **Take a Tour**
>
> 3-minute walkthrough covering:
> 1. Navigation & core pages
> 2. Building your first model (Skipped if user has already created one)
> 3. How models become rankings
> 4. Using AI Caddie for faster decisions

Each tour step is a clickable highlight with a brief explanation.

---

## 10. Contextual Help Throughout

Every major feature has a "?" icon or "Learn more" link that opens the relevant section of the docs:

- **Overall Rating → `docs/EXPLAINABILITY.md`**
- **Decision Trace → `docs/DECISION_TRACE_ENGINE.md`**
- **AI Caddie → `docs/AI_CADDIE.md`**
- **Comparison → Comparison & Verdict Engine docs (future)**
- **Models → `docs/MODELS.md`**
- **Backtesting → `docs/BACKTESTING.md` (future)**

---

## 11. First-Week Engagement Sequence (Optional)

For users who want ongoing guidance, an optional **engagement email sequence** (in future):

- **Day 0 (Sign-up):** "Welcome to CaddieIQ" + link to first-run tour.
- **Day 1:** "Your first picks" — quick wins (e.g., "explore a tournament").
- **Day 3:** "Dive deeper" — model-building introduction.
- **Day 7:** "What's next?" — backtesting, model sharing, etc.

Users can unsubscribe from this at any time via Settings.

---

## 12. Accessibility & Inclusivity

All guidance adheres to WCAG 2.1 AA:

- **Keyboard navigation** — all tours are fully keyboard accessible; no mouse required.
- **Screen reader friendly** — guide text is semantic HTML; no overlays block screen readers.
- **Dismissable** — users can skip any tour with a single click or Escape key.
- **Persistent link** — guidance is always accessible via Help, so users aren't locked into the first-run experience.

---

## 13. Success Metrics

Onboarding is successful when:

- **Time to first value** — users can make their first pick or question within 2–3 minutes of login.
- **Feature discovery** — 60%+ of new users discover the AI Caddie within their first week.
- **Guidance dismissal** — users can dismiss guidance with zero friction; <5% get frustrated by forced tutorials.
- **Return rate** — new users come back within 7 days; returning users engage with onboarded features.
- **Support tickets** — reduction in "how do I?" questions for core features.

---

## 14. Iteration & Updates

Onboarding is **living** — it evolves as the product changes:

- **New features** → new guided tours added automatically; existing users get opt-in discovery.
- **Feature changes** → guidance is updated and versioned.
- **Analytics** — track which users dismiss guidance early, which get stuck, which patterns lead to engagement.
- **Feedback loop** — users can report "this wasn't clear" directly from any guidance popover.

---

## 15. Related Documents

- [`EXPLAINABILITY.md`](./EXPLAINABILITY.md) — detailed explanation of the Explainability Engine.
- [`DECISION_TRACE_ENGINE.md`](./DECISION_TRACE_ENGINE.md) — the step-by-step reasoning pipeline.
- [`AI_CADDIE.md`](./AI_CADDIE.md) — the AI Caddie architecture and supported intents.
- [`PRODUCT.md`](./PRODUCT.md) — the overall product vision and personas.
- [`ACCESSIBILITY_AUDIT.md`](./ACCESSIBILITY_AUDIT.md) — accessibility guidelines for onboarding components.
