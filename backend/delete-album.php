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
    if (!isset($decoded->data->user_hierarchy) || $decoded->data->user_hierarchy != '1') {
        echo json_encode(['status' => 'error', 'message' => 'Administrator access required.']);
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
$userId = $decoded->data->user_id;

if (!$albumId || !$userId) {
    echo json_encode(['status' => 'error', 'message' => 'Missing some parameters.']);
    exit;
}

$conn->begin_transaction();

try {
    // $stmtDeleteFromTrackAlbums = $conn->prepare("DELETE FROM `katalog1`.`track_albums` WHERE `album_id` = ?");
    // $stmtDeleteFromTrackAlbums->bind_param("i", $albumId);
    // $stmtDeleteFromTrackAlbums->execute();
    // $stmtDeleteFromTrackAlbums->close();

    // $stmtDeleteFromAlbumArtists = $conn->prepare("DELETE FROM `katalog1`.`album_artists` WHERE `album_id` = ?");
    // $stmtDeleteFromAlbumArtists->bind_param("i", $albumId);
    // $stmtDeleteFromAlbumArtists->execute();
    // $stmtDeleteFromAlbumArtists->close();

    $deleteTracksQuery = "
        DELETE FROM `katalog1`.`tracks`
        WHERE `track_id` IN (
            SELECT `track_id`
            FROM `katalog1`.`track_albums`
            WHERE `album_id` = ?
        )
        AND `track_id` NOT IN (
            SELECT DISTINCT t.`track_id`
            FROM `katalog1`.`tracks` t
            JOIN `katalog1`.`track_albums` ta ON t.`track_id` = ta.`track_id`
            WHERE ta.`album_id` != ?
        )
    ";

    $stmt = $conn->prepare($deleteTracksQuery);
    $stmt->bind_param("ii", $albumId, $albumId);
    $stmt->execute();
    $stmt->close();

    $stmt = $conn->prepare("DELETE FROM `katalog1`.`albums` WHERE `album_id` = ?");
    $stmt->bind_param("i", $albumId);
    $stmt->execute();
    $stmt->close();
    
    $conn->commit();
    echo json_encode(['status' => 'success', 'message' => 'Album and associated tracks deleted successfully.']);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['status' => 'error', 'message' => 'Error deleting album and tracks: ' . $e->getMessage()]);
} finally {
    $conn->close();
}