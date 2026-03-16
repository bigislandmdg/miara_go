<?php

namespace App\Models;

use CodeIgniter\Model;

class NotificationModel extends Model
{
    protected $table      = 'notifications';
    protected $primaryKey = 'id';
    protected $returnType = 'array';
    protected $allowedFields = [
        'driver_id', 'ride_request_id', 'title', 'message', 'type', 'read', 'created_at'
    ];

    protected $useTimestamps = false;

    /**
     * Créer une notification
     */
    public function createNotification($driverId, $rideRequestId, $title, $message, $type = 'ride_request')
    {
        return $this->insert([
            'driver_id'       => $driverId,
            'ride_request_id' => $rideRequestId,
            'title'           => $title,
            'message'         => $message,
            'type'            => $type,
            'read'            => false,
        ]);
    }

    /**
     * Récupérer toutes les notifications d'un driver
     */
    public function getByDriver($driverId)
    {
        return $this->where('driver_id', $driverId)
                    ->orderBy('created_at', 'DESC')
                    ->findAll();
    }

    /**
     * Récupérer uniquement les notifications non lues
     */
    public function getUnread($driverId)
    {
        return $this->where('driver_id', $driverId)
                    ->where('read', false)
                    ->orderBy('created_at', 'DESC')
                    ->findAll();
    }

    /**
     * Marquer une notification comme lue
     */
    public function markAsRead($id)
    {
        return $this->update($id, ['read' => true]);
    }

    /**
     * Marquer toutes les notifications d'un driver comme lues
     */
    public function markAllAsRead($driverId)
    {
        return $this->where('driver_id', $driverId)
                    ->set(['read' => true])
                    ->update();
    }
}
