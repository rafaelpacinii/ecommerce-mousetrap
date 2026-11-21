# ADR 0006 — Static mouse artwork and native home scroll effects

- Accepted on 2026-11-21
- Supersedes [ADR 0004](0004-scroll-driven-homepage.md) for the runtime homepage.

The homepage uses a still render in each chapter and each discovery card.
The user's approved direction gives scroll motion to page elements such as
headings, product cards, and progress lines. Native CSS view timelines follow
document scrolling in both directions. Unsupported browsers and visitors who
prefer reduced motion receive the settled layout. Interactive elements settle
when focused. The frontend no longer needs a frame player or GSAP.

The brand section reads the existing public catalog facets. CSS moves two
identical cycles rightward and applies an edge mask. A size observer adjusts
the number of copies to keep the viewport covered. The original links are
exposed to assistive technology and keyboard focus. Tiles display uploaded
logos. Hover holds the current position and the reduced-motion preference
exposes the static list.

The authoring files and historical renders remain available locally. Angular
and the source archive ship the still artwork and exclude the retired frames.
Catalog filters, prices, stock, shopping, database and business rules keep
their existing contracts.
