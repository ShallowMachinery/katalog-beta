<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require 'config.php'; // Assuming this contains your $conn (mysqli connection)

// Get the JSON input
$data = json_decode(file_get_contents("php://input"), true);

$primaryArtistId = $data['primaryArtistId'];
$duplicateArtistIds = $data['duplicateArtistIds'];

// Validate input
if (!is_numeric($primaryArtistId) || !is_array($duplicateArtistIds)) {
    echo json_encode(['success' => false, 'error' => 'Invalid input']);
    exit;
}

// Convert duplicate IDs to a comma-separated string
$duplicateIds = implode(',', array_map('intval', $duplicateArtistIds));

// Update album_artists table to replace duplicate artist IDs with the primary artist ID
$updateAlbumsSql = "
    UPDATE `album_artists`
    SET `artist_id` = ?
    WHERE `artist_id` IN ($duplicateIds)
";
$stmt = $conn->prepare($updateAlbumsSql);
$stmt->bind_param("i", $primaryArtistId);
$stmt->execute();

// Check if update was successful
if ($stmt->affected_rows > 0) {
    // Optionally, delete duplicate artists from the Artists table
    $deleteArtistsSql = "
        DELETE FROM `Artists`
        WHERE `artist_id` IN ($duplicateIds)
    ";
    $conn->query($deleteArtistsSql);

    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'No albums updated']);
}

// Close the database connection
$conn->close();
?>
