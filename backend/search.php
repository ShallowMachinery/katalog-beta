<?php
require 'config.php'; 

// Get the search term from the query parameters
$searchTerm = $_GET['term'] ?? '';

if (empty($searchTerm)) {
    echo json_encode(['status' => 'error', 'message' => 'Missing search term']);
    exit;
}

// Initialize arrays to hold results
$artists = [];
$albums = [];
$tracks = [];
$lyrics = [];

// Prepare SQL statements
// Search artists
$artistStmt = $conn->prepare("SELECT `artist_id`, `artist_name`, `artist_vanity`, `artist_picture_link` 
                               FROM `katalog1`.`Artists` 
                               WHERE `artist_name` LIKE ? LIMIT 10");
$likeTerm = "%$searchTerm%";
$artistStmt->bind_param("s", $likeTerm);
$artistStmt->execute();
$artistResult = $artistStmt->get_result();
while ($row = $artistResult->fetch_assoc()) {
    $artists[] = [
        'artistId' => $row['artist_id'],
        'artistName' => $row['artist_name'],
        'artistVanity' => $row['artist_vanity'],
        'artistPictureUrl' => $row['artist_picture_link'] ? $row['artist_picture_link'] : null
    ];
}

// Search albums
$albumStmt = $conn->prepare("SELECT a.`album_id`, a.`album_name`, a.`album_vanity`, a.`release_date`, a.`album_cover_url`, aa.`artist_id`, ar.`artist_name`, ar.`artist_vanity`
    FROM `katalog1`.`Albums` AS a
    JOIN `katalog1`.`album_artists` AS aa ON a.`album_id` = aa.`album_id`
    JOIN `katalog1`.`Artists` AS ar ON aa.`artist_id` = ar.`artist_id`
    WHERE a.`album_name` LIKE ? 
    LIMIT 10");
$albumStmt->bind_param("s", $likeTerm);
$albumStmt->execute();
$albumResult = $albumStmt->get_result();
while ($row = $albumResult->fetch_assoc()) {
    $albums[] = [
        'albumId' => $row['album_id'],
        'albumName' => $row['album_name'],
        'albumVanity' => $row['album_vanity'],
        'releaseDate' => $row['release_date'],
        'coverUrl' => $row['album_cover_url'],
        'artistId' => $row['artist_id'], // Include artist_id
        'artistName' => $row['artist_name'], // Include artist_name
        'artistVanity' => $row['artist_vanity']
    ];
}

// Search tracks
$trackStmt = $conn->prepare("
    SELECT t.`track_id`, t.`track_name`, t.`track_vanity`, t.`track_main_artist_id`, 
           a.`artist_name`, a.`artist_vanity`, al.`album_id`, al. `album_name`, al.`album_cover_url`
    FROM `katalog1`.`Tracks` AS t
    JOIN `katalog1`.`Artists` AS a ON t.`track_main_artist_id` = a.`artist_id`
    LEFT JOIN `katalog1`.`Track_Albums` AS ta ON t.`track_id` = ta.`track_id`
    LEFT JOIN `katalog1`.`Albums` AS al ON ta.`album_id` = al.`album_id`
    WHERE t.`track_name` LIKE ? 
    LIMIT 10
");
$trackStmt->bind_param("s", $likeTerm);
$trackStmt->execute();
$trackResult = $trackStmt->get_result();
while ($row = $trackResult->fetch_assoc()) {
    $tracks[] = [
        'trackId' => $row['track_id'],
        'trackName' => $row['track_name'],
        'trackVanity' => $row['track_vanity'],
        'mainArtistId' => $row['track_main_artist_id'], // Include main artist ID
        'mainArtistName' => $row['artist_name'], // Include main artist name
        'mainArtistVanity' => $row['artist_vanity'], // Include main artist vanity
        'albumId' => $row['album_id'], // Include album ID
        'albumName' => $row['album_name'],
        'albumCoverUrl' => $row['album_cover_url'] // Include album cover URL
    ];
}

// Search lyrics
$lyricStmt = $conn->prepare("
    SELECT l.`lyrics_id`, l.`lyrics`, l.`track_id`, 
           t.`track_name`, t.`track_vanity`, t.`duration`, t.`track_main_artist_id`, 
           a.`artist_name`, a.`artist_vanity`, al.`album_id`, al. `album_name`, al.`album_cover_url`
    FROM `katalog1`.`Track_Lyrics` AS l
    JOIN `katalog1`.`Tracks` AS t ON l.`track_id` = t.`track_id`
    JOIN `katalog1`.`Artists` AS a ON t.`track_main_artist_id` = a.`artist_id`
    LEFT JOIN `katalog1`.`Track_Albums` AS ta ON t.`track_id` = ta.`track_id`
    LEFT JOIN `katalog1`.`Albums` AS al ON ta.`album_id` = al.`album_id`
    WHERE REGEXP_REPLACE(l.`lyrics`, '@[^\\n]*\\n?', '') LIKE ? 
    LIMIT 10
");
$lyricStmt->bind_param("s", $likeTerm);
$lyricStmt->execute();
$lyricResult = $lyricStmt->get_result();
while ($row = $lyricResult->fetch_assoc()) {
    $lyrics[] = [
        'lyricId' => $row['lyrics_id'],
        'lyricContent' => $row['lyrics'],
        'trackId' => $row['track_id'],
        'trackName' => $row['track_name'], // Include track name
        'trackVanity' => $row['track_vanity'], // Include track vanity
        'mainArtistId' => $row['track_main_artist_id'], // Include main artist ID
        'mainArtistName' => $row['artist_name'], // Include main artist name
        'mainArtistVanity' => $row['artist_vanity'], // Include main artist vanity
        'albumId' => $row['album_id'], // Include album ID
        'albumName' => $row['album_name'],
        'albumCoverUrl' => $row['album_cover_url'] // Include album cover URL
    ];
}

// Return the results as JSON
echo json_encode([
    'status' => 'success',
    'artists' => $artists,
    'albums' => $albums,
    'tracks' => $tracks,
    'lyrics' => $lyrics
]);

// Close the prepared statements and connection
$artistStmt->close();
$albumStmt->close();
$trackStmt->close();
$lyricStmt->close();
$conn->close();
?>
