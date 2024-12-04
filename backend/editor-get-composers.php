<?php
require 'config.php';

$stmt = $conn->prepare("SELECT * FROM `katalog1`.`Composers`;");
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
