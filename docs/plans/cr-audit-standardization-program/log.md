# CR audit revision log

The "Revised" lines that headed the [CR audit plan](../cr-audit-standardization-program.md) until 2026-11-22, oldest first. The plan now keeps one "Where it stands" paragraph, rewritten each time; later history is in the git log and the PRs.

*Revised 2026-11-12: added the card flag inventory (1.10), the generated kind reference (1.11), two Phase 2 guards, area 10, and the Phase 6 gate.*

*Revised 2026-11-13: added the playout blockers step between Phase 2 and area 1.*

*Revised 2026-11-14: Phase 2 done (engine #928); inventory counts corrected from its baselines.*

*Revised 2026-11-15: playout blockers done (engine #930 and #932, releases `v1.147.259` and `v1.147.260`); the playouts drop System Gateway (engine #931).*

*Revised 2026-11-19: added the kind and phrase check (1.12) and the [printed-text sweep](../cr-audit-standardization-program.md#printed-text-sweep-beside-phase-3-before-the-phase-6-gate) of the whole Eternal corpus; the Phase 6 gate now waits for every format to be clean and opens them all at once.*

*Revised 2026-11-19: the kind and phrase check (1.12) done in engine #941; its findings are listed under the printed-text sweep for the sweep sessions to confirm.*

*Revised 2026-11-19: area 1 (hosting and trash) done: engine #942 (release `v1.147.264`), game #313. Its new findings are filed under areas 2, 5, 6, 9 and 11.*

*Revised 2026-11-19: sweep S1 (Startup) done in engine #943–#945: 164 cards match, 35 wrong, 26 filed. PF-S1 (engine #948, release `v1.147.265`, game #314) fixed 14 wrong cards and the area 1 trash-hook finding, moved 6 to their areas, and left 15 for paired cut A ([S1 results](results.md#s1-results-2026-11-19)). The S1 filed cards are in the findings table.*

*Revised 2026-11-19: sweep S2 (Standard) done in engine #946, #947 and #949: 388 cards, 271 match, 76 wrong, 41 filed ([S2 results](results.md#s2-results-2026-11-19)). PF-S2 is next, then a fix-now session for icebreaker strength.*

*Revised 2026-11-19: PF-S2 (engine #950, release `v1.147.266`, game #315) closed the six S2 visibility leaks and worked all 76 wrong cards: 21 fixed, 26 moved to their areas, 29 left for paired cut A ([S2 results](results.md#s2-results-2026-11-19)). FX-breakers is next.*

*Revised 2026-11-19: FX-breakers (engine #953, release `v1.147.267`, game #318) makes every break check the icebreaker's strength through one helper, `src/state/procedures/break.ts`, the start of area 11's break helper. It closed the two area 11 breaking rows and filed six new area 11 rows.*

*Revised 2026-11-19: sweep S2a (Ashes, engine #947) and S2b (Borealis, engine #946) done; S2c (Liberation) started. Added [Shared pieces](../cr-audit-standardization-program.md#shared-pieces) and [Out of scope](../cr-audit-standardization-program.md#out-of-scope), which the coordinate skill needs for every area brief.*

*Revised 2026-11-19: added the CR section coverage map (1.13) and its [first pass](../cr-audit-standardization-program.md#cr-section-owners-first-pass-2026-11-19): 24 CR sections, plus three deck-construction characteristics, had no area and no earlier program. They get areas 14 (run flow), 15 (keywords and credits) and 16 (game setup and end), and the Phase 6 gate waits for them. Added the [re-audit of the earlier programs and the interaction check](../cr-audit-standardization-program.md#re-audit-of-the-earlier-programs-and-interaction-check), which start now beside area 2.*

*Revised 2026-11-19: added six checks that reduce what the audit can still miss: official rulings as tests (1.14), the timing walk in the playouts (1.15), a second reader on another model (1.16), subrule citation coverage (1.17), ability fire coverage (1.18), and the cited-rule change check (1.19).*

*Revised 2026-11-19: Phase 6 now waits for the whole program; the [gate](../cr-audit-standardization-program.md#phase-6-gate) is the program's final state. The second reader (1.16) uses Fable 5.2.*

*Revised 2026-11-20: split sweep S3 into 13 sessions by cycle (S3a–S3m). Started FX-salem, RA-1, RA-2, P1-l, P1-k, S3a and S3b.*

*Revised 2026-11-20: FX-salem done (engine #957, release `v1.147.269`, game #320, meta #310). Tool 1.13 done (engine #956): all 119 sections at the pin have an owner. Sweep S3a (Core Set, engine #959) and S3b (Genesis, engine #958) done ([S3 results](results.md#s3-results-2026-11-20)). Area 7's rules are 8.1.1–8.1.3 at the pin, not 8.2. Area 2, S3c, S3d, P1-p and P1-r started.*

*Revised 2026-11-20: RA-1 done (engine #960): 22 timing paths, 9 wrong, 11 RF tests that fail until RF fixes them; its findings are in the findings table under RF. Tool 1.19 done (engine #961, 665 cited rules) and tool 1.17 done (engine #962). S3e, S3f and P1-m started.*

*Revised 2026-11-20: RA-2 done (engine #964), P1-l done (engine #965: 31 ported, 19 engine bugs, no disagreements), tool 1.14 first batch (engine #969: 33 identity rulings). Sweeps S3c (#967), S3d (#963), S3e (#968) and S3f (#970) done; engine #966 regenerated the cited-text and subrule baselines after #960. 1,280 of 2,016 cards are swept. Engine master now refuses a PR that is behind master. New open questions are under [Not yet decided](../cr-audit-standardization-program.md#not-yet-decided).*

*Revised 2026-11-20: area 2 done (engine #971 and #972, releases `v1.147.270` and `v1.147.271`, game #321, meta #316; [results](results.md#area-2-results-2026-11-20)). Sweeps S3h (#974) and S3i (#973) done. FX-pump started.*

*Revised 2026-11-20: FX-pump done (engine #976, release `v1.147.272`, game #322, meta #318): 33 icebreakers pump as printed and 9 start at printed strength; Breach's +3 pump data goes to paired cut A. Sweep S3g (SanSan, #975) done. 1,614 of 2,016 cards swept. Paused here on Nathaniel's word; next are RF-1, RF-2, area 3, S3j–S3m and PF-S3a.*

*Revised 2026-11-20: RF-1 done (engine #980, release `v1.147.273`, game #323): 9 of RA-1's 11 RF tests and most cr-checker rows fixed, the 9.2.8a nested window built; the rest is RF-1b. Sweeps S3j (#978) and S3k (#977) done (1,854 of 2,016 cards). Rulings batch 2 (#979): 97 more rulings tested, 146 left. FX-legal-moves added and started; S3l and S3m started.*

*Revised 2026-11-21: the printed-text sweep has read the whole catalog. S3l (#982) and S3m (#981) done: all 2,016 cards have a result in `printed-sweep.json`: 1,348 match, 359 wrong, 259 filed, 50 fixed. PF-S3a–f fix the wrong ones. P1-m batch 3 and P1-q started.*

*Revised 2026-11-21: a fix-now visibility leak at the approach-server step (Formicary-class ice) and three gaps in the game's visibility check are in the findings table under area 4. When the leak is fixed is under [Not yet decided](../cr-audit-standardization-program.md#not-yet-decided).*

*Revised 2026-11-21: FX-legal-moves done (engine #983, release `v1.147.274`, game #324, meta #323): the legal-move list and apply share one window gate, so Net Shield, Decoy on the Corp's turn and Asteroid Belt's discounted rez are listed, and a new agreement check (`src/debug/legalityAgreement.ts`) runs at every position of the seeded playouts with 0 disagreements. It also fixed 10 moves apply took that the list refused, or the reverse. Its 7 leftovers are in the findings table; one, the basic trash in Archives, is fix-now.*

*Revised 2026-11-21: P1-q done (engine #984): tool 1.18 counts 2,295 abilities on 1,603 supported cards; 95 fire in the seeded playouts, 2,200 never do, and 169 have no test at all. Rulings batch 3 done (engine #985): 85 rulings on resources, programs and hardware, 61 pass and 24 are filed by area, six of them fix-now; 56 rulings are left for batch 4. FX-small (the Formicary-class leak and the Archives basic trash) runs now, before RF-2.*

*Revised 2026-11-21: FX-small done (engine #986, release `v1.147.275`, game #325, meta #328): the run stops at the approach-server step whenever any unrezzed ice is installed, so a facedown Formicary no longer shows, and a card accessed in Archives cannot be trashed for its trash cost. Tool 1.14 done: rulings batch 4 (engine #987) covers the last 56 rulings, so all 275 at the pin are cited by a test (194 pass, 75 filed by area) or listed as unreachable (6). Batches 3 and 4 found 12 fix-now cards, filed under their areas.*

*Revised 2026-11-21: P1-n done (engine #988): tool 1.15 walks every turn, run, breach and access of the 19 seeded playouts (176 turns, 178 runs, 95 breaches, 118 accesses, 8,030 steps) against the chapter 11 charts, with a shrink-only baseline in `tests/baselines/timing-walk.json` grouped by area and chart line. It found one new area 14 bug. The playouts never bring an agenda to its advancement requirement and reach few narrow paid-ability windows, so area 14's evidence step covers those by hand. RF-2 and P1-o (on Fable 5.2) started.*

*Revised 2026-11-21: RF-2 done (engine #989, release `v1.147.276`, game #326, meta #331): encounter-length effects end with the run, all 14 RA-2 RF tests are plain tests, Şifr on Wraparound follows 9.12.1a, blanking and the subtype layer share one 9.12.1d–e dependency sort, Chum fires (its +2 still for the encounter), and a shared active-card check (`src/state/active.ts`) also fixes the facedown paid-ability and Trieste rulings. P1-o first part done (engine #990): Fable 5.2 read the 56 examples of CR chapter 1 blind; the engine agrees on 43 of 55 positions and cr-checker found the engine wrong in all 12 others. Chapters 2–10 (187 examples), the rulings sample and the jinteki scenarios are left. New fix-now findings: resolved subroutines read as broken (area 11), subroutines resolving after an encounter ability ends the run (area 14), LLDS Energy Regulator (area 1), The Future Perfect (area 11).*

*Revised 2026-11-21: RF-1b started, with the two general fix-now run bugs first; P1-o part 2 (CR chapters 2–10, Fable 5.2) started.*

*Revised 2026-11-21: "fix-now" is narrowed to bugs that skew the audit's checks and to visibility leaks; single-card misplays go to their area or PF-S3 (see Decisions for a human).*

*Revised 2026-11-21: P1-o part 2 done (engine #994, #995; Fable 5.2): CR chapters 2–8 and 10 read blind, 119 positions, 80 agree, 39 engine-wrong, 1 reader mistake corrected, none open in the CR, no disagreement for Nathaniel. Chapter 9 (89 examples), the rulings sample and the jinteki scenarios are left. Three findings meet the narrowed fix-now rule: R&D's access limit counting root upgrades (area 8), and two games that cannot go on (Boomerang, Adrian Seis). RF-1b part 1 shipped (engine #991, `v1.147.277`, game #327, meta #336); part 2 is in progress.*

*Revised 2026-11-21: RF-1b part 2 merged (engine #993, `v1.147.278`; pins in progress). FX-access started for the three new fix-now bugs; the six second-reader baseline entries are accepted.*

*Revised 2026-11-21: RF-1b done (engine #991, #993; `v1.147.277`, `v1.147.278`): resolved subroutines are no longer read as broken (shared helpers in `src/state/procedures/break.ts`), no subroutine resolves after an encounter ability ends the run, Apocalypse with Hostile Infrastructure does 3, Atman's spend is a choice, Test Run's return mark ends on reinstall. Most RF (fidelity) rows are now fixed or struck. Its nine leftovers are filed by area under the narrowed fix-now rule. Two new visibility fix-now rows (The Foundry, Architect) and one CR question (The Foundry's shuffle) wait for Nathaniel.*

*Revised 2026-11-21: FX-access done (engine #996, release `v1.147.279`, game #329, meta #342): R&D's random access limit counts only cards from the deck and Archives has no limit (7.3.5, 7.4.6d); the run ends after Boomerang's shuffle (6.9.6d); Adrian Seis plays one Psi Game and Hokusai Grid fires once (9.6.4b); deck searches always ask and may find nothing, hidden from the other seat, and The Foundry always shuffles (8.7.2e, 8.7.3); an unrezzed Architect can be trashed (1.8.3a). Second-reader tests 7.4.5.ex1, 10.1.5.ex2 and 10.14.3.ex1–ex2 pass; 7.4.7a.ex2 stays skipped for Strongbox (area 8). The game's log no longer tells a "None" search pick apart (game #329). Five leftovers filed by area; none meets the fix-now rule. The invariant baseline did not change (the chapter 10 `POSITION_OUT_OF_RANGE` entry has another cause).*

*Revised 2026-11-21: PF-S3a done (engine #997, release `v1.147.280`, paired cards #308, `v1.147.26`, game #330, meta #345): of the 22 wrong cards from sweeps S3a and S3b plus Burke Bugs, 15 fixed, 8 moved to their areas (5 with their own part fixed), none left for cut A. Ten leftovers filed by area; none meets the fix-now rule. P1-o part 3 continues on Fable 5.2: CR chapter 9 (engine #998) and the rulings sample (engine #999) merged.*

*Revised 2026-11-21: P1-o part 3 done on Fable 5.2 (engine #998, #999, #1000): batch 1 is complete (chapter 9: 104 positions, 90 agree, 14 engine-wrong); rulings sample, 27 cards: 39 agree, 13 engine-wrong, 1 open in the CR (Spin Doctor, decided: follow the CR); jinteki run scenarios, 20 of 51: 17 agree, 8 engine-wrong, all already found by P1-l. Eleven invariant baseline entries accepted. Fix-now: FX-window, before PF-S3b, for the stuck run after a paid interrupt and the re-asked "choose one" ability.*

*Revised 2026-11-21: FX-window done (engine #1001, release `v1.147.281`, game #331, meta #350): one shared cause fixed in the window procedure, so the run goes on after a paid interrupt on a subroutine's damage (9.2.4d) and a "choose one" encounter ability is asked once (9.12.3d); the run walk also stops for a tag window. The Cleaners is different code and stays in area 11. Five leftovers filed under area 11; none meets the fix-now rule. PF-S3b is next.*

*Revised 2026-11-21: PF-S3b done (engine #1002, #1003, releases `v1.147.282`, `v1.147.283`, paired cards #309 `v1.147.27`, game #332, meta #353): of 62 wrong cards from sweeps S3c and S3d, 52 fixed, 2 already fixed, 7 moved to their areas (6 with their own part fixed), 1 decided by Nathaniel (Medical Breakthrough: score areas only, PF-S3c). #1003 fixed a leak #1002 added (Subliminal Messaging's decline label). Fix-now: FX-view, before PF-S3c, for pending abilities in the seat view, Subliminal Messaging's offer and Record Reconstructor.*

*Revised 2026-11-21: FX-view done (engine #1004, release `v1.147.284`, game #333, meta #356): one seat filter for pending state (`seatPendingView`), private choices from facedown Archives cards, and Record Reconstructor offering only faceup cards. Two area 4 decisions recorded (the Subliminal pause, facedown pending abilities). PF-S3c is next.*

*Revised 2026-11-22: PF-S3c done (engine #1005, release `v1.147.285`, paired cards #310 `v1.147.28`, game #334, meta #359): of 70 wrong cards from sweeps S3e and S3f plus Medical Breakthrough, 51 fixed, 1 already fixed (The Foundry), 19 moved to their areas (7 with their own part fixed), none left for cut A. Medical Breakthrough counts only scored copies; Woodcutter, Tyrant and Salvage match. One invariant entry accepted. PF-S3d (S3g+S3h) is next.*

*Revised 2026-11-22: PF-S3d done (engine #1006, release `v1.147.286`, paired cards #311 `v1.147.29`, game #335, meta #362): of 39 wrong cards from sweeps S3g and S3h, 25 fixed, 3 already fixed, 11 moved to their areas (9 with their own part fixed), none left for cut A. Disposable HQ decided (the Corp orders). Work pauses for the weekly usage limit; after the reset: FX-expose, then PF-S3e with the second reader beside it.*
