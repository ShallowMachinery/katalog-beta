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

$artistId = $_GET['artistId'] ?? '';

$stmt = $conn->prepare("
    SELECT 
        a.`artist_name` AS `artistName`,
        a.`artist_type` AS `artistType`,
        a.`artist_vanity` AS `artistVanity`,
        a.`artist_picture_link` AS `artistPictureUrl`,
        a.`artist_spotify_id` AS `artistSpotifyId`
    FROM
        `katalog1`.`artists` a
    WHERE 
        a.`artist_id` = ?
	LIMIT 1;
    ");
$stmt->bind_param("i", $artistId);
$stmt->execute();
$result = $stmt->get_result();
$artistInfo = $result->fetch_assoc();

echo json_encode($artistInfo);

$stmt->close();
$conn->close();
?>