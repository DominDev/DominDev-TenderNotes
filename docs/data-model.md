# Data Model

## profiles

One profile row per Supabase Auth user.

## observations

One row per child and day number. `user_id` identifies the account that wrote the latest row,
while `child_id` scopes the data and report.

Score fields use a 0-3 observation scale:

```text
0 - trudno
1 - trochę trudno
2 - raczej spokojnie
3 - spokojnie
```

## summary_answers

One row per child and summary question. These are the six final questions from the source document.

## children

One row per observed child. The current version stores display name, `birth_month`, age band
and a color-based avatar. Child photos are not part of v1.

## child_members

Membership table prepared for future caregiver sharing. Current UI creates only `owner`
memberships for the logged-in user.
