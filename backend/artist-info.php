<?php
require 'config.php'; 

$artistVanity = $_GET['artistVanity'] ?? '';

$stmt = $conn->prepare("
    SELECT 
        `artist_name` AS `artistName`,
        `artist_type` AS `artistType`,
        `artist_picture_link` AS `artistPictureUrl`,
        `artist_spotify_id` AS `artistSpotifyId`
    FROM 
        `katalog1`.`Artists`
    WHERE 
        `artist_vanity` = ?
");
$stmt->bind_param("s", $artistVanity);
$stmt->execute();
$result = $stmt->get_result();
$artistInfo = $result->fetch_assoc();

echo json_encode($artistInfo);

$stmt->close();
$conn->close();
?>
