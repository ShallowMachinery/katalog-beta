<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require 'config.php'; 

$albumVanity = $_GET['albumVanity'] ?? '';
$artistVanity = $_GET['artistVanity'] ?? '';

$stmt = $conn->prepare("
SELECT 
    t.`track_id` AS `trackId`,
    t.`track_name` AS `trackName`,
    t.`track_vanity` AS `trackVanity`,
    a.`artist_name` AS `artistName`, 
    a.`artist_vanity` AS `artistVanity`,
    al.`album_id` AS `albumId`,
    al.`album_name` AS `albumName`,
    al.`album_vanity` AS `albumVanity`,
    al.`album_cover_url` AS `albumCoverUrl`,
    al.`release_date` AS `releaseDate`,
    al.`label_name` AS `labelName`,
    t.`duration` AS `trackDuration`,
    t.`explicit` AS `isExplicit`,
    ta2.`track_number` AS `trackNumber`,
    t.`disc_number` AS `discNumber`
FROM 
    `katalog1`.`Tracks` t
JOIN 
    `katalog1`.`Track_Artists` ta ON t.`track_id` = ta.`track_id`
JOIN 
    `katalog1`.`Artists` a ON ta.`artist_id` = a.`artist_id`
JOIN 
    `katalog1`.`Track_Albums` ta2 ON t.`track_id` = ta2.`track_id`
JOIN 
    `katalog1`.`Albums` al ON ta2.`album_id` = al.`album_id`
JOIN 
    `katalog1`.`Album_Artists` aa ON al.`album_id` = aa.`album_id`
JOIN 
    `katalog1`.`Artists` a2 ON aa.`artist_id` = a2.`artist_id`
WHERE 
    a2.`artist_vanity` = ?  -- Match the album artist vanity
    AND al.`album_vanity` = ?  -- Match the album vanity
GROUP BY 
    t.`track_id`, al.`album_id`, ta2.`track_number`, t.`disc_number`
ORDER BY 
    t.`disc_number` ASC, ta2.`track_number` ASC;
");

$stmt->bind_param("ss", $artistVanity, $albumVanity);
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