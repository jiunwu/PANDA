# Funding logos (EXIST / BMWE / ESF Plus)

Source: the official German RGB funding logo bar published by EXIST,
`BMWE_Logoleiste_ESFplusEXIST_RGB_Foerder_DE.svg`
(https://exist.de/downloads/).

The three marks in this folder were cut out of that single file, so the
relative proportions and the exact brand colours of the approved lockup are
preserved. Nothing was redrawn: only the white backing rectangle, the German
caption text and the unused CSS classes were dropped, and the `mix-blend-mode`
hints were removed so the marks composite normally on a light background.

| File | Mark |
| --- | --- |
| `bmwe.svg` | Bundesministerium für Wirtschaft und Energie |
| `eu-cofunded.svg` | Kofinanziert von der Europäischen Union |
| `exist.svg` | EXIST – from science to business |

Handbuch requirements these satisfy (section 5.2, "Logo und Publizitätspflicht
während der Laufzeit"):

- the order BMWE → EU → EXIST,
- "Gefördert durch:" above the marks and "aufgrund eines Beschlusses des
  Deutschen Bundestages" below them,
- the Förderhinweis naming the project.

The caption text is set in the site's own typeface in `src/app/page.js`
rather than baked into the artwork, so it stays legible and translatable. Keep
the marks in their original colours on a light, uncoloured backing — the
`.lp-funding` panel in `src/app/landing.css` is white for that reason.
