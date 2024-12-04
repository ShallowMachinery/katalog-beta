<?php
require 'config.php';

$stmt = $conn->prepare("SELECT * FROM `katalog1`.`Genres`;");
if ($stmt) {
    $stmt->execute();
    $result = $stmt->get_result();

    $trackGenres = $result->fetch_all(MYSQLI_ASSOC);
    echo json_encode($trackGenres);
    $stmt->close();
} else {
    echo json_encode(["error" => "Failed to prepare statement"]);
}

$conn->close();
?>
