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

$pointsToAdd = 15;
$pointsToVerifier = 2;
$activityType = 'verified_lyrics';

$conn->begin_transaction();

try {
    $stmtVerify = $conn->prepare("UPDATE `katalog1`.`Track_Lyrics` SET `verified` = 1 WHERE `lyrics_id` = ?");
    $stmtVerify->bind_param("i", $lyricsId);
    $stmtVerify->execute();
    $stmtVerify->close();

    $stmtSetVerifier = $conn->prepare("UPDATE `katalog1`.`Track_Lyrics` SET `verifier_id` = ? WHERE `lyrics_id` = ?");
    $stmtSetVerifier->bind_param("ii", $userId, $lyricsId);
    $stmtSetVerifier->execute();
    $stmtSetVerifier->close();

    $stmtActivity = $conn->prepare("INSERT INTO `katalog1`.`User_Activities` (`user_id`, `activity_type`) VALUES (?, ?)");
    $stmtActivity->bind_param("is", $userId, $activityType);
    $stmtActivity->execute();
    $stmtActivity->close();

    $stmtContribution = $conn->prepare("INSERT INTO `katalog1`.`User_Contributions` (`user_id`, `contribution_id`, `contribution_type`, `points_given`, `track_id`, `lyrics_id`) VALUES (?, ?, ?, ?, ?, ?)");
    $contributionId = $conn->insert_id;
    $stmtContribution->bind_param("iisiii", $userId, $contributionId, $activityType, $pointsToVerifier, $trackId, $lyricsId);
    $stmtContribution->execute();
    $stmtContribution->close();

    $stmtSubmitterPoints = $conn->prepare("UPDATE `katalog1`.`User_Points` SET `user_points` = `user_points` + ? WHERE `user_id` = ?");
    $stmtSubmitterPoints->bind_param("ii", $pointsToAdd, $submitterId);
    $stmtSubmitterPoints->execute();
    $stmtSubmitterPoints->close();

    $stmtVerifierPoints = $conn->prepare("UPDATE `katalog1`.`User_Points` SET `user_points` = `user_points` + ? WHERE `user_id` = ?");
    $stmtVerifierPoints->bind_param("ii", $pointsToVerifier, $userId);
    $stmtVerifierPoints->execute();
    $stmtVerifierPoints->close();

    $conn->commit();
    echo json_encode(['status' => 'success', 'message' => 'Lyrics verified successfully.']);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['status' => 'error', 'message' => 'Verification failed: ' . $e->getMessage()]);
}