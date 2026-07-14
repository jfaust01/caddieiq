# Product Requirements Document — CaddieIQ

**Status:** Living document · **Owner:** Product · **Last updated:** v0.1.0

---

## 1. Vision

CaddieIQ becomes the default workspace for serious golf analysts: the place where
data, custom models, and validated picks live together. We believe the edge in
golf analytics comes not from a single proprietary algorithm but from giving
skilled users the tools to encode their own insight, test it rigorously, and act
on it quickly.

## 2. Mission

Give independent golf analysts professional-grade data infrastructure and model
tooling — transparent, fast, and self-serve — so they can compete on the quality
of their thinking, not the size of their budget.

## 3. Target Users

| Persona | Description | Primary Need |
| --- | --- | --- |
| **The DFS Grinder** | Plays daily fantasy golf across multiple sites weekly. | Fast, repeatable player projections tuned to slate context. |
| **The Sports Bettor** | Bets outrights, matchups, and props on professional golf. | Model-driven edges vs. sportsbook odds, with confidence signals. |
| **The Quant Hobbyist** | Enjoys building and backtesting statistical models. | Flexible model builder and rigorous historical validation. |
| **The Content Creator** | Publishes picks, previews, and rankings. | Presentable rankings and shareable model outputs. |
| **The Serious Handicapper** | Tracks form and course fit obsessively. | Deep player, course, and tournament context in one place. |

## 4. Primary Use Cases

1. **Explore the data universe** — browse players, tournaments, and courses with
   rich context (form, conditions, history).
2. **Build a custom model** — define inputs, assign weights, and configure scoring
   logic in the Model Builder.
3. **Generate rankings** — run a model against a tournament field to produce a
   ranked list of picks.
4. **Analyze performance** — review trends and accuracy across models and time.
5. **Backtest a model** — validate a model against historical events before
   trusting it live.
6. **Manage the workspace** — configure preferences, notifications, and account
   settings.

## 5. Core Features

These define the free/base product experience.

| Feature | Description |
| --- | --- |
| **Dashboard** | Command center summarizing models, activity, and performance. |
| **Player Universe** | Searchable, filterable database of tracked players. |
| **Tournaments** | Schedule, fields, and event context. |
| **Courses** | Course profiles and playing conditions. |
| **Model Builder** | Create and tune models from weighted inputs. |
| **Rankings** | Model-driven leaderboards for a given field. |
| **Analytics** | Performance trends and insight visualizations. |
| **Settings** | Workspace, preferences, and account management. |
| **Help** | Guides, documentation, and support. |

## 6. Premium Features

Reserved for paid tiers; see [ROADMAP.md](./ROADMAP.md) and
[FEATURES.md](./FEATURES.md).

| Feature | Description |
| --- | --- |
| **Advanced Backtesting** | Multi-season backtests with detailed accuracy breakdowns. |
| **AI Insights** | Natural-language model suggestions, narrative previews, and anomaly detection. |
| **Unlimited Models** | Remove limits on saved and active models. |
| **Live Odds Integration** | Compare model outputs against real-time sportsbook lines. |
| **Weather & Conditions Feeds** | Automated ingestion of course conditions and forecasts. |
| **Model Marketplace** | Publish, share, or subscribe to community models. |
| **Priority Data Refresh** | Faster data updates during live events. |
| **Export & API Access** | Programmatic access to model outputs and rankings. |

## 7. Future Vision

- **AI Co-Analyst** — a conversational layer that explains model behavior,
  proposes weight adjustments, and surfaces edges automatically.
- **Model Marketplace** — a two-sided ecosystem where top model builders can
  distribute their work.
- **Mobile App** — a companion app for on-the-go picks and live tracking.
- **Public API** — let power users and partners integrate CaddieIQ data and
  outputs into their own tools.

## 8. Success Metrics

| Category | Metric | Target Signal |
| --- | --- | --- |
| **Activation** | % of new users who build their first model | Users reach core value quickly. |
| **Engagement** | Weekly active analysts during tournament weeks | Product is habitual. |
| **Model Quality** | Median backtested accuracy of active models | Users can build models that work. |
| **Retention** | 3-month retention of activated users | Sustained value delivery. |
| **Conversion** | Free → paid conversion rate | Premium features justify their price. |
| **Marketplace** | Models published / subscribed (future) | Ecosystem health. |

## 9. Business Goals

| Goal | Description |
| --- | --- |
| **Subscription revenue** | Recurring revenue from premium tiers is the primary model. |
| **Low support burden** | Self-serve product with strong docs and in-app guidance. |
| **Data moat** | Clean, comprehensive, well-maintained golf data as a durable advantage. |
| **Community flywheel** | A marketplace that makes the product more valuable as it grows. |
| **Sustainable margins** | Efficient data pipelines and compute keep per-user cost low. |
