<?php
require 'config.php'; 

$artistId = $_GET['artistId'] ?? '';
$trackId = $_GET['trackId'] ?? '';

$stmt = $conn->prepare("
    SELECT 
        t.`track_id` AS `trackId`,
        t.`track_name` AS `trackName`,
        t.`track_vanity` AS `trackVanity`,
        t.`track_main_artist_id` AS `trackMainArtistId`,
        a.`artist_name` AS `artistName`, 
        a.`artist_vanity` AS `artistVanity`, 
        al.`album_id` AS `albumId`,
        al.`album_name` AS `albumName`,
        al.`album_cover_url` AS `albumCoverUrl`,
        al.`album_vanity` AS `albumVanity`,
        al.`release_date` AS `releaseDate`,
        al.`label_name` AS `labelName`,
        t.`duration` AS `trackDuration`,
        t.`explicit` AS `isExplicit`,
        ta2.`track_number` AS `trackNumber`,
        a2.`artist_vanity` AS `albumArtistVanity`,  -- Fetch the album artist vanity
        te.`isrc` AS `isrc`  -- Fetch the ISRC from Track_External_IDs
    FROM 
        `katalog1`.`Tracks` t
    JOIN 
        `katalog1`.`Track_Artists` ta ON t.`track_id` = ta.`track_id`
    JOIN 
        `katalog1`.`Artists` a ON t.`track_main_artist_id` = a.`artist_id`
    JOIN 
        `katalog1`.`Track_Albums` ta2 ON t.`track_id` = ta2.`track_id`
    JOIN 
        `katalog1`.`Albums` al ON ta2.`album_id` = al.`album_id`
    JOIN 
        `katalog1`.`Album_Artists` aa ON al.`album_id` = aa.`album_id`  -- Join Album_Artists to get album artist id
    JOIN 
        `katalog1`.`Artists` a2 ON aa.`artist_id` = a2.`artist_id`  -- Join Artists table to get album artist's vanity
    LEFT JOIN 
        `katalog1`.`Track_External_IDs` te ON t.`track_id` = te.`track_id`  -- Left join to get ISRC if available
    WHERE 
        t.`track_id` = (
            SELECT t2.`track_id` 
            FROM `katalog1`.`Tracks` t2
            JOIN `katalog1`.`Track_Artists` ta2 ON t2.`track_id` = ta2.`track_id`
            JOIN `katalog1`.`Artists` a2 ON ta2.`artist_id` = a2.`artist_id`
            WHERE a2.`artist_id` = ?
            AND t2.`track_id` = ?
            LIMIT 1
        )
    GROUP BY 
        t.`track_id`, al.`album_id`, ta2.`track_number`, a2.`artist_vanity`;  -- Include a2.`artist_vanity` in GROUP BY
    ");
$stmt->bind_param("ii", $artistId, $trackId);
$stmt->execute();
$result = $stmt->get_result();
$trackInfo = $result->fetch_assoc();

echo json_encode($trackInfo);

$stmt->close();
$conn->close();
?>