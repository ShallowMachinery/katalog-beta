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
} catch (ExpiredException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Access token has expired.']);
    exit;
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid access token.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$trackId = $data['trackId'] ?? null;
$newLyrics = $data['newLyrics'] ?? null;
$language = $data['languageResult'] ?? null;
$contributorId = $decoded->data->user_id ?? null;

if (!$trackId || !$newLyrics) {
    echo json_encode(['status' => 'error', 'message' => 'Missing track ID or lyrics data.', 'trackId' => $trackId, 'newLyrics' => $newLyrics]);
    exit;
}

if ($trackId && $newLyrics) {
    $stmt = $conn->prepare("SELECT `lyrics_id`, `lyrics` FROM `katalog1`.`Track_Lyrics` WHERE `track_id` = ? ORDER BY `lyrics_id` DESC LIMIT 1");
    if (!$stmt) {
        echo json_encode(['status' => 'error', 'message' => 'Failed to prepare statement: ' . $conn->error]);
        exit;
    }
    $stmt->bind_param("i", $trackId);
    $stmt->execute();
    $result = $stmt->get_result();
    $existingLyrics = $result->fetch_assoc();
    $stmt->close();

    if ($existingLyrics && $existingLyrics['lyrics'] === '') {
        $stmt = $conn->prepare("UPDATE `katalog1`.`Track_Lyrics` SET `lyrics` = ?, `language` = ?, `last_contributor_id` = ? WHERE `lyrics_id` = ?");
        if (!$stmt) {
            echo json_encode(['status' => 'error', 'message' => 'Failed to prepare update statement: ' . $conn->error]);
            exit;
        }
        $stmt->bind_param("ssii", $newLyrics, $language, $contributorId, $existingLyrics['lyrics_id']);

        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Lyrics updated successfully.']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to update lyrics: ' . $stmt->error]);
        }

        $stmt->close();
    } else {
        // If lyrics already exist, insert a new row
        $stmt = $conn->prepare("INSERT INTO `katalog1`.`Track_Lyrics` (`track_id`, `lyrics`, `last_contributor_id`, `language`) VALUES (?, ?, ?, ?)");
        if (!$stmt) {
            echo json_encode(['status' => 'error', 'message' => 'Failed to prepare insert statement: ' . $conn->error]);
            exit;
        }
        $stmt->bind_param("isis", $trackId, $newLyrics, $contributorId, $language);

        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Lyrics added successfully.']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to add lyrics: ' . $stmt->error]);
        }

        $stmt->close();
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid track ID or lyrics data.']);
}

$conn->close();
?>
