# Team agreement

Written by: Test A and Test B

How our team works together. Every member reads it at the start, and we read it again when something
goes wrong.

## Members, roles and pairs

| Role | Member | Works in a pair with |
| --- | --- | --- |
| Releases and repository | Test A | Test B |
| Content model and data | Test A | Test B |
| The informational task (finding the right room) | Test B | Test A |
| The transactional task (booking a room) | Test A | Test B |
| Design and accessibility | Test B | Test A |
| Research and testing | Test B | Test A |

- **How we share the roles:** Differently from the course's default: we are a test team of two, so each
  of us holds three roles and we work as one pair. We pair on the content model first, because both
  tasks depend on it.

## How we communicate

- **Where we talk:** In our team chat.
- **How quickly we answer a teammate:** Within one working day.
- **When and how long we meet:** Once a week after class, for 30 minutes.
- **Where we write down what we agreed:** In the chat summary of that meeting. A bigger product or
  technical choice gets a decision record in `docs/decisions/`.

## How we decide

- **What a role holder decides alone:** A choice inside their own part.
- **What needs the pair:** The content model, because both tasks depend on it. We are one pair, so the
  pair is also the whole team.
- **How we settle a disagreement, and when we write a decision record:** We talk it through and try the
  simplest option first. When we still disagree, the member who holds the role for that part decides,
  and writes down why. A product or technical choice that someone may want to change later gets a
  decision record.

## When a pull request is done

The author of a pull request merges it when all of this is true:

- The author tried the change on its preview, at a narrow width too when something visible changed.
- Its AI note is filled in.
- The starter's checks have finished. The author read what they say, and fixed what a red check found
  when that was possible.
- A change to the content model has its migration. Only the content-model pair creates migrations.

We ask the other member for a review when a change touches the booking. Our documents go straight to
`main`, without a pull request.

## The AI note

Every pull request has the section *AI note: what I asked AI, and what I checked*, under that exact
heading. The note is one or two lines and has two parts: *What I asked AI* and *What I checked*. When
no AI tool was used, the note says "No AI used".

- **How we check what an AI tool wrote before we use it:** We run it and read it before we merge it.

## When someone stops contributing

- **What counts as stopping for us:** A member misses two agreed tasks in a row.
- **What the pair does first:** The other member talks to them within two days.
- **What the whole team does next:** If nothing changes in the next week, we write down what happened
  and share the work again in this file.
- **How we record what happened:** We change this agreement when we share the roles or the work again.

## Agreed by

| Member | Date |
| --- | --- |
| Test A | 17 October 2026 |
| Test B | 17 October 2026 |

We changed "When a pull request is done" on 13 November 2026: the author merges, and a review is
optional.
