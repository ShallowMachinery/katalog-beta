<?php
require 'config.php';
require 'vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;

$response = array('success' => false, 'message' => '', 'contributions' => null);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $headers = apache_request_headers();
    $accessToken = $headers['Authorization'] ?? '';
    $username = $_GET['username'] ?? null;

    try {
        if (strpos($accessToken, 'Bearer ') === 0) {
            $accessToken = substr($accessToken, 7);
        }
        $key = new Key($secretKey, 'HS256');
        $decoded = JWT::decode($accessToken, $key);

        if (isset($decoded->data) && isset($decoded->data->user_id)) {
            $stmt = $conn->prepare("
            SELECT 
                tl.`lyrics_id` AS `lyricsId`, 
                tl.`track_id` AS `trackId`, 
                t.`track_name` AS `trackName`, 
                a.`artist_id` AS `artistId`, 
                a.`artist_name` AS `artistName`,
                a.`artist_vanity` AS `artistVanity`, 
                MIN(al.`album_cover_url`) AS `albumCoverUrl`,  
                tl.`lyrics` AS `lyrics`, 
                tl.`updated_at` AS `updatedAt`
            FROM 
                `katalog1`.`Track_lyrics` tl
            JOIN 
                `katalog1`.`Tracks` t ON tl.`track_id` = t.`track_id`
            JOIN 
                `katalog1`.`Artists` a ON t.`track_main_artist_id` = a.`artist_id`
            JOIN 
                `katalog1`.`Track_Albums` ta ON t.`track_id` = ta.`track_id`
            JOIN 
                `katalog1`.`Albums` al ON ta.`album_id` = al.`album_id`
            JOIN
                `katalog1`.`Accounts` ac ON tl.`last_contributor_id` = ac.`user_id`
            WHERE 
                ac.`user_name` = ?
                AND tl.`lyrics` != ''
            GROUP BY 
                tl.`lyrics_id`, t.`track_id`, a.`artist_id`, tl.`updated_at`
            ORDER BY 
                tl.`updated_at` DESC
            LIMIT 20;
            ");

            // Bind the userId parameter and execute the statement
            $stmt->bind_param("s", $username);
            $stmt->execute();
            $result = $stmt->get_result();

            $contributions = [];
            while ($row = $result->fetch_assoc()) {
                $contributions[] = $row;
            }

            $response['success'] = true;
            $response['contributions'] = $contributions;

            // Close the statement and connection
            $stmt->close();
        } else {
            $response['message'] = 'Invalid token structure.';
        }
    } catch (ExpiredException $e) {
        $response['message'] = 'Access token has expired.';
    } catch (Exception $e) {
        $response['message'] = 'Invalid access token.';
    }
} else {
    $response['message'] = 'Invalid request method.';
}

// Output the response as JSON
echo json_encode($response);

// Close the connection
$conn->close();
?>
