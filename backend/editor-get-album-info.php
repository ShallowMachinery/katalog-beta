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
        a.`album_id` AS `albumId`,
        a.`album_name` AS `albumName`,
        a.`album_vanity` AS `albumVanity`,
        ar.`artist_id` AS `artistId`,
        ar.`artist_name` AS `artistName`,
        ar.`artist_vanity` AS `artistVanity`,
        a.`release_date` AS `albumReleaseDate`,
        a.`release_type` AS `albumReleaseType`,
        a.`album_cover_url` AS `albumCoverUrl`,
        a.`label_name` AS `albumLabel`,
        a.`album_spotify_id` AS `albumSpotifyId`
    FROM
        `katalog1`.`albums` a
	JOIN
		`katalog1`.`album_artists` aa ON a.`album_id` = aa.`album_id`
	JOIN
		`katalog1`.`artists` ar ON aa.`artist_id` = ar.`artist_id`
    WHERE 
        a.`album_id` = ?
	LIMIT 1;
    ");
$stmt->bind_param("i", $albumId);
$stmt->execute();
$result = $stmt->get_result();
$albumInfo = $result->fetch_assoc();

echo json_encode($albumInfo);

$stmt->close();
$conn->close();
?>