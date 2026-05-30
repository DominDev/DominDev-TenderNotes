# Data Model

## profiles

One profile row per Supabase Auth user.

## observations

One row per user and day number.

Score fields use the 0-2 scale from the source document:

```text
0 - clear difficulty
1 - mixed reaction
2 - good or typical functioning
```

## summary_answers

One row per user and summary question. These are the six final questions from the source document.

