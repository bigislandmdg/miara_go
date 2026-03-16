<?php

namespace App\Controllers;

use App\Models\RideRequestModel;
use App\Models\UserModel;
use App\Models\NotificationModel;
use CodeIgniter\RESTful\ResourceController;

class RideRequestsController extends ResourceController
{
    protected $format = 'json';

    protected $rideRequestModel;
    protected $userModel;
    protected $notificationModel;

    public function __construct()
    {
        $this->rideRequestModel  = new RideRequestModel();
        $this->userModel         = new UserModel();
        $this->notificationModel = new NotificationModel();
    }

    /* =========================================================
     * 🔹 LISTE DE TOUTES LES DEMANDES
     * ========================================================= */
    public function index()
    {
        $rideRequests = $this->rideRequestModel->findAll();

        return $this->respond([
            'status' => true,
            'ride_requests' => $rideRequests
        ]);
    }

    /* =========================================================
     * 🔹 AFFICHER UNE DEMANDE PAR ID
     * ========================================================= */
    public function show($id = null)
    {
        $rideRequest = $this->rideRequestModel->find($id);

        if (!$rideRequest) {
            return $this->failNotFound('Demande de course non trouvée.');
        }

        return $this->respond([
            'status' => true,
            'ride_request' => $rideRequest
        ]);
    }

    /* =========================================================
     * 🔹 CRÉER UNE NOUVELLE DEMANDE
     * ========================================================= */
    public function create()
    {
        $data = $this->request->getJSON(true);

        if (!$data) {
            return $this->failValidationErrors('Payload JSON invalide.');
        }

        $allowedFields = [
            'departure_location',
            'arrival_location',
            'desired_date',
            'desired_time',
            'seats_needed',
            'luggage_info',
            'message',
            'status',
            'is_notified',
        ];

        $rideRequestData = array_intersect_key($data, array_flip($allowedFields));

        if (empty($rideRequestData)) {
            return $this->failValidationErrors('Champs requis manquants.');
        }

        try {
            if (!$this->rideRequestModel->insert($rideRequestData)) {
                return $this->failValidationErrors($this->rideRequestModel->errors());
            }

            $requestId = $this->rideRequestModel->getInsertID();
            $rideRequest = $this->rideRequestModel->find($requestId);

            // 🔔 NOTIFIER TOUS LES DRIVERS
            $drivers = $this->userModel->where('role', 'driver')->findAll();
            foreach ($drivers as $driver) {
                $this->notificationModel->createNotification(
                    $driver['id'],
                    $requestId,
                    'Nouvelle demande disponible',
                    "{$rideRequest['departure_location']} → {$rideRequest['arrival_location']}"
                );
            }

            return $this->respondCreated([
                'status' => true,
                'message' => 'Demande créée et notifications envoyées aux drivers.',
                'ride_request' => $rideRequest
            ]);

        } catch (\Throwable $e) {
            return $this->failServerError($e->getMessage());
        }
    }

    /* =========================================================
     * 🔹 METTRE À JOUR UNE DEMANDE
     * ========================================================= */
    public function update($id = null)
    {
        $rideRequest = $this->rideRequestModel->find($id);

        if (!$rideRequest) {
            return $this->failNotFound('Demande de course introuvable.');
        }

        $data = $this->request->getJSON(true);
        if (!$data) {
            return $this->failValidationErrors('Payload JSON invalide.');
        }

        $allowedFields = [
            'departure_location',
            'arrival_location',
            'desired_date',
            'desired_time',
            'seats_needed',
            'luggage_info',
            'message',
            'status',
            'is_notified',
        ];

        $updateData = array_intersect_key($data, array_flip($allowedFields));

        if (empty($updateData)) {
            return $this->failValidationErrors('Aucun champ valide à mettre à jour.');
        }

        if (!$this->rideRequestModel->update($id, $updateData)) {
            return $this->failValidationErrors($this->rideRequestModel->errors());
        }

        return $this->respond([
            'status' => true,
            'message' => 'Demande mise à jour avec succès.',
            'ride_request' => $this->rideRequestModel->find($id)
        ]);
    }

    /* =========================================================
     * 🔹 SUPPRIMER UNE DEMANDE
     * ========================================================= */
    public function delete($id = null)
    {
        $rideRequest = $this->rideRequestModel->find($id);

        if (!$rideRequest) {
            return $this->failNotFound('Demande de course introuvable.');
        }

        $this->rideRequestModel->delete($id);

        return $this->respondDeleted([
            'status' => true,
            'message' => 'Demande supprimée avec succès.'
        ]);
    }

    /* =========================================================
     * 🔹 FILTRER / RECHERCHER LES DEMANDES
     * ========================================================= */
    public function filter()
    {
        $departure = $this->request->getVar('departure_location');
        $arrival   = $this->request->getVar('arrival_location');
        $status    = $this->request->getVar('status');
        $date      = $this->request->getVar('desired_date');
        $seats     = $this->request->getVar('seats_needed');
        $luggage   = $this->request->getVar('luggage_info');

        $builder = $this->rideRequestModel;

        if ($departure) $builder = $builder->where('departure_location', $departure);
        if ($arrival)   $builder = $builder->where('arrival_location', $arrival);
        if ($status)    $builder = $builder->where('status', $status);
        if ($date)      $builder = $builder->where('desired_date', $date);
        if ($seats)     $builder = $builder->where('seats_needed', $seats);
        if ($luggage)   $builder = $builder->where('luggage_info', $luggage);

        $rideRequests = $builder->findAll();

        return $this->respond([
            'status' => true,
            'ride_requests' => $rideRequests
        ]);
    }
}

