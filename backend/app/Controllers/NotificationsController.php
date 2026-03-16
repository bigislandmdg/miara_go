<?php

namespace App\Controllers;

use App\Models\NotificationModel;
use CodeIgniter\RESTful\ResourceController;

class NotificationsController extends ResourceController
{
    protected $format = 'json';
    protected $notificationModel;

    public function __construct()
    {
        $this->notificationModel = new NotificationModel();
    }

    /**
     * GET /notifications?driver_id=1
     */
    public function index()
    {
        $driverId = $this->request->getVar('driver_id');
        if (!$driverId) {
            return $this->fail('Le driver_id est requis.', 400);
        }

        $notifications = $this->notificationModel->getByDriver($driverId);

        return $this->respond([
            'status' => true,
            'notifications' => $notifications
        ]);
    }

    /**
     * GET /notifications/unread?driver_id=1
     */
    public function unread()
    {
        $driverId = $this->request->getVar('driver_id');
        if (!$driverId) {
            return $this->fail('Le driver_id est requis.', 400);
        }

        $notifications = $this->notificationModel->getUnread($driverId);

        return $this->respond([
            'status' => true,
            'unread_notifications' => $notifications
        ]);
    }

    /**
     * POST /notifications/mark-read/{id}
     */
    public function markRead($id = null)
    {
        if (!$id) {
            return $this->fail('L\'ID de la notification est requis.', 400);
        }

        if (!$this->notificationModel->markAsRead($id)) {
            return $this->failNotFound('Notification non trouvée.');
        }

        return $this->respond([
            'status' => true,
            'message' => 'Notification marquée comme lue.'
        ]);
    }

    /**
     * POST /notifications/mark-all-read?driver_id=1
     */
    public function markAllRead()
    {
        $driverId = $this->request->getVar('driver_id');
        if (!$driverId) {
            return $this->fail('Le driver_id est requis.', 400);
        }

        $this->notificationModel->markAllAsRead($driverId);

        return $this->respond([
            'status' => true,
            'message' => 'Toutes les notifications ont été marquées comme lues.'
        ]);
    }

    /**
     * POST /notifications
     */
    public function create()
    {
        $data = $this->request->getJSON(true);
        if (!$data || empty($data['driver_id'])) {
            return $this->fail('driver_id est requis.', 400);
        }

        $notification = $this->notificationModel->createNotification(
            $data['driver_id'],
            $data['ride_request_id'] ?? null,
            $data['title'] ?? '',
            $data['message'] ?? '',
            $data['type'] ?? 'ride_request'
        );

        return $this->respondCreated([
            'status' => true,
            'message' => 'Notification créée avec succès.',
            'notification' => $notification
        ]);
    }

    /**
     * DELETE /notifications/{id}
     */
    public function delete($id = null)
    {
        if (!$id) {
            return $this->fail('ID requis.', 400);
        }

        $notification = $this->notificationModel->find($id);
        if (!$notification) {
            return $this->failNotFound('Notification introuvable.');
        }

        $this->notificationModel->delete($id);

        return $this->respond([
            'status' => true,
            'message' => 'Notification supprimée.',
            'deleted' => $notification // utile pour Undo
        ]);
    }

    /**
     * POST /notifications/restore
     * Body JSON = notification complète
     */
    public function restore()
    {
        $data = $this->request->getJSON(true);

        if (!$data || empty($data['id'])) {
            return $this->fail('Données invalides.', 400);
        }

        // Évite doublon si déjà restaurée
        if ($this->notificationModel->find($data['id'])) {
            return $this->respond([
                'status' => true,
                'message' => 'Notification déjà restaurée.'
            ]);
        }

        $this->notificationModel->insert([
            'id' => $data['id'],
            'driver_id' => $data['driver_id'],
            'ride_request_id' => $data['ride_request_id'] ?? null,
            'title' => $data['title'],
            'message' => $data['message'],
            'type' => $data['type'],
            'read' => $data['read'] ?? 'f',
            'created_at' => $data['created_at'],
        ]);

        return $this->respondCreated([
            'status' => true,
            'message' => 'Notification restaurée.'
        ]);
    }
}
