<?php
require 'config.php';

$artistVanity = $_GET['artistVanity'] ?? '';

if (!$artistVanity) {
    echo json_encode(['status' => 'error', 'message' => 'Missing artist vanity']);
    exit;
}

// Get the main artist's Spotify ID based on vanity
$stmt = $conn->prepare("SELECT `artist_id` FROM `katalog1`.`Artists` WHERE `artist_vanity` = ?");
$stmt->bind_param("s", $artistVanity);
$stmt->execute();
$result = $stmt->get_result();
$artist = $result->fetch_assoc();
$stmt->close();

if (!$artist) {
    echo json_encode(['status' => 'error', 'message' => 'Artist not found']);
    exit;
}

$artistId = $artist['artist_id'];

// Fetch related artists based on collaboration in the same tracks
$stmt = $conn->prepare("
    SELECT DISTINCT 
        a.`artist_name` AS `artistName`, 
        a.`artist_vanity` AS `artistVanity`, 
        a.`artist_picture_link` AS `artistPictureUrl`
    FROM 
        `katalog1`.`Track_Artists` ta1
    JOIN 
        `katalog1`.`Track_Artists` ta2 
        ON ta1.`track_id` = ta2.`track_id` AND ta1.`artist_id` != ta2.`artist_id`
    JOIN 
        `katalog1`.`Artists` a 
        ON ta2.`artist_id` = a.`artist_id`
    JOIN 
        `katalog1`.`Tracks` t 
        ON t.`track_id` = ta1.`track_id`
    WHERE 
        ta1.`artist_id` = ?
        AND a.`artist_name` NOT LIKE CONCAT('%', (SELECT `artist_name` FROM `katalog1`.`Artists` WHERE `artist_id` = ? ), '%')
    GROUP BY 
        a.`artist_id`
    ORDER BY 
        COUNT(DISTINCT t.`track_id`) DESC
    LIMIT 8;
");

$stmt->bind_param("ii", $artistId, $artistId);
$stmt->execute();
$result = $stmt->get_result();

$relatedArtists = [];
while ($row = $result->fetch_assoc()) {
    $relatedArtists[] = $row;
}

echo json_encode(['artists' => $relatedArtists]);

$stmt->close();
$conn->close();
?>