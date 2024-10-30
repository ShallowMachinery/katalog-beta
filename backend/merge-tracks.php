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

$data = json_decode(file_get_contents("php://input"), true);
$primaryTrackId = $data['primaryTrackId'];
$duplicateTrackIds = $data['duplicateTrackIds'];

if (!is_numeric($primaryTrackId) || !is_array($duplicateTrackIds)) {
    echo json_encode(['success' => false, 'error' => 'Invalid input']);
    exit;
}

$duplicateIds = implode(',', array_map('intval', $duplicateTrackIds));

// 1. Update track_albums
$updateAlbumsSql = "
    UPDATE katalog1.track_albums
    SET track_id = ?
    WHERE track_id IN ($duplicateIds)
";
$stmt = $conn->prepare($updateAlbumsSql);
if ($stmt) {
    $stmt->bind_param("i", $primaryTrackId);
    $stmt->execute();
    $stmt->close();
} else {
    echo json_encode(['success' => false, 'error' => 'Failed to prepare statement for updating albums']);
    exit;
}

// 2. Delete from track_artists
$deleteArtistsSql = "
    DELETE FROM katalog1.track_artists
    WHERE track_id IN ($duplicateIds)
";
if (!$conn->query($deleteArtistsSql)) {
    echo json_encode(['success' => false, 'error' => 'Failed to delete from track_artists']);
    exit;
}

// 3. Update track_external_ids
$primaryISRCQuery = "SELECT isrc FROM katalog1.track_external_ids WHERE track_id = ?";
$stmt = $conn->prepare($primaryISRCQuery);

if (!$stmt) {
    echo json_encode(['success' => false, 'error' => 'Failed to prepare primary ISRC query: ' . $conn->error]);
    exit;
}
$stmt->bind_param("i", $primaryTrackId);
if (!$stmt->execute()) {
    echo json_encode(['success' => false, 'error' => 'Failed to execute primary ISRC query: ' . $stmt->error]);
    exit;
}

$result = $stmt->get_result();
$primaryISRCRow = $result->fetch_assoc();
$primaryISRC = $primaryISRCRow ? $primaryISRCRow['isrc'] : null;

$duplicateISRCQuery = "SELECT track_id, isrc FROM katalog1.track_external_ids WHERE track_id IN ($duplicateIds)";
$duplicateISRCs = $conn->query($duplicateISRCQuery);

if (!$duplicateISRCs) {
    echo json_encode(['success' => false, 'error' => 'Failed to execute duplicate ISRC query: ' . $conn->error]);
    exit;
}

$deleteSql = "DELETE FROM katalog1.track_external_ids WHERE track_id = ?";
$updateSql = "UPDATE katalog1.track_external_ids SET track_id = ? WHERE track_id = ?";

while ($row = $duplicateISRCs->fetch_assoc()) {
    $duplicateId = $row['track_id'];
    $duplicateISRC = $row['isrc'];

    // Check if the ISRCs match
    if ($duplicateISRC === $primaryISRC) {
        // ISRC matches, delete the duplicate row
        $deleteStmt = $conn->prepare($deleteSql);
        if (!$deleteStmt) {
            echo json_encode(['success' => false, 'error' => 'Failed to prepare delete statement: ' . $conn->error]);
            exit;
        }
        
        $deleteStmt->bind_param("i", $duplicateId);
        if (!$deleteStmt->execute()) {
            echo json_encode(['success' => false, 'error' => 'Failed to execute delete statement for track_id ' . $duplicateId . ': ' . $deleteStmt->error]);
            exit;
        }

        $deleteStmt->close();
    } else {
        // ISRC does not match, update the duplicate row
        $updateStmt = $conn->prepare($updateSql);
        if (!$updateStmt) {
            echo json_encode(['success' => false, 'error' => 'Failed to prepare update statement: ' . $conn->error]);
            exit;
        }

        $updateStmt->bind_param("ii", $primaryTrackId, $duplicateId);
        if (!$updateStmt->execute()) {
            echo json_encode(['success' => false, 'error' => 'Failed to execute update statement for duplicate track_id ' . $duplicateId . ': ' . $updateStmt->error]);
            exit;
        }

        $updateStmt->close();
    }
}

$stmt->close();


// 4. Update track_lyrics
$updateLyricsSql = "
    UPDATE katalog1.track_lyrics
    SET track_id = ?
    WHERE track_id IN ($duplicateIds)
";
$stmt = $conn->prepare($updateLyricsSql);
if ($stmt) {
    $stmt->bind_param("i", $primaryTrackId);
    $stmt->execute();
    $stmt->close();
} else {
    echo json_encode(['success' => false, 'error' => 'Failed to prepare statement for updating lyrics']);
    exit;
}

// 5. Update track_spotify_ids
$updateSpotifyIdsSql = "
    UPDATE katalog1.track_spotify_ids
    SET track_id = ?
    WHERE track_id IN ($duplicateIds)
";
$stmt = $conn->prepare($updateSpotifyIdsSql);
if ($stmt) {
    $stmt->bind_param("i", $primaryTrackId);
    $stmt->execute();
    $stmt->close();
} else {
    echo json_encode(['success' => false, 'error' => 'Failed to prepare statement for updating Spotify IDs']);
    exit;
}

// 6. Delete from tracks
$deleteTracksSql = "
    DELETE FROM katalog1.tracks
    WHERE track_id IN ($duplicateIds)
";
if (!$conn->query($deleteTracksSql)) {
    echo json_encode(['success' => false, 'error' => 'Failed to delete from tracks']);
    exit;
}

echo json_encode(['success' => true]);

$conn->close();
?>
