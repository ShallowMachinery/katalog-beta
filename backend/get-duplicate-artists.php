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

$sql = "
    SELECT `artist_name`, GROUP_CONCAT(artist_id) AS artist_ids, COUNT(*) AS duplicate_count
    FROM `katalog1`.`artists`
    GROUP BY `artist_name`
    HAVING COUNT(*) > 1
";

$result = $conn->query($sql);

if ($result) {
    $duplicates = [];
    while ($row = $result->fetch_assoc()) {
        $artist_ids = $row['artist_ids'];
        $album_sql = "
            SELECT a.`album_id`, a.`album_name`, aa.`artist_id`, ar.`artist_name`, ar.`artist_vanity`, ar.`artist_type`, ar.`artist_spotify_id`
            FROM `katalog1`.`albums` a
            JOIN `katalog1`.`album_artists` aa ON a.`album_id` = aa.`album_id`
            JOIN `katalog1`.`artists` ar ON aa.`artist_id` = ar.`artist_id`
            WHERE aa.`artist_id` IN ($artist_ids)
            GROUP BY a.`album_id`, ar.`artist_id`
        ";
        $album_result = $conn->query($album_sql);
        $albums = [];
        if ($album_result) {
            while ($album_row = $album_result->fetch_assoc()) {
                $albums[] = $album_row;
            }
        }
        $track_sql = "
            SELECT t.`track_id`, t.`track_name`, ta.`artist_id`, ar.`artist_name`, ar.`artist_vanity`, ar.`artist_type`, ar.`artist_spotify_id`
            FROM `katalog1`.`tracks` t
            JOIN `katalog1`.`track_artists` ta ON t.`track_id` = ta.`track_id`
            JOIN `katalog1`.`artists` ar ON ta.`artist_id` = ar.`artist_id`
            WHERE ta.`artist_id` IN ($artist_ids)
            GROUP BY t.`track_id`, ar.`artist_id`
        ";
        $track_result = $conn->query($track_sql);
        $tracks = [];
        if ($track_result) {
            while ($track_row = $track_result->fetch_assoc()) {
                $tracks[] = $track_row;
            }
        }
        $row['albums'] = $albums;
        $row['tracks'] = $tracks;
        $duplicates[] = $row;
    }

    echo json_encode($duplicates);
} else {
    echo json_encode(['error' => 'Error fetching duplicate artists']);
}

$conn->close();
?>
