<?php

namespace App\Models;

use CodeIgniter\Model;

class WalletModel extends Model
{
    protected $table = 'wallets';
    protected $primaryKey = 'id';
    protected $returnType = 'array';

    protected $allowedFields = [
        'user_id',
        'balance',
        'last_transaction_id',
        'updated_at'
    ];

    protected $useTimestamps = false;

    /**
     * 🔹 Récupérer le portefeuille d'un utilisateur
     */
    public function getWalletByUser($userId)
    {
        return $this->where('user_id', $userId)->first();
    }

    /**
     * 🔹 Créer un portefeuille s’il n’existe pas
     */
    public function ensureWalletExists($userId)
    {
        $wallet = $this->where('user_id', $userId)->first();

        if (!$wallet) {
            $this->insert([
                'user_id' => $userId,
                'balance' => 0.00,
                'updated_at' => date('Y-m-d H:i:s'),
            ]);
        }
    }

    /**
     * 🔹 Déposer un montant
     */
    public function deposit($userId, $amount, $transactionId = null)
    {
        if ($amount <= 0) {
            return false;
        }

        $this->ensureWalletExists($userId);

        $wallet = $this->getWalletByUser($userId);
        $newBalance = $wallet['balance'] + $amount;

        return $this->update($wallet['id'], [
            'balance' => $newBalance,
            'last_transaction_id' => $transactionId,
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
    }

    /**
     * 🔹 Retirer un montant
     */
    public function withdraw($userId, $amount, $transactionId = null)
    {
        if ($amount <= 0) {
            return false;
        }

        $wallet = $this->getWalletByUser($userId);

        if (!$wallet || $wallet['balance'] < $amount) {
            return false; // Solde insuffisant
        }

        $newBalance = $wallet['balance'] - $amount;

        return $this->update($wallet['id'], [
            'balance' => $newBalance,
            'last_transaction_id' => $transactionId,
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
    }

    /**
     * 🔹 Obtenir le solde
     */
    public function getBalance($userId)
    {
        $wallet = $this->getWalletByUser($userId);
        return $wallet ? $wallet['balance'] : 0.00;
    }

    /**
     * 🔹 Mettre à jour directement le solde
     */
    public function updateBalance($userId, $newBalance, $transactionId = null)
    {
        $this->ensureWalletExists($userId);

        $wallet = $this->getWalletByUser($userId);

        return $this->update($wallet['id'], [
            'balance' => $newBalance,
            'last_transaction_id' => $transactionId,
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
    }
}
