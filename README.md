# Version history

## v0.1.0 (mistagged as v1.0)

- Launched the Katalog-beta
- Added the ability to import album information, its tracks' information, its artist(s) information to the database

## v0.1.1

- Added the ability to import artist's albums
- Simplified the process of importing data in one button only
- Added timers for each importer to avoid the risk of being rate-limited

## v0.2.0

- Added lyrics page (accessible through /lyrics/:artistVanity/:trackVanity)
- You can add lyrics to the page through adding /katalog-admin/ before lyrics page URL (e.g. /katalog-admin/lyrics/:artistVanity/:trackVanity)
- Added artist page (accessible through /artist/:artistVanity/)
- Moved importer page to /katalog-admin/importer/
- Timers may not work as intended, but meh
- More information added at the bottom of lyrics page

## v0.2.0.a

- Added homepage with search function
- Timers fixed. The importer must be refreshed to fix the timer in Submit button (timers in React don't work as intended, or maybe I'm just lazy xD)