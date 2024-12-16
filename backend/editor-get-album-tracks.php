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

$albumId = $_GET['albumId'] ?? '';

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
        al.`album_vanity` AS `albumVanity`,
        al.`album_cover_url` AS `albumCoverUrl`,
        al.`release_date` AS `releaseDate`,
        al.`label_name` AS `labelName`,
        t.`duration` AS `trackDuration`,
        t.`explicit` AS `isExplicit`,
        ta2.`track_number` AS `trackNumber`,
        ta2.`disc_number` AS `discNumber`
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
    WHERE 
        al.`album_id` = ?
    GROUP BY 
        t.`track_id`, al.`album_id`, ta2.`track_number`, t.`disc_number`
    ORDER BY 
        ta2.`disc_number` ASC, ta2.`track_number` ASC;
    ");
$stmt->bind_param("i", $albumId);
$stmt->execute();
$result = $stmt->get_result();
$albumTracks = $result->fetch_all(MYSQLI_ASSOC);
echo json_encode($albumTracks);

$stmt->close();
$conn->close();
?>