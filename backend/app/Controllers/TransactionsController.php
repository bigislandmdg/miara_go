<?php

namespace App\Controllers;

use App\Models\TransactionModel;
use App\Models\UserModel;
use App\Models\CreditModel;
use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\Database\Exceptions\DatabaseException;

class TransactionsController extends ResourceController
{
    protected $format = 'json';

    protected TransactionModel $transactionModel;
    protected UserModel $userModel;
    protected CreditModel $creditModel;

    public function __construct()
    {
        $this->transactionModel = new TransactionModel();
        $this->userModel        = new UserModel();
        $this->creditModel      = new CreditModel();
    }

    /* =====================================================
       🔹 LISTE DES TRANSACTIONS
       ===================================================== */
    public function index()
    {
        $transactions = $this->transactionModel
            ->orderBy('created_at', 'DESC')
            ->findAll();

        return $this->respond([
            'status'       => true,
            'transactions' => $transactions
        ]);
    }

    /* =====================================================
       🔹 CRÉER UNE TRANSACTION
       ===================================================== */
    public function create()
    {
        $data = $this->request->getJSON(true) ?? $this->request->getPost();

        if (empty($data['user_id']) || empty($data['type']) || empty($data['amount'])) {
          return $this->failValidationErrors('user_id, type et amount sont obligatoires.');
        }

        $user = $this->userModel->find($data['user_id']);
        if (!$user) {
           return $this->failNotFound('Utilisateur non trouvé.');
        }

        $data['payment_method'] = $data['payment_method'] ?? 'mobile_money';
        $data['status'] = $data['status'] ?? 'completed';
        $data['reference'] = $data['reference'] ?? 'TXN_' . uniqid();

        /* ================= TRANSACTION ================= */
        $this->transactionModel->insert($data);
        $transactionId = $this->transactionModel->getInsertID();

        if (!$transactionId) {
           return $this->failServerError('Erreur création transaction');
        }

        /* ================= CREDIT AUTO ================= */
        if ($data['type'] === 'achat_credit' && $data['status'] === 'completed') {
        $this->creditModel->insert([
            'user_id'        => $data['user_id'],
            'transaction_id'=> $transactionId,
            'credit_amount' => $data['amount'],
            'status'         => 'valid',
        ]);
        }

        return $this->respondCreated([
           'status' => true,
           'message' => 'Transaction créée avec succès.',
           'transaction_id' => $transactionId
        ]);
    }


    /* =====================================================
       🔹 AFFICHER UNE TRANSACTION
       ===================================================== */
    public function show($id = null)
    {
        $transaction = $this->transactionModel->find($id);

        if (!$transaction) {
            return $this->failNotFound('Transaction non trouvée.');
        }

        return $this->respond([
            'status'      => true,
            'transaction' => $transaction
        ]);
    }

    /* =====================================================
       🔥 UPDATE AVEC LOGIQUE MÉTIER RÉELLE
       ===================================================== */
    public function update($id = null)
    {
        $db = \Config\Database::connect();
        $db->transBegin();

        try {
            $data = $this->request->getJSON(true) ?? $this->request->getRawInput();

            $old = $this->transactionModel->find($id);
            if (!$old) {
                throw new \Exception('Transaction non trouvée.');
            }

            if (!$this->transactionModel->update($id, $data)) {
                throw new \Exception(
                    json_encode($this->transactionModel->errors())
                );
            }

            $updated = $this->transactionModel->find($id);

            /* ================================
               🔹 LOGIQUE MÉTIER CRITIQUE
               ================================ */
            if (
                $old['status'] !== 'completed' &&
                $updated['status'] === 'completed'
            ) {
                if ($updated['type'] === 'achat_credit') {
                    $this->applyCreditPurchase($updated);
                }

                if ($updated['type'] === 'withdraw') {
                    $this->applyWithdraw($updated);
                }
            }

            $db->transCommit();

            return $this->respond([
                'status'      => true,
                'message'     => 'Transaction mise à jour avec succès.',
                'transaction' => $updated
            ]);
        } catch (\Throwable $e) {
            $db->transRollback();

            return $this->failServerError(
                'Erreur transactionnelle : ' . $e->getMessage()
            );
        }
    }

    /* =====================================================
       🔹 SUPPRIMER
       ===================================================== */
    /* =====================================================
       🔹 SUPPRIMER UNE TRANSACTION
       🔥 Synchronisé avec frontend React Native
    ===================================================== */
    public function delete($id = null)
    {
        $transaction = $this->transactionModel->find($id);

        if (!$transaction) {
            return $this->failNotFound('Transaction non trouvée.');
        }

        // Supprimer les crédits associés si achat crédit
        if ($transaction['type'] === 'achat_credit') {
            $credit = $this->creditModel
                ->where('transaction_id', $transaction['id'])
                ->first();
            if ($credit) {
                $this->creditModel->delete($credit['id']);
            }
        }

        // Supprimer la transaction
        $this->transactionModel->delete($id);

        return $this->respondDeleted([
            'status'  => true,
            'message' => 'Transaction supprimée.'
        ]);
    }

    /* =====================================================
       🔧 LOGIQUE MÉTIER : ACHAT CRÉDIT
       ===================================================== */
    private function applyCreditPurchase(array $transaction)
    {
        // RÈGLE MÉTIER : 300 Ar = 1 crédit
        $creditAmount = round($transaction['amount'] / 300, 2);

        $this->creditModel->insert([
            'user_id'         => $transaction['user_id'],
            'transaction_id' => $transaction['id'],
            'credit_amount'  => $creditAmount,
            'status'          => 'valid',
            'created_at'      => date('Y-m-d H:i:s')
        ]);
    }

    /* =====================================================
       🔧 LOGIQUE MÉTIER : RETRAIT
       ===================================================== */
    private function applyWithdraw(array $transaction)
    {
        $remaining = $transaction['amount'];

        $credits = $this->creditModel
            ->where('user_id', $transaction['user_id'])
            ->where('status', 'valid')
            ->orderBy('created_at', 'ASC')
            ->findAll();

        foreach ($credits as $credit) {
            if ($remaining <= 0) break;

            $value = (float)$credit['credit_amount'];

            if ($value <= $remaining) {
                // consommer tout
                $this->creditModel->update($credit['id'], [
                    'status' => 'used'
                ]);
                $remaining -= $value;
            } else {
                // consommer partiellement
                $this->creditModel->update($credit['id'], [
                    'credit_amount' => $value - $remaining
                ]);
                $remaining = 0;
            }
        }
    }
}
