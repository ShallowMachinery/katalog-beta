<?php
require 'config.php'; 

$trackId = $_GET['trackId'] ?? '';

$stmt = $conn->prepare("
    SELECT 
        te.`isrc` AS `isrc`
    FROM 
        `katalog1`.`Tracks` t
    JOIN 
        `katalog1`.`Artists` a ON t.`track_main_artist_id` = a.`artist_id`
    JOIN 
        `katalog1`.`Track_Albums` tal ON t.`track_id` = tal.`track_id`
	JOIN
		`katalog1`.`Albums` al ON tal.`album_id` = al.`album_id`
	JOIN
		`katalog1`.`Track_External_Ids` te ON t.`track_id` = te.`track_id`
    WHERE 
        t.`track_id` = ?
	GROUP BY
		te.`isrc`;
    ");
$stmt->bind_param("i", $trackId);
if ($stmt) {
    $stmt->execute();
    $result = $stmt->get_result();

    $trackISRCs = $result->fetch_all(MYSQLI_ASSOC);
    echo json_encode($trackISRCs);
    $stmt->close();
} else {
    echo json_encode(["error" => "Failed to prepare statement"]);
}

$conn->close();
?>