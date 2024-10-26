<?php
require 'config.php';

$trackId = $_GET['trackId'];

// Prepare the SQL query to fetch album details
$sql = "SELECT a.`album_id`, a.`album_name`, a.`album_vanity`, a.`album_cover_url`, ta.`track_number`, ta.`disc_number`, ar.`artist_id`, art.`artist_name`, art.`artist_vanity`
FROM `katalog1`.`track_albums` ta 
JOIN `katalog1`.`albums` a ON ta.`album_id` = a.`album_id` 
JOIN `katalog1`.`album_artists` ar ON a.`album_id` = ar.`album_id` 
JOIN `katalog1`.`artists` art ON ar.`artist_id` = art.`artist_id`
WHERE ta.`track_id` = ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $trackId);
$stmt->execute();
$result = $stmt->get_result();

$albums = [];
while ($row = $result->fetch_assoc()) {
    $albums[] = $row;  // Add each album to the array
}

$stmt->close();
$conn->close();

// Return the album data as a JSON response
if (!empty($albums)) {
    echo json_encode(['success' => true, 'albums' => $albums]);
} else {
    echo json_encode(['success' => false, 'message' => 'No albums found for this track.']);
}
?>
