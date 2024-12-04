<?php
require 'config.php';
require 'vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;

$headers = apache_request_headers();
$accessToken = $headers['Authorization'] ?? '';

// Check if token is provided and valid
try {
    if (strpos($accessToken, 'Bearer ') === 0) {
        $accessToken = substr($accessToken, 7);
    }
    $key = new Key($secretKey, 'HS256');
    $decoded = JWT::decode($accessToken, $key);
    
    if (!isset($decoded->data->user_id)) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid token structure.']);
        exit;
    }
    
    $userId = $decoded->data->user_id;
} catch (ExpiredException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Access token has expired.']);
    exit;
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid access token.']);
    exit;
}

// Check if file is uploaded
if (!isset($_FILES['profilePicture'])) {
    echo json_encode(['status' => 'error', 'message' => 'No file uploaded.']);
    exit;
}

$file = $_FILES['profilePicture'];

// Validate file type and size
if ($file['type'] !== 'image/jpeg') {
    echo json_encode(['status' => 'error', 'message' => 'Only JPG files are allowed.']);
    exit;
}

if ($file['size'] > 1024 * 1024) { // 1MB limit
    echo json_encode(['status' => 'error', 'message' => 'File size exceeds 1MB.']);
    exit;
}

// Define the absolute path for the directory
$targetDir = "D:/katalog/beta/katalog-beta/public/assets_public/users/";

// Ensure the directory exists
if (!file_exists($targetDir)) {
    if (!mkdir($targetDir, 0777, true)) {
        echo json_encode(['status' => 'error', 'message' => 'Failed to create directory.']);
        exit;
    }
}

// Define the file path
$targetFile = $targetDir . $userId . ".jpg";

// Move the file to the target directory
if (move_uploaded_file($file['tmp_name'], $targetFile)) {
    echo json_encode(['status' => 'success', 'message' => 'Profile picture uploaded successfully.']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to upload profile picture.']);
}
?>
