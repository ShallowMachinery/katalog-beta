<?php
require 'config.php'; 

$stmt = $conn->prepare("
    SELECT 
        (SELECT COUNT(*) FROM katalog1.tracks) AS track_count,
        (SELECT COUNT(*) FROM katalog1.artists WHERE artist_type IS NULL) AS artist_count,
        (SELECT COUNT(*) FROM katalog1.albums) AS album_count,
        (SELECT COUNT(DISTINCT track_id) FROM katalog1.track_lyrics WHERE lyrics IS NOT NULL AND lyrics != '') AS lyrics_count;
    ");

$stmt->execute();
$result = $stmt->get_result();
$count = $result->fetch_assoc();

echo json_encode($count);
?>