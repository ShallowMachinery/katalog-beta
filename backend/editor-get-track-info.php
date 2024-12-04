<?php
require 'config.php'; 

$trackId = $_GET['trackId'] ?? '';

$stmt = $conn->prepare("
    SELECT 
        t.`track_id` AS `trackId`,
        t.`track_name` AS `trackName`,
        t.`track_vanity` AS `trackVanity`,
        t.`track_main_artist_id` AS `trackMainArtistId`,
        ts.`track_spotify_id` AS `trackSpotifyId`,
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
        ta2.`disc_number` AS `discNumber`,
        a2.`artist_vanity` AS `albumArtistVanity`,
        tg.`genre_id` AS `trackGenreId`,
        g.`genre_name` AS `trackGenre`,
        tl.`language` AS `language`
    FROM 
        `katalog1`.`Tracks` t
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
		`katalog1`.`Track_Genres` tg ON t.`track_id` = tg.`track_id`
	LEFT JOIN
		`katalog1`.`Genres` g ON tg.`genre_id` = g.`genre_id`
    LEFT JOIN
        `katalog1`.`Track_Spotify_IDs` ts ON t.`track_id` = ts.`track_id`
    LEFT JOIN
        `katalog1`.`Track_Lyrics` tl ON t.`track_id` = tl.`track_id`
        AND tl.`created_at` = (SELECT MAX(`created_at`) FROM `katalog1`.`Track_Lyrics` WHERE `track_id` = t.`track_id`)
    WHERE 
        t.`track_id` = ?
    GROUP BY 
        t.`track_id`, al.`album_id`, ta2.`track_number`, a2.`artist_vanity` -- Include a2.`artist_vanity` in GROUP B
	LIMIT 1;
    ");
$stmt->bind_param("i", $trackId);
$stmt->execute();
$result = $stmt->get_result();
$trackInfo = $result->fetch_assoc();

echo json_encode($trackInfo);

$stmt->close();


$conn->close();
?>