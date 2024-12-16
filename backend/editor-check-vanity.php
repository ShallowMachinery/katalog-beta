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

$type = $_GET['type'] ?? null;

if ($type === 'track') {
    $artistId = $_GET['artistId'] ?? null;
    $trackVanity = $_GET['trackVanity'] ?? null;

    if (is_null($artistId) || is_null($trackVanity)) {
        echo json_encode(['status' => 'error', 'message' => 'Missing required parameters.']);
        exit;
    }

    $stmt = $conn->prepare("
        SELECT t.`track_id`, t.`track_vanity`, t.`track_main_artist_id`, a.`artist_name`, a.`artist_vanity`
        FROM `katalog1`.`tracks` t
        JOIN `katalog1`.`artists` a ON t.`track_main_artist_id` = a.`artist_id`
        WHERE t.`track_vanity` = ?
        AND t.`track_main_artist_id` = ?
        LIMIT 1;
    ");

    $stmt->bind_param("si", $trackVanity, $artistId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        echo json_encode(['status' => 'error', 'message' => 'Vanity URL already exists.']);
        exit;
    }

    $stmt->close();
} else if ($type === 'artist') {
    $artistVanity = $_GET['artistVanity'] ?? null;

    if (is_null($artistVanity)) {
        echo json_encode(['status' => 'error', 'message' => 'Missing a required parameter.']);
        exit;
    }

    $stmt = $conn->prepare("
        SELECT a.`artist_id`, a.`artist_name`, a.`artist_vanity`
        FROM `katalog1`.`artists` a
        WHERE a.`artist_vanity` = ?
        LIMIT 1;
    ");

    $stmt->bind_param("s", $artistVanity);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        echo json_encode(['status' => 'error', 'message' => 'Vanity URL already exists.']);
        exit;
    }

    $stmt->close();
} else if ($type === 'album') {
    $artistId = $_GET['artistId'] ?? null;
    $albumVanity = $_GET['albumVanity'] ?? null;

    if (is_null($artistId) || is_null($albumVanity)) {
        echo json_encode(['status' => 'error', 'message' => 'Missing required parameters.']);
        exit;
    }

    $stmt = $conn->prepare("
        SELECT a.`album_id`, a.`album_vanity`, aa.`artist_id`, ar.`artist_name`, ar.`artist_vanity`
        FROM `katalog1`.`albums` a
        JOIN `katalog1`.`album_artists` aa ON a.`album_id` = aa.`album_id`
        JOIN `katalog1`.`artists` ar ON aa.`artist_id` = ar.`artist_id`
        WHERE a.`album_vanity` = ?
        AND aa.`artist_id` = ?
        LIMIT 1;
    ");

    $stmt->bind_param("si", $albumVanity, $artistId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        echo json_encode(['status' => 'error', 'message' => 'Vanity URL already exists.']);
        exit;
    }
    $stmt->close();
}

$conn->close();


