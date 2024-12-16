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
        echo json_encode(['status' => 'error', 'message' => 'Access denied.']);
        exit;
    }
} catch (ExpiredException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Access token has expired.']);
    exit;
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid access token.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$albumId = $data['albumId'] ?? null;
$albumName = $data['albumName'] ?? null;
$albumVanity = $data['albumVanity'] ?? null;
$albumCoverUrl = $data['albumCoverUrl'] ?? null;
$albumLabel = $data['albumLabel'] ?? null;
$albumReleaseDate = $data['albumReleaseDate'] ?? null;

$contributorId = $decoded->data->user_id ?? null;
$userHierarchy = $decoded->data->user_hierarchy ?? null;
$isAdmin = ($userHierarchy === 1);

if (!$albumId || !$albumName) {
    echo json_encode(['status' => 'error', 'message' => 'Missing album ID or album name.']);
    exit;
}

$conn->begin_transaction();

try {
    $stmt = $conn->prepare("
        UPDATE `katalog1`.`Albums`
        SET `album_name` = ?, `album_vanity` = ?, `album_cover_url` = ?, `label_name` = ?, `release_date` = ?
        WHERE `album_id` = ?");
    if (!$stmt) {
        throw new Exception('Failed to prepare album update statement: ' . $conn->error);
    }
    $stmt->bind_param("sssssi", $albumName, $albumVanity, $albumCoverUrl, $albumLabel, $albumReleaseDate, $albumId);
    if (!$stmt->execute()) {
        throw new Exception('Failed to update album information: ' . $stmt->error);
    }
    $stmt->close();

    $conn->commit();
    echo json_encode(['status' => 'success', 'message' => 'Track information updated successfully.']);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
$conn->close();
?>