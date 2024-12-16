<?php
require 'config.php';
require 'vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;

$headers = apache_request_headers();
$accessToken = $headers['authorization'] ?? '';

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

// Initialize an empty response array
$response = [
    "tracks" => [],
    "albums" => [],
    "artists" => []
];

try {
    // Get tracks and their reports
    $trackQuery = "
        SELECT 
            t.`track_id`,
            t.`track_name`,
            t.`track_vanity`,
            t.`duration`,
            a.`album_name`,
            a.`album_vanity`,
            aar.`artist_vanity` AS `album_artist_vanity`,
            ar.`artist_name`,
            ar.`artist_vanity`,
            GROUP_CONCAT(DISTINCT te.`isrc` SEPARATOR ', ') AS `isrcs`,
            GROUP_CONCAT(DISTINCT c.`composer_name` SEPARATOR '; ') AS `writers`,
            COUNT(DISTINCT tc.`track_id`) AS `writer_count`,
            EXISTS (
                SELECT 1 FROM `katalog1`.`tracks` t2
                WHERE t2.`track_name` = t.`track_name`
                AND t2.`track_main_artist_id` = t.`track_main_artist_id`
                AND t2.`track_id` != t.`track_id`
            ) AS is_duplicate
        FROM `katalog1`.`Tracks` t
        LEFT JOIN `katalog1`.`Track_Albums` ta ON t.`track_id` = ta.`track_id`
        LEFT JOIN `katalog1`.`Albums` a ON ta.`album_id` = a.`album_id`
		JOIN `katalog1`.`Album_Artists` aal ON ta.`album_id` = aal.`album_id`
        JOIN `katalog1`.`Artists` aar ON aal.`artist_id` = aar.`artist_id`
        LEFT JOIN `katalog1`.`Track_External_IDs` te ON t.`track_id` = te.`track_id`
        LEFT JOIN `katalog1`.`Track_Composers` tc ON t.`track_id` = tc.`track_id`
	    LEFT JOIN `katalog1`.`Composers` c ON tc.`composer_id` = c.`composer_id`
        LEFT JOIN `katalog1`.`Artists` ar ON t.`track_main_artist_id` = ar.`artist_id`
        GROUP BY t.`track_id`
    ";
    $trackStmt = $conn->prepare($trackQuery);
    $trackStmt->execute();
    $trackResult = $trackStmt->get_result();

    while ($row = $trackResult->fetch_assoc()) {
        $response["tracks"][] = [
            "trackId" => $row["track_id"],
            "trackName" => $row["track_name"],
            "trackVanity" => $row["track_vanity"],
            "trackDuration" => $row["duration"],
            "albumName" => $row["album_name"],
            "albumVanity" => $row["album_vanity"],
            "albumArtistVanity" => $row["album_artist_vanity"],
            "artistName" => $row["artist_name"],
            "artistVanity" => $row["artist_vanity"],
            "isrcs" => $row["isrcs"],
            "writerCount" => $row["writer_count"],
            "isDuplicate" => $row["is_duplicate"] == 1
        ];
    }

    // Get albums
    $albumQuery = "
        SELECT 
            a.`album_id`,
            a.`album_name`,
            a.`album_vanity`,
            a.`album_cover_url`,
            a.`release_date`,
            a.`release_type`,
            a.`tracks_count`,
            a.`discs_count`,
            art.`artist_name`,
            art.`artist_vanity`
        FROM `katalog1`.`albums` a
        LEFT JOIN `katalog1`.`album_artists` ar ON a.`album_id` = ar.`album_id`
        LEFT JOIN `katalog1`.`artists` art ON ar.`artist_id` = art.`artist_id`
    ";
    $albumStmt = $conn->prepare($albumQuery);
    $albumStmt->execute();
    $albumResult = $albumStmt->get_result();

    while ($row = $albumResult->fetch_assoc()) {
        $response["albums"][] = [
            "albumId" => $row["album_id"],
            "albumName" => $row["album_name"],
            "albumVanity" => $row["album_vanity"],
            "albumCoverUrl" => $row["album_cover_url"],
            "releaseDate" => $row["release_date"],
            "releaseType" => $row["release_type"],
            "tracksCount" => $row["tracks_count"],
            "discsCount" => $row["discs_count"],
            "artistName" => $row["artist_name"],
            "artistVanity" => $row["artist_vanity"],
        ];
    }

    $artistQuery = "
        SELECT 
            `artist_id`,
            `artist_name`,
            CASE 
                WHEN `artist_type` IS NULL THEN 'solo' 
                ELSE `artist_type` 
            END AS `artist_type`,
            `artist_vanity`,
            `artist_picture_link`,
            CASE 
                WHEN EXISTS (
                    SELECT 1 
                    FROM katalog1.`artists` AS duplicates 
                    WHERE duplicates.`artist_name` = katalog1.`artists`.`artist_name` 
                    AND duplicates.`artist_id` <> katalog1.`artists`.`artist_id`
                ) THEN 1
                ELSE 0
            END AS `is_duplicate`
        FROM katalog1.`artists`
    ";
    $artistStmt = $conn->prepare($artistQuery);
    $artistStmt->execute();
    $artistResult = $artistStmt->get_result();

    while ($row = $artistResult->fetch_assoc()) {
        $response["artists"][] = [
            "artistId" => $row["artist_id"],
            "artistName" => $row["artist_name"],
            "artistType" => $row["artist_type"],
            "artistVanity" => $row["artist_vanity"],
            "artistCoverUrl" => $row["artist_picture_link"],
            "isDuplicate" => $row["is_duplicate"],
        ];
    }

    // Output the JSON response
    echo json_encode($response);

} catch (Exception $e) {
    // If an error occurs, return a 500 error and a message
    http_response_code(500);
    echo json_encode(["error" => "Failed to fetch database reports: " . $e->getMessage()]);
}
?>