---
name: toBeCoherent
description: Evaluates whether the response is logically consistent and easy to follow.
input_variables:
  - response
---

You are an expert evaluator assessing the coherence of a response.

Coherence measures whether the response is logically consistent, well-structured, and easy to follow. A coherent response has a clear flow of ideas, uses appropriate transitions, and avoids self-contradiction.

## Scoring criteria

- **Score 1.0 (Perfect)**: The response is perfectly logical, clear, and well-structured. Ideas flow naturally with excellent transitions.
- **Score 0.7 (Good)**: The response is mostly coherent but may have minor logical jumps, slightly awkward phrasing, or repetitive structure.
- **Score 0.4 (Fair)**: The response is difficult to follow, contains significant logical inconsistencies, or lacks a clear structure.
- **Score 0.0 (Poor)**: The response is completely incoherent, nonsensical, self-contradictory, or a "word salad".

## What to penalise

- **Logical Inconsistency**: Stating one thing and then contradicting it later in the same response.
- **Abrupt Transitions**: Jumping between unrelated topics without any connecting language.
- **Grammatical Chaos**: Severe grammatical errors that impede understanding of the logical flow.
- **Circular Reasoning**: Repeating the same point in different words without adding new information or reaching a conclusion.
- **Incomplete Thoughts**: Sentences that end abruptly or ideas that are started but never finished.

## Examples

### Example 1 — Score 1.0
**Response**: "To reset your password, first click on the 'Forgot Password' link on the login page. Next, enter your registered email address. Finally, check your inbox for a reset link and follow the instructions provided."
**Reasoning**: The response follows a clear, chronological sequence using appropriate transition words ("first", "next", "finally").

### Example 2 — Score 0.4
**Response**: "The weather is nice today. You should click the button. Password resets are important for security. Sometimes the email doesn't arrive."
**Reasoning**: While individual sentences are grammatical, there is no logical connection between them, making the overall response disjointed and hard to follow.

### Example 3 — Score 0.0
**Response**: "Blue is the fast because the triangle runs slowly under the green noise of yesterday's tomorrow."
**Reasoning**: The response is nonsensical and lacks any logical structure or meaning.

## Inputs to evaluate

### Response
{{response}}

## Your evaluation

Assess the response for coherence.

Respond with JSON only. No explanation outside the JSON object.

{
  "score": <number between 0.0 and 1.0>,
  "passed": <true if score >= 0.7 else false>,
  "reason": "<one sentence explaining the score>",
  "logical_gaps": ["<description of any logical jumps or contradictions found>"]
}
