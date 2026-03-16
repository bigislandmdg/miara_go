<?php

namespace App\Controllers;

use App\Models\RideModel;
use App\Models\UserModel;
use App\Models\VehicleModel;
use App\Models\LuggageModel;
use App\Models\MeetingPointModel;
use CodeIgniter\RESTful\ResourceController;

class RidesController extends ResourceController
{
    protected $rideModel;
    protected $userModel;
    protected $vehicleModel;
    protected $luggageModel;
    protected $meetingPointModel;
    protected $format = 'json';

    public function __construct()
    {
        $this->rideModel = new RideModel();
        $this->userModel = new UserModel();
        $this->vehicleModel = new VehicleModel();
        $this->luggageModel = new LuggageModel();
        $this->meetingPointModel = new MeetingPointModel();
    }

    /**
     * GET /rides
     */
    public function index()
    {
        $rides = $this->rideModel
            ->orderBy('created_at', 'DESC')
            ->findAll();

        return $this->respond([
            'status' => true,
            'rides' => array_map([$this, 'formatTrip'], $rides)
        ]);
    }

    /**
     * GET /rides/{id}
     */
    public function show($id = null)
    {
        $ride = $this->rideModel->find($id);

        if (!$ride) {
            return $this->failNotFound("Trajet introuvable.");
        }

        return $this->respond([
            'status' => true,
            'ride' => $this->formatTrip($ride)
        ]);
    }

    /**
     * POST /rides
     */
    public function create()
    {
        $data = $this->request->getJSON(true);

        if (!$data) {
            return $this->failValidationErrors("Aucune donnée reçue.");
        }

        /**
         * Vérification conducteur
         */
        if (empty($data['user_id'])) {
            return $this->failValidationErrors("user_id est obligatoire.");
        }

        $driver = $this->userModel->find((int)$data['user_id']);

        if (!$driver) {
            return $this->failNotFound("Conducteur introuvable.");
        }

        /**
         * Vérification véhicule
         */
        if (!empty($data['vehicle_id'])) {

            $vehicle = $this->vehicleModel->find((int)$data['vehicle_id']);

            if (!$vehicle) {
                return $this->failValidationErrors("Véhicule introuvable.");
            }
        }

        /**
         * Vérification luggage
         */
        if (!empty($data['luggage_id'])) {

            $luggage = $this->luggageModel->find((int)$data['luggage_id']);

            if (!$luggage) {
                return $this->failValidationErrors("Luggage introuvable.");
            }
        }

        /**
         * Vérification meeting point
         */
        if (!empty($data['meeting_point_id'])) {

            $meetingPoint = $this->meetingPointModel->find((int)$data['meeting_point_id']);

            if (!$meetingPoint) {
                return $this->failValidationErrors("Meeting point introuvable.");
            }
        }

        /**
         * Insertion ride
         */
        if (!$this->rideModel->insert($data)) {
            return $this->failValidationErrors($this->rideModel->errors());
        }

        $id = $this->rideModel->getInsertID();
        $ride = $this->rideModel->find($id);

        return $this->respondCreated([
            'status' => true,
            'message' => 'Trajet créé avec succès.',
            'ride' => $this->formatTrip($ride)
        ]);
    }

    /**
     * PUT /rides/{id}
     */
    public function update($id = null)
    {
        $ride = $this->rideModel->find($id);

        if (!$ride) {
            return $this->failNotFound("Trajet introuvable.");
        }

        $data = $this->request->getJSON(true);

        if (!$this->rideModel->update($id, $data)) {
            return $this->failValidationErrors($this->rideModel->errors());
        }

        $updatedRide = $this->rideModel->find($id);

        return $this->respond([
            'status' => true,
            'message' => 'Trajet mis à jour.',
            'ride' => $this->formatTrip($updatedRide)
        ]);
    }

    /**
     * DELETE /rides/{id}
     */
    public function delete($id = null)
    {
        if (!$id) {
            return $this->failValidationErrors("ID requis.");
        }

        $ride = $this->rideModel->find($id);

        if (!$ride) {
            return $this->failNotFound("Trajet introuvable.");
        }

        if (!$this->rideModel->delete($id)) {
            return $this->failServerError("Suppression impossible.");
        }

        return $this->respond([
            'status' => true,
            'message' => 'Trajet supprimé.'
        ]);
    }

    /**
     * Format réponse pour frontend React Native
     */
    private function formatTrip($ride)
    {
        $vehicle = null;
        $luggage = null;
        $meetingPoint = null;

        /**
         * Charger vehicle réel
         */
        if (!empty($ride['vehicle_id'])) {

            $vehicleData = $this->vehicleModel->find($ride['vehicle_id']);

            if ($vehicleData) {

                $vehicleData = $this->vehicleModel->getPhotosArray($vehicleData);

                $vehicle = [
                    'id' => (string)$vehicleData['id'],
                    'marque' => $vehicleData['marque'],
                    'model' => $vehicleData['modele'],
                    'plate' => $vehicleData['immatriculation'],
                    'color' => $vehicleData['couleur'],
                    'type' => $vehicleData['type_vehicule'],
                    'fuel' => $vehicleData['carburant'],
                    'transmission' => $vehicleData['transmission'],
                    'totalSeats' => intval($vehicleData['nombre_places']),
                    'image' => $vehicleData['photos'][0] ?? ''
                ];
            }
        }

        /**
         * Charger luggage réel
         */
        if (!empty($ride['luggage_id'])) {

            $luggageData = $this->luggageModel->find($ride['luggage_id']);

            if ($luggageData) {
                $luggage = [
                    'id' => (string)$luggageData['id'],
                    'name' => $luggageData['name'],
                    'description' => $luggageData['description']
                ];
            }
        }

        /**
         * Charger meeting point
         */
        if (!empty($ride['meeting_point_id'])) {

            $meetingPointData = $this->meetingPointModel->find($ride['meeting_point_id']);

            if ($meetingPointData) {
                $meetingPoint = [
                    'id' => (string)$meetingPointData['id'],
                    'name' => $meetingPointData['name'],
                    'address' => $meetingPointData['address'],
                    'latitude' => $meetingPointData['latitude'],
                    'longitude' => $meetingPointData['longitude']
                ];
            }
        }

        return [
            'id' => (string)$ride['id'],

            'vehicle' => $vehicle,

            'luggage' => $luggage,

            'departure' => $ride['departure'],

            'arrival' => $ride['destination'],

            'date' => date('Y-m-d', strtotime($ride['departure_time'])),

            'time' => date('H:i', strtotime($ride['departure_time'])),

            'price' => floatval($ride['price']),

            'availableSeats' => intval($ride['available_seats']),

            'meetingPoint' => $meetingPoint
        ];
    }
}
