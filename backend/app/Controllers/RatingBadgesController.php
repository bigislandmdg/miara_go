<?php

namespace App\Controllers;

use App\Models\RatingBadgeModel;
use App\Models\RatingModel;
use CodeIgniter\RESTful\ResourceController;

class RatingBadgesController extends ResourceController
{
    protected $format = 'json';
    protected $badgeModel;
    protected $ratingModel;

    public function __construct()
    {
        $this->badgeModel = new RatingBadgeModel();
        $this->ratingModel = new RatingModel();
    }

    /**
     * 🔹 Lister tous les badges
     */
    public function index()
    {
        $badges = $this->badgeModel->orderBy('created_at', 'DESC')->findAll();

        return $this->respond([
            'status' => true,
            'badges' => $badges
        ]);
    }

    /**
     * 🔹 Créer un badge
     */
    public function create()
    {
        $data = $this->request->getJSON(true);

        if (!$data || empty($data['rating_id']) || empty($data['badge_name'])) {
            return $this->failValidationErrors('Les champs rating_id et badge_name sont obligatoires.');
        }

        // Vérifier que le rating existe
        if (!$this->ratingModel->find($data['rating_id'])) {
            return $this->failNotFound('Évaluation non trouvée.');
        }

        // Vérifie si le badge existe déjà pour ce rating
        if ($this->badgeModel->alreadyExists($data['rating_id'], $data['badge_name'])) {
            return $this->failResourceExists('Ce badge existe déjà pour cette évaluation.');
        }

        // Insertion
        if (!$this->badgeModel->insert($data)) {
            return $this->failServerError('Erreur lors de la création du badge.');
        }

        $badgeId = $this->badgeModel->getInsertID();
        $badge = $this->badgeModel->find($badgeId);

        return $this->respondCreated([
            'status'  => true,
            'message' => 'Badge créé avec succès.',
            'badge'   => $badge
        ]);
    }

    /**
     * 🔹 Afficher un badge spécifique
     */
    public function show($id = null)
    {
        $badge = $this->badgeModel->find($id);
        if (!$badge) {
            return $this->failNotFound('Badge non trouvé.');
        }

        return $this->respond([
            'status' => true,
            'badge'  => $badge
        ]);
    }

    /**
     * 🔹 Mettre à jour un badge
     */
    public function update($id = null)
    {
        $data = $this->request->getJSON(true) ?? $this->request->getRawInput();

        if (!$this->badgeModel->find($id)) {
            return $this->failNotFound('Badge non trouvé.');
        }

        if (!$this->badgeModel->update($id, $data)) {
            return $this->failValidationErrors($this->badgeModel->errors());
        }

        $updated = $this->badgeModel->find($id);

        return $this->respond([
            'status'  => true,
            'message' => 'Badge mis à jour avec succès.',
            'badge'   => $updated
        ]);
    }

    /**
     * 🔹 Supprimer un badge
     */
    public function delete($id = null)
    {
        if (!$this->badgeModel->find($id)) {
            return $this->failNotFound('Badge non trouvé.');
        }

        $this->badgeModel->delete($id);

        return $this->respondDeleted([
            'status'  => true,
            'message' => 'Badge supprimé avec succès.'
        ]);
    }

    /**
     * 🔹 Filtrer les badges par rating_id
     */
    public function filter()
    {
        $rating_id = $this->request->getGet('rating_id');
        $builder = $this->badgeModel;

        if ($rating_id) {
            $builder = $builder->where('rating_id', $rating_id);
        }

        $results = $builder->orderBy('created_at', 'DESC')->findAll();

        return $this->respond([
            'status'  => true,
            'rating_id' => $rating_id,
            'results' => $results
        ]);
    }
}
