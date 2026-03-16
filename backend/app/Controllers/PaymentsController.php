<?php

namespace App\Controllers;

use App\Models\PaymentModel;
use App\Models\UserModel;
use CodeIgniter\RESTful\ResourceController;

class PaymentsController extends ResourceController
{
    protected $format = 'json';
    protected $paymentModel;
    protected $userModel;

    public function __construct()
    {
        $this->paymentModel = new PaymentModel();
        $this->userModel = new UserModel();
    }

    /**
     * 🔹 Liste de tous les paiements
     */
    public function index()
    {
        $payments = $this->paymentModel->findAll();
        return $this->respond([
            'status' => true,
            'payments' => $payments
        ]);
    }

    /**
     * 🔹 Créer un paiement
     */
    public function create()
    {
        $data = $this->request->getJSON(true) ?? $this->request->getPost();

        if (empty($data['user_id']) || empty($data['amount']) || empty($data['method'])) {
            return $this->failValidationErrors('Les champs user_id, amount et method sont obligatoires.');
        }

        // Vérifier que l'utilisateur existe
        $user = $this->userModel->find($data['user_id']);
        if (!$user) {
            return $this->failNotFound('Utilisateur non trouvé.');
        }

        // Valeurs par défaut
        $data['status'] = $data['status'] ?? 'pending';
        $data['created_at'] = date('Y-m-d H:i:s');

        if (!$this->paymentModel->insert($data)) {
            return $this->failValidationErrors($this->paymentModel->errors());
        }

        $payment = $this->paymentModel->find($this->paymentModel->getInsertID());

        return $this->respondCreated([
            'status' => true,
            'message' => 'Paiement créé avec succès.',
            'payment' => $payment
        ]);
    }

    /**
     * 🔹 Afficher un paiement
     */
    public function show($id = null)
    {
        $payment = $this->paymentModel->find($id);
        if (!$payment) {
            return $this->failNotFound('Paiement non trouvé.');
        }

        return $this->respond([
            'status' => true,
            'payment' => $payment
        ]);
    }

    /**
     * 🔹 Mettre à jour un paiement
     */
    public function update($id = null)
    {
        $data = $this->request->getJSON(true) ?? $this->request->getRawInput();

        $payment = $this->paymentModel->find($id);
        if (!$payment) {
            return $this->failNotFound('Paiement non trouvé.');
        }

        if (!$this->paymentModel->update($id, $data)) {
            return $this->failValidationErrors($this->paymentModel->errors());
        }

        $updated = $this->paymentModel->find($id);
        return $this->respond([
            'status' => true,
            'message' => 'Paiement mis à jour avec succès.',
            'payment' => $updated
        ]);
    }

    /**
     * 🔹 Supprimer un paiement
     */
    public function delete($id = null)
    {
        $payment = $this->paymentModel->find($id);
        if (!$payment) {
            return $this->failNotFound('Paiement non trouvé.');
        }

        $this->paymentModel->delete($id);

        return $this->respondDeleted([
            'status' => true,
            'message' => 'Paiement supprimé avec succès.'
        ]);
    }

    /**
     * 🔹 Compter les paiements
     */
    public function count()
    {
        $total = $this->paymentModel->countAllResults();
        return $this->respond([
            'status' => true,
            'total_payments' => $total
        ]);
    }

    /**
     * 🔹 Filtrer les paiements
     * Exemple : /payments/filter?status=completed&method=MVola
     */
    public function filter()
    {
        $status = $this->request->getGet('status');
        $method = $this->request->getGet('method');
        $user_id = $this->request->getGet('user_id');

        $builder = $this->paymentModel;

        if ($status) {
            $builder = $builder->where('status', $status);
        }

        if ($method) {
            $builder = $builder->where('method', $method);
        }

        if ($user_id) {
            $builder = $builder->where('user_id', $user_id);
        }

        $results = $builder->findAll();

        return $this->respond([
            'status' => true,
            'filters' => compact('status', 'method', 'user_id'),
            'results' => $results
        ]);
    }

    /**
     * 🔹 Statistiques des paiements
     */
    public function stats()
    {
        $db = \Config\Database::connect();
        $query = $db->query("
            SELECT 
                method,
                COUNT(*) AS total_transactions,
                SUM(amount) AS total_amount,
                SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) AS total_completed,
                SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS total_pending,
                SUM(CASE WHEN status = 'failed' THEN amount ELSE 0 END) AS total_failed
            FROM payments
            GROUP BY method
        ");

        $stats = $query->getResultArray();

        return $this->respond([
            'status' => true,
            'stats' => $stats
        ]);
    }
}
