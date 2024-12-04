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

$stmt = $conn->prepare("
    SELECT
        uc.*,
        ac.`user_name` AS `userName`,
        ac.`user_type_name` AS `userTypeName`,
        t.`track_name` AS `trackName`,
        t.`track_vanity` AS `trackVanity`,
        a.`artist_name` AS `artistName`,
        a.`artist_vanity` AS `artistVanity`,
        MIN(al.`album_name`) AS `albumName`,
        MIN(al.`album_cover_url`) AS `albumCoverUrl`
    FROM `katalog1`.`user_contributions` uc
    JOIN `katalog1`.`tracks` t ON uc.`track_id` = t.`track_id`
    JOIN `katalog1`.`artists` a ON t.`track_main_artist_id` = a.`artist_id`
    JOIN `katalog1`.`track_albums` tal ON t.`track_id` = tal.`track_id`
    JOIN `katalog1`.`albums` al ON tal.`album_id` = al.`album_id`
    JOIN `katalog1`.`accounts` ac ON uc.`user_id` = ac.`user_id`
    WHERE uc.`track_id` IN (
        SELECT t2.`track_id`
        FROM `katalog1`.`tracks` t2
        JOIN `katalog1`.`artists` a2 ON t2.`track_main_artist_id` = a2.`artist_id`
        WHERE a2.`artist_id` = ?
    )
    AND uc.`contribution_type` != 'deleted_lyrics'
    GROUP BY uc.`contribution_id`, ac.`user_name`, ac.`user_type_name`, t.`track_name`, t.`track_vanity`, 
            a.`artist_name`, a.`artist_vanity`
    ORDER BY uc.`created_at` DESC
    LIMIT 10;
");

$stmt->bind_param("i", $artistId,);
$stmt->execute();
$result = $stmt->get_result();

$recentArtistActivities = [];
while ($row = $result->fetch_assoc()) {
    $recentArtistActivities[] = $row;
}

echo json_encode(['activities' => $recentArtistActivities]);

$stmt->close();
$conn->close();
?>
