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

    try {
        // Optional: Check for the access token if you want to validate the user session
        if (strpos($accessToken, 'Bearer ') === 0) {
            $accessToken = substr($accessToken, 7);
        }
        $key = new Key($secretKey, 'HS256');
        $decoded = JWT::decode($accessToken, $key);

        // Query to get contributions for all users
        $stmt = $conn->prepare("
        SELECT
            c.`user_id` AS `userId`,
            u.`user_name` AS `userName`,
            u.`user_hierarchy` AS `userHierarchy`,
            u.`user_type_name` AS `userTypeName`,
            c.`contribution_id` AS `contributionId`,
            c.`contribution_type` AS `contributionType`,
            c.`lyrics_id` AS `lyricsId`,
            t.`track_id` AS `trackId`,
            t.`track_name` AS `trackName`,
            t.`track_vanity` AS `trackVanity`,
            a.`artist_id` AS `artistId`, 
            a.`artist_name` AS `artistName`,
            a.`artist_vanity` AS `artistVanity`, 
            MAX(al.`album_cover_url`) AS `albumCoverUrl`,  
            c.`points_given` AS `pointsGiven`,
            c.`created_at` AS `createdAt`
        FROM `katalog1`.`User_Contributions` c
        JOIN `katalog1`.`Accounts` u ON c.`user_id` = u.`user_id`
        JOIN `katalog1`.`Tracks` t ON c.`track_id` = t.`track_id`
        JOIN `katalog1`.`Artists` a ON t.`track_main_artist_id` = a.`artist_id`
        JOIN `katalog1`.`Track_Albums` ta ON t.`track_id` = ta.`track_id`
        JOIN `katalog1`.`Albums` al ON ta.`album_id` = al.`album_id`
        WHERE c.`contribution_type` NOT IN ('deleted_lyrics', 'unverified_lyrics')
        GROUP BY c.`lyrics_id`, c.`track_id`, a.`artist_id`, c.`created_at`
        ORDER BY c.`created_at` DESC
        LIMIT 100;
        ");

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
