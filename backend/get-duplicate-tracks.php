<?php
require 'config.php';

$sql = "
    SELECT t.track_name, a.artist_name, GROUP_CONCAT(t.track_id) AS track_ids, COUNT(*) AS duplicate_count
    FROM katalog1.tracks t
    JOIN katalog1.artists a ON t.track_main_artist_id = a.artist_id
    GROUP BY t.track_name, a.artist_name
    HAVING COUNT(*) > 1
    ORDER BY t.creation_date DESC, t.track_id ASC;
";

$result = $conn->query($sql);

if ($result) {
    $duplicates = [];

    while ($row = $result->fetch_assoc()) {
        $track_ids = $row['track_ids'];

        // Fetch additional details for each duplicate track
        $trackDetailsSql = "
            SELECT t.track_id, t.track_name, ta.artist_id, ar.artist_name, ar.artist_id, al.album_name, t.duration, te.isrc
            FROM katalog1.tracks t
            JOIN katalog1.track_artists ta ON t.track_id = ta.track_id
            JOIN katalog1.artists ar ON ta.artist_id = ar.artist_id
            JOIN katalog1.track_albums ta1 ON t.track_id = ta1.track_id
            JOIN katalog1.albums al ON ta1.album_id = al.album_id
            JOIN katalog1.track_external_ids te ON t.track_id = te.track_id
            WHERE t.track_id IN ($track_ids)
            GROUP BY t.track_id
        ";
        $trackDetailsResult = $conn->query($trackDetailsSql);
        $trackDetails = [];

        if ($trackDetailsResult) {
            while ($detailRow = $trackDetailsResult->fetch_assoc()) {
                $trackDetails[] = $detailRow;
            }
        }

        $row['track_details'] = $trackDetails;
        $duplicates[] = $row;
    }

    echo json_encode($duplicates);
} else {
    echo json_encode(['error' => 'Error fetching duplicate tracks']);
}

$conn->close();
?>
