<!-- Why Typed Config -->
<!-- Summary: Draft article arguing that a typed config class is clearer, safer, and easier to maintain than the REFramework dictionary. -->
[//]: # (Why Typed Config)

<!--
DRAFT

## The advantages of the typed config

Every config setting is named and typed. Autocompletion guides you, Verify Project
catches mistakes before the robot runs. No casts, no string keys, no guessing.
The config object is self-documenting — navigate every section, every setting,
with more granularity than ever. Ship with confidence instead of hoping.

## The problem with the Config dictionary

Runtime surprises are the norm: misspell a key and it silently returns Nothing.
Every property access demands a cast — `.ToString()`, `CBool()`, `CInt()` — and
DateTime is simply no fun to use at all. The dictionary accepts any string key at
compile time, so typos are invisible until the robot crashes in production.
No IntelliSense, no type safety, no structure. The REFramework config dictionary
has stagnated for nearly a decade. The developer must memorize internal key names
and trust that whoever built Config.xlsx used the exact same spelling.

-->
