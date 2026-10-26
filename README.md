# Recurring event with EventSegments: occurrences keep the master's segment dates and a wrong endDate

Minimal repro for Bryntum support. Scheduler Pro 7.3.7, plain JS + Vite, `eventSegments` on, no code of ours around it.

## Run

```sh
npm install   # needs access to npm.bryntum.com (licensed or trial account)
npm run dev
```

Open http://localhost:5192/, or run the check headless in a fresh browser (3 runs by default):

```sh
npm run dev     # in one terminal
npm run repro   # in another
```

No gesture is involved: the page only loads one event and reads the occurrences. `window.report()` prints what it reads.

## Setup

One resource, one weekly event on Tuesday 14 Apr 2026, `FREQ=WEEKLY;BYDAY=TU;UNTIL=20260428`:

- `startDate` 10:00, `endDate` 22:30, `duration: 9` hours (the worked time: the two segments add up to 9 h)
- `segments`: 10:00-14:30 and 18:00-22:30

## Expected

Each Tuesday looks like the master's: occurrence 10:00 to 22:30, segments 10:00-14:30 and 18:00-22:30 **on that day**,
two bars drawn.

## Actual (3/3 runs)

```
Tuesday 14 Apr  4/14 10:00 -> 4/14 22:30  segments: ["4/14 10:00 - 4/14 14:30","4/14 18:00 - 4/14 22:30"]  bars drawn that day: 3
Tuesday 21 Apr  4/21 10:00 -> 4/21 19:00  segments: ["4/14 10:00 - 4/14 14:30","4/14 18:00 - 4/14 22:30"]  bars drawn that day: 0
Tuesday 28 Apr  4/28 10:00 -> 4/28 19:00  segments: ["4/14 10:00 - 4/14 14:30","4/14 18:00 - 4/14 22:30"]  bars drawn that day: 0
```

1. The occurrence's segments still carry the master's dates (14 Apr), so nothing is drawn on 21 and 28 Apr.
2. The occurrence's `endDate` is 19:00, not 22:30: master start + `duration` (9 h), not the segments' span.

(`bars drawn that day` counts `.b-sch-event` elements overlapping the day's column.)

## Where it comes from (7.3.7 source)

- `RecurringTimeSpan.buildOccurrence` (`Scheduler/model/mixin/RecurringTimeSpan.js:597`) sets the occurrence end to
  `occurrenceDate + duration`, then calls `me.copy({ id, startDate, endDate, duration })` (`:635`).
- `SplitEventMixin.copy` (`Engine/quark/model/scheduler_pro/SplitEventMixin.js:946-955`) copies the segments with
  `seg.copy()`, so they keep the master's `startDate` / `endDate`. Nothing moves them to the occurrence start.

## Versions

`@bryntum/schedulerpro` 7.3.7, Vite 7, Chromium (Playwright 1.63.0).
