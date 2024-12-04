<?php
$allowedOrigins = [
    'http://192.168.100.8:3000',
    'http://192.168.188.80:3000',
    'http://192.168.136.80:3000',
    'http://192.168.0.87:3000',
    'http://192.168.189.80:3000',
    'http://192.168.56.1:3000',
    'http://192.168.1.191:3000',
    'http://localhost:3000',
    'http://192.168.1.15:3000',
    'http://192.168.1.22:3000'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:3000");
}
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Authorization, Content-Type");
header("Content-Type: application/json, multipart/form-data");

require 'vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$secretKey = $_ENV['JWT_SECRET_KEY'] ?? null;

if ($secretKey === null) {
    die(json_encode(['success' => false, 'message' => 'Secret key not found.']));
}
$servername = "127.0.0.1";
$username = "root";
$password = "";
$dbname = "katalog1";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $conn->connect_error]));
}
?>
