<?php
require 'config.php';
use Firebase\JWT\JWT;

$response = array('success' => false, 'message' => '');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $username = $input['username'];
    $password = $input['password'];

    if (empty($username) || empty($password)) {
        $response['message'] = 'Username or password cannot be empty.';
        echo json_encode($response);
        exit;
    }

    $stmt = $conn->prepare("SELECT `user_id`, `user_password`, `user_name`, `user_hierarchy` FROM katalog1.`accounts` WHERE `user_name` = ?");
    $stmt->bind_param('s', $username);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        $stmt->bind_result($user_id, $hashed_password, $user_name, $user_hierarchy);
        $stmt->fetch();

        if (hash('sha256', $password) === $hashed_password) {
            $response['success'] = true;
            $response['message'] = 'Login successful';

            $payload = [
                'iat' => time(),
                'exp' => time() + (3 * 24 * 60 * 60),
                'data' => [
                    'user_id' => $user_id,
                    'user_name' => $user_name,
                    'user_hierarchy' => $user_hierarchy,
                ],
            ];

            $jwt = JWT::encode($payload, $secretKey, 'HS256');

            $response['user'] = array(
                'user_id' => $user_id,
                'user_name' => $user_name,
                'user_hierarchy' => $user_hierarchy,
                'token' => $jwt
            );
        } else {
            $response['message'] = 'Incorrect password';
        }
    } else {
        $response['message'] = 'Username not found';
    }

    $stmt->close();
} else {
    $response['message'] = 'Invalid request method';
}

echo json_encode($response);
?>
