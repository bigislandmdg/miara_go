<?php

namespace App\Models;

use CodeIgniter\Model;

class RatingCriteriaModel extends Model
{
    protected $table = 'rating_criteria';
    protected $primaryKey = 'id';
    protected $allowedFields = ['rating_id', 'criterion', 'score', 'created_at'];
    protected $useTimestamps = false;

    /**
     * 🔹 Vérifie si un critère existe déjà pour un rating donné
     */
    public function existsForRating($ratingId, $criterion)
    {
        return $this->where([
            'rating_id' => $ratingId,
            'criterion' => $criterion
        ])->first();
    }

    /**
     * 🔹 Récupère tous les critères d’un rating
     */
    public function getCriteriaByRating($ratingId)
    {
        return $this->where('rating_id', $ratingId)
                    ->orderBy('id', 'ASC')
                    ->findAll();
    }

    /**
     * 🔹 Calcule la moyenne des scores d’un rating
     */
    public function getAverageScore($ratingId)
    {
        return $this->where('rating_id', $ratingId)
                    ->selectAvg('score', 'average_score')
                    ->get()
                    ->getRowArray();
    }
}
