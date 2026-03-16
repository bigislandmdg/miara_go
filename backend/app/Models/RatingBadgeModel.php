<?php

namespace App\Models;

use CodeIgniter\Model;

class RatingBadgeModel extends Model
{
    protected $table      = 'rating_badges';
    protected $primaryKey = 'id';
    protected $allowedFields = ['rating_id', 'badge_name', 'created_at'];
    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = ''; // Pas de champ updated

    /**
     * Vérifie si un badge existe déjà pour un rating
     */
    public function alreadyExists($rating_id, $badge_name)
    {
        return $this->where('rating_id', $rating_id)
                    ->where('badge_name', $badge_name)
                    ->first();
    }
}
