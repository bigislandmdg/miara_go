<?php

namespace App\Controllers;

use App\Models\CreditTransactionModel;
use App\Models\UserModel;
use CodeIgniter\RESTful\ResourceController;

class CreditTransactionsController extends ResourceController
{
    protected $format = 'json';
    protected $transactionModel;
    protected $userModel;

    public function __construct()
    {
        $this->transactionModel = new CreditTransactionModel();
        $this->userModel = new UserModel();
    }

    // 🔹 Liste de toutes les transactions
    public function index()
    {
        $transactions = $this->transactionModel->orderBy('created_at', 'DESC')->findAll();
        return $this->respond(['status' => true, 'transactions' => $transactions]);
    }

    // 🔹 Créer une transaction
    public function create()
    {
        $data = $this->request->getJSON(true) ?? $this->request->getPost();

        if (empty($data['user_id']) || empty($data['type']) || empty($data['amount'])) {
            return $this->failValidationErrors('Les champs user_id, type et amount sont obligatoires.');
        }

        // Vérifier utilisateur
        if (!$this->userModel->find($data['user_id'])) {
            return $this->failNotFound('Utilisateur non trouvé.');
        }

        $data['reference'] = $data['reference'] ?? 'CR_TXN_' . uniqid();
        $data['created_at'] = $data['created_at'] ?? date('Y-m-d H:i:s');

        $transaction = $this->transactionModel->createTransaction($data);
        if (!$transaction) {
            return $this->failValidationErrors($this->transactionModel->errors());
        }

        return $this->respondCreated([
            'status' => true,
            'message' => 'Transaction de crédit créée avec succès.',
            'transaction' => $transaction
        ]);
    }

    // 🔹 Afficher une transaction
    public function show($id = null)
    {
        $transaction = $this->transactionModel->find($id);
        if (!$transaction) {
            return $this->failNotFound('Transaction non trouvée.');
        }
        return $this->respond(['status' => true, 'transaction' => $transaction]);
    }

    // 🔹 Supprimer une transaction
    public function delete($id = null)
    {
        if (!$this->transactionModel->find($id)) {
            return $this->failNotFound('Transaction non trouvée.');
        }
        $this->transactionModel->delete($id);
        return $this->respondDeleted(['status' => true, 'message' => 'Transaction supprimée.']);
    }

    // 🔹 Compter toutes les transactions
    public function count()
    {
        $total = $this->transactionModel->countAllResults();
        return $this->respond(['status' => true, 'total_transactions' => $total]);
    }

    // 🔹 Filtrer transactions (user_id, type)
    public function filter()
    {
        $filters = $this->request->getGet();
        $builder = $this->transactionModel;

        if (!empty($filters['user_id'])) $builder = $builder->where('user_id', $filters['user_id']);
        if (!empty($filters['type'])) $builder = $builder->where('type', $filters['type']);

        $results = $builder->orderBy('created_at', 'DESC')->findAll();
        return $this->respond(['status' => true, 'filters' => $filters, 'results' => $results]);
    }
}
