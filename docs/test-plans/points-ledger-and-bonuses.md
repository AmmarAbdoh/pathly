# Pathly test plan: points ledger, points history and bonuses

You are testing two new features of **Pathly**, a goal-tracking phone app (React Native + Expo),
running as a web build at **http://localhost:8081**:

1. **Points ledger and Points history.** Every payout of points is now recorded as an entry:
   its time, points, reason and goal. Lifetime points are the total of these entries. A new
   screen, Rewards → **History**, lists every point earned and spent.
2. **Smart bonuses.** Completing a goal can earn extra points: **early-bird**, **streak** and
   **welcome back**. Each bonus is its own ledger entry.

Follow the plan in order, check every expected result, and finish with the report described at
the end. Don't change any code. The app's data exists only for this test, so you may clear or
edit it freely.

---

## Ground rules

1. **The app's pop-up messages don't appear in a browser.** This includes the completion
   message that lists the points and bonuses paid. Judge results by the ledger in localStorage
   and by the Points history screen. In-app dialogs, like the "Complete Goal" card with a
   **Mark as Complete** button, do work.
2. **WEB-ONLY; skip these:**
   - the completion pop-up message itself
   - the **Reset Now** button (it uses a browser pop-up; test 5.5 covers its effect another way)
   - backup **import** (it needs the phone's file picker)
3. **Don't trigger browser dialogs** (alert, confirm, prompt).
4. **JavaScript:** you are authorized to run JavaScript in the page to read and write
   localStorage, as the steps say.
5. **Before every seeding snippet, wait at least 2 seconds after your last action in the app.**
   A save still pending when the page reloads can overwrite the seeded data. After a seed, check
   the app shows the seeded goals; if it doesn't, run the seed again.
6. **Pressing buttons:** if a normal click on an app button doesn't register, dispatch
   `pointerdown`, `pointerup` and `click` events on it.
7. **Console:** after each section, check the console for red errors and note them with the step
   number.
8. **Keep going:** if a bug blocks a step, record it, mark the steps that depend on it BLOCKED,
   and carry on.

All times are local. Record `new Date().toString()` at the start. **Avoid running the tests
within 15 minutes of midnight**: several expected results depend on "today".

---

## How the data looks

| localStorage key | What it holds |
|---|---|
| `@pathly:goals` | JSON array of goals |
| `@pathly:points_ledger` | JSON array of ledger entries (below). **The lifetime total is their sum.** |
| `@pathly:lifetime_points` | *Legacy:* the old single total. Read once, to start a ledger when none exists; never written again. |
| `@pathly_rewards` | JSON array of rewards (a redeemed one has `isRedeemed: true`, `pointsCost` and `redeemedAt`) |

A ledger entry looks like this:

```
{ id, at, points, reason: 'completion' | 'bonus' | 'carried', bonus?: 'early' | 'streak' | 'welcomeBack', goalId?, goalTitle? }
```

- `at` is when the points were earned, as a timestamp in ms. `at: 0` means "before history was
  kept".
- `carried` means points from before the ledger existed, whose history is gone.

## The bonus rules, for working out expected numbers

Bonuses are shares of the goal's own points. Each is rounded, and a bonus that rounds to 0 isn't
recorded. Only a goal's **first completion in a period** pays. A subgoal pays only when its parent
has "Subgoals award their own points" on.

- **Early-bird:**
  - **When it applies:** the goal has a deadline (its period isn't Ongoing), and the period's
    timing hasn't been changed by hand (`timingChanged`).
  - **The formula:**
    - `timeLeft = (end − now) / (end − start)`, clamped to the range 0–1.
    - If `timeLeft ≥ 0.25`, the bonus is `round(points × 0.25 × timeLeft)`. Otherwise there's
      none.
  - **The period's end:**
    - **Recurring goal** (the moment it resets): daily is midnight that day; weekly is exactly 7
      days after the start; monthly is the same time next month.
    - **One-off goal:** the end of its last day. For weekly, that's 11:59 PM on the day 7 days
      after the start.
- **Streak:** recurring goals only.
  - `streak` is the number of consecutive periods completed, this one included.
  - The bonus is `round(points × min(0.5, 0.1 × (streak − 1)))`.
- **Welcome back:** if the most recent `completion` entry (with `at > 0`) is 3 or more days
  before now, the bonus is `round(points × 0.2)`. There's none on the very first completion
  ever.

## Helper script

Put this at the **top of every snippet** in this plan that uses `seed`, `goal`, `done`, `show`
or `total`:

```js
const DAY = 86400000, now = Date.now();
const goal = (o) => ({ id: 1, title: 'Goal', target: 10, current: 0, initialValue: 0, unit: 'x',
  progress: 0, points: 50, direction: 'increase', period: 'ongoing', periodStartDate: now,
  createdAt: now - 60 * DAY, subGoals: [], isComplete: false, completionHistory: [], icon: '🎯', ...o });
// A completion entry in the ledger, `at` a time; titled so it is easy to spot.
const done = (at, points = 10, title = 'Earlier goal') =>
  ({ id: Math.round(at), at, points, reason: 'completion', goalId: 999, goalTitle: title });
// Replace all data and reload. ledger: [] by default (an empty ledger, not a missing one).
function seed({ goals = [], ledger = [], legacyTotal = null, rewards = [] } = {}) {
  localStorage.clear();
  localStorage.setItem('@pathly:language', 'en');
  localStorage.setItem('@pathly:goals', JSON.stringify(goals));
  if (ledger !== null) localStorage.setItem('@pathly:points_ledger', JSON.stringify(ledger));
  if (legacyTotal !== null) localStorage.setItem('@pathly:lifetime_points', String(legacyTotal));
  localStorage.setItem('@pathly_rewards', JSON.stringify(rewards));
  location.reload();
  return 'seeded';
}
const read = () => JSON.parse(localStorage.getItem('@pathly:points_ledger') || 'null');
// The ledger as readable lines: reason[:bonus] points title when
const show = () => (read() || []).map((e) =>
  `${e.reason}${e.bonus ? ':' + e.bonus : ''} ${e.points} ${e.goalTitle || '-'} ${e.at ? new Date(e.at).toLocaleString() : 'undated'}`).join('\n');
const total = () => (read() || []).reduce((sum, e) => sum + e.points, 0);
```

To **complete a goal**:
1. Open `http://localhost:8081/goal/<id>` and press **Mark as Complete**.
2. In the dialog, press **Mark as Complete** again.
3. Wait 1 second, then run `show()` (with the helper) to see what was paid.

---

## 1. Starting the ledger from old data (migration)

**1.1 Old total plus goal history.** Seed:

```js
seed({ ledger: null, legacyTotal: 405, goals: [
  goal({ id: 1, title: 'Read', points: 50, isComplete: true, current: 10, progress: 100, completedAt: now - DAY }),
  goal({ id: 2, title: 'Water', points: 10, period: 'daily', isRecurring: true, completionHistory: [now - 2 * DAY] }),
] });
```

After the reload, run `show()`. **Expected:**
- **A ledger was created** with 3 entries:
  - `carried 345`, undated
  - `completion 10 Water`, dated 2 days ago
  - `completion 50 Read`, dated yesterday
- **The total is unchanged:** `total()` is 405, and Rewards shows Total Earned 405.

**1.2 Old total only.** Seed `seed({ ledger: null, legacyTotal: 120 })`. **Expected:** a single
`carried 120` entry.

**1.3 History only, with no old total.** Seed:

```js
seed({ ledger: null, goals: [
  goal({ id: 1, title: 'Parent A', isUltimate: true, subgoalsAwardPoints: false, subGoals: [2], points: 0 }),
  goal({ id: 2, title: 'Unpaid sub', parentId: 1, points: 20, isComplete: true, completedAt: now - DAY }),
  goal({ id: 3, title: 'Parent B', isUltimate: true, subgoalsAwardPoints: true, subGoals: [4], points: 0 }),
  goal({ id: 4, title: 'Paid sub', parentId: 3, points: 25, isComplete: true, completedAt: now - DAY }),
  goal({ id: 5, title: 'Read', points: 50, isComplete: true, completedAt: now - 2 * DAY }),
] });
```

**Expected:** dated completion entries for **Read (50)** and **Paid sub (25)** only, totalling
75. "Unpaid sub" isn't there.

**1.4 History worth more than the old total.** Seed:

```js
seed({ ledger: null, legacyTotal: 30, goals: [
  goal({ title: 'Read', points: 50, isComplete: true, completedAt: now - DAY }),
] });
```

**Expected:** a single `carried 30` entry, with no dated entries; the total stays 30.

**1.5 A ledger wins over the old total.** Seed:

```js
seed({ ledger: [done(now - DAY, 40)], legacyTotal: 9999 });
```

**Expected:** `total()` is 40, and Rewards shows Total Earned 40.

## 2. Rewards screen and Points history screen

**2.1 Seed:**

```js
seed({
  ledger: [
    { id: 1, at: now - DAY, points: 50, reason: 'completion', goalId: 1, goalTitle: 'Read' },
    { id: 2, at: now - DAY, points: 12, reason: 'bonus', bonus: 'early', goalId: 1, goalTitle: 'Read' },
    { id: 3, at: 0, points: 300, reason: 'carried' },
  ],
  rewards: [
    { id: 1, title: 'Coffee', description: '', pointsCost: 30, icon: '☕', createdAt: now - DAY, isRedeemed: true, redeemedAt: now - 3600000 },
    { id: 2, title: 'Old reward', description: '', pointsCost: 20, icon: '🎁', createdAt: now - DAY, isRedeemed: true },
    { id: 3, title: 'Unredeemed', description: '', pointsCost: 99, icon: '🎁', createdAt: now - DAY, isRedeemed: false },
  ],
});
```

**2.2 Rewards card.** Go to the Rewards tab. **Expected:**
- **Totals:** Total Earned **362**, Spent **50**, Available **312**.
- **History button:** a **History** button under the card.

**2.3 History screen.** Press History. **Expected:**
- **Header:** the title "Points History", and the line "Earn bonus points by finishing early,
  keeping a streak going, or coming back after a break."
- **Rows, top to bottom:**
  1. 🎁 Coffee, today's date, **−30**
  2. 🎯 Read, yesterday, **+50**
  3. ✨ **Early-bird bonus · Read**, yesterday, **+12**
  4. 📦 "Points from before history was kept", no date, **+300**
  5. 🎁 Old reward, no date, **−20**
- **Colors:** earned amounts green, spent amounts red.
- **Leaving out:** "Unredeemed" isn't listed.

Press Back. **Expected:** you return to Rewards.

**2.4 Empty history.** Seed `seed()`, then open `http://localhost:8081/points-history`.
**Expected:** "No points yet. Complete a goal to earn some!"

## 3. Totals agree everywhere

Seed as in 2.1, then check:

1. **Expected:** Stats → Total Points equals Rewards → Total Earned (362).
2. Stats → Review → This Week. **Expected:** "Points Earned" equals what this snippet prints (it
   sums the entries dated this week, with weeks running Sunday to Saturday):

   ```js
   (() => { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - d.getDay());
     const start = d.getTime(), end = start + 7 * 86400000 - 1;
     return JSON.parse(localStorage.getItem('@pathly:points_ledger'))
       .filter((e) => e.at >= start && e.at <= end).reduce((s, e) => s + e.points, 0); })()
   ```

3. **Expected:** Review → Last Week and This Month work the same way. Record the numbers you see.

## 4. Completion pays, with the right bonuses

Seed each case, complete the goal as described in "How to complete a goal" above, then run
`show()`. The **new** entries are the ones after any you seeded.

| # | Seed (`goals`, with `ledger: []` unless shown) | Complete | Expected new entries |
|---|---|---|---|
| 4.1 | `[goal({ title: 'Report', period: 'weekly' })]`: one-off, just started | goal 1 | `completion 50 Report`, `bonus:early 12` (11–12 is fine) |
| 4.2 | `[goal({ title: 'Run', points: 100, period: 'weekly', isRecurring: true, periodStartDate: now - 3 * DAY })]` | goal 1 | `completion 100`, `bonus:early 14` (4/7 of the week left) |
| 4.3 | as 4.2 but `periodStartDate: now - 6 * DAY` | goal 1 | `completion 100` only (last quarter: no early-bird) |
| 4.4 | `[goal({ title: 'Meditate' })]`: ongoing, no deadline | goal 1 | `completion 50` only |
| 4.5 | `[goal({ title: 'Streak', period: 'weekly', isRecurring: true, periodStartDate: now - 6 * DAY, completionHistory: [now - 14 * DAY, now - 7 * DAY] })]` | goal 1 | `completion 50`, `bonus:streak 10` (3 weeks in a row: +20%) |
| 4.6 | as 4.5 but `completionHistory: [8, 7, 6, 5, 4, 3, 2, 1].map((w) => now - w * 7 * DAY)` | goal 1 | `completion 50`, `bonus:streak 25` (capped at +50%) |
| 4.7 | `[goal({ title: 'Back' })]`, `ledger: [done(now - 4 * DAY)]` | goal 1 | `completion 50`, `bonus:welcomeBack 10` |
| 4.8 | as 4.7 but `ledger: [done(now - 2 * DAY)]` | goal 1 | `completion 50` only (the break was too short) |
| 4.9 | `[goal({ title: 'All', points: 100, period: 'weekly', isRecurring: true, completionHistory: [now - 14 * DAY, now - 7 * DAY] })]`, `ledger: [done(now - 5 * DAY)]` | goal 1 | `completion 100`, `bonus:early 25`, `bonus:streak 20`, `bonus:welcomeBack 20`; `total()` = **175** |
| 4.9a | `[goal({ title: 'Back to back', period: 'weekly', isRecurring: true, periodStartDate: now - DAY, completionHistory: [now - 1.1 * DAY] })]`: last week's completion on its final day | goal 1 | `completion 50`, `bonus:early 11`, **`bonus:streak 5`** (back-to-back weeks count, however close) |
| 4.9b | as 4.9a but `completionHistory: [now - 14.5 * DAY]`: the week before this one has no completion | goal 1 | `completion 50`, `bonus:early 11`, and **no** streak bonus (a skipped week breaks it) |

For 4.9, also open the History screen. **Expected:** three ✨ rows with the right names (Early-bird
bonus, Streak bonus, Welcome-back bonus), each "· All".

**4.10 Paid once per period.** After 4.2, open goal 1 again. **Expected:** it shows as complete,
and there's no Mark as Complete button and no progress controls. The ledger is unchanged.

**4.11 A new period pays again.** Continue from 4.10. Wait 2 seconds, then move the goal's
period back:

```js
(() => { const k = '@pathly:goals'; const g = JSON.parse(localStorage.getItem(k));
  g[0].periodStartDate -= 8 * 86400000; localStorage.setItem(k, JSON.stringify(g)); location.reload(); })()
```

**Expected:**
- **After the reload:** goal 1 is reset (not complete). The new period starts on the goal's own
  weekly boundary, not at the moment of the reload: check that `periodStartDate` is about 4 days
  ago.
- **Complete it again:** a new `completion 100` entry appears, with an early-bird bonus of about
  **11** (3 of the week's 7 days are left). The earlier entries stay as they were.

**4.12 Subgoals.** Seed:

```js
seed({ goals: [
  goal({ id: 1, title: 'Parent A', isUltimate: true, subgoalsAwardPoints: false, subGoals: [2], points: 0 }),
  goal({ id: 2, title: 'Unpaid sub', parentId: 1, points: 20, period: 'weekly' }),
  goal({ id: 3, title: 'Parent B', isUltimate: true, subgoalsAwardPoints: true, subGoals: [4], points: 0 }),
  goal({ id: 4, title: 'Paid sub', parentId: 3, points: 20, period: 'weekly' }),
] });
```

**Expected:**
- **Complete goal 2:** no new entries.
- **Complete goal 4:** `completion 20 Paid sub` and `bonus:early 5`.

**4.13 Blocked goal.** Seed:

```js
seed({ goals: [goal({ id: 1, title: 'First' }), goal({ id: 2, title: 'Blocked', period: 'weekly', dependsOn: [1] })] });
```

**Expected:** goal 2's page shows the 🔒 blocked message and **no** Mark as Complete button, and
the ledger stays empty.

## 5. No early-bird bonus once the timing was changed by hand

**5.1 Extended deadline.** Seed:

```js
seed({ goals: [goal({ title: 'Late', period: 'weekly', periodStartDate: now - 10 * DAY })] });
```

- **Expected:** goal 1's page shows it's expired, with **Extend Deadline**.
- Extend by 14 days (Save). **Expected:** it's no longer expired, and its countdown shows about
  11 days.
- Wait 2 seconds and check the flag:
  `JSON.parse(localStorage.getItem('@pathly:goals'))[0].timingChanged`. **Expected:** `true`.
- Complete it. **Expected:** `completion 50` only, with **no** early-bird bonus, even though the
  new window has barely started.

**5.2 The period changed in the edit form.** Seed:

```js
seed({ goals: [goal({ id: 1, title: 'Switch', period: 'weekly' }), goal({ id: 2, title: 'Rename', period: 'weekly' })] });
```

- **Goal 1:** Edit Goal, change Time Period to **Yearly**, then Save Changes and confirm.
  Complete it. **Expected:** `completion 50` only.
- **Goal 2:** Edit Goal, change **only the title** to "Renamed", then save and confirm. Complete
  it. **Expected:** `completion 50` plus `bonus:early` (about 12). The early-bird bonus is kept
  when the period wasn't touched.

**5.3 Reset Now (WEB-ONLY).** The button uses a browser pop-up, so test its effect instead. Seed:

```js
seed({ goals: [goal({ title: 'Restarted', period: 'weekly', isRecurring: true, timingChanged: true })] });
```

Complete it. **Expected:** `completion 50` only.

**5.4 A new period clears the flag.** Continue from 5.3. Move the period back as in 4.11, reload,
then complete the goal again. **Expected:**
- After the reload, the goal is reset and `timingChanged` is gone from its record.
- The new completion earns an early-bird bonus again: about **11**. The new period started on
  its weekly boundary a day ago, so 6 of its 7 days are left.

## 6. A linked reward and bonus points

**6.1 Affordable only because of the bonus.** Seed:

```js
seed({
  goals: [goal({ title: 'Linked', linkedRewardId: 7 })],
  ledger: [done(now - 4 * DAY)],
  rewards: [{ id: 7, title: 'Treat', description: '', pointsCost: 65, icon: '🍰', createdAt: now - DAY, isRedeemed: false }],
});
```

Complete goal 1. **Expected:**
- **The ledger** gains `completion 50` and `bonus:welcomeBack 10`, for a total of 70.
- **The reward:** "Treat" moves to Redeemed Rewards.
- **Rewards shows:** Earned 70, Spent 65, Available 5.

**6.2 Control.** The same seed, with `ledger: [done(now - 2 * DAY)]`. Complete goal 1.
**Expected:** a total of 60, and "Treat" isn't redeemed (60 is less than 65).

## 7. Saving

1. Seed as in 4.1 and complete the goal. **Make your very next action a page reload.**
   **Expected:** both entries are still there (points are saved at once, not after a delay).
2. Reload again. **Expected:** the ledger, Total Earned and the History rows are all unchanged.

## 8. Damaged data

**8.1 A ledger that isn't a list.** Run:

```js
localStorage.setItem('@pathly:goals', JSON.stringify([{ id: 1, title: 'Read', target: 10, current: 10,
  initialValue: 0, unit: 'x', progress: 100, points: 50, direction: 'increase', period: 'ongoing',
  createdAt: 1, periodStartDate: 1, subGoals: [], isComplete: true, completedAt: Date.now() - 86400000,
  completionHistory: [] }]));
localStorage.setItem('@pathly:points_ledger', '{"broken":true}');
location.reload();
```

**Expected:**
- **A message** says saved data couldn't be read and was set aside.
- **The broken value is kept:** a key starting with `@pathly:points_ledger.unreadable.` holds
  `{"broken":true}`.
- **A new ledger** is started from the goal's history: `completion 50 Read`, total 50.

**8.2 Bad entries.** Seed:

```js
seed({ ledger: [
  { id: 1, at: now, points: -5, reason: 'completion' },
  { id: 2, at: now, points: '10', reason: 'completion' },
  { id: 3, at: now - DAY, points: 20, reason: 'completion', goalTitle: 'Good' },
  { id: 4, at: now, points: 7, reason: 'bonus', bonus: 'lucky' },
] });
```

**Expected:**
- **Total Earned is 27.** The entries whose points aren't a positive number are ignored.
- **The unknown bonus** (7 points) still counts, and is listed in History as "Points from
  before history was kept".

## 9. Export includes the ledger

Seed as in 2.1 and wait for the app to load. Then run this, to catch the export in the page
instead of downloading a file:

```js
const s = document.createElement('script');
s.textContent = `(() => { const orig = URL.createObjectURL; URL.createObjectURL = (blob) => { window.__export = blob; return orig(blob); }; })();`;
document.head.appendChild(s); 'ready';
```

1. Go to Settings and press **Export as JSON**.
2. Run `(async () => { const d = JSON.parse(await window.__export.text()); return { total: d.lifetimePointsEarned, entries: d.pointsLedger.length, first: d.pointsLedger[0] }; })()`.
   **Expected:** `total` is 362, `entries` is 3, and `first` matches the first seeded entry.

## 10. Arabic

1. Seed as in 2.1, then switch Settings → Language to **Arabic**. Reload if the layout doesn't
   flip, and note whether you had to.
2. Open Rewards → History (السجل). **Expected:**
   - The title is "سجل النقاط", and the hint line is in Arabic.
   - The bonus row reads "مكافأة الإنجاز المبكر · Read".
   - The carried row reads "نقاط من قبل بدء السجل".
   - All amounts and dates use **Arabic-Indic digits** (٠١٢٣…). None show Western digits.
3. **Expected:** the Rewards card totals are in Arabic-Indic digits too.
4. Switch back to English.

---

## Report

Finish with a report in this format:

1. **Summary table:** step | PASS / FAIL / PARTIAL / WEB-ONLY / BLOCKED | one-line note.
2. **Bugs**, most severe first. For each:
   - **Title**
   - **Severity.** High: points lost, duplicated or wrong; a bonus that can be gamed; a crash.
     Medium: a wrong display of points, dates or order. Low: wording or layout.
   - **Steps to reproduce:** the seed snippet and the actions.
   - **Expected** and **Actual**, with the `show()` output before and after.
   - **Evidence:** a screenshot and any console error text.
3. **Console errors**, each with its step.
4. **Observations:** anything that worked but felt confusing, or looked like it could be gamed,
   kept separate from bugs.
