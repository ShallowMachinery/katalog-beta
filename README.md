# Katalog

A music platform for managing lyrics, contributions, and artists.

## Overview

A music platform for managing lyrics, contributions, and artists, where users can contribute to song lyrics, manage their contributions, and view artist information, with features including user authentication and session handling, contribution tracking and display, user pointing system, and Spotify embed integration, providing a comprehensive and engaging experience for music enthusiasts.

## Features

### User Management and Contribution Tracking
- User account creation and login capabilities
- User profile picture update functionality
- User pages to view recent contributions
- Point system awarding points for adding new lyrics and editing/updating existing lyrics
- Modification attribution with links to user pages of recent modifiers
- Lyric locking feature for admins to prevent direct edits by member accounts
- Instrumental lyrics marking with point rewards and optional verification by admins

### Comprehensive Song Information
- Artist page with song discography, albums with categorization, and recent activities
- Track information editing for admins, including fetching track ISRC and adding track writers
- Enhanced track details with writer information and ISRC display option
- Admin-only features for track information management and verification
- Album categorization (Singles, EPs, Albums, or view all options)

### Lyrics Management
- Lyric page with Spotify embeds, font size toggler, where users can add or edit lyrics
- Advanced lyric tagging and language detection using DetectLanguage API
- Instrumental lyrics marking with point rewards and optional verification by admins
- Enhanced lyric locking and verification/deletion by admins with customizable permissions

### Search and Filtering
- Search function on homepage with responsive design
- Search filtering for artist song discography and duplicates resolver pages
- Robust search filtering for artist song discography and duplicates resolver pages

### User Interface
- Designed home page for enhanced user engagement and modern aesthetic
- Modernized log in and register pages with responsive layout and clear typography
- Implemented toast and modal notifications for improved user experience and feedback
- Enhanced font size toggler for lyrics page to accommodate diverse user needs
- App-wide dark mode for improved user experience

### Admin Tools
- Admin tools page with access to artist/album data importer from Spotify, artist and track merger, allowing administrators to:
  - Import album information, including associated tracks and artist details, from Spotify into the database
  - Merge duplicate artist entries to maintain data consistency
  - Merge duplicate track entries to maintain data consistency
    #### In lyrics editor page:
    - Manage and verify track information, including ISRC and writer details
    - Lock lyrics to prevent direct edits by member accounts
    - Verify or delete member-made lyrics smoothly

## Getting Started

To get started with Katalog, follow these steps:

### Prerequisites

* Node.js and npm installed
* PHP and Apache environment (e.g., XAMPP for local development)
* HTTPS support for Spotify embeds (e.g., using a self-signed certificate)
* Database setup (if applicable) via MySQL

### Installation

1. Clone the repository:

```bash
git clone https://github.com/ShallowMachinery/katalog-beta
cd katalog-beta
```

2. Install dependencies:

```bash
npm install
cd backend
composer install
```

3. If using Apache Web Server, please update the Document Root and the Directory in the config (`XAMPP-installation-folder/apache/conf/httpd.conf`) to the location where the web app is cloned. This is necessary for the backend files to work as intended.

For example:

```conf
DocumentRoot "C:/xampp/htdocs" ---> DocumentRoot "C:/path/to/where/katalog-beta/is"
```

```conf
<Directory "C:/xampp/htdocs">
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
</Directory>
```

   --->

```conf
<Directory "C:/path/to/where/katalog-beta/is">
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
</Directory>
```

4. Open up MySQL and import the database schema `sqldumpYYYYMMDDHHMM.sql` file in the project root.

5. Alternatively, you can use my own environment variables instead of creating new ones. However, if you prefer to use your own, create a `.env` file in the project root (please see the section below for more information on getting or generating API keys) and add the following keys:

```bash
REACT_APP_SPOTIFY_CLIENT_ID={your_spotify_client_id}
REACT_APP_SPOTIFY_CLIENT_SECRET={your_spotify_client_secret}
REACT_APP_SPOTIFY_REFRESH_TOKEN={your_spotify_refresh_token}
REACT_APP_DETECT_LANGUAGE_API_KEY={your_detectlanguage_api_key}
REACT_APP_YOUTUBE_API_KEY={your_youtube_api_key}
```

Also create a .env file in the backend directory and add the following keys:

```bash
JWT_SECRET_KEY={your_jwt_secret_key}
SERVERNAME={servername}
USERNAME={database_username}
PASSWORD={database_password}
```

6. Run the following commands in the project root:

```bash
npm start
```

## Usage Examples

### Adding New Lyrics

To add new lyrics, navigate to the lyrics page and click on the "Add lyrics" button. You can also add tags and mark the song as instrumental if applicable.

### Editing Existing Lyrics

To edit existing lyrics which is unverified by an administrator, navigate to the lyrics page and click on the "Edit lyrics" button. Make the necessary changes to the lyrics and click "Save" to update the changes.

### Searching for Songs

To search for songs, you can use the search bar in the menu bar to enter a song title, artist name, album name, or even part of the lyrics. You can then also filter the search results to show every result, or only selected categories (tracks, artists, albums, lyrics).

### Viewing Artist Information

To view artist information, navigate to the artist page and click on the artist's name. You can view their discography, recent user activities, and related artists.

### Using Admin Tools

To use admin tools, navigate to the admin tools page and click on the desired tool. You can import album information, merge duplicate artist entries, and more.

## API Documentation

### User Management
- login.php
- register.php
- user-info.php
- user-recent-contributions.php
- upload-profile-picture.php
- check-session.php

### Catalogue Viewing
- featured-artists.php
- album-info.php
- album-tracks.php
- artist-info.php
- artist-albums.php
- artist-tracks.php
- related-artists.php
- recent-artist-activity.php
- track-info.php
- track-lyrics.php
- get-track-albums.php
- get-track-artists.php
- verified-lyrics-info.php

### Lyrics Management
- update-lyrics.php
- verify-lyrics.php
- delete-lyrics.php

### Editor Functions
- editor-check-vanity.php
- editor-get-album-info.php
- editor-get-album-tracks.php
- editor-update-album-info.php
- delete-album.php
- editor-get-artist-info.php
- editor-update-artist-info.php
- editor-get-track-info.php
- editor-get-track-composers.php
- editor-get-composers.php
- editor-get-genres.php
- editor-update-track-info.php

### Admin Tools
- importAlbum.php
- timer.php
- get-duplicate-artists.php
- merge-artists.php
- get-duplicate-tracks.php
- merge-tracks.php

### Search and Reports
- search.php
- get-all-count.php
- get-database-reports.php
- recent-contributions.php

## Version History

Note: OV denotes old or former version.

### v0.1.0 (Mistakenly tagged as v1.0)
- Release of Katalog-beta: Initial launch of the application.
- Import Functionality: Enabled the import of album information, including associated tracks and artist details, into the database.

### v0.1.1
- Artist Album Import: Introduced functionality to import an artist's albums.
- Streamlined Import Process: Consolidated the import process to a single button for user convenience.
- Rate Limiting Protection: Implemented timers for each importer to mitigate the risk of exceeding API rate limits.

### v0.1.2 (OV v0.2.0)
- Album Page Creation: Added an album page accessible via /album/:artistVanity/:trackVanity.
- Artist Page Creation: Introduced an artist page available at /artist/:artistVanity/.
- Lyrics Page Access: Established a lyrics page reachable at /lyrics/:artistVanity/:trackVanity.
- Admin URL Prefix: Lyrics can now be added via the admin prefix /katalog-admin/ (e.g., /katalog-admin/lyrics/:artistVanity/:trackVanity).
- Importer Page Relocation: Moved the importer page to /katalog-admin/importer/.
- Timer Functionality: Noted that timers may not function as intended.
- Enhanced Lyrics Page: Added additional information at the bottom of the lyrics page.

### v0.1.2a (OV v0.2.0.a)
- Homepage Development: Launched a homepage featuring a search function (note: CSS layout for search results is not yet optimized).
- Timer Fixes: Resolved timer issues; however, the importer must be refreshed to correct the timer on the Submit button due to React behavior.
- Last Modified Information: Added details about who last modified the lyrics.

### v0.1.2b (OV v0.2.1)
- Importer Page Update: Relocated the importer page to /katalog-admin/tools/importer.
- Artist Merger Tool: Introduced a tool for merging duplicate artist entries, accessible at /katalog-admin/tools/artist-merger.
- Track Album Display: Implemented a feature to display the albums associated with each track at the bottom of the page.
- Spotify Link Addition: Added a Spotify link to the artist pages.

### v0.1.3 (OV v0.3.0)
- Lyric Page Redirection Update: Modified redirection rules to utilize artistIds and trackIds instead of their vanities, rendering trackVanity currently obsolete.
- Admin View Toggle: Added a temporary button to toggle admin view in the menu bar.
- Admin Tools Page: Created an admin tools page accessible via the footer on the homepage.
- Font Size Toggler: Added functionality for font size adjustment in the lyrics page, currently commented out.
- Additional Album Information: Displayed other albums by the artist on their respective album pages.

### v0.1.4 (OV v0.4.0)
- Favicon Update: Updated the website's favicon.
- Instrumental Lyrics Marking: Added functionality to mark lyrics as instrumental.
- Track Merger Tool: Implemented a tool for merging duplicate track entries, accessible at /katalog-admin/tools/track-merger.
- ISRC Display Option: Introduced an option to view all ISRCs within track information.
- Disc Indicator: Added indicators for multi-disc albums in the album tracks page.

### v0.1.4a (OV v0.4.0a)
- Lyric Tag Bug Fix: Resolved an issue where lyric tags were not displaying correctly.

### v0.1.4b (OV v0.4.1)
- Language Detection for Lyrics: Integrated the DetectLanguage API to identify the language of new lyrics, which are saved to the database upon submission.

### v0.1.5 (OV v0.5.0)
- User Account Functionality: Enabled account creation and login capabilities for users.
- Access Token Requirement: Implemented access token requirements for updating lyrics, importing albums (admin), and merging artists and tracks (admin).
- Responsive Design: Enhanced support for smaller screen devices.

### v0.1.6 (OV v0.6.0)
- User Pages: Developed user pages allowing users to view their recent contributions.
- Point System Implementation: Introduced a points system, awarding 8 points for adding new lyrics and 5 points for editing/updating existing lyrics.
- Modification Attribution: Added links to the user pages of those who recently modified lyrics.
- Lyric Locking Feature: Admins can now lock lyrics to prevent direct edits by member accounts.

### v0.2.0
- Version Retagging: Retagged to follow a semantic three-part version numbering system.
- Instrumental Marking Points: Users now receive 2 points for marking a song as instrumental.
- Admin Tools for Lyrics: Administrators can now verify or delete member-made lyrics smoothly.
- Spotify Embeds: Integrated Spotify embeds into the lyrics page (ensure your Spotify Premium account is logged in to the browser for full functionality).
- Return to Vanity-Based URL: Restored the use of /lyrics/:artistVanity/:trackVanity for lyric page access.
- Toast and Modal Notifications: Converted all alerts to toast and modal notifications for improved user experience.
- User Contribution Visibility: Recent user contributions can now be seen on the user page, while all member contributions are visible on the home page for logged-in users.
- Album Categorization: Implemented proper categorization of albums, allowing users to filter by Singles, EPs, Albums, or view all options to enhance the user interface.
- Track Pagination: Added pagination for an artist's tracks in the track section, improving navigation and organization of content.

### v0.2.0a
- Artist Page Rearrangement: Songs are now displayed before albums, and users' recent activities for that artist are shown.
- Lyric Page Layout Rearrangement: The Spotify embed is now floating at the bottom of the screen, writers' information has been added to the more information section, and a font size toggler has been implemented.
- Profile Picture Update: Users can now change their profile pictures on localhost devices.
- Tag Suggestions: Tag suggestions are now provided when '@' is inputted in the text area.
- Track Information Editing: Users can now edit track information.

### v0.2.1
- Enhanced profile picture update functionality for non-localhost devices with clear documentation.
- Implemented robust search filtering for artist song discography and duplicates resolver pages.
- Introduced app-wide dark mode for improved user experience.
- Redesigned home page for better user engagement.
- Updated log in and register pages with modern layout.
- Conducted thorough code cleanup for improved maintainability.
- Improved version history documentation for better readability and organization.
- Added clear headings and sections for each version.
- Reformatted version history for consistency and clarity.

### v0.2.2
- Added database reports to check what tracks, albums, and artists have issues, with a dedicated button to redirect to their editor and additional filtering options for improved usability.
- Modified the track editor page, adding track_vanity to also edit their link.
- Improved the loading spinner animation.
- Revamped the more information section on the lyrics page.
- Enhanced database functionality to include a video key for displaying YouTube embeds in the lyric page.

### v0.2.2a
- Added a constraint to the register page to prevent usernames from consisting only of numbers.

## Getting API Keys

### Spotify API License

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/) and create an account if you haven't already.
2. Click on "Create an App" and fill in the required information.
3. Go to the "Edit Settings" page and click on "Show Client Secret" to obtain your Client ID and Client Secret.
4. You will also need to obtain a Refresh Token, which can be done by following the instructions in the [Spotify API documentation](https://developer.spotify.com/documentation/general/guides/authorization-guide/).

### DetectLanguage API Key

1. Go to the [DetectLanguage API website](https://detectlanguage.com/) and sign up for an account.
2. Click on "Get API Key" and fill in the required information.
3. You will receive an API key via email, which you can use to make API requests.

### YouTube API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a new project.
2. Click on "Enable APIs and Services" and search for the YouTube Data API.
3. Click on "Enable" and follow the instructions to create credentials for your project.
4. You will receive an API key, which you can use to make API requests.

## Acknowledgements

### Contributors
- [Eleazar James Galope](https://purrfolio.vercel.app) - Creator and maintainer of Katalog

### Libraries and Resources Used
- [Spotify Web API](https://developer.spotify.com/documentation/web-api/) - Used for fetching artist and track information
- [DetectLanguage API](https://detectlanguage.com/) - Used for detecting the language of lyrics
- [YouTube Data API](https://developers.google.com/youtube/v3) - Used for fetching video information
- [React](https://reactjs.org/) - Used for building the user interface
- [Node.js](https://nodejs.org/) - Used for building the server-side application
- [MySQL](https://www.mysql.com/) - Used for storing and retrieving data
- [PHP](https://www.php.net/) - Used as backend for server-side scripting
