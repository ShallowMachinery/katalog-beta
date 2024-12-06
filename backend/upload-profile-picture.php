<?php
require 'config.php';
require 'vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;

$headers = apache_request_headers();
$accessToken = $headers['authorization'] ?? '';

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

if (!isset($_FILES['profilePicture'])) {
    echo json_encode(['status' => 'error', 'message' => 'No file uploaded.']);
    exit;
}

$file = $_FILES['profilePicture'];

if ($file['type'] !== 'image/jpeg') {
    echo json_encode(['status' => 'error', 'message' => 'Only JPG files are allowed.']);
    exit;
}

if ($file['size'] > 1024 * 1024) {
    echo json_encode(['status' => 'error', 'message' => 'File size exceeds 1MB.']);
    exit;
}

$targetDir = __DIR__ . "/../public/assets_public/users/";
var_dump($targetDir);

if (!file_exists($targetDir)) {
    if (!mkdir($targetDir, 0777, true)) {
        echo json_encode(['status' => 'error', 'message' => 'Failed to create directory.']);
        exit;
    }
}

$targetFile = $targetDir . $userId . ".jpg";

if (move_uploaded_file($file['tmp_name'], $targetFile)) {
    echo json_encode(['status' => 'success', 'message' => 'Profile picture uploaded successfully.']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to upload profile picture.']);
}
?>
