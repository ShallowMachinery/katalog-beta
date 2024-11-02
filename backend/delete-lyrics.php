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
$trackId = $data['trackId'] ?? null;
$lyricsId = $data['lyricsId'] ?? null;
$submitterId = $data['submitterId'] ?? null;
$userId = $decoded->data->user_id;

if (!$lyricsId || !$submitterId) {
    echo json_encode(['status' => 'error', 'message' => 'Missing lyrics ID or submitter ID.']);
    exit;
}

$pointsToDeduct = 15;
$pointsToVerifier = 0;
$activityType = 'deleted_lyrics';

$conn->begin_transaction();

// Make sure we won't delete the lyric row if there's only one row left
try {
    $stmtCheckIfOnlyOneLyrics = $conn->prepare("SELECT COUNT(*) AS `lyrics_count` FROM `katalog1`.`track_lyrics` WHERE `track_id` = ?");
    $stmtCheckIfOnlyOneLyrics->bind_param("i", $trackId);
    $stmtCheckIfOnlyOneLyrics->execute();

    $result = $stmtCheckIfOnlyOneLyrics->get_result();
    $row = $result->fetch_assoc();
    $lyricsCount = $row['lyrics_count'];

    $stmtCheckIfOnlyOneLyrics->close();

    // Check if there's more than one lyric entry
    if ($lyricsCount > 1) {
        // Proceed with the deletion if there's more than one lyric row
        $stmtDeleteLyrics = $conn->prepare("DELETE FROM `katalog1`.`track_lyrics` WHERE `lyrics_id` = ?");
        $stmtDeleteLyrics->bind_param("i", $lyricsId);
        $stmtDeleteLyrics->execute();
        $stmtDeleteLyrics->close();
    } else {
        $stmtDeleteOnlyLyrics = $conn->prepare("UPDATE `katalog1`.`track_lyrics` SET lyrics = '', `last_contributor_id` = 1, `verified` = NULL, `verifier_id` = NULL, `language` = NULL WHERE `lyrics_id` = ?");
        $stmtDeleteOnlyLyrics->bind_param("i", $lyricsId);
        $stmtDeleteOnlyLyrics->execute();
        $stmtDeleteOnlyLyrics->close();
    }

    $stmtActivity = $conn->prepare("INSERT INTO `katalog1`.`User_Activities` (`user_id`, `activity_type`) VALUES (?, ?)");
    $stmtActivity->bind_param("is", $userId, $activityType);
    $stmtActivity->execute();
    $stmtActivity->close();

    
    $stmtContribution = $conn->prepare("INSERT INTO `katalog1`.`User_Contributions` (`user_id`, `contribution_id`, `contribution_type`, `points_given`, `track_id`, `lyrics_id`) VALUES (?, ?, ?, ?, ?, ?)");
    $contributionId = $conn->insert_id;
    $stmtContribution->bind_param("iisiii", $userId, $contributionId, $activityType, $pointsToVerifier, $trackId, $lyricsId);
    $stmtContribution->execute();
    $stmtContribution->close();

    if ($decoded->data->user_hierarchy != '1') {
        $stmtSubmitterPoints = $conn->prepare("UPDATE `katalog1`.`User_Points` SET `user_points` = `user_points` - ? WHERE `user_id` = ?");
        $stmtSubmitterPoints->bind_param("ii", $pointsToDeduct, $submitterId);
        $stmtSubmitterPoints->execute();
        $stmtSubmitterPoints->close();
    }

    $conn->commit();
    echo json_encode(['status' => 'success', 'message' => 'Lyrics deleted successfully.']);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['status' => 'error', 'message' => 'Deletion failed: ' . $e->getMessage()]);
}