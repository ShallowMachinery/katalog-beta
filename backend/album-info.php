<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require 'config.php'; 

$albumVanity = $_GET['albumVanity'] ?? '';
$artistVanity = $_GET['artistVanity'] ?? '';

if (empty($albumVanity) || empty($artistVanity)) {
    echo json_encode(['status' => 'error', 'message' => 'Missing albumVanity or artistVanity parameters']);
    exit;
}

$stmt = $conn->prepare("
    SELECT 
        al.`album_id` AS `albumId`,
        al.`album_name` AS `albumName`,
        al.`album_vanity` AS `albumVanity`,
        al.`release_date` AS `releaseDate`,
        al.`release_type` AS `albumType`, 
        al.`album_cover_url` AS `albumCoverUrl`,
        a.`artist_name` AS `artistName`,
        a.`artist_vanity` AS `artistVanity`
    FROM 
        `katalog1`.`Albums` al
    JOIN 
        `katalog1`.`Album_Artists` aa ON al.`album_id` = aa.`album_id`
    JOIN 
        `katalog1`.`Artists` a ON aa.`artist_id` = a.`artist_id`
    WHERE 
        al.`album_vanity` = ? AND a.`artist_vanity` = ? 
    LIMIT 1
");

if (!$stmt) {
    echo json_encode(['status' => 'error', 'message' => 'Prepared statement failed: ' . $conn->error]);
    exit;
}

$stmt->bind_param("ss", $albumVanity, $artistVanity);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $albumInfo = $result->fetch_assoc();
    echo json_encode($albumInfo);
} else {
    echo json_encode(['status' => 'error', 'message' => 'No album found']);
}

$stmt->close();
$conn->close();
?>
