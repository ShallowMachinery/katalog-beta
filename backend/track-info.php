<?php
require 'config.php'; 

$artistVanity = $_GET['artistVanity'] ?? '';
$trackVanity = $_GET['trackVanity'] ?? '';

$stmt = $conn->prepare("
    SELECT 
        t.`track_id` AS `trackId`,
        t.`track_name` AS `trackName`,
        t.`track_vanity` AS `trackVanity`,
        t.`track_main_artist_id` AS `trackMainArtistId`,
        t.`youtube_video_id` AS `youtubeVideoId`,
        a.`artist_picture_link` AS `artistPictureUrl`,
        a.`artist_name` AS `artistName`, 
        a.`artist_vanity` AS `artistVanity`, 
        a.`artist_type` AS `artistType`,
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
        GROUP_CONCAT(DISTINCT te.`isrc` SEPARATOR ', ') AS `isrc`,
        IF(TRIM(tl.`lyrics`) = '@INSTRUMENTAL', 1, 0) AS `isInstrumental`,
        ts.`track_spotify_id` AS `trackSpotifyId`,
        GROUP_CONCAT(DISTINCT c.`composer_name` SEPARATOR '; ') AS `writers`,
        COUNT(c.`composer_name`) AS `writerCount`,
        tg.`genre_id` AS `trackGenreId`,
        g.`genre_name` AS `trackGenre`
    FROM 
        `katalog1`.`Tracks` t
    JOIN 
        `katalog1`.`Artists` a ON t.`track_main_artist_id` = a.`artist_id`
    JOIN 
        `katalog1`.`Track_Albums` ta2 ON t.`track_id` = ta2.`track_id`
    JOIN 
        `katalog1`.`Albums` al ON ta2.`album_id` = al.`album_id`
    JOIN 
        `katalog1`.`Album_Artists` aa ON al.`album_id` = aa.`album_id`
    JOIN 
        `katalog1`.`Artists` a2 ON aa.`artist_id` = a2.`artist_id`
    JOIN
        `katalog1`.`Track_Lyrics` tl ON t.`track_id` = tl.`track_id`
    LEFT JOIN 
        `katalog1`.`Track_External_IDs` te ON t.`track_id` = te.`track_id`
    LEFT JOIN 
        `katalog1`.`Track_Spotify_IDs` ts ON t.`track_id` = ts.`track_id`
	LEFT JOIN
		`katalog1`.`Track_Composers` tc ON t.`track_id` = tc.`track_id`
	LEFT JOIN
		`katalog1`.`Composers` c ON tc.`composer_id` = c.`composer_id`
    LEFT JOIN
		`katalog1`.`Track_Genres` tg ON t.`track_id` = tg.`track_id`
	LEFT JOIN
		`katalog1`.`Genres` g ON tg.`genre_id` = g.`genre_id`
    WHERE 
        t.`track_id` = (
            SELECT t2.`track_id` 
            FROM `katalog1`.`Tracks` t2
            JOIN `katalog1`.`Artists` a2 ON t2.`track_main_artist_id` = a2.`artist_id`
            WHERE a2.`artist_vanity` = ?
            AND t2.`track_vanity` = ?
            LIMIT 1
        )
    GROUP BY 
        t.`track_id`, al.`album_id`, ta2.`track_number`, a2.`artist_vanity`
    ORDER BY
        al.`release_date` ASC
	LIMIT 1;
    ");
$stmt->bind_param("ss", $artistVanity, $trackVanity);
$stmt->execute();
$result = $stmt->get_result();
$trackInfo = $result->fetch_assoc();

echo json_encode($trackInfo);

$stmt->close();
$conn->close();
?>