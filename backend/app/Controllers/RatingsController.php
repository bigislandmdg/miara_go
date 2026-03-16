<?php

namespace App\Controllers;

use App\Models\RatingModel;
use App\Models\UserModel;
use App\Models\RideModel;
use CodeIgniter\RESTful\ResourceController;

class RatingsController extends ResourceController
{
    protected $format = 'json';
    protected $ratingsModel;
    protected $userModel;
    protected $rideModel;

    public function __construct()
    {
        $this->ratingModel = new RatingModel();
        $this->userModel = new UserModel();
        $this->rideModel = new RideModel();
    }

    /**
     * 🔹 Lister toutes les évaluations
     */
    public function index()
    {
        $ratings = $this->ratingModel
            ->orderBy('created_at', 'DESC')
            ->findAll();

        return $this->respond([
            'status'  => true,
            'ratings' => $ratings
        ]);
    }

    /**
     * 🔹 Créer une nouvelle évaluation
     */
    public function create()
    {
        $data = $this->request->getJSON(true);

        if (!$data) {
            return $this->failValidationErrors('Aucune donnée reçue.');
        }

        // Validation des champs obligatoires
        $required = ['ride_id', 'reviewer_id', 'reviewed_id', 'average_score'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return $this->failValidationErrors("Le champ {$field} est obligatoire.");
            }
        }

        // Vérifie si les utilisateurs et la course existent
        if (!$this->userModel->find($data['reviewer_id'])) {
            return $this->failNotFound('Utilisateur évaluateur non trouvé.');
        }
        if (!$this->userModel->find($data['reviewed_id'])) {
            return $this->failNotFound('Utilisateur évalué non trouvé.');
        }
        if (!$this->rideModel->find($data['ride_id'])) {
            return $this->failNotFound('Course non trouvée.');
        }

        // Vérifie si déjà noté
        if ($this->ratingModel->alreadyRated($data['ride_id'], $data['reviewer_id'])) {
            return $this->failResourceExists('Cet utilisateur a déjà noté cette course.');
        }

        // Insertion
        if (!$this->ratingModel->insert($data)) {
            return $this->failValidationErrors($this->ratingModel->errors());
        }

        $ratingId = $this->ratingModel->getInsertID();
        $rating = $this->ratingModel->find($ratingId);

        return $this->respondCreated([
            'status'  => true,
            'message' => 'Évaluation créée avec succès.',
            'rating'  => $rating
        ]);
    }

    /**
     * 🔹 Afficher une évaluation spécifique
     */
    public function show($id = null)
    {
        $rating = $this->ratingModel->find($id);

        if (!$rating) {
            return $this->failNotFound('Évaluation non trouvée.');
        }

        return $this->respond([
            'status' => true,
            'rating' => $rating
        ]);
    }

    /**
     * 🔹 Mettre à jour une évaluation
     */
    public function update($id = null)
    {
        $data = $this->request->getJSON(true) ?? $this->request->getRawInput();

        if (!$this->ratingModel->find($id)) {
            return $this->failNotFound('Évaluation non trouvée.');
        }

        if (!$this->ratingModel->update($id, $data)) {
            return $this->failValidationErrors($this->ratingModel->errors());
        }

        $updated = $this->ratingModel->find($id);

        return $this->respond([
            'status'  => true,
            'message' => 'Évaluation mise à jour avec succès.',
            'rating'  => $updated
        ]);
    }

    /**
     * 🔹 Supprimer une évaluation
     */
    public function delete($id = null)
    {
        if (!$this->ratingModel->find($id)) {
            return $this->failNotFound('Évaluation non trouvée.');
        }

        $this->ratingModel->delete($id);

        return $this->respondDeleted([
            'status'  => true,
            'message' => 'Évaluation supprimée avec succès.'
        ]);
    }

    /**
     * 🔹 Moyenne des notes d’un utilisateur
     */
    public function average($userId = null)
    {
        if (!$userId) {
            return $this->failValidationErrors('ID utilisateur manquant.');
        }

        $average = $this->ratingModel->getAverageForUser($userId);

        return $this->respond([
            'status'        => true,
            'user_id'       => $userId,
            'average_score' => round($average, 2)
        ]);
    }

    /**
     * 🔹 Filtrer les évaluations
     */
    public function filter()
    {
        $filters = $this->request->getGet();
        $builder = $this->ratingModel;

        if (!empty($filters['ride_id'])) {
            $builder = $builder->where('ride_id', $filters['ride_id']);
        }

        if (!empty($filters['reviewed_id'])) {
            $builder = $builder->where('reviewed_id', $filters['reviewed_id']);
        }

        $results = $builder->orderBy('created_at', 'DESC')->findAll();

        return $this->respond([
            'status'  => true,
            'filters' => $filters,
            'results' => $results
        ]);
    }
}
