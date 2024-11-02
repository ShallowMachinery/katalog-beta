<?php
require 'config.php'; 

$artistVanity = $_GET['artistVanity'] ?? '';

$stmt = $conn->prepare("
    SELECT 
        t.`track_id` AS `trackId`,
        t.`track_name` AS `trackName`,
        t.`track_vanity` AS `trackVanity`,
        t.`track_main_artist_id` AS `trackMainArtistId`,
        a.`artist_vanity` AS `artistVanity`,
        a.`artist_name` AS `artistName`,
        MAX(al.`album_cover_url`) AS `albumCoverUrl`
    FROM 
        `katalog1`.`Tracks` t
    JOIN 
        `katalog1`.`Artists` a ON t.`track_main_artist_id` = a.`artist_id`
    JOIN 
        `katalog1`.`Track_Albums` ta ON t.`track_id` = ta.`track_id`
    JOIN 
        `katalog1`.`Albums` al ON ta.`album_id` = al.`album_id`
    WHERE 
        t.`track_id` IN (
            SELECT DISTINCT t2.`track_id` 
            FROM `katalog1`.`Tracks` t2
            JOIN `katalog1`.`Track_Artists` ta2 ON t.`track_id` = ta2.`track_id`
            JOIN `katalog1`.`Artists` a2 ON ta2.`artist_id` = a2.`artist_id`
            WHERE a2.`artist_vanity` = ?
        )
    GROUP BY 
        t.`track_id`, t.`track_name`, t.`track_vanity`, a.`artist_name`, a.`artist_vanity`
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