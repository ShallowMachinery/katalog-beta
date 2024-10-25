<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require 'config.php'; // Assuming this contains your $conn (mysqli connection)

// Prepare the SQL query to find duplicate artist names
$sql = "
    SELECT `artist_name`, GROUP_CONCAT(artist_id) AS artist_ids, COUNT(*) AS duplicate_count
    FROM `katalog1`.`artists`
    GROUP BY `artist_name`
    HAVING COUNT(*) > 1
";

// Execute the query
$result = $conn->query($sql);

// Check if query was successful
if ($result) {
    $duplicates = [];

    // Fetch all rows
    while ($row = $result->fetch_assoc()) {
        $artist_ids = $row['artist_ids'];

        // Query to get the albums associated with the artist_ids
        $album_sql = "
            SELECT a.`album_id`, a.`album_name`, aa.`artist_id`, ar.`artist_name`, ar.`artist_vanity`, ar.`artist_type`, ar.`artist_spotify_id`
            FROM `katalog1`.`albums` a
            JOIN `katalog1`.`album_artists` aa ON a.`album_id` = aa.`album_id`
            JOIN `katalog1`.`artists` ar ON aa.`artist_id` = ar.`artist_id`
            WHERE aa.`artist_id` IN ($artist_ids)
            GROUP BY a.`album_id`, ar.`artist_id`
        ";
        $album_result = $conn->query($album_sql);
        $albums = [];
        if ($album_result) {
            while ($album_row = $album_result->fetch_assoc()) {
                $albums[] = $album_row;
            }
        }

        // Query to get the tracks associated with the artist_ids
        $track_sql = "
            SELECT t.`track_id`, t.`track_name`, ta.`artist_id`, ar.`artist_name`, ar.`artist_vanity`, ar.`artist_type`, ar.`artist_spotify_id`
            FROM `katalog1`.`tracks` t
            JOIN `katalog1`.`track_artists` ta ON t.`track_id` = ta.`track_id`
            JOIN `katalog1`.`artists` ar ON ta.`artist_id` = ar.`artist_id`
            WHERE ta.`artist_id` IN ($artist_ids)
            GROUP BY t.`track_id`, ar.`artist_id`
        ";
        $track_result = $conn->query($track_sql);
        $tracks = [];
        if ($track_result) {
            while ($track_row = $track_result->fetch_assoc()) {
                $tracks[] = $track_row;
            }
        }

        // Combine artist details with albums and tracks
        $row['albums'] = $albums;
        $row['tracks'] = $tracks;

        // Add the row to the duplicates array
        $duplicates[] = $row;
    }

    // Return the duplicates with associated albums and tracks in JSON format
    echo json_encode($duplicates);
} else {
    // Return an error message in case of failure
    echo json_encode(['error' => 'Error fetching duplicate artists']);
}

// Close the database connection
$conn->close();
?>
