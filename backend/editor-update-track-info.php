<?php
require 'config.php';
require 'vendor/autoload.php';

use Dotenv\Repository\Adapter\WriterInterface;
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
$trackId = $data['trackId'] ?? null;
$trackName = $data['trackName'] ?? null;
$isExplicit = $data['isExplicit'] ?? null;
$trackWriters = array_map(function ($item) {
    return $item['composerName'];
}, $data['trackWriters'] ?? []);
$trackISRCs = array_map(function ($item) {
    return $item['isrc'];
}, $data['trackISRCs'] ?? []);
$trackGenreId = $data['trackGenreId'] ?? null;
$trackGenre = $data['trackGenre'] ?? null;
$trackLanguage = $data['trackLanguage'] ?? null;
$contributorId = $decoded->data->user_id ?? null;
$userHierarchy = $decoded->data->user_hierarchy ?? null;
$isAdmin = ($userHierarchy === 1);

if (!$trackId || !$trackName) {
    echo json_encode(['status' => 'error', 'message' => 'Missing track ID or track name.']);
    exit;
}

$conn->begin_transaction();

try {
    // Update track info
    $stmt = $conn->prepare("
        UPDATE `katalog1`.`Tracks`
        SET `track_name` = ?, `explicit` = ?
        WHERE `track_id` = ?");
    if (!$stmt) {
        throw new Exception('Failed to prepare track update statement: ' . $conn->error);
    }
    $stmt->bind_param("sii", $trackName, $isExplicit, $trackId);
    if (!$stmt->execute()) {
        throw new Exception('Failed to update track information: ' . $stmt->error);
    }
    $stmt->close();

    // Update or add track genre
    if ($trackGenreId && $trackGenre) {
        $stmt = $conn->prepare("SELECT `genre_id` FROM `katalog1`.`Track_Genres` WHERE `track_id` = ?");
        if (!$stmt) {
            throw new Exception('Failed to prepare check genre statement: ' . $conn->error);
        }
        $stmt->bind_param("i", $trackId);
        $stmt->execute();
        $result = $stmt->get_result();
        $existingGenre = $result->fetch_assoc();
        $stmt->close();

        if ($existingGenre) {
            $stmt = $conn->prepare("UPDATE `katalog1`.`Track_Genres` SET `genre_id` = ? WHERE `track_id` = ?");
            if (!$stmt) {
                throw new Exception('Failed to prepare genre update statement: ' . $conn->error);
            }
            $stmt->bind_param("ii", $trackGenreId, $trackId);
        } else {
            $stmt = $conn->prepare("INSERT INTO `katalog1`.`Track_Genres` (`track_id`, `genre_id`) VALUES (?, ?)");
            if (!$stmt) {
                throw new Exception('Failed to prepare genre insert statement: ' . $conn->error);
            }
            $stmt->bind_param("ii", $trackId, $trackGenreId);
        }

        if (!$stmt->execute()) {
            throw new Exception('Failed to update/add track genre: ' . $stmt->error);
        }
        $stmt->close();
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Missing track genre information.']);
        exit;
    }

    // Add/update track ISRCs
    // Firstly, select all isrcs of a track in track_external_ids table, column isrc
    // Compare trackISRC from the data to the isrcs in the database
    // if a trackISRC from the data matches an isrc for that track in the database, skip it
    // if a trackISRC from the data doesn't match an isrc for that track in the database, add it
    // if an ISRC from the database is not in the trackISRC from the data, remove it

    // Handle ISRCs
    if (!empty($trackISRCs)) {
        // Select all current ISRCs for the track
        $stmt = $conn->prepare("SELECT `isrc` FROM `katalog1`.`track_external_ids` WHERE `track_id` = ?");
        if (!$stmt) {
            throw new Exception('Failed to prepare ISRC select statement: ' . $conn->error);
        }
        $stmt->bind_param("i", $trackId);
        $stmt->execute();
        $existingISRCsResult = $stmt->get_result();
        $existingISRCs = [];
        while ($row = $existingISRCsResult->fetch_assoc()) {
            $existingISRCs[] = $row['isrc'];
        }
        $stmt->close();

        // Compare ISRCs and insert or remove as necessary
        foreach ($trackISRCs as $trackISRC) {
            if (is_array($trackISRC)) {
                echo json_encode(['status' => 'error', 'message' => 'Invalid ISRC value: Array found.']);
                exit;
            }
            if (!in_array($trackISRC, $existingISRCs)) {
                // ISRC does not exist, insert it
                $stmt = $conn->prepare("INSERT INTO `katalog1`.`track_external_ids` (`track_id`, `isrc`) VALUES (?, ?)");
                if (!$stmt) {
                    throw new Exception('Failed to prepare ISRC insert statement: ' . $conn->error);
                }
                $stmt->bind_param("is", $trackId, $trackISRC);
                if (!$stmt->execute()) {
                    throw new Exception('Failed to add ISRC: ' . $stmt->error);
                }
                $stmt->close();
            }
        }

        // Remove ISRCs not in the new list
        foreach ($existingISRCs as $existingISRC) {
            if (!in_array($existingISRC, $trackISRCs)) {
                // ISRC is no longer in the list, remove it
                $stmt = $conn->prepare("DELETE FROM `katalog1`.`track_external_ids` WHERE `track_id` = ? AND `isrc` = ?");
                if (!$stmt) {
                    throw new Exception('Failed to prepare ISRC delete statement: ' . $conn->error);
                }
                $stmt->bind_param("is", $trackId, $existingISRC);
                if (!$stmt->execute()) {
                    throw new Exception('Failed to remove ISRC: ' . $stmt->error);
                }
                $stmt->close();
            }
        }
    }

    // Handle writers
    if (!empty($trackWriters)) {
        // Select all writers
        $stmt = $conn->prepare("
            SELECT `composer_id`, `composer_name` FROM `katalog1`.`composers`;");
        if (!$stmt) {
            throw new Exception('Failed to prepare writer select statement: ' . $conn->error);
        }
        $stmt->execute();
        $existingWritersResult = $stmt->get_result();
        $existingWriters = [];
        while ($row = $existingWritersResult->fetch_assoc()) {
            $existingWriters[$row['composer_name']] = $row['composer_id'];
        }
        $stmt->close();

        // Add or update writers
        foreach ($trackWriters as $writer) {
            if (is_array($writer)) {
                echo json_encode(['status' => 'error', 'message' => 'Invalid writer value: Array found.']);
                exit;
            }

            if (!isset($existingWriters[$writer])) {
                // Add new writer to composers table
                $stmt = $conn->prepare("INSERT INTO `katalog1`.`composers` (`composer_name`) VALUES (?)");
                if (!$stmt) {
                    throw new Exception('Failed to prepare writer insert statement: ' . $conn->error);
                }
                $stmt->bind_param("s", $writer);
                if (!$stmt->execute()) {
                    throw new Exception('Failed to add writer: ' . $stmt->error);
                }
                $composerId = $stmt->insert_id;
                $stmt->close();

                // Associate new writer with track
                $stmt = $conn->prepare("INSERT INTO `katalog1`.`track_composers` (`track_id`, `composer_id`) VALUES (?, ?)");
                if (!$stmt) {
                    throw new Exception('Failed to prepare track_composers insert statement: ' . $conn->error);
                }
                $stmt->bind_param("ii", $trackId, $composerId);
                if (!$stmt->execute()) {
                    throw new Exception('Failed to associate writer with track: ' . $stmt->error);
                }
                $stmt->close();
            } else {
                // If writer already exists, just associate them with the track
                $composerId = $existingWriters[$writer]; // Get the composer_id of the existing writer
                $stmt = $conn->prepare("INSERT INTO `katalog1`.`track_composers` (`track_id`, `composer_id`) VALUES (?, ?)");
                if (!$stmt) {
                    throw new Exception('Failed to prepare track_composers insert statement: ' . $conn->error);
                }
                $stmt->bind_param("ii", $trackId, $composerId);
                if (!$stmt->execute()) {
                    throw new Exception('Failed to associate existing writer with track: ' . $stmt->error);
                }
                $stmt->close();
            }
        }

        // Remove writers not in the new list
        foreach ($existingWriters as $existingWriter) {
            if (!in_array($existingWriter, $trackWriters)) {
                // Remove writer from track_composers
                $stmt = $conn->prepare("
                    DELETE FROM `katalog1`.`track_composers`
                        WHERE `track_id` = ?
                        AND `composer_id` IN
                            (SELECT `composer_id`
                            FROM `katalog1`.`composers`
                            WHERE `composer_name` = ?)
                    ");
                if (!$stmt) {
                    throw new Exception('Failed to prepare writer delete statement: ' . $conn->error);
                }
                $stmt->bind_param("is", $trackId, $existingWriter);
                if (!$stmt->execute()) {
                    throw new Exception('Failed to remove writer from track: ' . $stmt->error);
                }
                $stmt->close();
            }
        }
    }

    // Update track language
    $stmt = $conn->prepare("
        UPDATE `katalog1`.`Track_Lyrics`
        SET `language` = ?
        WHERE `track_id` = ?
        AND `lyrics_id` = (
            SELECT `lyrics_id`
            FROM `katalog1`.`Track_Lyrics`
            WHERE `track_id` = ?
            ORDER BY `created_at` DESC
            LIMIT 1
        )");
    if (!$stmt) {
        throw new Exception('Failed to prepare track update statement: ' . $conn->error);
    }
    $stmt->bind_param("sii", $trackLanguage, $trackId, $trackId);
    if (!$stmt->execute()) {
        throw new Exception('Failed to update track language: ' . $stmt->error);
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