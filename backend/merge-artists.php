<?php
require 'config.php';
require 'vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;

$headers = apache_request_headers();
$accessToken = $headers['Authorization'] ?? '';

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

// Get the JSON input
$data = json_decode(file_get_contents("php://input"), true);

$primaryArtistId = $data['primaryArtistId'];
$duplicateArtistIds = $data['duplicateArtistIds'];

// Validate input
if (!is_numeric($primaryArtistId) || !is_array($duplicateArtistIds)) {
    echo json_encode(['success' => false, 'error' => 'Invalid input']);
    exit;
}

// Convert duplicate IDs to a comma-separated string
$duplicateIds = implode(',', array_map('intval', $duplicateArtistIds));

// Update album_artists table to replace duplicate artist IDs with the primary artist ID
$updateAlbumsSql = "
    UPDATE `album_artists`
    SET `artist_id` = ?
    WHERE `artist_id` IN ($duplicateIds)
";
$stmt = $conn->prepare($updateAlbumsSql);
$stmt->bind_param("i", $primaryArtistId);
$stmt->execute();

// Check if update was successful
if ($stmt->affected_rows > 0) {
    // Optionally, delete duplicate artists from the Artists table
    $deleteArtistsSql = "
        DELETE FROM `Artists`
        WHERE `artist_id` IN ($duplicateIds)
    ";
    $conn->query($deleteArtistsSql);

    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'No albums updated']);
}

// Close the database connection
$conn->close();
?>
