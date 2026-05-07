# Working Days Utility — Full Specification

## Purpose

Pure domain utility (no framework imports) that determines which dates within a date range qualify as working days, factoring in weekends and an optional holiday list.

---

## Requirements

### Requirement: isWorkingDay

The system MUST expose `isWorkingDay(date: string, holidays: string[]): boolean` that returns `false` for Saturday, Sunday, or any date present in the holidays array; otherwise returns `true`.

#### Scenario: Weekday with no holidays

- GIVEN holidays = []
- WHEN isWorkingDay("2026-05-04") is called (Monday)
- THEN it returns true

#### Scenario: Saturday returns false

- GIVEN holidays = []
- WHEN isWorkingDay("2026-05-09") is called (Saturday)
- THEN it returns false

#### Scenario: Sunday returns false

- GIVEN holidays = []
- WHEN isWorkingDay("2026-05-10") is called (Sunday)
- THEN it returns false

#### Scenario: Weekday in holidays list returns false

- GIVEN holidays = ["2026-05-01"]
- WHEN isWorkingDay("2026-05-01") is called (Friday)
- THEN it returns false

#### Scenario: Empty holidays array skips only weekends

- GIVEN holidays = []
- WHEN isWorkingDay is called for Mon–Fri dates
- THEN all return true

---

### Requirement: getWorkingDays

The system MUST expose `getWorkingDays(start: string, end: string, holidays: string[]): string[]` that returns a sorted array of ISO date strings (YYYY-MM-DD) between start and end (inclusive) that pass `isWorkingDay`.

If start or end itself is a non-working day, it MUST NOT be included in the returned array.

#### Scenario: Range with weekends

- GIVEN start="2026-05-04", end="2026-05-10", holidays=[]
- WHEN getWorkingDays is called
- THEN returns ["2026-05-04","2026-05-05","2026-05-06","2026-05-07","2026-05-08"]

#### Scenario: Start is weekend — excluded

- GIVEN start="2026-05-09" (Saturday), end="2026-05-11", holidays=[]
- WHEN getWorkingDays is called
- THEN returns ["2026-05-11"] (Monday only)

#### Scenario: Holiday in range excluded

- GIVEN start="2026-05-04", end="2026-05-06", holidays=["2026-05-05"]
- WHEN getWorkingDays is called
- THEN returns ["2026-05-04","2026-05-06"]

#### Scenario: All days are holidays returns empty array

- GIVEN start="2026-05-04", end="2026-05-04", holidays=["2026-05-04"]
- WHEN getWorkingDays is called
- THEN returns []
