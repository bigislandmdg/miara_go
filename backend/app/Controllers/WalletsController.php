<?php

namespace App\Controllers;

use App\Models\WalletModel;
use App\Models\UserModel;
use CodeIgniter\RESTful\ResourceController;

class WalletsController extends ResourceController
{
    protected $format = 'json';
    protected $walletModel;
    protected $userModel;

    public function __construct()
    {
        $this->walletModel = new WalletModel();
        $this->userModel = new UserModel();
    }

    /**
     * 🔹 Lister tous les portefeuilles
     */
    public function index()
    {
        $wallets = $this->walletModel->findAll();
        return $this->respond([
            'status' => true,
            'wallets' => $wallets
        ]);
    }

    /**
     * 🔹 Créer un portefeuille (si non existant)
     */
    public function create()
    {
        $data = $this->request->getJSON(true) ?? $this->request->getPost();

        if (empty($data['user_id'])) {
            return $this->failValidationErrors('Le champ user_id est obligatoire.');
        }

        $user = $this->userModel->find($data['user_id']);
        if (!$user) {
            return $this->failNotFound('Utilisateur non trouvé.');
        }

        $this->walletModel->ensureWalletExists($data['user_id']);
        $wallet = $this->walletModel->getWalletByUser($data['user_id']);

        return $this->respondCreated([
            'status' => true,
            'message' => 'Portefeuille créé avec succès.',
            'wallet' => $wallet
        ]);
    }

    /**
     * 🔹 Afficher un portefeuille par ID
     */
    public function show($id = null)
    {
        $wallet = $this->walletModel->find($id);
        if (!$wallet) {
            return $this->failNotFound('Portefeuille non trouvé.');
        }

        return $this->respond([
            'status' => true,
            'wallet' => $wallet
        ]);
    }

    /**
     * 🔹 Mettre à jour un portefeuille
     */
    public function update($id = null)
    {
        $data = $this->request->getJSON(true) ?? $this->request->getRawInput();

        $wallet = $this->walletModel->find($id);
        if (!$wallet) {
            return $this->failNotFound('Portefeuille non trouvé.');
        }

        if (!$this->walletModel->update($id, $data)) {
            return $this->failValidationErrors($this->walletModel->errors());
        }

        $updated = $this->walletModel->find($id);
        return $this->respond([
            'status' => true,
            'message' => 'Portefeuille mis à jour avec succès.',
            'wallet' => $updated
        ]);
    }

    /**
     * 🔹 Supprimer un portefeuille
     */
    public function delete($id = null)
    {
        $wallet = $this->walletModel->find($id);
        if (!$wallet) {
            return $this->failNotFound('Portefeuille non trouvé.');
        }

        $this->walletModel->delete($id);
        return $this->respondDeleted([
            'status' => true,
            'message' => 'Portefeuille supprimé avec succès.'
        ]);
    }

    /**
     * 💰 Dépôt d’argent dans un portefeuille
     */
    public function deposit()
    {
        $data = $this->request->getJSON(true);

        if (empty($data['user_id']) || empty($data['amount'])) {
            return $this->failValidationErrors('Les champs user_id et amount sont obligatoires.');
        }

        $success = $this->walletModel->deposit($data['user_id'], $data['amount'], $data['transaction_id'] ?? null);

        if (!$success) {
            return $this->fail('Échec du dépôt (montant invalide ?).');
        }

        $wallet = $this->walletModel->getWalletByUser($data['user_id']);

        return $this->respond([
            'status' => true,
            'message' => 'Dépôt effectué avec succès.',
            'wallet' => $wallet
        ]);
    }

    /**
     * 💸 Retrait d’argent depuis le portefeuille
     */
    public function withdraw()
    {
        $data = $this->request->getJSON(true);

        if (empty($data['user_id']) || empty($data['amount'])) {
            return $this->failValidationErrors('Les champs user_id et amount sont obligatoires.');
        }

        $success = $this->walletModel->withdraw($data['user_id'], $data['amount'], $data['transaction_id'] ?? null);

        if (!$success) {
            return $this->fail('Échec du retrait (solde insuffisant ou montant invalide).');
        }

        $wallet = $this->walletModel->getWalletByUser($data['user_id']);

        return $this->respond([
            'status' => true,
            'message' => 'Retrait effectué avec succès.',
            'wallet' => $wallet
        ]);
    }

    /**
     * 🔹 Consulter le solde d’un utilisateur
     */
    public function balance($userId = null)
    {
        $wallet = $this->walletModel->getWalletByUser($userId);

        if (!$wallet) {
            return $this->failNotFound('Portefeuille non trouvé pour cet utilisateur.');
        }

        return $this->respond([
            'status' => true,
            'user_id' => $userId,
            'balance' => $wallet['balance']
        ]);
    }

    /**
     * 🔹 Filtrer les portefeuilles par solde minimum/maximum
     */
    public function filter()
    {
        $min = $this->request->getVar('min_balance');
        $max = $this->request->getVar('max_balance');

        $builder = $this->walletModel;

        if ($min !== null) {
            $builder = $builder->where('balance >=', (float) $min);
        }
        if ($max !== null) {
            $builder = $builder->where('balance <=', (float) $max);
        }

        $wallets = $builder->findAll();

        return $this->respond([
            'status' => true,
            'wallets' => $wallets
        ]);
    }

    /**
     * 📊 Statistiques des portefeuilles
     */
    public function stats()
    {
        $builder = $this->walletModel->builder();

        $totalUsers = $builder->countAllResults(false);
        $totalBalance = $builder->selectSum('balance')->get()->getRow()->balance ?? 0;

        return $this->respond([
            'status' => true,
            'total_wallets' => $totalUsers,
            'total_balance' => (float) $totalBalance,
            'average_balance' => $totalUsers ? round($totalBalance / $totalUsers, 2) : 0,
        ]);
    }

    /**
     * Générer QR code simple
     * Retourne un token temporaire + timestamp
     */
    public function generateQR($userId = null)
    {
        if (!$userId) return $this->failValidationErrors('User ID requis.');

        $wallet = $this->walletModel->getWalletByUser($userId);
        if (!$wallet) return $this->failNotFound('Portefeuille introuvable.');

        $token = bin2hex(random_bytes(8)); // 16 caractères hex
        $expiresIn = 36000; // secondes
        $expiresAt = time() + $expiresIn;

        return $this->respond([
            'status' => true,
            'token' => $token,
            'expires_at' => $expiresAt,
            'expires_in' => $expiresIn,
            'user_id' => $userId
        ]);
    }

    /**
     * Scanner QR code simple
     * Vérifie que le token n’a pas expiré
     * ATTENTION : Le token + timestamp doivent être renvoyés par le client
     */
    public function scanQR()
    {
        $data = $this->request->getJSON(true);

        if (empty($data['token']) || empty($data['expires_at']) || empty($data['user_id'])) {
            return $this->failValidationErrors('Token, user_id et expires_at requis.');
        }

        if (time() > $data['expires_at']) {
            return $this->fail('QR expiré.');
        }

        $wallet = $this->walletModel->getWalletByUser($data['user_id']);
        if (!$wallet) return $this->failNotFound('Portefeuille introuvable.');

        return $this->respond([
            'status'   => true,
            'user_id'  => $data['user_id'],
            'balance'  => (float) $wallet['balance'],
            'currency' => 'credits'
        ]);
    }

    
}
