<?php
require 'config.php'; 

$artistVanity = $_GET['artistVanity'] ?? '';

$stmt = $conn->prepare("
    SELECT 
        al.`album_id` AS `albumId`,
        al.`album_name` AS `albumName`,
        al.`release_type` AS `albumType`, 
        al.`album_vanity` AS `albumVanity`,
        al.`album_cover_url` AS `albumCoverUrl`,
        al.`release_date` AS `releaseDate`,
        a2.`artist_vanity` AS `artistVanity`
    FROM 
        `katalog1`.`Albums` al
    JOIN 
        `katalog1`.`Album_Artists` aa ON al.`album_id` = aa.`album_id`
    JOIN 
        `katalog1`.`Artists` a ON aa.`artist_id` = a.`artist_id`
    JOIN 
        `katalog1`.`Album_Artists` aa2 ON al.`album_id` = aa2.`album_id`
    JOIN 
        `katalog1`.`Artists` a2 ON aa2.`artist_id` = a2.`artist_id`
    WHERE 
        a.`artist_vanity` = ?
    ORDER BY 
        al.`release_date` DESC
");

$stmt->bind_param("s", $artistVanity);
$stmt->execute();
$result = $stmt->get_result();

$albums = [];
while ($row = $result->fetch_assoc()) {
    $albums[] = $row;
}

echo json_encode(['albums' => $albums]);

$stmt->close();
$conn->close();
?>
