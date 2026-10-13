# Test transcripts

20 realistic voice-note style job descriptions, used to measure Day 2
extraction accuracy (docs/RISKS.md R3.5) and to decide 270M-vs-1B default and
Q4-vs-Q8 quant with data instead of guessing. Mix of clean, messy (corrections,
filler words), trades, and creative/freelance jobs, per docs/ARCHITECTURE.md
section 4.

Each entry: the raw transcript, then the expected line items a competent
human reading it would write down, for comparing against model output.

## 1. Clean, trades
"Tiled the Hendersons' bathroom, about 40 square meters, materials were 300,
two days labor."
Expected: tiling 40 m2, materials 300, labor 2 days.

## 2. Clean, creative
"Logo design package for a coffee shop, three concepts, one round of
revisions, flat fee of 450."
Expected: logo design package, flat 450.

## 3. Messy, correction
"So I did the Hendersons' bathroom, um, forty square meters of tile, actually
make that forty five, materials came to three hundred, and two days of
labor at my usual rate."
Expected: tiling 45 m2 (corrected), materials 300, labor 2 days, rate from
library if known.

## 4. Messy, filler words
"Okay so, like, I painted the fence, it was, um, maybe sixty meters, used two
cans of paint at twenty five each, took me half a day."
Expected: fence painting 60 m, paint materials 2x25, labor 0.5 day.

## 5. Multiple distinct jobs in one breath
"Mowed the lawn and trimmed the hedges for the Martinez place, lawn was about
an hour, hedges another forty five minutes, no materials."
Expected: lawn mowing 1 hour, hedge trimming 0.75 hour.

## 6. Numbers spoken as words
"Garden cleanup, took about three hours, green waste disposal was forty
dollars."
Expected: garden cleanup 3 hours, disposal fee 40.

## 7. No price given at all
"Fixed the leaking tap in the kitchen, quick job, maybe twenty minutes."
Expected: tap repair, no rate (estimate chip expected).

## 8. Day-rate trade job
"Full day on the deck rebuild, materials were about twelve hundred for the
lumber."
Expected: labor 1 day, materials 1200.

## 9. Freelance writing
"Wrote four blog posts for their site, about eight hundred words each, two
hundred per post."
Expected: 4 blog posts at 200 each.

## 10. Per-square-meter quote with a range
"Painting the living room, roughly thirty to thirty five square meters, say
thirty two, two coats, paint and labor included, forty a meter."
Expected: painting 32 m2 at 40/m2.

## 11. Mixed units same job
"Electrical job, three hours of labor plus the parts which came to about
eighty five."
Expected: labor 3 hours, parts 85.

## 12. Client name buried mid-sentence
"So for the Chen family, their deck needed, uh, about six hours of work and
maybe two hundred in materials."
Expected: client Chen family, labor 6 hours, materials 200.

## 13. Photography gig
"Did an engagement shoot, two hours on location, edited twenty final photos,
flat rate three fifty."
Expected: engagement shoot, flat 350.

## 14. Plumbing callout plus parts
"Callout fee is eighty, then forty five minutes of actual work, and a new
valve which was thirty bucks."
Expected: callout 80, labor 0.75 hour, valve part 30.

## 15. Tutoring, hourly, recurring described as one session
"One tutoring session, an hour and a half, my rate is sixty an hour."
Expected: tutoring 1.5 hours at 60/hour.

## 16. Correction changing the price not the quantity
"Redid their fence staining, forty meters, I usually charge eight a meter
actually it's gone up to ten now."
Expected: fence staining 40 m at 10/m (corrected rate).

## 17. Ambiguous unit (could be hours or a flat job)
"Dog walking for the week, five walks, fifteen each."
Expected: dog walking 5 at 15 each (job/item unit, not hour).

## 18. Long rambling with one real job buried in it
"So yeah it's been a busy week, anyway for the Okafor job I did the gutter
cleaning, took forty five minutes, no materials needed, pretty
straightforward."
Expected: client Okafor, gutter cleaning 0.75 hour.

## 19. Two materials lines
"Fixed the drywall, two sheets at eighteen each, joint compound was twelve,
labor was an hour and a half."
Expected: drywall sheets 2x18, joint compound 12, labor 1.5 hours.

## 20. No numbers at all (should fail gracefully to manual mode)
"Went out and had a look at their roof, didn't do any work yet, just an
inspection."
Expected: no priced items extractable; model should omit rate rather than
invent one, or the app should fall through to manual mode cleanly.
