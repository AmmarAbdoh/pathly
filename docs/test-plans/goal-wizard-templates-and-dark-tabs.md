# Pathly test plan: step-by-step goal form, picking several templates, goals down to 0, dark tab pages

You are testing four changes to **Pathly**, a goal-tracking phone app (React Native + Expo),
running as a web build at **http://localhost:8081**:

1. **A step-by-step form on the Add Goal tab.** It replaces one long form with four short
   steps:
   1. **What's the goal?** The name and icon.
   2. **How will you track it?** A number, just done or not, or by smaller steps.
   3. **How often?** The period, and whether it repeats.
   4. **What's it worth?** Points, a linked reward and a description.

   There's no confirmation dialog: **Create goal** adds the goal and goes to Home.
2. **Picking several templates at once.** The template list lets you tick several templates
   and add them all with one button ("Add 3 goals"). It opens from two places: a new **Pick
   goals to start** button on an empty Home screen, and **Use a Template** on the Add Goal tab.
   With one template ticked, **Customize** opens it in the step-by-step form.
3. **Goals that go down may aim for 0.** Examples: inbox zero, a debt paid off. A goal that goes
   up still needs a target above 0. Three built-in templates aim for 0 and couldn't be added
   before: **Reduce Debt**, **Process Emails** and **Reduce Plastic**.
4. **Dark mode tab pages.** Pages not yet drawn used to show light grey in dark mode while you
   swiped to them. They should now match the dark background. The pages next to the one shown
   are now drawn ahead of time.

The old long form still exists: it's used for **editing** a goal and **adding a subgoal**.

Follow the plan in order, check every expected result, and finish with the report described at
the end. Don't change any code. The app's data exists only for this test, so you may clear or
edit it freely.

---

## Ground rules

1. **The app's pop-up messages don't appear in a browser.** Judge results by the screen and by
   localStorage. In-app dialogs and panels do work.
   - **Two buttons do nothing in a browser,** because each asks through a pop-up: **Save** in the
     "Goal Reached 100%" panel, and **Reset Now**. If a step needs either one, mark it
     **WEB-ONLY**.
2. **Don't trigger browser dialogs** (alert, confirm, prompt).
3. **JavaScript:** you are authorized to run JavaScript in the page to read and write
   localStorage, as the steps say.
4. **Wait before reading or seeding.** Saves land about half a second after a change.
   - **Before reading:** wait at least 1 second after your last action before running `goals()`.
   - **Before seeding:** wait at least 2 seconds, or a save still pending when the page reloads
     can overwrite the seeded data.
   - **After a seed:** check the app shows what was seeded. If it doesn't, run the seed again.
5. **Pressing buttons:** if a normal click on an app button doesn't register, dispatch
   `pointerdown`, `pointerup` and `click` events on it. Most buttons have an `aria-label` equal
   to their visible text.
6. **Typing:** if typed text doesn't register in a field, set it with the input's native value
   setter and dispatch an `input` event.
7. **The template list draws only its first 6 cards** until you scroll. To reach any other
   template, type its name in the list's **Search** field first.
8. **Console:** after each section, check the console for red errors and note them with the step
   number.
9. **Keep going:** if a bug blocks a step, record it, mark the steps that depend on it BLOCKED,
   and carry on.

---

## How the data looks

| localStorage key | What it holds |
|---|---|
| `@pathly:goals` | JSON array of goals |
| `@pathly_rewards` | JSON array of rewards |
| `@pathly:custom_templates` | JSON array of templates the user saved |
| `@pathly:theme_mode` | `light`, `dark` or `system` |
| `@pathly:language` | `en` or `ar` |

The goal fields this plan checks:
- **`title`, `icon`**
- **`target`, `current`, `unit`**
- **`direction`:** `increase` or `decrease`
- **`period`:** `daily`, `weekly`, `monthly`, `yearly`, `custom` or `ongoing`
- **`customPeriodDays`**
- **`isRecurring`:** the goal repeats
- **`isUltimate`:** progress comes from subgoals
- **`points`**
- **`schedule`:** which days a repeating goal is active
- **`linkedRewardId`, `subgoalsAwardPoints`, `description`**

## Helper script

Put this at the **top of every snippet** in this plan that uses `seed` or `goals`:

```js
const now = Date.now();
// Replace all data and reload.
function seed({ goals = [], rewards = [], templates = null, theme = 'light', language = 'en' } = {}) {
  localStorage.clear();
  localStorage.setItem('@pathly:language', language);
  localStorage.setItem('@pathly:theme_mode', theme);
  localStorage.setItem('@pathly:goals', JSON.stringify(goals));
  localStorage.setItem('@pathly_rewards', JSON.stringify(rewards));
  if (templates) localStorage.setItem('@pathly:custom_templates', JSON.stringify(templates));
  location.reload();
  return 'seeded';
}
// The saved goals, with the fields this plan checks.
const goals = () => JSON.parse(localStorage.getItem('@pathly:goals') || '[]').map((g) => ({
  title: g.title, icon: g.icon, target: g.target, current: g.current, unit: g.unit,
  direction: g.direction, period: g.period, days: g.customPeriodDays, repeat: !!g.isRecurring,
  ultimate: !!g.isUltimate, points: g.points, schedule: g.schedule, reward: g.linkedRewardId,
  subPoints: g.subgoalsAwardPoints, description: g.description, id: g.id }));
```

A template, for seeding saved ones:

```js
const template = (o) => ({ id: 'custom_1', title: 'My Plan', category: 'other', description: 'Saved by me',
  target: 5, unit: 'tasks', direction: 'increase', points: 20, period: 'weekly', icon: '🗓️', ...o });
```

---

## 1. First launch: pick goals from Home

**1.1 The empty Home screen.** Run `seed()`.

**Expected:**
- **The message** reads "No goals yet. Pick a few ready-made ones to get going, or make your own
  on the Add tab."
- **A button** below it reads **Pick goals to start**.

**1.2 The starter button only shows with nothing to filter.** Press the **Completed** filter
chip. **Expected:** the message changes to "No goals found", and **Pick goals to start** is
gone. Press **All** again.

**1.3 Open the list.** Press **Pick goals to start**.

**Expected:**
- **The panel** is titled **Pick goals to start**.
- **Category chips** include **My Templates**, in English.
- **The footer** reads "Tap the ones you want, then add them all at once."
- **The cards** each show Target, points and Time Period, with an empty tick circle.

**1.4 Tick and untick.** Tick **Drink Water**.

**Expected:**
- **The card** gets a coloured border and a ✓.
- **The footer** shows **Add 1 goal**.
- **No Customize button:** it only appears on the Add Goal tab.

Tick **Run Distance**; the button reads **Add 2 goals**. Tick **Build Muscle**; it reads **Add 3
goals**. Untick **Build Muscle**; it's back to **Add 2 goals**.

**1.5 A goal that goes down needs your start.** Tick **Lose Weight** (target 70 kg).

**Expected:**
- **A field** appears inside its card: "Your current value (kg)", empty.
- **The button** (**Add 3 goals**) is **disabled**.

Then type into the field and check each value:

| Value | Error under the field | Button |
|---|---|---|
| `60` | "For a decreasing goal, current progress must be above the target" | disabled |
| `70` | the same error | disabled |
| `abc` | an error | disabled |
| `82` | none | enabled |

**1.6 Add them.** Press **Add 3 goals**, wait 1 second, and run `goals()`.

**Expected:**
- **The panel closes**, and Home lists the 3 goals.
- **The saved goals** are exactly these 3:

| title | target | current | unit | direction | period | repeat | points |
|---|---|---|---|---|---|---|---|
| Drink Water | 8 | 0 | glasses | increase | daily | **true** | 10 |
| Run Distance | 100 | 0 | km | increase | monthly | false | 50 |
| Lose Weight | 70 | **82** | kg | **decrease** | monthly | false | 100 |

- **Each goal** has its template's icon, and all 3 ids are different.
- **No schedule** is saved on any of them.

**1.7 The button is gone once there are goals.** **Expected:** Home no longer shows **Pick goals
to start**.

**1.8 Closing clears the ticks.** Seed `seed()` again and press **Pick goals to start**. Tick
**Drink Water**, close the panel with ✕, then open it again. **Expected:** nothing is ticked, and
the footer shows the hint again.

## 2. The template list from the Add Goal tab

Before each step here, seed as the step says, then open the **Add Goal** tab and press **Use a
Template** (under the title field on step 1).

**2.1 The same list, with Customize.** Run `seed()`.

**Expected:**
- **The panel** is titled **Goal Templates**.
- **Customize:** tick one template, and **Customize** appears next to **Add 1 goal**. Tick a
  second, and **Customize** disappears. Untick back to one, and it returns.

**2.2 Add several from here.** Tick **Drink Water** and **Workout Streak**, then press **Add 2
goals**. **Expected:** the app goes to Home, and `goals()` shows both goals with their
templates' values.

**2.3 A saved template with a custom period can't be ticked.** Seed:

```js
seed({ templates: [template({ id: 'custom_1', title: 'Fortnight Plan', period: 'custom' }),
                   template({ id: 'custom_2', title: 'Weekly Plan', period: 'weekly' })] });
```

Open the list. **Expected:**
- **Fortnight Plan** is faded, has no tick circle, and reads "Set up on the Add tab".
- **Pressing it** ticks nothing.
- **Weekly Plan** can be ticked. Adding it saves a weekly goal with `repeat: true` and 20
  points.
- **The My Templates chip** shows only these two.

**2.4 Search, then tick.** Open the list, type `Distractions` in Search and tick **Reduce
Distractions**, a daily goal going down to 2 hours.

**Expected:**
- **Its start field** appears: "Your current value (hours)".
- **The error:** `1` shows it; `5` is accepted.
- **After adding:** the goal is saved with `current: 5`, `direction: 'decrease'`, `period:
  'daily'` and `repeat: true`.

**2.5 A template going down to 0.** Search `Debt`. **Reduce Debt** shows Target **0 dollars**.

**Expected:**
- **It can be ticked:** it isn't faded, and has no "Set up on the Add tab".
- **Its start field:** `0` shows "For a decreasing goal, current progress must be above the
  target"; `5000` is accepted.
- **After adding:** the goal is saved with `target: 0`, `current: 5000`, `direction:
  'decrease'` and `period: 'yearly'`.

**2.6 The other two going down to 0.** Search `Emails`, then `Plastic`. **Expected:** **Process
Emails** and **Reduce Plastic** show Target 0 and can be ticked. Before this change, all three
were impossible to add.

## 3. The step-by-step form

Run `seed()` and open the **Add Goal** tab for each step, unless it says otherwise.

**3.1 Layout.** **Expected:**
- **The progress bar:** "Step 1 of 4", with a bar of 4 segments and the first one filled.
- **The title:** "What's the goal?", with a hint under it.
- **The fields:** a 🎯 icon button, a title field and a **Use a Template** link.
- **The footer:** a **Next** button, and no **Back** button.

**3.2 The title is required.** Press **Next** with the title empty. **Expected:** "Title is
required" appears, and the form stays on step 1. Type a 101-character title and press **Next**.
**Expected:** "Title must be 100 characters or fewer". (Typing stops at 100 characters; set a 101-character value from JavaScript to see the message.)

**3.3 The icon picker.** Press the 🎯 button. **Expected:** a panel of icons in categories.
Choose 📚. **Expected:** the panel closes, and the button shows 📚.

**3.4 Step 2: tracking by number.** Type the title `Read`, then press **Next**.

**Expected:**
- **The header:** "Step 2 of 4", "How will you track it?".
- **Three choices:** **A number** (selected), **Just done or not** and **By smaller steps**.
- **Fields for a number:** Target amount, Unit of measurement, "I'm starting at" (holding
  `0`), and **Going up** / **Going down** (Going up selected).

Press **Next** with the target and unit empty. **Expected:** "Target is required" and "Unit is
required".

Then try each case below in turn, pressing **Next** each time:

| Target | Unit | Start | Direction | Expected error |
|---|---|---|---|---|
| `0` | `pages` | `0` | up | "Target must be a positive number" |
| `20` | `abcdefghijklmnopqrstu` (21 characters, set from JavaScript: typing stops at 20) | `0` | up | "Unit must be 20 characters or fewer" |
| `20` | `pages` | `25` | up | "Current progress must be below the target" |
| `20` | `pages` | `10` | down | "For a decreasing goal, current progress must be above the target" |

Finish with **Going up**, target `20`, unit `pages` and start `0`, then press **Next**. It moves
to step 3.

**3.5 Back keeps what you typed.** On step 3, press **Back** twice. **Expected:** step 1 shows
`Read` and 📚. Press **Next**. **Expected:** step 2 still shows `20`, `pages` and `0`.

**3.6 Step 3: how often.** Continue to step 3.

**Expected:**
- **The header:** "Step 3 of 4", "How often?".
- **The period chips:** Daily (selected), Weekly, Monthly, Yearly, Custom and No deadline.
- **A checkbox**, "Repeat every day", is **ticked**.
- **Below it,** a schedule picker is shown.

Then tap each period and check:

| Period tapped | Repeat checkbox |
|---|---|
| Weekly | "Repeat every week", **ticked** |
| Monthly | "Repeat every month", **unticked** |
| Yearly | "Repeat every year", **unticked** |
| No deadline | **no repeat checkbox at all** |

**3.7 Custom period.** Tap **Custom**. **Expected:** a "Custom Period (Days)" field appears.
Press **Next** with it empty. **Expected:** "Custom period days is required".

Then try each value, pressing **Next**:

| Days | Expected |
|---|---|
| `0.5` | "Enter a number of days from 1 to 3650" |
| `4000` | the same error |
| `14` | moves to step 4 |

**Expected on step 4:** the suggested points are **140** (10 per day, capped at 300).

**3.8 Points follow the period until you type them.** Go **Back** to step 3.

**Expected:**
1. **Daily, then Next:** Points shows **10**, with the hint "Suggested for a daily goal".
2. **Back, Weekly, then Next:** **30**, "Suggested for a weekly goal".
3. **Back, Monthly, then Next:** **100**.
4. **Back, Yearly, then Next:** **300**.
5. **Back, No deadline, then Next:** **50**.
6. **Now type `45`:** the hint disappears.
7. **Back, Daily, then Next:** Points still shows **45**.

**3.9 The points check.** On step 4, test each value by pressing **Create goal**:

| Points | Expected error |
|---|---|
| (empty) | "Points are required" |
| `100001` | "Points must be 100,000 or less" |

**3.10 Create a counted goal.** Set Points to `15`, then press **Create goal**.

**Expected:**
- **The app goes to Home,** and "Read" is listed.
- **The saved goal (`goals()`):** title `Read`, icon 📚, target 20, current 0, unit `pages`,
  direction `increase`, period `daily`, `repeat: true`, points 15.

**3.11 The form starts over.** Open the **Add Goal** tab again. **Expected:** "Step 1 of 4", an
empty title and the 🎯 icon.

**3.12 A done-or-not goal.** Type the title `Meditate` and press **Next**. Choose **Just done or
not**. **Expected:** the number fields disappear. Press **Next** twice, then press **Create
goal**.

**Expected:** a goal with target **1**, current 0, unit **`time`**, `repeat: true`, period
daily, and points **10**.

Then open it from Home and complete it (its **+1** control, or **Mark as Complete** and confirm).
**Expected:** it shows as complete.

**3.13 A goal made of smaller steps.** Title `Learn Spanish`, choose **By smaller steps**, and
press **Next**.

**Expected:**
- **Step 3 has no repeat checkbox,** for any period.
- **On step 4,** a "Subgoals award their own points" checkbox appears. Tick it, then create the
  goal.
- **The saved goal:** `ultimate: true`, `repeat: false`, target 100, unit `subgoals`,
  `subPoints: true`.

**3.14 Repeat off, and the schedule.**
1. **Repeat off:** create `Walk`, done-or-not and daily, but **untick** "Repeat every day".
   **Expected:** the schedule picker disappears when you untick it, and the saved goal has
   `repeat: false` and **no** `schedule`.
2. **With a schedule:** create `Gym`, done-or-not and weekly, with repeat on. On step 3:
   1. Tap the schedule row under the checkbox (a calendar icon, reading "Every day").
   2. In the Schedule panel, choose **Specific days**.
   3. Tap **Mon** and **Thu**, then press **Apply**.

   **Expected:** the row now names the two days, and the saved goal has `repeat: true` and a
   `schedule` whose `daysOfWeek` is `[1, 4]`.

**3.15 Linked reward and description.** Seed a reward first:

```js
seed({ rewards: [{ id: 7, title: 'Movie night', description: '', pointsCost: 50, icon: '🎬', createdAt: now, isRedeemed: false }] });
```

Create `Run 5k` as done-or-not and weekly.
1. **On step 4,** open **Linked Reward** and choose **Movie night**.
2. **Press More options.** **Expected:** a Description field appears. Type `Easy pace`.
3. **Create.**

**Expected:** the saved goal has `reward: 7` and `description: 'Easy pace'`.

**3.16 A goal going down to 0.**
1. **Going up to 0 is refused:** create `Inbox` with **A number**, target `0`, unit `emails`,
   start `0` and **Going up**, then press **Next**. **Expected:** "Target must be a positive
   number".
2. **Going down, 0 is accepted:** choose **Going down** and set the start to `40`. **Expected:**
   **Next** moves on.
3. **Below 0 is refused:** go **Back** and set the target to `-1`. **Expected:** "Target must be
   0 or more".
4. **Save it:** set the target back to `0`, choose **No deadline** on step 3, and create.
   **Expected:** the saved goal has `target: 0`, `current: 40` and `direction: 'decrease'`.

Then open it from Home and check each point below:

| Check | Expected |
|---|---|
| Progress, as created | **0%** |
| Slider ends | labelled **0** and **40** |
| Type `10` in "New progress value", then press **Update Progress** | **75%** |
| Type `0`, then press **Update Progress** | the "Goal Reached 100%" panel appears. Its **Save** is **WEB-ONLY** (see ground rule 1), so press **Cancel**. |
| Press **Mark as Complete**, then **Mark as Complete** in the dialog | the goal is complete, with `current: 0`, and 100% |
| The points ledger (`@pathly:points_ledger`) | a `completion` entry of 50 points |

## 4. Customize a template

Run `seed()`, open the **Add Goal** tab and press **Use a Template** for each step.

**4.1 A normal template.** Tick **Drink Water**, then press **Customize**.

**Expected:**
- **The panel closes,** and the form opens at **step 4 of 4** with Points **10**.
- **Back shows the template's values:** step 3 has Daily with repeat ticked; step 2 has 8,
  glasses and 0; step 1 has "Drink Water" and 💧.

Change the title to `Drink More Water` and create. **Expected:** one goal, with that title,
target 8, unit glasses, `repeat: true` and points 10.

**4.2 A template going down, with no start yet.** Tick **Lose Weight**, leave its field empty,
and press **Customize**.

**Expected:**
- **The form opens at step 2 of 4,** with **Going down** selected and "I'm starting at" empty.
- **Pressing Next** shows "Current value is required".
- **Type `82`,** then continue to step 4 and create.
- **The saved goal:** current 82, target 70, direction `decrease`.

**4.3 A template going down, with its start.** Tick **Lose Weight**, type `90` in its card's
field, and press **Customize**. **Expected:** the form opens at **step 4**; creating it saves
current 90.

**4.4 A template while a goal is half-typed.** On step 1, type `Something`, then **Use a
Template**, tick **Build Muscle** and press **Customize**. **Expected:** the form shows Build
Muscle's values; `Something` is gone.

## 5. The long form still works (edit and subgoal)

**5.1 Edit keeps what you don't change.** Seed:

```js
seed({
  rewards: [{ id: 7, title: 'Movie night', description: '', pointsCost: 50, icon: '🎬', createdAt: now, isRedeemed: false }],
  goals: [{ id: 1, title: 'Gym', target: 1, current: 0, initialValue: 0, unit: 'time', progress: 0, points: 30,
    direction: 'increase', period: 'weekly', periodStartDate: now, createdAt: now, subGoals: [], isComplete: false,
    completionHistory: [], icon: '🏋️', isRecurring: true, schedule: { daysOfWeek: [1, 4] }, linkedRewardId: 7 }],
});
```

1. Open `http://localhost:8081/goal/1` and press **Edit Goal**.
2. **Expected:** the long form opens, filled in with the goal's values.
3. Press the icon button. **Expected:** the icon picker opens, as in 3.3. Choose 🏃.
4. Change the title to `Gym twice`, then save.

**Expected:** the title and icon are changed; `repeat: true`, `schedule` `[1, 4]` and `reward:
7` are all kept.

**5.2 Adding a subgoal.** Seed a goal made of subgoals:

```js
seed({ goals: [{ id: 1, title: 'Learn Spanish', target: 100, current: 0, initialValue: 0, unit: 'subgoals', progress: 0,
  points: 100, direction: 'increase', period: 'yearly', periodStartDate: now, createdAt: now, subGoals: [],
  isComplete: false, completionHistory: [], icon: '🇪🇸', isUltimate: true }] });
```

Open `http://localhost:8081/goal/1`, press **Add Subgoal**, fill in `Vocabulary`, 100, `words`,
and save. **Expected:** the subgoal is listed under the goal.

## 6. Dark mode tab pages

The app's five tabs are pages side by side: **Home, Add, Stats, Rewards, Settings**. Each page is
drawn the first time you're on it or next to it. A page not drawn yet shows only its background.

Run this snippet in each step below to see every page's state:

```js
(() => {
  const names = ['Home', 'Add', 'Stats', 'Rewards', 'Settings'];
  const hidden = [...document.querySelectorAll('[aria-hidden="true"]')].find((el) => el.getBoundingClientRect().height > 300);
  if (!hidden) return 'no hidden pages found';
  // Each page sits in its own wrapper; the wrappers are side by side in one row.
  return [...hidden.parentElement.parentElement.children].map((wrapper, i) => {
    const page = wrapper.firstElementChild;
    return `${names[i]}: ${page.getAttribute('aria-hidden') === 'true' ? 'hidden' : 'SHOWN'} | ${getComputedStyle(page).backgroundColor} | ${page.innerText.trim() ? 'drawn' : 'EMPTY'}`;
  }).join('\n');
})()
```

At launch in dark mode it prints:

```
Home: SHOWN | rgb(26, 26, 26) | drawn
Add: hidden | rgb(26, 26, 26) | drawn
Stats: hidden | rgb(26, 26, 26) | EMPTY
Rewards: hidden | rgb(26, 26, 26) | EMPTY
Settings: hidden | rgb(26, 26, 26) | EMPTY
```

**6.1 At launch.** Run `seed({ theme: 'dark' })` and wait for Home.

**Expected:**
- **Every page's background** is **`rgb(26, 26, 26)`**. `rgb(242, 242, 242)` anywhere is the
  old bug.
- **Home** is SHOWN and drawn, and **Add** is already drawn.
- **Stats, Rewards and Settings** are EMPTY.

**6.2 Neighbours are drawn ahead.** Tap the **Add Goal** tab. **Expected:** **Stats** is now
drawn, while **Rewards** and **Settings** are still EMPTY. Tap **Stats**. **Expected:**
**Rewards** is drawn. Tap **Rewards**. **Expected:** **Settings** is drawn.

**6.3 Jumping to a far tab.** Run `seed({ theme: 'dark' })` again, then tap **Settings**
straight from Home.

**Expected:**
- **Settings** is SHOWN and drawn, and **Rewards** is drawn too.
- **Stats** is EMPTY.
- **No light flash:** during the jump, note if any light area appears, and take a screenshot if
  you can.

**6.4 Swiping (if the browser allows it).** Reseed dark. On Home, press and hold on an empty part
of the page, drag left halfway, and take a screenshot while holding.

**Expected:** the incoming page is the Add form on a dark background, with no light area.

If dragging doesn't move the pages in this browser, mark it **WEB-ONLY**.

**6.5 Switching theme.** In **Settings**, choose **Light**, then run the snippet.

**Expected:**
- **Light:** every page is **`rgb(245, 246, 250)`**, with no reload.
- **Dark again:** choose **Dark**; every page is back to **`rgb(26, 26, 26)`**.

**6.6 Opening a goal in dark mode.** Seed dark with one goal:

```js
seed({ theme: 'dark', goals: [{ id: 1, title: 'Read', target: 10, current: 2, initialValue: 0, unit: 'pages', progress: 20,
  points: 20, direction: 'increase', period: 'weekly', periodStartDate: now, createdAt: now, subGoals: [],
  isComplete: false, completionHistory: [], icon: '📚' }] });
```

Tap the goal to open it, then go back. **Expected:** no light background flashes during either
slide.

## 7. Arabic

**7.1 The empty Home screen.** Run `seed({ language: 'ar' })`. Reload if the layout doesn't flip,
and note whether you had to.

**Expected:**
- **The message:** "لا توجد أهداف بعد. اختر بعض الأهداف الجاهزة للبدء، أو أنشئ هدفك من تبويب
  الإضافة."
- **The button:** **اختر أهدافاً للبدء**.

**7.2 The list in Arabic.** Press the button.

**Expected:**
- **The panel title** is "اختر أهدافاً للبدء", and the My Templates chip reads **قوالبي**.
- **The add button's wording** changes with the count:

| Templates ticked | Button text |
|---|---|
| 1 | **أضف هدفاً واحداً** |
| 2 | **أضف هدفين** |
| 3 | **أضف ٣ أهداف** |

- **Lose Weight** (إنقاص الوزن), when ticked, shows the field "قيمتك الحالية (كجم)".
- **Every number** on the cards (targets, points) is in **Arabic-Indic digits** (٠١٢٣…).

Tick 3 templates, including Lose Weight with a start of 82, and add them. **Expected:** 3 goals
are saved.

**7.3 The form in Arabic.** Open the Add Goal tab (إضافة هدف).

**Expected:**
- **The header:** "الخطوة ١ من ٤", titled "ما هو هدفك؟".
- **The button:** **التالي**.
- **The layout** is right-to-left.

Create a done-or-not daily goal (**تم أو لم يتم**), going through **التالي** to **إنشاء
الهدف**.

**Expected:**
- **The saved goal** has unit **`مرة`**.
- **Each step's header** uses Arabic-Indic digits (٢, ٣, ٤).
- **The points hint** on step 4 is in Arabic.

**Record, but don't count as a bug:** which digits the text fields show while you type.

**7.4** Switch back to English in Settings.

---

## Report

Finish with a report in this format:

1. **Summary table:** step | PASS / FAIL / PARTIAL / WEB-ONLY / BLOCKED | one-line note.
2. **Bugs**, most severe first. For each:
   - **Title**
   - **Severity:**
     - **High:** a goal saved with wrong values; something added that shouldn't be, or not
       added without saying so; a goal that can't reach 100%; a crash; a light flash in dark
       mode.
     - **Medium:** a wrong default, a check that's missing or wrong, the wrong step opened.
     - **Low:** wording or layout.
   - **Steps to reproduce:** the seed snippet and the actions.
   - **Expected** and **Actual,** with `goals()` output where it matters.
   - **Evidence:** a screenshot and any console error text.
3. **Console errors**, each with its step.
4. **Observations:** anything that worked but felt slow, confusing or easy to get wrong, kept
   separate from bugs. Say how many taps it took to add 3 goals in section 1, and to create the
   done-or-not goal in 3.12.
