<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$servername = "127.0.0.1";
$username = "root";
$password = "";
$dbname = "katalog";

// Connect to the database
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}

// Get the type from GET parameters or POST body
$type = $_GET['type'] ?? null;

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $type) {
    // Fetch expiry time for the given type
    $stmt = $conn->prepare("SELECT expiry_time FROM timers WHERE type = ?");
    $stmt->bind_param("s", $type);
    $stmt->execute();
    $stmt->bind_result($expiryTime);
    $stmt->fetch();
    $stmt->close();

    if ($expiryTime) {
        echo json_encode(['expiryTime' => $expiryTime]);
    } else {
        echo json_encode(['expiryTime' => 0]); // If no timer found, return 0
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get data from the request
    $data = json_decode(file_get_contents('php://input'), true);
    $type = $data['type'] ?? null;
    $expiryTime = $data['expiryTime'] ?? 0;

    if ($type) {
        // Store expiry time for the given type
        $stmt = $conn->prepare("REPLACE INTO timers (type, expiry_time) VALUES (?, ?)");
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
