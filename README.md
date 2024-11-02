# Version History

Note: OV denotes old or former version.

## v0.1.0 (Mistakenly tagged as v1.0)
- Release of Katalog-beta: Initial launch of the application.
- Import Functionality: Enabled the import of album information, including associated tracks and artist details, into the database.

## v0.1.1
- Artist Album Import: Introduced functionality to import an artist's albums.
- Streamlined Import Process: Consolidated the import process to a single button for user convenience.
- Rate Limiting Protection: Implemented timers for each importer to mitigate the risk of exceeding API rate limits.

## v0.1.2 (OV v0.2.0)
- Album Page Creation: Added an album page accessible via /album/:artistVanity/:trackVanity.
- Artist Page Creation: Introduced an artist page available at /artist/:artistVanity/.
- Lyrics Page Access: Established a lyrics page reachable at /lyrics/:artistVanity/:trackVanity.
- Admin URL Prefix: Lyrics can now be added via the admin prefix /katalog-admin/ (e.g., /katalog-admin/lyrics/:artistVanity/:trackVanity).
- Importer Page Relocation: Moved the importer page to /katalog-admin/importer/.
- Timer Functionality: Noted that timers may not function as intended.
- Enhanced Lyrics Page: Added additional information at the bottom of the lyrics page.

## v0.1.2a (OV v0.2.0.a)
- Homepage Development: Launched a homepage featuring a search function (note: CSS layout for search results is not yet optimized).
- Timer Fixes: Resolved timer issues; however, the importer must be refreshed to correct the timer on the Submit button due to React behavior.
- Last Modified Information: Added details about who last modified the lyrics.

## v0.1.2b (OV v0.2.1)
- Importer Page Update: Relocated the importer page to /katalog-admin/tools/importer.
- Artist Merger Tool: Introduced a tool for merging duplicate artist entries, accessible at /katalog-admin/tools/artist-merger.
- Track Album Display: Implemented a feature to display the albums associated with each track at the bottom of the page.
- Spotify Link Addition: Added a Spotify link to the artist pages.

## v0.1.3 (OV v0.3.0)
- Lyric Page Redirection Update: Modified redirection rules to utilize artistIds and trackIds instead of their vanities, rendering trackVanity currently obsolete.
- Admin View Toggle: Added a temporary button to toggle admin view in the menu bar.
- Admin Tools Page: Created an admin tools page accessible via the footer on the homepage.
- Font Size Toggler: Added functionality for font size adjustment in the lyrics page, currently commented out.
- Additional Album Information: Displayed other albums by the artist on their respective album pages.

## v0.1.4 (OV v0.4.0)
- Favicon Update: Updated the website's favicon.
- Instrumental Lyrics Marking: Added functionality to mark lyrics as instrumental.
- Track Merger Tool: Implemented a tool for merging duplicate track entries, accessible at /katalog-admin/tools/track-merger.
- ISRC Display Option: Introduced an option to view all ISRCs within track information.
- Disc Indicator: Added indicators for multi-disc albums in the album tracks page.

## v0.1.4a (OV v0.4.0a)
- Lyric Tag Bug Fix: Resolved an issue where lyric tags were not displaying correctly.

## v0.1.4b (OV v0.4.1)
- Language Detection for Lyrics: Integrated the DetectLanguage API to identify the language of new lyrics, which are saved to the database upon submission.

## v0.1.5 (OV v0.5.0)
- User Account Functionality: Enabled account creation and login capabilities for users.
- Access Token Requirement: Implemented access token requirements for updating lyrics, importing albums (admin), and merging artists and tracks (admin).
- Responsive Design: Enhanced support for smaller screen devices.

## v0.1.6 (OV v0.6.0)
- User Pages: Developed user pages allowing users to view their recent contributions.
- Point System Implementation: Introduced a points system, awarding 8 points for adding new lyrics and 5 points for editing/updating existing lyrics.
- Modification Attribution: Added links to the user pages of those who recently modified lyrics.
- Lyric Locking Feature: Admins can now lock lyrics to prevent direct edits by member accounts.

## v0.2.0
- Version Retagging: Retagged to follow a semantic three-part version numbering system.
- Instrumental Marking Points: Users now receive 2 points for marking a song as instrumental.
- Admin Tools for Lyrics: Administrators can now verify or delete member-made lyrics smoothly.
- Spotify Embeds: Integrated Spotify embeds into the lyrics page (ensure your Spotify Premium account is logged in to the browser for full functionality).
- Return to Vanity-Based URL: Restored the use of /lyrics/:artistVanity/:trackVanity for lyric page access.
- Toast and Modal Notifications: Converted all alerts to toast and modal notifications for improved user experience.
- User Contribution Visibility: Recent user contributions can now be seen on the user page, while all member contributions are visible on the home page for logged-in users.
- Album Categorization: Implemented proper categorization of albums, allowing users to filter by Singles, EPs, Albums, or view all options to enhance the user interface.
- Track Pagination: Added pagination for an artist's tracks in the track section, improving navigation and organization of content.