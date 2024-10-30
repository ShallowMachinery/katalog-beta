<?php
require 'config.php'; 
require 'vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;

$response = array('status' => 'error', 'message' => '');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$headers = apache_request_headers();
$accessToken = $headers['Authorization'] ?? '';

try {
    if (strpos($accessToken, 'Bearer ') === 0) {
        $accessToken = substr($accessToken, 7);
    }
    $key = new Key($secretKey, 'HS256');
    $decoded = JWT::decode($accessToken, $key);
    if (!isset($decoded->data->user_id) || !isset($decoded->data->user_hierarchy)) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid token structure.']);
        exit;
    }
    if ($decoded->data->user_hierarchy !== 1) {
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized access.']);
        exit;
    }
} catch (ExpiredException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Access token has expired.']);
    exit;
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid access token.']);
    exit;
}



function generateArtistVanityUrl($conn, $name)
{
    $count = 0;
    $vanity = preg_replace('/[^\p{L}\p{N}]+/u', '-', $name);
    $vanity = trim($vanity, '-');
    $originalVanity = $vanity;
    $suffix = 1;
    do {
        $stmt = $conn->prepare("SELECT COUNT(*) FROM `Artists` WHERE `artist_vanity` = ?");
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

function generateVanityUrl($conn, $name, $artistId, $entityType)
{
    $count = 0;
    $vanity = preg_replace('/[^\p{L}\p{N}]+/u', '-', $name);
    $vanity = trim($vanity, '-');
    $originalVanity = $vanity;
    $suffix = 1;

    do {
        if ($entityType === 'album') {
            $stmt = $conn->prepare("
                SELECT COUNT(*)
                FROM `Albums` a
                JOIN `Album_Artists` aa ON a.`album_id` = aa.`album_id`
                WHERE a.`album_vanity` = ? AND aa.`artist_id` = ?
            ");
        } elseif ($entityType === 'track') {
            $stmt = $conn->prepare("
                SELECT COUNT(*)
                FROM `Tracks` t
                JOIN `Track_Artists` ta ON t.`track_id` = ta.`track_id`
                WHERE t.`track_vanity` = ? AND ta.`artist_id` = ?
            ");
        } else {
            throw new Exception("Unknown entity type: $entityType");
        }

        $stmt->bind_param("ss", $vanity, $artistId);
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

function checkAlbumIfAlreadyExists($conn, $albumSpotifyId)
{
    $stmt = $conn->prepare("SELECT `album_spotify_id` FROM `Albums` WHERE `album_spotify_id` = ?");
    $stmt->bind_param("s", $albumSpotifyId);
    $stmt->execute();
    $stmt->store_result();
    $exists = $stmt->num_rows > 0;
    $stmt->close();

    return $exists;
}

function processAlbumArtists($conn, $albumArtists)
{
    $albumArtistId = null;
    // If there is one album artist
    if (count($albumArtists) === 1) {
        $albumArtistId = checkAlbumArtistIfExistsInArtists($conn, $albumArtists[0]);
    } else if (count($albumArtists) > 1) {
        // Combining album artist names
        $albumArtistNames = [];
        foreach ($albumArtists as $albumArtist) {
            $albumArtistNames[] = $albumArtist['album_artist_name']; // Add each artist's name to the array
        }
        $combinedAlbumArtistNames = implode(", ", $albumArtistNames);
        $combinedAlbumArtistVanity = generateArtistVanityUrl($conn, $combinedAlbumArtistNames);
        $albumArtistId = checkCombinedAlbumArtistsIfExistsInArtists($conn, $combinedAlbumArtistNames, $combinedAlbumArtistVanity);
    }

    return $albumArtistId;
}

function checkAlbumArtistIfExistsInArtists($conn, $albumArtist)
{
    $albumArtistSpotifyId = $albumArtist['album_artist_id'];
    $albumArtistId = null;

    // Check if there is existing album artist with the Spotify ID
    $stmt = $conn->prepare("SELECT `artist_id` FROM `Artists` WHERE `artist_spotify_id` = ?");
    $stmt->bind_param("s", $albumArtistSpotifyId);
    $stmt->execute();
    $stmt->bind_result($albumArtistId);
    $stmt->fetch();
    $stmt->close();

    if (is_null($albumArtistId)) {
        $albumArtistId = addSingleAlbumArtistToArtistTable($conn, $albumArtist);
    } else {
        updateAlbumArtistToArtistTable($conn, $albumArtist, $albumArtistId);
    }

    return $albumArtistId;
}
function addSingleAlbumArtistToArtistTable($conn, $albumArtist)
{
    $albumArtistSpotifyId = $albumArtist['album_artist_id'];
    $albumArtistName = $albumArtist['album_artist_name'];
    $albumArtistType = null;
    $albumArtistVanity = generateArtistVanityUrl($conn, $albumArtistName);
    $albumArtistPictureUrl = $albumArtist['artist_picture_url'];
    $contributorId = 1;

    $stmt = $conn->prepare("
            INSERT INTO `Artists` (`artist_spotify_id`, `artist_name`, `artist_type`, `artist_vanity`, `artist_picture_link`, `contributor_id`) VALUES (?, ?, ?, ?, ?, ?)
        ");
    $stmt->bind_param("sssssi", $albumArtistSpotifyId, $albumArtistName, $albumArtistType, $albumArtistVanity, $albumArtistPictureUrl, $contributorId);
    if (!$stmt->execute()) {
        throw new Exception($stmt->error);
    }
    $albumArtistId = $conn->insert_id;
    $stmt->close();

    return $albumArtistId;
}

function updateAlbumArtistToArtistTable($conn, $albumArtist, $albumArtistId) {
    $albumArtistName = $albumArtist['album_artist_name'];
    $albumArtistPictureUrl = $albumArtist['artist_picture_url'];

    $stmt = $conn->prepare("UPDATE `Artists` SET `artist_name` = ?, `artist_picture_link` = ? WHERE `artist_id` = ?");
    $stmt->bind_param("ssi", $albumArtistName, $albumArtistPictureUrl, $albumArtistId);
    if (!$stmt->execute()) {
        throw new Exception($stmt->error);
    }
    $stmt->close();

}
function checkCombinedAlbumArtistsIfExistsInArtists($conn, $combinedAlbumArtistNames, $combinedAlbumArtistVanity)
{
    $albumArtistId = null;
    $stmt = $conn->prepare("SELECT `artist_id` FROM `Artists` WHERE `artist_vanity` = ?");
    $stmt->bind_param("s", $combinedAlbumArtistVanity);
    $stmt->execute();
    $stmt->bind_result($albumArtistId);
    $stmt->fetch();
    $stmt->close();

    if (is_null($albumArtistId)) {
        $albumArtistId = addCombinedAlbumArtistsToArtistTable($conn, $combinedAlbumArtistNames, $combinedAlbumArtistVanity);
    }

    return $albumArtistId;
}

function addCombinedAlbumArtistsToArtistTable($conn, $combinedAlbumArtistNames, $combinedAlbumArtistVanity)
{
    $albumArtistNames = $combinedAlbumArtistNames;
    $albumArtistSpotifyId = null;
    $albumArtistType = 'Multiple';
    $albumArtistVanity = $combinedAlbumArtistVanity;
    $albumArtistPictureUrl = null;
    $contributorId = 1;

    $stmt = $conn->prepare("
            INSERT INTO `Artists` (`artist_spotify_id`, `artist_name`, `artist_type`, `artist_vanity`, `artist_picture_link`, `contributor_id`) VALUES (?, ?, ?, ?, ?, ?)
        ");
    $stmt->bind_param("sssssi", $albumArtistSpotifyId, $albumArtistNames, $albumArtistType, $albumArtistVanity, $albumArtistPictureUrl, $contributorId);
    if (!$stmt->execute()) {
        throw new Exception($stmt->error);
    }
    $albumArtistId = $conn->insert_id;
    $stmt->close();

    return $albumArtistId;
}

function attachAlbumArtistIdToAlbumArtistsTable($conn, $albumArtistId, $albumId)
{
    $stmt = $conn->prepare("INSERT INTO `Album_Artists` (`album_id`, `artist_id`) VALUES (?, ?)");
    $stmt->bind_param("ii", $albumId, $albumArtistId);
    if (!$stmt->execute())
        throw new Exception($stmt->error);
    $stmt->close();
}

function processAlbumTracks($conn, $albumTracks, $albumId)
{
    foreach ($albumTracks as $albumTrack) {
        $trackArtists = $albumTrack['track_artists'];
        $trackArtistIds = processTrackArtists($conn, $trackArtists);
        processTrack($conn, $albumTrack, $trackArtistIds, $albumId);
    }
}

function processTrackArtists($conn, $trackArtists)
{
    $trackArtistIds = [];

    // If there is one track artist
    if (count($trackArtists) === 1) {
        $trackArtistIds[] = checkTrackArtistIfExistsInArtists($conn, $trackArtists[0]);
        // CL
    } else if (count($trackArtists) > 1) {
        // Combine track artist names
        $trackArtistNames = [];

        foreach ($trackArtists as $trackArtist) {
            $trackArtistNames[] = $trackArtist['track_artist_name']; // Add each artist's name to an array
        }

        $combinedTrackArtistNames = implode(", ", $trackArtistNames);

        $combinedTrackArtistId = checkCombinedTrackArtistsIfExistsInArtists($conn, $combinedTrackArtistNames);

        if (!is_null($combinedTrackArtistId)) {
            $trackArtistIds[] = $combinedTrackArtistId;
        }

        foreach ($trackArtists as $trackArtist) {
            $trackArtistTempName = $trackArtist['track_artist_name'];
            $trackArtistSpotifyId = $trackArtist['track_artist_id'];
            $trackArtistId = null;
        
            // Check if there is existing track artist with the Spotify ID
            // If there isn't, proceed to add this track artist to Artist table
            $stmt = $conn->prepare("SELECT `artist_id` FROM `Artists` WHERE `artist_spotify_id` = ?");
            $stmt->bind_param("s", $trackArtistSpotifyId);
            $stmt->execute();
            $stmt->bind_result($trackArtistId);
            $stmt->fetch();
            $stmt->close();

            if (is_null($trackArtistId)) {
                $newSingleTrackArtistId = addTrackArtistToArtistTable($conn, $trackArtist);

                if ($newSingleTrackArtistId) {
                    $trackArtistIds[] = $newSingleTrackArtistId;
                }

            } else {
                $trackArtistIds[] = $trackArtistId;
            }
        }
    }

    return $trackArtistIds;
}

function checkTrackArtistIfExistsInArtists($conn, $trackArtist)
{
    $trackArtistSpotifyId = $trackArtist['track_artist_id'];
    $trackArtistId = null;

    // Check if there is existing track artist with the Spotify ID
    $stmt = $conn->prepare("SELECT `artist_id` FROM `Artists` WHERE `artist_spotify_id` = ?");
    $stmt->bind_param("s", $trackArtistSpotifyId);
    $stmt->execute();
    $stmt->bind_result($trackArtistId);
    $stmt->fetch();
    $stmt->close();

    if (is_null($trackArtistId)) {
        $trackArtistId = addSingleTrackArtistToArtistTable($conn, $trackArtist);
    }

    return $trackArtistId;
}
function addSingleTrackArtistToArtistTable($conn, $trackArtist)
{
    $trackArtistSpotifyId = $trackArtist['track_artist_id'];
    $trackArtistName = $trackArtist['track_artist_name'];
    $trackArtistType = null;
    $trackArtistVanity = generateArtistVanityUrl($conn, $trackArtistName);
    $trackArtistPictureUrl = '';
    $contributorId = 1;

    $stmt = $conn->prepare("
            INSERT INTO `Artists` (`artist_spotify_id`, `artist_name`, `artist_type`, `artist_vanity`, `artist_picture_link`, `contributor_id`) VALUES (?, ?, ?, ?, ?, ?)
        ");
    $stmt->bind_param("sssssi", $trackArtistSpotifyId, $trackArtistName, $trackArtistType, $trackArtistVanity, $trackArtistPictureUrl, $contributorId);
    if (!$stmt->execute()) {
        throw new Exception($stmt->error);
    }
    $trackArtistId = $conn->insert_id;
    $stmt->close();

    return $trackArtistId;
}

function addTrackArtistToArtistTable($conn, $trackArtist)
{
    $trackArtistSpotifyId = $trackArtist['track_artist_id'];
    $trackArtistName = $trackArtist['track_artist_name'];
    $trackArtistType = null;
    $trackArtistVanity = generateArtistVanityUrl($conn, $trackArtistName);
    $trackArtistPictureUrl = null;
    $contributorId = 1;

    $stmt = $conn->prepare("
            INSERT INTO `Artists` (`artist_spotify_id`, `artist_name`, `artist_type`, `artist_vanity`, `artist_picture_link`, `contributor_id`) VALUES (?, ?, ?, ?, ?, ?)
        ");
    $stmt->bind_param("sssssi", $trackArtistSpotifyId, $trackArtistName, $trackArtistType, $trackArtistVanity, $trackArtistPictureUrl, $contributorId);
    if (!$stmt->execute()) {
        throw new Exception($stmt->error);
    }
    $newSingleTrackArtistId = $conn->insert_id;
    $stmt->close();

    return $newSingleTrackArtistId;
}

function checkCombinedTrackArtistsIfExistsInArtists($conn, $combinedTrackArtistNames)
{
    $trackArtistId = null;
    $combinedTrackArtistVanity = null;
    $stmt = $conn->prepare("SELECT `artist_id`, `artist_vanity` FROM `Artists` WHERE `artist_name` = ?");
    $stmt->bind_param("s", $combinedTrackArtistNames);
    $stmt->execute();
    $stmt->bind_result($trackArtistId, $combinedTrackArtistVanity);
    $stmt->fetch();
    $stmt->close();

    if (is_null($trackArtistId)) {
        $trackArtistId = addCombinedTrackArtistsToArtistTable($conn, $combinedTrackArtistNames);
    }

    return $trackArtistId;
}

function addCombinedTrackArtistsToArtistTable($conn, $combinedTrackArtistNames)
{
    $trackArtistNames = $combinedTrackArtistNames;
    $trackArtistSpotifyId = null;
    $trackArtistType = 'Multiple';
    $trackArtistVanity = generateArtistVanityUrl($conn, $combinedTrackArtistNames);
    $trackArtistPictureUrl = null;
    $contributorId = 1;

    $stmt = $conn->prepare("
            INSERT INTO `Artists` (`artist_spotify_id`, `artist_name`, `artist_type`, `artist_vanity`, `artist_picture_link`, `contributor_id`) VALUES (?, ?, ?, ?, ?, ?)
        ");
    $stmt->bind_param("sssssi", $trackArtistSpotifyId, $trackArtistNames, $trackArtistType, $trackArtistVanity, $trackArtistPictureUrl, $contributorId);
    if (!$stmt->execute()) {
        throw new Exception($stmt->error);
    }
    $combinedTrackArtistId = $conn->insert_id;
    $stmt->close();

    return $combinedTrackArtistId;
}

function processTrack($conn, $albumTrack, $trackArtistIds, $albumId)
{
    $trackName = $albumTrack['track_name'];
    $trackISRC = $albumTrack['isrc'];
    $trackDuration = $albumTrack['track_duration'];
    $trackExplicit = $albumTrack['explicit'];

    $trackId = null;
    // Checking if the track already exists based on name, isrc, duration, and explicitness,
    // if the track already exists, it will get the Track ID
    $stmt = $conn->prepare("
            SELECT t.`track_id` 
            FROM `Tracks` t 
            JOIN `Track_External_IDs` te ON t.`track_id` = te.`track_id`
            JOIN `Track_Artists` ta ON t.`track_id` = ta.`track_id`
            JOIN `Artists` a ON ta.`artist_id` = a.`artist_id`
            WHERE t.`track_name` = ? 
            AND t.`duration` = ? 
            AND t.`explicit` = ? 
            AND te.`isrc` = ?
        ");
    $stmt->bind_param("ssis", $trackName, $trackDuration, $trackExplicit, $trackISRC);
    $stmt->execute();
    $stmt->bind_result($trackId);
    $stmt->fetch();
    $stmt->close();

    if (is_null($trackId)) {
        addTrackToTables($conn, $albumTrack, $trackArtistIds, $albumId);
    } else {
        updateTrackToTables($conn, $albumTrack, $trackId, $trackArtistIds, $albumId);
    }
}

function addTracktoTables($conn, $albumTrack, $trackArtistIds, $albumId)
{
    $trackName = $albumTrack['track_name'];
    $trackDuration = $albumTrack['track_duration'];
    $trackExplicit = $albumTrack['explicit'];
    $trackDiscNumber = $albumTrack['disc_number'];
    $trackNumber = $albumTrack['track_number'];
    $trackISRC = $albumTrack['isrc'];
    $trackUPC = $albumTrack['upc'];
    $trackEAN = $albumTrack['ean'];
    $trackSpotifyId = $albumTrack['track_id'];
    $trackMainArtistId = $trackArtistIds[0];

    $contributorId = 1;

    $trackVanity = generateVanityUrl($conn, $trackName, $trackArtistIds[0], 'track');

    $stmt = $conn->prepare("INSERT INTO `Tracks` (`track_name`, `track_vanity`, `track_number`, `disc_number`, `track_main_artist_id`, `explicit`, `duration`, `contributor_id`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssiiissi", $trackName, $trackVanity, $trackNumber, $trackDiscNumber, $trackMainArtistId, $trackExplicit, $trackDuration, $contributorId);
    if (!$stmt->execute())
        throw new Exception($stmt->error);
    $trackId = $stmt->insert_id;
    $stmt->close();

    addTrackArtistIdToTrackArtistsTable($conn, $trackArtistIds, $trackId);
    addTrackAlbumIdToTrackAlbumsTable($conn, $trackId, $albumId, $trackNumber, $trackDiscNumber);
    addTrackLyricsIdToTrackLyricsTable($conn, $trackId, $contributorId);
    addTrackExternalIdsToTrackExternalIdsTable($conn, $trackId, $trackISRC, $trackUPC, $trackEAN);
    addTrackSpotifyIdsToTrackSpotifyIdsTable($conn, $trackId, $trackSpotifyId);

    return $trackId;

}
function addTrackArtistIdToTrackArtistsTable($conn, $trackArtistIds, $trackId)
{
    foreach ($trackArtistIds as $trackArtistId) {
        $stmt = $conn->prepare("INSERT IGNORE INTO `Track_Artists` (`track_id`, `artist_id`) VALUES (?, ?)");
        $stmt->bind_param("ii", $trackId, $trackArtistId);
        if (!$stmt->execute())
            throw new Exception($stmt->error);
        $stmt->close();
    }

}

function addTrackAlbumIdToTrackAlbumsTable($conn, $trackId, $albumId, $trackNumber, $discNumber)
{
    $stmt = $conn->prepare("INSERT INTO `Track_Albums` (`track_id`, `album_id`, `track_number`, `disc_number`) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("iiii", $trackId, $albumId, $trackNumber, $discNumber);
    if (!$stmt->execute())
        throw new Exception($stmt->error);
    $stmt->close();
}

function addTrackLyricsIdToTrackLyricsTable($conn, $trackId, $contributorId)
{
    $trackLyrics = '';
    $stmt = $conn->prepare("INSERT INTO `Track_Lyrics` (`track_id`, `lyrics`, `last_contributor_id`) VALUES (?, ?, ?)");
    $stmt->bind_param("isi", $trackId, $trackLyrics, $contributorId);
    if (!$stmt->execute())
        throw new Exception($stmt->error);
    $stmt->close();
}

function addTrackExternalIdsToTrackExternalIdsTable($conn, $trackId, $trackISRC, $trackUPC, $trackEAN)
{
    $stmt = $conn->prepare("INSERT IGNORE INTO `Track_External_IDs` (`track_id`, `isrc`, `upc`, `ean`) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("isss", $trackId, $trackISRC, $trackUPC, $trackEAN);
    if (!$stmt->execute())
        throw new Exception($stmt->error);
    $stmt->close();
}

function addTrackSpotifyIdsToTrackSpotifyIdsTable($conn, $trackId, $trackSpotifyId)
{
    $stmt = $conn->prepare("INSERT IGNORE INTO `Track_Spotify_IDs` (`track_id`, `track_spotify_id`) VALUES (?, ?)");
    $stmt->bind_param("is", $trackId, $trackSpotifyId);
    if (!$stmt->execute())
        throw new Exception($stmt->error);
    $stmt->close();
}

function updateTrackToTables($conn, $albumTrack, $trackId, $trackArtistIds, $albumId)
{
    $trackNumber = $albumTrack['track_number'];
    $trackDiscNumber = $albumTrack['disc_number'];
    $trackISRC = $albumTrack['isrc'];
    $trackUPC = $albumTrack['upc'];
    $trackEAN = $albumTrack['ean'];
    $trackSpotifyId = $albumTrack['track_id'];

    addTrackArtistIdToTrackArtistsTable($conn, $trackArtistIds, $trackId);
    addTrackAlbumIdToTrackAlbumsTable($conn, $trackId, $albumId, $trackNumber, $trackDiscNumber);
    addTrackExternalIdsToTrackExternalIdsTable($conn, $trackId, $trackISRC, $trackUPC, $trackEAN);
    addTrackSpotifyIdsToTrackSpotifyIdsTable($conn, $trackId, $trackSpotifyId);
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    // Get the album's Spotify ID, first and foremost
    $albumSpotifyId = $data['album_id'];
    if (checkAlbumIfAlreadyExists($conn, $albumSpotifyId)) {
        echo json_encode(['status' => 'error', 'message' => 'Album already exists in the database.']);
        $conn->close();
        exit;
    } else {
        // If album doesn't exist, the backend gets the album information
        $albumArtists = $data['album_artists'];
        $albumCoverUrl = !empty($data['album_cover_url']) ? $data['album_cover_url'] : null;
        $albumDiscsCount = $data['album_discs_count'];
        $albumDuration = $data['album_duration'];
        $albumLabel = $data['album_label'];
        $albumName = $data['album_name'];
        $albumReleaseDate = $data['album_release_date'];
        $albumReleaseType = $data['album_release_type'];
        $albumTrackCount = $data['album_track_count'];
        $albumTracks = $data['album_tracks'];
        $contributorId = $decoded->data->user_id; // Administrator Id

        // If the Spotify API only returns year of the album's release date,
        // concatenate January 1st
        if (preg_match('/^\d{4}$/', $albumReleaseDate)) {
            $albumReleaseDate .= '-01-01';
        }
        $conn->begin_transaction();
        try {
            // SQL query to add the album to the Albums table
            // excluding Album Vanity
            $albumVanity = null;
            $stmt = $conn->prepare("INSERT INTO `Albums` (`album_spotify_id`, `album_name`, `album_vanity`, `release_date`, `release_type`, `tracks_count`, `discs_count`, `album_cover_url`, `duration`, `label_name`, `contributor_id`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("sssssiisssi", $albumSpotifyId, $albumName, $albumVanity, $albumReleaseDate, $albumReleaseType, $albumTrackCount, $albumDiscsCount, $albumCoverUrl, $albumDuration, $albumLabel, $contributorId);
            if (!$stmt->execute()) {
                throw new Exception($stmt->error);
            }
            $albumId = $conn->insert_id;
            $stmt->close();

            // Process Album Artists and get their unique artist ID
            $albumArtistId = processAlbumArtists($conn, $albumArtists);
            attachAlbumArtistIdToAlbumArtistsTable($conn, $albumArtistId, $albumId);
            $albumVanity = generateVanityUrl($conn, $albumName, $albumArtistId, 'album');

            $updateStmt = $conn->prepare("UPDATE `Albums` SET `album_vanity` = ? WHERE `album_id` = ?");
            $updateStmt->bind_param("si", $albumVanity, $albumId);
            if (!$updateStmt->execute()) {
                throw new Exception($updateStmt->error);
            }
            $updateStmt->close();

            // Process Album tracks and related data
            processAlbumTracks($conn, $albumTracks, $albumId);

            $conn->commit();
            echo json_encode(['status' => 'success', 'message' => 'Album and its details have been successfully added to the database.']);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }
    $conn->close();
}