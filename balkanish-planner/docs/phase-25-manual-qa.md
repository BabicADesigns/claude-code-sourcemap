# Phase 25 — Manual QA Checklist

Audit date: 2026-07-07

This checklist is written for a non-developer tester using a mobile phone (390px wide) or tablet. Go through each step as a real traveller would.

---

## Before You Start

You need:
- A Balkanish account (email + password)
- A connected Supabase instance
- OpenAI key configured (for AI prose)

---

## Section 1: Discovery (No Account Needed)

1. Open the homepage. Does it load without errors?
2. Tap "Hidden Gems" in the menu. Do you see a grid of destinations?
3. Tap one destination. Does the detail page show a hero image, description, and score panel?
4. Tap "Food Finds" in the menu. Do you see food entries with images?
5. Tap a food entry. Does the detail page load with a full story?
6. Tap "Culture Notes". Do you see culture entries?
7. Tap "Secret Swap". Can you pick a famous place and see an alternative?
8. Tap "Matchmaker". Can you complete the 10-question quiz and see a result?
9. Try to save a destination (heart icon). You should be prompted to sign in.

---

## Section 2: Sign-Up and Account

10. Tap "Sign in" in the header. Do you see a sign-in form?
11. Tap "Create an account" and register a new account.
12. After signing up, are you redirected to a logged-in state?
13. Open "Account" from the header. Do you see a profile form?
14. Change your display name and tap Save. Does the change persist after refreshing?

---

## Section 3: AI Planner

15. Tap "Plan" in the header. Do you see the planner wizard?
16. Work through all wizard steps (destination, style, duration, budget, interests).
17. Tap Generate. Does a loading state appear?
18. Does the result show three variant tabs (Explorer/Balanced/Conservative)?
19. Switch between tabs. Do they show different routes?
20. Does the itinerary show destination names, day-by-day slots, and a map?
21. Tap "Save this trip". Do you see a success state?

---

## Section 4: My Trips

22. Open "My Trips" from the header. Do you see the trip you just saved?
23. Tap the trip card. Do you see companion/today/reflection links?
24. Can you rename the trip by tapping the name?
25. Can you download a PDF? (Tap the download button)

---

## Section 5: Trip Companion (Pre-Trip)

26. Open the Trip Companion from My Trips.
27. Can you set a departure date?
28. Does the readiness checklist appear after setting a date?
29. Tap "Mark done" on a checklist item. Does the state save?
30. Add a booking note to an item. Does it save and show on refresh?

---

## Section 6: Live Trip (During Trip)

*Note: For testing, set the departure date to today.*

31. Open the "Today" view from My Trips.
32. Does it show today's scheduled activities?
33. Tap "Done" on a morning slot. Does the state change?
34. Tap "Skip" on an afternoon slot. Does it show as skipped?
35. Does the cultural context section show any insights?

---

## Section 7: Post-Trip Reflection

*Note: For testing, set the departure date to a week ago.*

36. Open the Reflection page from My Trips.
37. Does the page load (not show "trip not completed" error)?
38. Can you select an overall feeling (e.g., "Loved it")?
39. Can you select a pace reflection and planning comfort rating?
40. Can you rate individual day slots (loved/would skip)?
41. Does the "What I learned" section appear with candidate cards?
42. Can you confirm or skip a learning candidate?
43. Can you complete the reflection?

---

## Section 8: Travel Memory

44. After completing a reflection, open your Account page.
45. Do you see a "Travel Memory" section with at least one signal?
46. Can you confirm a signal you haven't confirmed yet?
47. Can you reject a signal? (It should disappear from the active list)

---

## Section 9: Mobile Layout (390px)

48. On all pages above, confirm text is readable without horizontal scrolling.
49. Check that the header nav collapses to a hamburger menu on small screens.
50. Check that the planner wizard steps are tappable without zooming.
51. Check that the itinerary map fits within the screen width.

---

## Section 10: Edge Cases

52. Try opening `/trips/fake-id/today` (not your trip). Does it show a 404 page?
53. Sign out and try to open My Trips. Are you redirected to sign-in?
54. Sign out and try to open the planner. Can you generate without signing in? (Should fail with "Sign in to generate" after P25-C01 fix)
55. Open the reflection for a trip that is still in PLANNING status (no departure date set). Does it show "not eligible" instead of the full form?

---

## Pass Criteria

All steps should complete without:
- Blank white screens
- "Something went wrong" errors that don't resolve
- Data that doesn't persist after refresh
- Features that are visible but non-functional
- Content from another user appearing in your view
