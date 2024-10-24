<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require 'config.php'; 

$artistVanity = $_GET['artistVanity'] ?? '';

$stmt = $conn->prepare("
    SELECT 
        `artist_name` AS `artistName`,
        `artist_type` AS `artistType`,
        `artist_picture_link` AS `artistPictureUrl`
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
