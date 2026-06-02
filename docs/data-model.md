# Data Model

## profiles

One profile row per Supabase Auth user.

## observations

One row per user and day number.

Score fields use a 0-3 observation scale:

```text
0 - trudno
1 - trochę trudno
2 - raczej spokojnie
3 - spokojnie
```

## summary_answers

One row per user and summary question. These are the six final questions from the source document.
