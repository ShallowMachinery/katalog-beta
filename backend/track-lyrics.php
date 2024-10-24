<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require 'config.php'; 

$trackVanity = $_GET['trackVanity'] ?? '';
$artistVanity = $_GET['artistVanity'] ?? '';

$stmt = $conn->prepare("
    SELECT 
        tl.`lyrics`
    FROM 
        `katalog1`.`Track_Lyrics` tl
    JOIN 
        `katalog1`.`Tracks` t ON tl.`track_id` = t.`track_id`
    JOIN 
        `katalog1`.`Track_Artists` ta ON t.`track_id` = ta.`track_id`
    JOIN 
        `katalog1`.`Artists` a ON ta.`artist_id` = a.`artist_id`
    WHERE 
        t.`track_vanity` = ? AND a.`artist_vanity` = ?
    ORDER BY 
        tl.`lyrics_id` DESC
    LIMIT 1
");
$stmt->bind_param("ss", $trackVanity, $artistVanity);
$stmt->execute();
$result = $stmt->get_result();
$lyrics = $result->fetch_assoc();

echo json_encode($lyrics);

$stmt->close();
$conn->close();
?>