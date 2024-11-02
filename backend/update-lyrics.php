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
$userHierarchy = $decoded->data->user_hierarchy ?? null;
$isAdmin = ($userHierarchy === 1);

if (!$trackId || !$newLyrics) {
    echo json_encode(['status' => 'error', 'message' => 'Missing track ID or lyrics data.', 'trackId' => $trackId, 'newLyrics' => $newLyrics]);
    exit;
}

$pointsToAdd = 0;
$activityType = '';
$lyricsId = null;

if ($trackId && $newLyrics) {
    $stmt = $conn->prepare("
        SELECT `lyrics_id`, `lyrics`
        FROM `katalog1`.`Track_Lyrics`
        WHERE `track_id` = ?
        ORDER BY `lyrics_id`
        DESC LIMIT 1");
    if (!$stmt) {
        echo json_encode(['status' => 'error', 'message' => 'Failed to prepare statement: ' . $conn->error]);
        exit;
    }
    $stmt->bind_param("i", $trackId);
    $stmt->execute();
    $result = $stmt->get_result();
    $existingLyrics = $result->fetch_assoc();
    $stmt->close();

    // Determine points based on content of newLyrics
    if ($existingLyrics && $newLyrics === '@INSTRUMENTAL') {
        $pointsToAdd = 2;
        $activityType = 'added_lyrics';
        $lyricsId = $existingLyrics['lyrics_id'];
    } elseif ($existingLyrics && $existingLyrics['lyrics'] === '' && $newLyrics != '@INSTRUMENTAL') {
        $pointsToAdd = 8;
        $activityType = 'added_lyrics';
        $lyricsId = $existingLyrics['lyrics_id'];
    } else {
        $pointsToAdd = 5;
        $activityType = 'updated_lyrics';
    }

    if ($existingLyrics && $existingLyrics['lyrics'] === '') {
        if ($isAdmin) {
            $stmt = $conn->prepare("
                UPDATE `katalog1`.`Track_Lyrics`
                SET `lyrics` = ?, `language` = ?, `last_contributor_id` = ?, `verified` = 1, `verifier_id` = 1
                WHERE `lyrics_id` = ?");
            if (!$stmt) {
                echo json_encode(['status' => 'error', 'message' => 'Failed to prepare update statement: ' . $conn->error]);
                exit;
            }
            $stmt->bind_param("ssii", $newLyrics, $language, $contributorId, $lyricsId);
        } else {
            $stmt = $conn->prepare("
                UPDATE `katalog1`.`Track_Lyrics`
                SET `lyrics` = ?, `language` = ?, `last_contributor_id` = ?
                WHERE `lyrics_id` = ?");
            if (!$stmt) {
                echo json_encode(['status' => 'error', 'message' => 'Failed to prepare update statement: ' . $conn->error]);
                exit;
            }
            $stmt->bind_param("ssii", $newLyrics, $language, $contributorId, $lyricsId);
        }
        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Lyrics updated successfully.']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to update lyrics: ' . $stmt->error]);
        }
        $stmt->close();
    } else {
        if ($isAdmin) {
            $stmt = $conn->prepare("
                INSERT INTO `katalog1`.`Track_Lyrics`
                (`track_id`, `lyrics`, `last_contributor_id`, `language`, `verified`, `verifier_id`)
                VALUES (?, ?, ?, ?, 1, 1)");
            if (!$stmt) {
                echo json_encode(['status' => 'error', 'message' => 'Failed to prepare insert statement: ' . $conn->error]);
                exit;
            }
            $stmt->bind_param("isis", $trackId, $newLyrics, $contributorId, $language);
        } else {
            $stmt = $conn->prepare("
                INSERT INTO `katalog1`.`Track_Lyrics`
                (`track_id`, `lyrics`, `last_contributor_id`, `language`)
                VALUES (?, ?, ?, ?)");
            if (!$stmt) {
                echo json_encode(['status' => 'error', 'message' => 'Failed to prepare insert statement: ' . $conn->error]);
                exit;
            }
            $stmt->bind_param("isis", $trackId, $newLyrics, $contributorId, $language);
        }
        if ($stmt->execute()) {
            $lyricsId = $conn->insert_id;
            echo json_encode(['status' => 'success', 'message' => 'Lyrics added successfully.']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to add lyrics: ' . $stmt->error]);
        }

        $stmt->close();
    }

    $stmtActivity = $conn->prepare("INSERT INTO `katalog1`.`User_Activities` (`user_id`, `activity_type`) VALUES (?, ?)");
    if ($stmtActivity) {
        $stmtActivity->bind_param("is", $contributorId, $activityType);
        if (!$stmtActivity->execute()) {
            echo json_encode(['status' => 'error', 'message' => 'Failed to log activity: ' . $stmtActivity->error]);
        }
        $stmtActivity->close();
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to prepare activity statement: ' . $conn->error]);
    }

    $contributionType = $activityType;
    $stmtContribution = $conn->prepare("INSERT INTO `katalog1`.`User_Contributions` (`user_id`, `contribution_id`, `contribution_type`, `points_given`, `track_id`, `lyrics_id`) VALUES (?, ?, ?, ?, ?, ?)");
    if ($stmtContribution) {
        $contributionId = $conn->insert_id;
        $stmtContribution->bind_param("iisiii", $contributorId, $contributionId, $contributionType, $pointsToAdd, $trackId, $lyricsId);
        if (!$stmtContribution->execute()) {
            echo json_encode(['status' => 'error', 'message' => 'Failed to log contribution: ' . $stmtContribution->error]);
        }
        $stmtContribution->close();
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to prepare contribution statement: ' . $conn->error]);
    }

    if ($pointsToAdd > 0) {
        $stmt = $conn->prepare("UPDATE `katalog1`.`User_Points` SET `user_points` = `user_points` + ? WHERE `user_id` = ?");
        if (!$stmt) {
            echo json_encode(['status' => 'error', 'message' => 'Failed to prepare update points statement: ' . $conn->error]);
            exit;
        }
        $stmt->bind_param("ii", $pointsToAdd, $contributorId);

        if (!$stmt->execute()) {
            echo json_encode(['status' => 'error', 'message' => 'Failed to update user points: ' . $stmt->error]);
        }
        $stmt->close();
    }

} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid track ID or lyrics data.']);
}

$conn->close();
?>