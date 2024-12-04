<?php
require 'config.php'; 

$trackId = $_GET['trackId'] ?? '';

$stmt = $conn->prepare("
    SELECT 
        tc.`composer_id` AS `composerId`,
        c.`composer_name` AS `composerName`
    FROM 
        `katalog1`.`Tracks` t
    JOIN 
        `katalog1`.`Track_composers` tc ON t.`track_id` = tc.`track_id`
    JOIN 
        `katalog1`.`Composers` c ON tc.`composer_id` = c.`composer_id`
    WHERE 
        t.`track_id` = ?
    GROUP BY 
        t.`track_id`, c.`composer_id`;
    ");
$stmt->bind_param("i", $trackId);
if ($stmt) {
    $stmt->execute();
    $result = $stmt->get_result();

    $trackComposers = $result->fetch_all(MYSQLI_ASSOC);
    echo json_encode($trackComposers);
    $stmt->close();
} else {
    echo json_encode(["error" => "Failed to prepare statement"]);
}

$conn->close();
?>