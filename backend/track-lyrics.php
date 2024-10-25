<?php
require 'config.php'; 

$trackId = $_GET['trackId'] ?? '';
$artistId = $_GET['artistId'] ?? '';

$stmt = $conn->prepare("
    SELECT 
        tl.`lyrics`,
        tl.`last_contributor_id` AS `lastContributorId`, 
        tl.`updated_at` AS `updateTimestamp`,
        u.`user_id` AS `userId`,
        u.`first_name` AS `firstName`,
        u.`last_name` AS `lastName`,
        u.`user_name` AS `userName`,
        u.`user_type_name` AS `userType`
    FROM 
        `katalog1`.`Track_Lyrics` tl
    JOIN 
        `katalog1`.`Tracks` t ON tl.`track_id` = t.`track_id`
    JOIN 
        `katalog1`.`Artists` a ON t.`track_main_artist_id` = a.`artist_id`
    JOIN 
        `katalog1`.`Accounts` u ON tl.`last_contributor_id` = u.`user_id`
    WHERE 
        t.`track_id` = ? AND a.`artist_id` = ?
    ORDER BY 
        tl.`lyrics_id` DESC
    LIMIT 1;
");
$stmt->bind_param("ii", $trackId, $artistId);
$stmt->execute();
$result = $stmt->get_result();
$lyrics = $result->fetch_assoc();

echo json_encode($lyrics);

$stmt->close();
$conn->close();
?>