# Explainability Validation Framework

**Author:** Principal Data Scientist  
**Date:** 2026-07-20  
**Purpose:** Rigorous validation that explanations are truthful, consistent, and grounded in actual scoring

---

## Core Principles

1. **Truthfulness:** Every statement must reference actual scoring data
2. **Consistency:** Same input should generate equivalent explanations
3. **Relevance:** Stated drivers should match actual score components
4. **Non-Contradiction:** Explanations must not contradict scoring profile
5. **Grounding:** Every claim traceable to source data

---

## Validation 1: Truthfulness Audit

**Objective:** Ensure zero false statements in explanations.

**Method:**

```
For 50 random predictions:
  Generate explanation
  Manual review: Is every statement factual?
  Flag any unsupported claims
```

**Evaluation Rubric:**

✅ **Truthful Statement** Examples:
- "Player has top-10 driving distance this year (data available)"
- "Course has played 0.8 strokes easier than average (verifiable)"
- "Player historically struggles on bermuda greens (venue history available)"

❌ **False Statement** Examples:
- "Player likely to play conservatively (no psychological data)"
- "This course suits short hitters (opposite of data)"
- "Best approach shot in the field (not in top 20)"

**Measurement:**

```
False Statement Rate = (False statements) / (Total statements)

Target: 0% (100% truthful)
Acceptable: 0%
Failure threshold: >1 false statement in 50
```

**Failure Action:** Identify faulty explanation generation; remove problematic components.

---

## Validation 2: Consistency Test

**Objective:** Ensure explanations are deterministic and stable.

**Method:**

```
For 10 random predictions:
  Generate explanation 5 times each
  Compare explanations for semantic equivalence
  Measure variation
```

**Consistency Levels:**

- **Identical:** Exact same text (rare, not required)
- **Equivalent:** Different wording, same meaning (target)
- **Inconsistent:** Contradictory or different messages (failure)

**Examples:**

```
Prediction: Player A vs. Course B

Run 1: "Strong on par-3s; weak on par-5s"
Run 2: "Excels at par-3 holes; struggles with par-5 layout"
Result: ✅ EQUIVALENT (same meaning, different wording)

Run 1: "Strong putter this year"
Run 2: "Weak putter; ranks 140th in SG:Putting"
Result: ❌ INCONSISTENT (contradictory)
```

**Measurement:**

```
Consistency Rate = (Equivalent or identical explanations) / (Total explanations)

Target: ≥ 95%
Acceptable: ≥ 90%
Failure threshold: < 85%
```

**Failure Action:** Identify non-determinism in explanation generation; debug randomness.

---

## Validation 3: Relevance Assessment

**Objective:** Ensure stated factors actually drive the score.

**Method:**

```
For 30 random predictions:
  Generate explanation
  Extract top 3 stated factors
  Calculate actual score contribution of those factors
  Measure overlap
```

**Example:**

```
Explanation states (in order):
1. "Strong driving game"
2. "Recent good form"
3. "Course history advantage"

Actual score drivers (by contribution):
1. Skill fit: 45 points
2. Recent form: 30 points
3. Venue history: 15 points

Overlap: 3/3 factors ✅ (100%)
```

**Measurement:**

```
Relevance Score = (Stated factors in top 3 actual drivers) / 3

Target: ≥ 80% (2.4 of 3 factors correct)
Acceptable: ≥ 75%
Failure threshold: < 70%
```

**Failure Action:** Adjust explanation component selection or factor ordering.

---

## Validation 4: Non-Contradiction Test

**Objective:** Ensure explanations don't contradict scoring profile.

**Method:**

```
For 50 explanations:
  Generate explanation
  Compare stated factors vs. CourseProfile and PlayerProfile
  Flag any contradictions
```

**Example of Contradiction:**

```
Player Profile says:
- Recent form: POOR (0.5 SG avg, below average)

Explanation says:
- "Recent good form"

Result: ❌ CONTRADICTION
```

**Measurement:**

```
Contradiction Rate = (Contradictions) / 50

Target: 0%
Acceptable: 0%
Failure threshold: >1
```

**Failure Action:** Fix explanation generation logic.

---

## Validation 5: Expert Review

**Objective:** Qualitative assessment of explanation quality.

**Method:**

```
Have 3 golf analysts (independent, not on team) review 20 explanations:
  Is this explanation credible?
  Would you trust this explanation?
  Any concerns about accuracy?
```

**Scoring:**

- Credible: 5 points
- Questionable: 3 points
- Incredible: 1 point

**Target:** Average ≥ 4.5 / 5 (credible to experts)

**Failure Action:** Revise explanations; address expert concerns.

---

## Validation 6: Coverage Audit

**Objective:** Ensure explanations cover all major score components.

**Method:**

```
For 100 explanations:
  Check for mention of:
  - Skill fit component ✅/❌
  - Recent form component ✅/❌
  - Venue history component ✅/❌
  - Confidence statement ✅/❌
  - Risk assessment ✅/❌
```

**Target:** 95%+ of explanations mention all 5 components

**Failure Action:** Ensure all components represented.

---

## Validation 7: Edge Case Testing

**Objective:** Ensure explanations handle unusual cases gracefully.

**Test Cases:**

1. **First-time at Venue**
   - Explanation should not reference venue history
   - Instead reference comparable course types
   - ✅ Pass if handled correctly

2. **Injured Player**
   - Explanation should not project health return
   - Should state "unknown recovery timeline"
   - ✅ Pass if handled correctly

3. **Venue History Anomaly**
   - If player has excellent venue history but poor current form
   - Explanation should acknowledge contradiction
   - ✅ Pass if acknowledged

4. **Brand New Data**
   - If player just posted exceptional round
   - Explanation should incorporate recent result
   - ✅ Pass if updated timely

---

## Sign-Off Checklist

Before launching, all validation tests must pass:

- [ ] Truthfulness: 0 false statements in 50 reviews
- [ ] Consistency: ≥95% consistency rate
- [ ] Relevance: ≥80% relevant factors
- [ ] Non-Contradiction: 0 contradictions detected
- [ ] Expert Review: ≥4.5/5 credibility
- [ ] Coverage: 95%+ mention all components
- [ ] Edge Cases: All 4 cases handled properly

**Any failure → Return to Phase 16B; fix before launch**

---

**Every explanation must pass this scientific rigor before reaching users.**
