<?php
require 'config.php';
require 'vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;

$response = array('success' => false, 'message' => '');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $headers = apache_request_headers();
    $accessToken = $headers['authorization'] ?? '';

    try {
        if (strpos($accessToken, 'Bearer ') === 0) {
            $accessToken = substr($accessToken, 7);
        }
        
        $key = new Key($secretKey, 'HS256');

        $decoded = JWT::decode($accessToken, $key);

        if (isset($decoded->data) && isset($decoded->data->user_id)) {
            $userId = $decoded->data->user_id;
            
            $stmt = $conn->prepare("SELECT `first_name` FROM `Accounts` WHERE `user_id` = ?");
            $stmt->bind_param('i', $userId);
            $stmt->execute();
            $stmt->bind_result($first_name);
            $stmt->fetch();

            if ($first_name) {
                $response['success'] = true;
                $response['first_name'] = $first_name;
            } else {
                $response['message'] = 'User not found.';
            }
            $stmt->close();
        } else {
            $response['message'] = 'Invalid token structure.';
        }
    } catch (ExpiredException $e) {
        $response['message'] = 'Access token has expired.';
    } catch (Exception $e) {
        $response['message'] = 'Invalid access token.';
    }
} else {
    $response['message'] = 'Invalid request method.';
}

echo json_encode($response);
