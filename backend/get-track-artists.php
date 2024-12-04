<?php
require 'config.php';

$trackId = $_GET['trackId'];
$artistId = $_GET['trackMainArtistId'];

// Prepare the SQL query to fetch album details
$sql = "SELECT DISTINCT ta.`artist_id`, a.*
FROM `katalog1`.`track_artists` ta
JOIN `katalog1`.`artists` a ON ta.`artist_id` = a.`artist_id`
WHERE ta.`track_id` = ?
AND ta.`artist_id` != ?
ORDER BY a.`artist_name` ASC";

$stmt = $conn->prepare($sql);
$stmt->bind_param("ii", $trackId, $artistId);
$stmt->execute();
$result = $stmt->get_result();

$artists = [];
while ($row = $result->fetch_assoc()) {
    $artists[] = $row;
}

$stmt->close();
$conn->close();

if (!empty($artists)) {
    echo json_encode(['success' => true, 'artists' => $artists]);
} else {
    echo json_encode(['success' => false, 'message' => 'No artists found for this track.']);
}
?>
