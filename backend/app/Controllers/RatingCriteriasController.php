<?php

namespace App\Controllers;

use App\Models\RatingCriteriaModel;
use App\Models\RatingModel;
use CodeIgniter\RESTful\ResourceController;

class RatingCriteriasController extends ResourceController
{
    protected $format = 'json';
    protected $ratingCriteriaModel;
    protected $ratingModel;

    public function __construct()
    {
        $this->ratingCriteriaModel = new RatingCriteriaModel();
        $this->ratingModel = new RatingModel();
    }

    /**
     * 🔹 Lister tous les critères
     */
    public function index()
    {
        $criteria = $this->ratingCriteriaModel->orderBy('created_at', 'DESC')->findAll();

        return $this->respond([
            'status'   => true,
            'criteria' => $criteria
        ]);
    }

    /**
     * 🔹 Créer un nouveau critère pour une évaluation
     */
    public function create()
    {
        $data = $this->request->getJSON(true);

        if (!$data) {
            return $this->failValidationErrors('Aucune donnée envoyée.');
        }

        if (empty($data['rating_id']) || empty($data['criterion']) || !isset($data['score'])) {
            return $this->failValidationErrors('Les champs rating_id, criterion et score sont obligatoires.');
        }

        // Vérifie si le rating existe
        if (!$this->ratingModel->find($data['rating_id'])) {
            return $this->failNotFound('Évaluation (rating) non trouvée.');
        }

        // Vérifie si le critère existe déjà
        if ($this->ratingCriteriaModel->existsForRating($data['rating_id'], $data['criterion'])) {
            return $this->failResourceExists('Ce critère existe déjà pour cette évaluation.');
        }

        if (!$this->ratingCriteriaModel->insert($data)) {
            return $this->failValidationErrors($this->ratingCriteriaModel->errors());
        }

        $newId = $this->ratingCriteriaModel->getInsertID();
        $created = $this->ratingCriteriaModel->find($newId);

        return $this->respondCreated([
            'status'  => true,
            'message' => 'Critère ajouté avec succès.',
            'criteria' => $created
        ]);
    }

    /**
     * 🔹 Afficher les critères d’un rating
     */
    public function show($ratingId = null)
    {
        if (!$ratingId) {
            return $this->failValidationErrors('ID du rating manquant.');
        }

        $criteria = $this->ratingCriteriaModel->getCriteriaByRating($ratingId);

        return $this->respond([
            'status'   => true,
            'rating_id' => $ratingId,
            'criteria' => $criteria
        ]);
    }

    /**
     * 🔹 Mettre à jour un critère
     */
    public function update($id = null)
    {
        $data = $this->request->getJSON(true) ?? $this->request->getRawInput();

        if (!$this->ratingCriteriaModel->find($id)) {
            return $this->failNotFound('Critère non trouvé.');
        }

        if (!$this->ratingCriteriaModel->update($id, $data)) {
            return $this->failValidationErrors($this->ratingCriteriaModel->errors());
        }

        $updated = $this->ratingCriteriaModel->find($id);

        return $this->respond([
            'status'  => true,
            'message' => 'Critère mis à jour avec succès.',
            'criteria' => $updated
        ]);
    }

    /**
     * 🔹 Supprimer un critère
     */
    public function delete($id = null)
    {
        if (!$this->ratingCriteriaModel->find($id)) {
            return $this->failNotFound('Critère non trouvé.');
        }

        $this->ratingCriteriaModel->delete($id);

        return $this->respondDeleted([
            'status'  => true,
            'message' => 'Critère supprimé avec succès.'
        ]);
    }

    /**
     * 🔹 Calculer la moyenne des scores pour un rating
     */
    public function average($ratingId = null)
    {
        if (!$ratingId) {
            return $this->failValidationErrors('ID du rating manquant.');
        }

        $average = $this->ratingCriteriaModel->getAverageScore($ratingId);

        return $this->respond([
            'status'        => true,
            'rating_id'     => $ratingId,
            'average_score' => $average['average_score'] ?? 0
        ]);
    }
}
