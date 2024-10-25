<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require 'config.php'; 

$artistVanity = $_GET['artistVanity'] ?? '';

$stmt = $conn->prepare("
SELECT 
    t.`track_id` AS `trackId`,
    t.`track_name` AS `trackName`,
    t.`track_vanity` AS `trackVanity`,
    t.`track_main_artist_id` AS `trackMainArtistId`,
    MIN(al.`album_cover_url`) AS `albumCoverUrl`,
    a2.`artist_vanity` AS `artistVanity`,
    a.`artist_name` AS `artistName`
FROM 
    `katalog1`.`Tracks` t
JOIN 
    `katalog1`.`Track_Artists` ta ON t.`track_id` = ta.`track_id`
JOIN 
    `katalog1`.`Artists` a ON ta.`artist_id` = a.`artist_id`
JOIN 
    `katalog1`.`Track_Albums` ta3 ON t.`track_id` = ta3.`track_id`
JOIN 
    `katalog1`.`Albums` al ON ta3.`album_id` = al.`album_id`
JOIN 
    `katalog1`.`Track_Artists` ta2 ON t.`track_id` = ta2.`track_id`
JOIN 
    `katalog1`.`Artists` a2 ON ta2.`artist_id` = a2.`artist_id`
JOIN 
    `katalog1`.`Artists` main_artist ON t.`track_main_artist_id` = main_artist.`artist_id`  -- Self-join to get main artist's name
WHERE 
    t.`track_id` IN (
        SELECT t2.`track_id` 
        FROM `katalog1`.`Tracks` t2
        JOIN `katalog1`.`Track_Artists` ta2 ON t2.`track_id` = ta2.`track_id`
        JOIN `katalog1`.`Artists` a2 ON ta2.`artist_id` = a2.`artist_id`
        WHERE a2.`artist_vanity` = ?
    )
    AND a.`artist_name` = main_artist.`artist_name`  -- Filter to match artist_name with main_artist_name
GROUP BY 
    t.`track_id`, t.`track_name`, t.`track_vanity`, a2.`artist_vanity`, a.`artist_name`
ORDER BY 
    t.`track_name` ASC;
    ");

$stmt->bind_param("s", $artistVanity);
$stmt->execute();
$result = $stmt->get_result();

$tracks = [];
while ($row = $result->fetch_assoc()) {
    $tracks[] = $row;
}

echo json_encode(['tracks' => $tracks]);

$stmt->close();
$conn->close();
?>