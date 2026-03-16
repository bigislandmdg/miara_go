<?php

namespace App\Controllers;

use App\Models\TransactionModel;
use App\Models\CreditModel;
use CodeIgniter\RESTful\ResourceController;

class CreditsController extends ResourceController
{
    protected $transactionModel;
    protected $creditModel;
    protected $db;

    public function __construct()
    {
        $this->transactionModel = new TransactionModel();
        $this->creditModel      = new CreditModel();
        $this->db               = \Config\Database::connect();
    }

     
    /**
     * 🔹 Initier un achat de crédits (Mobile Money)
     * Status : pending
     */
    public function purchaseCredits()
    {
        $data = $this->request->getJSON(true) ?? $this->request->getPost();

        $userId  = $data['user_id'] ?? null;
        $credits = $data['credits'] ?? null;
        $bonus   = $data['bonus'] ?? 0;
        $price   = $data['price'] ?? null;

        if (!$userId || !$credits || !$price) {
           return $this->failValidationErrors(['error' => 'Données manquantes']);
        }

        $creditAmount = (int)$credits + (int)$bonus;

        if ($creditAmount <= 0) {
          return $this->failValidationErrors(['error' => 'Montant crédits invalide']);
        }

        $reference = 'TXN_' . uniqid();

        $this->db->transStart();

        $transaction = $this->transactionModel->createTransaction([
            'user_id'        => (int)$userId,
            'type'           => 'achat_credit',
            'amount'         => (float)$price,
            'payment_method' => 'mobile_money',
            'status'         => 'pending',
            'reference'      => $reference,
        ]);

        if (!$transaction) {
          $this->db->transRollback();
             return $this->failServerError('Erreur création transaction');
          }

        $credit = $this->creditModel->createCredit([
           'user_id'         => (int)$userId,
           'transaction_id' => $transaction['id'],
           'credit_amount'  => $creditAmount,
        ]);

       if (!$credit) {
            $this->db->transRollback();
            return $this->failServerError('Erreur création crédit');
        }

       $this->db->transComplete();

    if ($this->db->transStatus() === false) {
        return $this->failServerError('Transaction base de données échouée');
    }

    return $this->respondCreated([
        'transaction' => $transaction,
        'credit'      => $credit,
    ]);
   }

    /**
     * 🔹 Callback Mobile Money
     * pending → completed
     */
    public function confirmPayment($reference = null)
    {
        if (!$reference) {
            return $this->fail('Référence manquante', 400);
        }

        $transaction = $this->transactionModel
            ->where('reference', $reference)
            ->first();

        if (!$transaction) {
            return $this->failNotFound('Transaction non trouvée');
        }

        if ($transaction['status'] === 'completed') {
            return $this->respond([
                'message' => 'Transaction déjà confirmée',
                'transaction' => $transaction
            ]);
        }

        $this->db->transStart();

        $this->transactionModel->setStatus($transaction['id'], 'completed');

        $credit = $this->creditModel
            ->where('transaction_id', $transaction['id'])
            ->first();

        if ($credit) {
            $this->creditModel->update($credit['id'], [
                'status' => 'valid'
            ]);
        }

        $this->db->transComplete();

        return $this->respond([
            'message' => 'Paiement confirmé',
            'transaction' => $this->transactionModel->find($transaction['id']),
            'credit' => $this->creditModel
                ->where('transaction_id', $transaction['id'])
                ->first()
        ]);
    }

    /**
     * 🔹 Wallet utilisateur amélioré
     * Retourne :
     * - transactions
     * - total_credits (valid)
     * - pending_credits (en attente)
     */
    public function wallet($userId = null)
    {
        if (!$userId) {
            return $this->fail('Utilisateur non spécifié', 400);
        }

        // Toutes les transactions
        $transactions = $this->transactionModel->getByUser((int)$userId);

        // Tous les crédits
        $credits = $this->creditModel->getByUser((int)$userId);

        // Total des crédits valides
        $totalCredits = array_reduce($credits, function($carry, $c) {
            return $carry + (($c['status'] === 'valid') ? (float)$c['credit_amount'] : 0);
        }, 0);

        // Total des crédits pending
        $pendingCredits = array_reduce($credits, function($carry, $c) {
            return $carry + (($c['status'] === 'pending') ? (float)$c['credit_amount'] : 0);
        }, 0);

        return $this->respond([
            'transactions'    => $transactions,
            'credits'         => $credits,
            'total_credits'   => $totalCredits,
            'pending_credits' => $pendingCredits,
        ]);
    }

    /**
 * 🔹 Générer un QR code stateless
 * Retourne le token et le total de crédits disponibles
 */
public function generateQR($userId = null)
{
    if (!$userId) {
        return $this->failValidationErrors('User ID requis.');
    }

    // Récupère tous les crédits valides pour l'utilisateur
    $credits = $this->creditModel->getByUser((int)$userId);
    $totalCredits = array_reduce($credits, function($carry, $c) {
        return $carry + (($c['status'] === 'valid') ? (float)$c['credit_amount'] : 0);
    }, 0);

    // Token temporaire
    $token = bin2hex(random_bytes(8)); // 16 caractères hex

    // Expiration timestamp
    $expiresAt = time() + 36000; // 30 secondes

    return $this->respond([
        'status'      => true,
        'token'       => $token,
        'user_id'     => (int)$userId,
        'total_credits' => (float)$totalCredits,
        'expires_at'  => $expiresAt,
        'expires_in'  => 36000
    ]);
}

/**
 * 🔹 Scanner le QR code stateless
 * Vérifie le token et retourne les crédits totaux
 */
public function scanQR()
{
    $data = $this->request->getJSON(true);

    if (empty($data['token']) || empty($data['user_id']) || empty($data['expires_at'])) {
        return $this->failValidationErrors('Token, user_id et expires_at requis.');
    }

    // Vérifie expiration
    if ($data['expires_at'] < time()) {
        return $this->fail('QR expiré.');
    }

    // Récupère les crédits valides de l'utilisateur
    $credits = $this->creditModel->getByUser((int)$data['user_id']);
    $totalCredits = array_reduce($credits, function($carry, $c) {
        return $carry + (($c['status'] === 'valid') ? (float)$c['credit_amount'] : 0);
    }, 0);

    return $this->respond([
        'status'        => true,
        'user_id'       => (int)$data['user_id'],
        'token'         => $data['token'],
        'total_credits' => (float)$totalCredits,
        'currency'      => 'credits'
    ]);
  }
}
