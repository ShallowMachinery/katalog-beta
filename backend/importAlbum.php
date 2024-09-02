<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$servername = "127.0.0.1";
$username = "root";
$password = "";
$dbname = "katalog";
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}

// Generating the vanity URL
function generateVanityUrl($conn, $table, $column, $name, $primaryArtistSpotifyId, $entityType)
{
    $vanity = preg_replace('/[^\w]+/', '-', strtolower($name));
    $vanity = trim($vanity, '-');
    $originalVanity = $vanity;
    $suffix = 1;

    do {
        if ($entityType === 'album') {
            $stmt = $conn->prepare("
                SELECT COUNT(*)
                FROM $table a
                JOIN Album_Artists aa ON a.album_spotify_id = aa.album_spotify_id
                WHERE a.$column = ? AND aa.artist_spotify_id = ? AND aa.artist_role = 'Primary'
            ");
        } elseif ($entityType === 'track') {
            $stmt = $conn->prepare("
                SELECT COUNT(*)
                FROM $table t
                JOIN Track_Artists ta ON t.track_id = ta.track_id
                WHERE t.$column = ? AND ta.artist_spotify_id = ? AND ta.artist_role = 'Primary'
            ");
        } else {
            throw new Exception("Unknown entity type: $entityType");
        }

        $stmt->bind_param("ss", $vanity, $primaryArtistSpotifyId);
        $stmt->execute();
        $stmt->bind_result($count);
        $stmt->fetch();
        $stmt->close();

        if ($count > 0) {
            // Append a suffix if there's a conflict
            $vanity = $originalVanity . '-' . $suffix++;
        } else {
            break;
        }
    } while (true);

    return $vanity;
}

function generateArtistVanityUrl($conn, $name)
{
    $vanity = preg_replace('/[^\w]+/', '-', strtolower($name));
    $vanity = trim($vanity, '-');
    $originalVanity = $vanity;
    $suffix = 1;
    do {
        $stmt = $conn->prepare("SELECT COUNT(*) FROM Artists WHERE artist_vanity = ?");
        $stmt->bind_param("s", $vanity);
        $stmt->execute();
        $stmt->bind_result($count);
        $stmt->fetch();
        $stmt->close();
        if ($count > 0) {
            $vanity = $originalVanity . '-' . $suffix++;
        } else {
            break;
        }
    } while (true);
    return $vanity;
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $albumSpotifyId = $data['album_id'];

    // Checking if the loaded album info is already existing
    // in the database using the album's Spotify ID
    $stmt = $conn->prepare("SELECT album_spotify_id FROM Albums WHERE album_spotify_id = ?");
    $stmt->bind_param("s", $albumSpotifyId);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows > 0) {
        $stmt->close();
        echo json_encode(['status' => 'error', 'message' => 'Album already exists in the database.']);
        $conn->close();
        exit;
    }
    $stmt->close();

    // If it doesn't exist, the backend gets the album information
    $albumName = $data['album_name'];
    $albumReleaseDate = $data['album_release_date'];
    $albumReleaseType = $data['album_release_type'];
    $albumDuration = $data['album_duration'];
    $albumLabel = $data['album_label'];
    $albumTrackCount = $data['album_track_count'];
    $albumDiscsCount = $data['album_discs_count'];
    $albumCoverUrl = !empty($data['album_cover_url']) ? $data['album_cover_url'] : '';
    $contributorId = 1; // Administrator's ID
    $albumArtists = $data['album_artists'];
    $primaryAlbumArtistSpotifyId = $data['album_artists'][0]['album_artist_id'];
    $albumTracks = $data['album_tracks'];
    $albumVanity = generateVanityUrl($conn, 'Albums', 'album_vanity', $albumName, $primaryAlbumArtistSpotifyId, 'album');

    // If the Spotify API only returns year of the album's release date,
    // concatenate January 1st
    if (preg_match('/^\d{4}$/', $albumReleaseDate)) {
        $albumReleaseDate .= '-01-01';
    }

    $conn->begin_transaction();

    try {
        // SQL query to add the album to the Albums table
        $stmt = $conn->prepare("INSERT INTO Albums (album_spotify_id, album_name, album_vanity, release_date, release_type, tracks_count, discs_count, album_cover_url, duration, label_name, contributor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sssssiisssi", $albumSpotifyId, $albumName, $albumVanity, $albumReleaseDate, $albumReleaseType, $albumTrackCount, $albumDiscsCount, $albumCoverUrl, $albumDuration, $albumLabel, $contributorId);
        if (!$stmt->execute())
            throw new Exception($stmt->error);
        $stmt->close();

        // Getting the information of the album artist(s)
        foreach ($albumArtists as $albumArtistIndex => $albumArtist) {
            // Check if the album artist already exists in the Artists table
            $albumArtistSpotifyId = $albumArtist['album_artist_id'];
            $artistPictureUrl = !empty($albumArtist['artist_picture_url']) ? $albumArtist['artist_picture_url'] : null;
            $stmt = $conn->prepare("SELECT COUNT(*) FROM artists WHERE artist_spotify_id = ?");
            $stmt->bind_param("s", $albumArtistSpotifyId);
            $stmt->execute();
            $stmt->bind_result($count);
            $stmt->fetch();
            $stmt->close();
            if ($count > 0)
            // If the artist to be added to the database already exists
            // Add this artist's details into the following table:
            // Album_Artists, Artists (only update the artist_picture_link column)
            {
                // SQL query to add the artist(s) to the Album Artists table under their respective album
                $albumArtistRole = ($albumArtistIndex === 0) ? "Primary" : "Featuring";
                $stmt = $conn->prepare("INSERT INTO Album_Artists (album_spotify_id, artist_spotify_id, artist_role) VALUES (?, ?, ?)");
                $stmt->bind_param("sss", $albumSpotifyId, $albumArtistSpotifyId, $albumArtistRole);
                if (!$stmt->execute())
                    throw new Exception($stmt->error);
                $stmt->close();

                // SQL query to update the artist picture
                if ($artistPictureUrl != null) {
                    $stmt = $conn->prepare("UPDATE Artists SET artist_picture_link = ? WHERE artist_spotify_id = ?");
                    $stmt->bind_param("ss", $artistPictureUrl, $albumArtistSpotifyId);
                    if (!$stmt->execute()) {
                        throw new Exception($stmt->error);
                    }
                    $stmt->close();
                }
            } else
            // If the album artist doesn't exist, add to these tables:
            // Artists, Album_Artists
            {
                $albumArtistName = $albumArtist['album_artist_name'];
                $artistType = ''; // Only values are "Solo" for individual musicians or "Group" for bands, girl or boy groups
                $artistVanity = generateArtistVanityUrl($conn, $albumArtistName);

                // SQL query to add the artist(s) to the Artists table
                $stmt = $conn->prepare("
                        INSERT INTO Artists (artist_spotify_id, artist_name, artist_type, artist_vanity, artist_picture_link, contributor_id)
                        VALUES (?, ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE
                            artist_name = VALUES(artist_name),
                            artist_type = VALUES(artist_type),
                            artist_vanity = VALUES(artist_vanity),
                            artist_picture_link = VALUES(artist_picture_link)
                    ");
                $stmt->bind_param("sssssi", $albumArtistSpotifyId, $albumArtistName, $artistType, $artistVanity, $artistPictureUrl, $contributorId);
                if (!$stmt->execute())
                    throw new Exception($stmt->error);
                $stmt->close();

                // SQL query to add the artist(s) to the Album Artists table under their respective album
                $albumArtistRole = ($albumArtistIndex === 0) ? "Primary" : "Featuring";
                $stmt = $conn->prepare("INSERT INTO Album_Artists (album_spotify_id, artist_spotify_id, artist_role) VALUES (?, ?, ?)");
                $stmt->bind_param("sss", $albumSpotifyId, $albumArtistSpotifyId, $albumArtistRole);
                if (!$stmt->execute())
                    throw new Exception($stmt->error);
                $stmt->close();
            }
        }

        // Getting the information of the album track(s)
        foreach ($albumTracks as $albumTrackIndex => $albumTrack) {
            $trackSpotifyId = $albumTrack['track_id'];
            $trackName = $albumTrack['track_name'];
            $trackDuration = $albumTrack['track_duration'];
            $trackExplicit = $albumTrack['explicit'];
            $trackNumber = $albumTrack['track_number'];
            $trackDiscNumber = $albumTrack['disc_number'];
            $primaryArtistSpotifyId = $albumTrack['track_artists'][0]['track_artist_id'];
            $trackISRC = $albumTrack['isrc'];
            $trackUPC = $albumTrack['upc'];
            $trackEAN = $albumTrack['ean'];

            // Checking if the track already exists based on name, artist, duration, and explicitness,
            // if the track already exists, it will get the Track ID
            $stmt = $conn->prepare("
                    SELECT COUNT(*), t.track_id 
                    FROM Tracks t 
                    JOIN Track_Artists ta ON t.track_id = ta.track_id
                    JOIN Artists a ON ta.artist_spotify_id = a.artist_spotify_id
                    WHERE t.track_name = ? 
                    AND t.duration = ? 
                    AND t.explicit = ? 
                    AND a.artist_name = ?
                ");
            $trackArtistName = $albumTrack['track_artists'][0]['track_artist_name'];  // Assuming the first artist is the primary artist
            $stmt->bind_param("ssis", $trackName, $trackDuration, $trackExplicit, $trackArtistName);
            $stmt->execute();
            $stmt->bind_result($count, $existingTrackId);
            $stmt->fetch();
            $stmt->close();
            // If the track to be added to the database already exists
            // Add this track's details into the following tables:
            // Track_Albums, Track_External_IDs, Track_Spotify_IDs
            if ($count > 0) {
                $trackId = $existingTrackId;
                // Add the album ID of this new track to the Track Albums table
                // if the track already exists, meaning this track is found in multiple albums
                $stmt = $conn->prepare("INSERT INTO Track_Albums (track_id, album_spotify_id, track_number) VALUES (?, ?, ?)");
                $stmt->bind_param("isi", $trackId, $albumSpotifyId, $trackNumber);
                if (!$stmt->execute())
                    throw new Exception($stmt->error);
                $stmt->close();

                // Add new Spotify Track's ISRC, UPC, EAN to the Track External IDs table
                // if the track already exists
                $stmt = $conn->prepare("INSERT IGNORE INTO Track_External_IDs (track_id, isrc, upc, ean) VALUES (?, ?, ?, ?)");
                $stmt->bind_param("isss", $trackId, $trackISRC, $trackUPC, $trackEAN);
                if (!$stmt->execute())
                    throw new Exception($stmt->error);
                $stmt->close();

                // Add new Spotify Track ID (always unique) to the Track Spotify IDs table
                // if the track already exists
                $stmt = $conn->prepare("INSERT INTO Track_Spotify_IDs (track_id, track_spotify_id) VALUES (?, ?)");
                $stmt->bind_param("is", $trackId, $trackSpotifyId);
                if (!$stmt->execute())
                    throw new Exception($stmt->error);
                $stmt->close();
            } else
            // This new track does not exist, add this track's details into the following tables:
            // Tracks, Track_Albums, Track_Genres, Track_Composers,
            // Track_Lyrics, Track_External_IDs, Track_Spotify_IDs, Track_Artists
            {
                // Add new track to the Tracks table
                $trackVanity = generateVanityUrl($conn, 'Tracks', 'track_vanity', $trackName, $primaryArtistSpotifyId, 'track');
                $stmt = $conn->prepare("INSERT INTO Tracks (track_name, track_vanity, track_number, disc_number, explicit, duration, contributor_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmt->bind_param("ssiissi", $trackName, $trackVanity, $trackNumber, $trackDiscNumber, $trackExplicit, $trackDuration, $contributorId);
                if (!$stmt->execute())
                    throw new Exception($stmt->error);
                $trackId = $stmt->insert_id;
                $stmt->close();

                // Add the album ID of this new track to the Track Albums table
                $stmt = $conn->prepare("INSERT INTO Track_Albums (track_id, album_spotify_id, track_number) VALUES (?, ?, ?)");
                $stmt->bind_param("isi", $trackId, $albumSpotifyId, $trackNumber);
                if (!$stmt->execute())
                    throw new Exception($stmt->error);
                $stmt->close();

                // Add new row for this release in the Track Genres table
                $trackGenreId = 1; // Default Genre ID
                $stmt = $conn->prepare("INSERT INTO Track_Genres (track_id, genre_id) VALUES (?, ?)");
                $stmt->bind_param("ii", $trackId, $trackGenreId);
                if (!$stmt->execute())
                    throw new Exception($stmt->error);
                $stmt->close();

                // Add new row for this release in the Track Composers table
                $trackComposerId = 1; // Default Composer ID
                $stmt = $conn->prepare("INSERT INTO Track_Composers (track_id, composer_id) VALUES (?, ?)");
                $stmt->bind_param("ii", $trackId, $trackComposerId);
                if (!$stmt->execute())
                    throw new Exception($stmt->error);
                $stmt->close();

                // Add new row for this release in the Track Lyrics table
                $trackLyrics = '';
                $stmt = $conn->prepare("INSERT INTO Track_Lyrics (track_id, lyrics, last_contributor_id) VALUES (?, ?, ?)");
                $stmt->bind_param("isi", $trackId, $trackLyrics, $contributorId);
                if (!$stmt->execute())
                    throw new Exception($stmt->error);
                $stmt->close();

                // Add new row for this release in the Track External IDs table
                $stmt = $conn->prepare("INSERT INTO Track_External_IDs (track_id, isrc, upc, ean) VALUES (?, ?, ?, ?)");
                $stmt->bind_param("isss", $trackId, $trackISRC, $trackUPC, $trackEAN);
                if (!$stmt->execute())
                    throw new Exception($stmt->error);
                $stmt->close();

                // Add new row for this release in the Track Spotify IDs table
                $stmt = $conn->prepare("INSERT INTO Track_Spotify_IDs (track_id, track_spotify_id) VALUES (?, ?)");
                $stmt->bind_param("is", $trackId, $trackSpotifyId);
                if (!$stmt->execute())
                    throw new Exception($stmt->error);
                $stmt->close();

                // Handle track artists
                $trackArtists = $albumTrack['track_artists'];
                foreach ($trackArtists as $trackArtistIndex => $trackArtist) {
                    $trackArtistSpotifyId = $trackArtist['track_artist_id'];
                    $trackArtistPictureUrl = !empty($trackArtist['track_artist_picture_url']) ? $trackArtist['track_artist_picture_url'] : null;
                    // Check if the track artist already exists in the Artists table
                    $stmt = $conn->prepare("SELECT COUNT(*) FROM artists WHERE artist_spotify_id = ?");
                    $stmt->bind_param("s", $trackArtistSpotifyId);
                    $stmt->execute();
                    $stmt->bind_result($count);
                    $stmt->fetch();
                    $stmt->close();
                    if ($count > 0)
                    // If the track artist already exists in the Artists table, add to this table:
                    // Track_Artists, Artists (only update the artist_picture_link column)
                    {
                        // SQL query to add the artist(s) to the Track Artists table
                        $trackArtistRole = ($trackArtistIndex === 0) ? "Primary" : "Featuring";
                        $stmt = $conn->prepare("INSERT INTO Track_Artists (track_id, artist_spotify_id, artist_role) VALUES (?, ?, ?)");
                        $stmt->bind_param("iss", $trackId, $trackArtistSpotifyId, $trackArtistRole);
                        if (!$stmt->execute())
                            throw new Exception($stmt->error);
                        $stmt->close();

                        // SQL query to update the artist picture
                        if ($trackArtistPictureUrl != null) {
                            $stmt = $conn->prepare("UPDATE Artists SET artist_picture_link = ? WHERE artist_spotify_id = ?");
                            $stmt->bind_param("ss", $trackArtistPictureUrl, $trackArtistSpotifyId);
                            if (!$stmt->execute()) {
                                throw new Exception($stmt->error);
                            }
                            $stmt->close();
                        }
                    } else
                    // If the track artist doesn't exist, add to these tables:
                    // Artists, Track_Artists
                    {
                        $trackArtistName = $trackArtist['track_artist_name'];
                        $trackArtistVanity = generateArtistVanityUrl($conn, $trackArtistName);

                        // Add to Artists table
                        $stmt = $conn->prepare("
                            INSERT INTO Artists (artist_spotify_id, artist_name, artist_type, artist_vanity, artist_picture_link, contributor_id)
                            VALUES (?, ?, ?, ?, ?, ?)
                            ON DUPLICATE KEY UPDATE
                                artist_name = VALUES(artist_name),
                                artist_type = VALUES(artist_type),
                                artist_vanity = VALUES(artist_vanity),
                                artist_picture_link = VALUES(artist_picture_link)
                        ");
                        $stmt->bind_param("sssssi", $trackArtistSpotifyId, $trackArtistName, $artistType, $trackArtistVanity, $trackArtistPictureUrl, $contributorId);
                        if (!$stmt->execute())
                            throw new Exception($stmt->error);
                        $stmt->close();

                        // SQL query to add the artist(s) to the Track Artists table
                        $trackArtistRole = ($trackArtistIndex === 0) ? "Primary" : "Featuring";
                        $stmt = $conn->prepare("INSERT INTO Track_Artists (track_id, artist_spotify_id, artist_role) VALUES (?, ?, ?)");
                        $stmt->bind_param("iss", $trackId, $trackArtistSpotifyId, $trackArtistRole);
                        if (!$stmt->execute())
                            throw new Exception($stmt->error);
                        $stmt->close();
                    }
                }
            }
        }
        $conn->commit();
        echo json_encode(['status' => 'success', 'message' => 'Album and its details have been successfully added to the database.']);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    $conn->close();
}
?>