<?php
require 'config.php'; 

// Fetch featured artists
$sql = "SELECT artist_id, artist_name, artist_vanity, artist_picture_link
FROM katalog1.Artists
WHERE artist_type IS NULL
AND artist_picture_link IS NOT NULL
AND artist_picture_link != ''
ORDER BY RAND() LIMIT 6";

$result = $conn->query($sql);

$artists = [];
if ($result->num_rows > 0) {
    // Fetch all artists
    while ($row = $result->fetch_assoc()) {
        $artists[] = [
            'artistId' => $row['artist_id'],
            'artistName' => $row['artist_name'],
            'artistVanity' => $row['artist_vanity'],
            'artistPictureUrl' => $row['artist_picture_link'] ? $row['artist_picture_link'] : null // Corrected handling
        ];
    }
} else {
    // Optionally handle case where no artists are found
    echo json_encode(['artists' => []]);
    exit;
}

// Return artists as JSON
echo json_encode(['artists' => $artists]);

$conn->close();
?>
