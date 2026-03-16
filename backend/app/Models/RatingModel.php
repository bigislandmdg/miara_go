<?php

namespace App\Models;

use CodeIgniter\Model;

class RatingModel extends Model
{
    protected $table = 'ratings';
    protected $primaryKey = 'id';

    protected $allowedFields = [
        'ride_id',
        'reviewer_id',
        'reviewed_id',
        'average_score',
        'comment',
        'created_at'
    ];

    protected $useTimestamps = false;

    protected $validationRules = [
        'ride_id'       => 'required|integer',
        'reviewer_id'   => 'required|integer',
        'reviewed_id'   => 'required|integer',
        'average_score' => 'required|decimal|greater_than_equal_to[0]|less_than_equal_to[5]',
    ];

    /**
     * 🔹 Calcul de la moyenne des notes d’un utilisateur
     */
    public function getAverageForUser($userId)
    {
        return $this->selectAvg('average_score')
                    ->where('reviewed_id', $userId)
                    ->get()
                    ->getRow('average_score') ?? 0;
    }

    /**
     * 🔹 Vérifie si un utilisateur a déjà noté un autre pour un trajet
     */
    public function alreadyRated($rideId, $reviewerId)
    {
        return $this->where('ride_id', $rideId)
                    ->where('reviewer_id', $reviewerId)
                    ->first();
    }
}
