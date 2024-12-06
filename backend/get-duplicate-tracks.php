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
    SELECT t.track_name, a.artist_name, GROUP_CONCAT(t.track_id) AS track_ids, COUNT(*) AS duplicate_count, t.creation_date AS date_added
    FROM katalog1.tracks t
    JOIN katalog1.artists a ON t.track_main_artist_id = a.artist_id
    GROUP BY t.track_name, a.artist_name
    HAVING COUNT(*) > 1
    ORDER BY t.track_name ASC;
";

$result = $conn->query($sql);

if ($result) {
    $duplicates = [];

    while ($row = $result->fetch_assoc()) {
        $track_ids = $row['track_ids'];
        $trackDetailsSql = "
            SELECT t.track_id, t.track_name, t.track_vanity, t.track_main_artist_id, ar.artist_name, ar.artist_vanity, ar.artist_id, al.album_name, al.release_date, t.duration, te.isrc, ts.track_spotify_id
            FROM katalog1.tracks t
            JOIN katalog1.artists ar ON t.track_main_artist_id = ar.artist_id
            JOIN katalog1.track_albums ta1 ON t.track_id = ta1.track_id
            JOIN katalog1.albums al ON ta1.album_id = al.album_id
            JOIN katalog1.track_external_ids te ON t.track_id = te.track_id
            JOIN katalog1.track_spotify_ids ts ON t.track_id = ts.track_id
            WHERE t.track_id IN ($track_ids)
            GROUP BY t.track_id
        ";
        $trackDetailsResult = $conn->query($trackDetailsSql);
        $trackDetails = [];

        if ($trackDetailsResult) {
            while ($detailRow = $trackDetailsResult->fetch_assoc()) {
                $trackDetails[] = $detailRow;
            }
        }

        $row['track_details'] = $trackDetails;
        $duplicates[] = $row;
    }

    echo json_encode($duplicates);
} else {
    echo json_encode(['error' => 'Error fetching duplicate tracks']);
}

$conn->close();
?>
