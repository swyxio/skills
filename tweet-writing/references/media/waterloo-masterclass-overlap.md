# waterloo-masterclass-overlap.jpg

Kernel-scheduling diagram from the Baseten masterclass thread (60 replies · 110 reposts · 1.6K likes · 534K views).

- **Top panel:** four CTAs (CTA 0, CTA 1, CTA 2 (STRAGGLER), CTA 3). The next kernel waits on the straggler, so the timeline ends late at a red "end" line. Label: "PDL (overlapping non-dependent kernel execution) bottlenecked by straggling CTA"
- **Bottom panel:** the same CTAs, with the dependent work starting as soon as each CTA's own data dependency is met. It ends earlier at a green "end" line, marked "time saved". The label is repeated as in the image.
- **Legend:** a dotted line means "Data Dependency"
