<?php

namespace App\Controllers;

use App\Models\UserModel;
use App\Models\OtpVerificationModel;
use CodeIgniter\RESTful\ResourceController;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class AuthController extends ResourceController
{
    protected $format = 'json';
    private $jwtSecret;
    protected $userModel;
    protected $otpModel;

    // =========================================================
    // 🌍 Config internationalisation — codes pays supportés
    // Modifier uniquement ici pour ajouter un nouveau pays
    //
    // Format : 'code_pays' => [
    //    'prefix'    => '+XXX',        // préfixe international
    //    'local_len' => N,             // longueur avec le 0 local
    //    'short_len' => N,             // longueur sans le 0
    // ]
    // =========================================================
    private array $countryCodes = [
        // Océan Indien
        'MG' => ['prefix' => '+261', 'local_len' => 10, 'short_len' => 9],
        'RE' => ['prefix' => '+262', 'local_len' => 10, 'short_len' => 9],
        'KM' => ['prefix' => '+269', 'local_len' => 7,  'short_len' => 7],
        'MU' => ['prefix' => '+230', 'local_len' => 8,  'short_len' => 8],
        // Europe
        'FR' => ['prefix' => '+33',  'local_len' => 10, 'short_len' => 9],
        'GB' => ['prefix' => '+44',  'local_len' => 10, 'short_len' => 10],
        'DE' => ['prefix' => '+49',  'local_len' => 11, 'short_len' => 10],
        // Amérique du Nord
        'US' => ['prefix' => '+1',   'local_len' => 10, 'short_len' => 10],
        'CA' => ['prefix' => '+1',   'local_len' => 10, 'short_len' => 10],
        // Afrique
        'ZA' => ['prefix' => '+27',  'local_len' => 9,  'short_len' => 9],
    ];

    // Pays par défaut (peut être surchargé via .env : DEFAULT_COUNTRY_CODE=MG)
    private string $defaultCountry = 'MG';

    public function __construct()
    {
        $this->jwtSecret = getenv('JWT_SECRET') ?: 'TonSecretJWTParDefaut123!';
        $this->userModel = new UserModel();
        $this->otpModel = new OtpVerificationModel();

        // Surcharge depuis .env si défini
        $envCountry = strtoupper(getenv('DEFAULT_COUNTRY_CODE') ?: '');
        if ($envCountry && isset($this->countryCodes[$envCountry])) {
            $this->defaultCountry = $envCountry;
        }
    }

    // =========================================================
    // 🔹 Nettoyer le zéro redondant après le préfixe
    // Exemple : "+2610341234567" → "+261341234567"
    // =========================================================
    private function cleanRedundantZero(string $phone, string $prefix): string
    {
        // Si le numéro commence par le préfixe + suivi d'un 0
        if (preg_match('/^' . preg_quote($prefix, '/') . '0(\d+)$/', $phone, $matches)) {
            return $prefix . $matches[1];
        }
        
        // Si le numéro a le format +XXX0XXXXXXXX
        if (preg_match('/^(\+\d+)0(\d+)$/', $phone, $matches)) {
            return $matches[1] . $matches[2];
        }
        
        return $phone;
    }

    // =========================================================
    // 🔹 Normalisation numéro — internationalisation
    //
    // Logique :
    //  1. Si country_code fourni dans la requête → utiliser ce pays
    //  2. Sinon → utiliser $defaultCountry (MG par défaut)
    //  3. Si le numéro a déjà un préfixe international (+XXX) → inchangé
    //  4. Supprime automatiquement le 0 redondant après le préfixe
    //
    // Exemples avec MG (+261, local_len=10, short_len=9) :
    //   0341234567   →  +261341234567
    //   341234567    →  +261341234567
    //   261341234567 →  +261341234567
    //   +2610341234567→  +261341234567  (nettoyé)
    //   +261341234567→  +261341234567  (inchangé)
    //
    // Exemples avec FR (+33, local_len=10, short_len=9) :
    //   0612345678   →  +33612345678
    //   612345678    →  +33612345678
    //   +330612345678→  +33612345678   (nettoyé)
    // =========================================================
    private function normalizePhone(?string $phone, ?string $countryCode = null): ?string
    {
        if (!$phone) return null;

        // Nettoyer : supprimer espaces, tirets, points, parenthèses
        $phone = preg_replace('/[\s\-\.\(\)]+/', '', $phone);

        // Déjà au format international complet (+XXXXX...) 
        if (preg_match('/^\+\d{7,15}$/', $phone)) {
            // Nettoyer le zéro redondant après le préfixe
            foreach ($this->countryCodes as $code => $cfg) {
                if (strpos($phone, $cfg['prefix']) === 0) {
                    return $this->cleanRedundantZero($phone, $cfg['prefix']);
                }
            }
            return $phone;
        }

        // Résoudre le pays à utiliser
        $country = strtoupper($countryCode ?? $this->defaultCountry);
        if (!isset($this->countryCodes[$country])) {
            // Pays inconnu → fallback sur le pays par défaut
            log_message('warning', "[normalizePhone] Code pays inconnu : {$country}, fallback sur {$this->defaultCountry}");
            $country = $this->defaultCountry;
        }

        $cfg    = $this->countryCodes[$country];
        $prefix = $cfg['prefix'];           // ex: "+261"
        $digits = ltrim($prefix, '+');      // ex: "261"
        $localLen = $cfg['local_len'];      // ex: 10
        $shortLen = $cfg['short_len'];      // ex: 9

        // Format XXXXXXXXXXX (préfixe numérique sans +, ex: 261341234567)
        if (preg_match('/^' . $digits . '(\d{' . $shortLen . '})$/', $phone, $m)) {
            return $prefix . $m[1];
        }

        // Format local 0XXXXXXXX (avec 0 initial, ex: 0341234567)
        if (strlen($phone) === $localLen && $phone[0] === '0') {
            return $prefix . substr($phone, 1);
        }

        // Format court sans 0 (ex: 341234567)
        if (strlen($phone) === $shortLen && $phone[0] !== '0') {
            return $prefix . $phone;
        }

        // Format avec préfixe + suivi d'un 0 (ex: +2610341234567)
        if (preg_match('/^' . preg_quote($prefix, '/') . '0(\d{' . $shortLen . '})$/', $phone, $m)) {
            return $prefix . $m[1];
        }

        // Format non reconnu → retourner tel quel (la validation rejettera)
        log_message('warning', "[normalizePhone] Format non reconnu : {$phone} (pays: {$country})");
        return $phone;
    }

    /**
     * 🔹 Inscription utilisateur
     */
    public function register()
    {
        $rules = [
            'nom'    => 'required',
            'prenom' => 'required',
            'phone'  => 'required|is_unique[users.phone]',
            'role'   => 'permit_empty|in_list[user,driver,admin]'
        ];

        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $userData = [
            'nom'         => $this->request->getVar('nom'),
            'prenom'      => $this->request->getVar('prenom'),
            'phone'       => $this->normalizePhone(
                                $this->request->getVar('phone'),
                                $this->request->getVar('country_code') // optionnel, ex: "FR"
                             ),
            'role'        => $this->request->getVar('role') ?? 'user',
            'is_verified' => false,
        ];

        $userId = $this->userModel->insert($userData);
        $user = $this->userModel->find($userId);

        $otpCode = rand(100000, 999999);
        $this->otpModel->createOtp($user['phone'], $otpCode);
        log_message('info', "OTP envoyé à {$user['phone']}: {$otpCode}");

        return $this->respondCreated([
            'status'  => true,
            'message' => 'Utilisateur enregistré avec succès. OTP envoyé pour vérification.',
            'user'    => $user
        ]);
    }

    /**
     * 🔹 Login par phone (génération JWT)
     */
    public function login()
    {
        $phone = $this->normalizePhone(
            $this->request->getVar('phone'),
            $this->request->getVar('country_code')
        );
        if (!$phone) return $this->fail('Le numéro de téléphone est requis.');

        $user = $this->userModel->findByPhone($phone);
        if (!$user) return $this->failNotFound('Utilisateur non trouvé.');

        if (!$user['is_verified']) {
            return $this->fail('Le numéro de téléphone n\'est pas vérifié.');
        }

        $payload = [
            'iss'  => 'miarago_app',
            'sub'  => $user['id'],
            'role' => $user['role'],
            'iat'  => time(),
            'exp'  => time() + 3600
        ];

        $token = JWT::encode($payload, $this->jwtSecret, 'HS256');

        return $this->respond([
            'status'  => true,
            'message' => 'Connexion réussie',
            'token'   => $token,
            'user'    => $user
        ]);
    }

    /**
     * 🔹 Envoi OTP séparé
     */
    public function sendOtp()
    {
        $phone = $this->normalizePhone(
            $this->request->getVar('phone'),
            $this->request->getVar('country_code')
        );
        if (!$phone) return $this->fail('Numéro de téléphone requis.');

        $otpCode = rand(100000, 999999);
        $this->otpModel->createOtp($phone, $otpCode);
        log_message('info', "OTP envoyé à {$phone}: {$otpCode}");

        return $this->respond(['status' => true, 'message' => 'OTP envoyé avec succès.']);
    }

    // ========================
    // NEW : GET LATEST OTP
    // ========================
    public function getLatestOtp()
    {
        $phone = $this->normalizePhone(
            $this->request->getGet('phone'),
            $this->request->getGet('country_code')
        );

        if (!$phone) return $this->fail('Téléphone requis.');

        $otp = $this->otpModel
            ->where('phone', $phone)
            ->orderBy('created_at', 'DESC')
            ->first();

        if (!$otp) {
            return $this->respond(['status' => false, 'message' => 'Aucun OTP trouvé.']);
        }

        return $this->respond([
            'status'     => true,
            'otp_code'   => $otp['otp_code'],
            'created_at' => $otp['created_at']
        ]);
    }

    /**
     * 🔹 Vérification OTP
     */
    public function verifyOtp()
    {
        $phone = $this->normalizePhone(
            $this->request->getVar('phone'),
            $this->request->getVar('country_code')
        );
        $otpCode = $this->request->getVar('otp_code');

        if (!$phone || !$otpCode) return $this->fail('Téléphone et OTP requis.');

        if (!$this->otpModel->verifyOtp($phone, $otpCode)) {
            return $this->fail(['message' => 'OTP invalide ou expiré.']);
        }

        $user = $this->userModel->findByPhone($phone);
        if (!$user) return $this->failNotFound('Utilisateur non trouvé.');

        $this->userModel->update($user['id'], ['is_verified' => true]);

        $payload = [
            'iss'  => 'miarago_app',
            'sub'  => $user['id'],
            'role' => $user['role'],
            'iat'  => time(),
            'exp'  => time() + 3600
        ];

        $token = JWT::encode($payload, $this->jwtSecret, 'HS256');

        return $this->respond([
            'status'  => true,
            'message' => 'Vérification réussie.',
            'user'    => $user,
            'token'   => $token
        ]);
    }

    /**
     * 🔹 Vérification JWT
     */
    public function verifyToken()
    {
        $authHeader = $this->request->getHeaderLine('Authorization');
        if (!$authHeader) return $this->failUnauthorized('Token manquant.');

        $token = explode(' ', $authHeader)[1] ?? null;
        if (!$token) return $this->failUnauthorized('Token invalide.');

        try {
            $decoded = JWT::decode($token, new Key($this->jwtSecret, 'HS256'));
            return $this->respond(['status' => true, 'data' => $decoded]);
        } catch (Exception $e) {
            return $this->failUnauthorized('Token invalide ou expiré.');
        }
    }

    // -------------------------
    // 🔹 Refresh Token
    // -------------------------
    public function refreshToken()
    {
        $refreshToken = $this->request->getVar('refresh_token');
        if (!$refreshToken) return $this->failUnauthorized('Refresh token manquant.');

        $tokenData = $this->refreshTokenModel
            ->where('token', $refreshToken)
            ->where('expires_at >=', date('Y-m-d H:i:s'))
            ->first();

        if (!$tokenData) return $this->failUnauthorized('Refresh token invalide ou expiré.');

        $user = $this->userModel->find($tokenData['user_id']);
        if (!$user) return $this->failNotFound('Utilisateur non trouvé.');

        $payload = [
            'iss'  => 'miarago_app',
            'sub'  => $user['id'],
            'role' => $user['role'],
            'iat'  => time(),
            'exp'  => time() + 3600
        ];

        $newToken = JWT::encode($payload, $this->jwtSecret, 'HS256');

        return $this->respond(['status' => true, 'token' => $newToken]);
    }

    /**
     * 🔹 Profil utilisateur connecté
     */
    public function profile()
    {
        $authHeader = $this->request->getHeaderLine('Authorization');
        if (!$authHeader) return $this->failUnauthorized('Token manquant.');

        $token = explode(' ', $authHeader)[1] ?? null;
        if (!$token) return $this->failUnauthorized('Token invalide.');

        try {
            $decoded = JWT::decode($token, new Key($this->jwtSecret, 'HS256'));

            $userId = $decoded->sub ?? null;
            if (!$userId) return $this->failUnauthorized('Token invalide (user id).');

            $user = $this->userModel->find($userId);
            if (!$user) return $this->failNotFound('Utilisateur non trouvé.');

            return $this->respond(['status' => true, 'user' => $user]);

        } catch (Exception $e) {
            return $this->failUnauthorized('Token invalide ou expiré.');
        }
    }

    // ================= Biometric =================

    /**
     * Activer la biométrie après OTP
     */
    public function enableBiometric()
    {
        $phone    = $this->normalizePhone(
            $this->request->getVar('phone'),
            $this->request->getVar('country_code')
        );
        $token    = $this->request->getVar('token');
        $deviceId = $this->request->getVar('device_id');

        if (!$phone || !$token || !$deviceId) {
            return $this->fail('Tous les champs sont requis (phone, token, device_id).');
        }

        $user = $this->userModel->findByPhone($phone);
        if (!$user) return $this->failNotFound('Utilisateur non trouvé.');

        if (!$user['is_verified']) {
            return $this->fail('L\'utilisateur doit être vérifié par OTP avant d\'activer la biométrie.');
        }

        $this->userModel->enableBiometric($user['id'], $token, $deviceId);

        return $this->respond(['status' => true, 'message' => 'Biométrie activée avec succès.']);
    }

    /**
     * Login rapide avec biométrie
     */
    public function biometricLogin()
    {
        $token    = $this->request->getVar('token');
        $deviceId = $this->request->getVar('device_id');

        if (!$token || !$deviceId) return $this->fail('Token et device_id requis.');

        $user = $this->userModel->findByBiometric($token, $deviceId);
        if (!$user) return $this->failNotFound('Utilisateur biométrique non trouvé ou non activé.');

        $payload = [
            'iss'  => 'miarago_app',
            'sub'  => $user['id'],
            'role' => $user['role'],
            'iat'  => time(),
            'exp'  => time() + 3600
        ];

        $jwt = JWT::encode($payload, $this->jwtSecret, 'HS256');

        return $this->respond([
            'status'  => true,
            'message' => 'Connexion biométrique réussie.',
            'token'   => $jwt,
            'user'    => $user
        ]);
    }
}