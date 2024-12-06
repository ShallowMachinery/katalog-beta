<?php
require 'config.php'; 

$type = $_GET['type'] ?? null;

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $type) {
    $stmt = $conn->prepare("SELECT `expiry_time` FROM `katalog1`.`timers` WHERE `type` = ?");
    $stmt->bind_param("s", $type);
    $stmt->execute();
    $stmt->bind_result($expiryTime);
    $stmt->fetch();
    $stmt->close();

    if ($expiryTime) {
        echo json_encode(['expiryTime' => $expiryTime]);
    } else {
        echo json_encode(['expiryTime' => 0]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $type = $data['type'] ?? null;
    $expiryTime = $data['expiryTime'] ?? 0;

    if ($type) {
        $stmt = $conn->prepare("REPLACE INTO  `katalog1`.`timers` (`type`, `expiry_time`) VALUES (?, ?)");
        $stmt->bind_param("si", $type, $expiryTime);
        if ($stmt->execute()) {
            echo json_encode(['status' => 'success']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to set timer.']);
        }
        $stmt->close();
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Type is missing in the request.']);
    }
}

$conn->close();
?>
