# Version history

## v0.1.0 (mistagged as v1.0)

- Launched the Katalog-beta
- Added the ability to import album information, its tracks' information, its artist(s) information to the database

## v0.1.1

- Added the ability to import artist's albums
- Simplified the process of importing data in one button only
- Added timers for each importer to avoid the risk of being rate-limited

## v0.2.0

- Added album page, accessible through /album/:artistVanity/:trackVanity
- Added artist page, accessible through /artist/:artistVanity/
- Added lyrics page, accessible through /lyrics/:artistVanity/:trackVanity
- You can add lyrics to the page through adding /katalog-admin/ before lyrics page URL (e.g. /katalog-admin/lyrics/:artistVanity/:trackVanity)
- Moved importer page to /katalog-admin/importer/
- Timers may not work as intended, but meh
- More information added at the bottom of lyrics page

## v0.2.0.a

- Added homepage with search function (search results don't have proper CSS layout yet, but it works :D)
- Timers fixed. The importer must be refreshed to fix the timer in Submit button (timers in React don't work as intended, or maybe I'm just lazy xD)
- Added last modified by whom information

## v0.2.1

- Moved importer page to /katalog-admin/tools/importer
- Added artist merger for duplicate artist entries, accessible through /katalog-admin/tools/artist-merger
- Display what albums the track is listed on at the bottom of the page
- Added artist Spotify link to their artist page

## v0.3.0

- Changed redirection rules for lyric pages, it will use artistIds and trackIds instead of their vanities (this will leave trackVanity obsolete for now, but maybe it will soon be of use)
- Added temporary button to toggle admin view at the rightmost of the menu bar
- Added admin tools page, accessible by clicking the home page's footer
- Added font size toggler in lyrics, but commented out for now
- Add other albums of the artists in their album pages