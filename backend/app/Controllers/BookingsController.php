<?php

namespace App\Controllers;

use App\Models\BookingModel;
use App\Models\RideModel;
use App\Models\OfferModel;
use CodeIgniter\RESTful\ResourceController;

class BookingsController extends ResourceController
{
    protected $format = 'json';
    protected $bookingModel;
    protected $rideModel;
    protected $offerModel;

    public function __construct()
    {
        $this->bookingModel = new BookingModel();
        $this->rideModel = new RideModel();
        $this->offerModel = new OfferModel();
    }

    /**
     * 🔹 Lister toutes les réservations
     */
    public function index()
    {
        $bookings = $this->bookingModel->findAll();
        return $this->respond([
            'status' => true,
            'bookings' => $bookings
        ]);
    }

    /**
     * 🔹 Créer une réservation (statut directement "confirmed")
     */
    public function create()
    {
        $data = $this->request->getJSON(true) ?? $this->request->getPost();

        // Validation minimale
        if (empty($data['ride_id']) || empty($data['seats_reserved']) || empty($data['total_price'])) {
            return $this->failValidationErrors('Les champs ride_id, seats_reserved et total_price sont obligatoires.');
        }

        // Forcer les types
        $data['ride_id'] = (int)$data['ride_id'];
        $data['offer_id'] = isset($data['offer_id']) ? (int)$data['offer_id'] : null;
        $data['seats_reserved'] = (int)$data['seats_reserved'];
        $data['total_price'] = (float)$data['total_price'];
        
        // 🔹 LE STATUT EST DIRECTEMENT "confirmed"
        $data['status'] = $data['status'] ?? 'confirmed';
        
        $data['baby_on_board'] = isset($data['baby_on_board']) ? (int)$data['baby_on_board'] : 0;
        $data['pets_on_board'] = isset($data['pets_on_board']) ? (int)$data['pets_on_board'] : 0;
        $data['luggage_on_board'] = isset($data['luggage_on_board']) ? (int)$data['luggage_on_board'] : 0;

        // Vérifier existence du trajet
        $ride = $this->rideModel->find($data['ride_id']);
        if (!$ride) {
            return $this->failNotFound('Le trajet fourni n’existe pas.');
        }

        // Vérifier l'offre si fournie
        if (!empty($data['offer_id']) && !$this->offerModel->find($data['offer_id'])) {
            return $this->failNotFound('L’offre fournie n’existe pas.');
        }

        // Vérifier les places disponibles
        $availableSeats = $ride['available_seats'] ?? $ride['nombre_places'] ?? 0;
        
        if ($availableSeats < $data['seats_reserved']) {
            return $this->failValidationErrors('Nombre de places insuffisant. Places disponibles: ' . $availableSeats);
        }
        
        // Démarrer une transaction
        $db = \Config\Database::connect();
        $db->transStart();
        
        // Mettre à jour les places disponibles
        $this->rideModel->update($data['ride_id'], [
            'available_seats' => $availableSeats - $data['seats_reserved']
        ]);

        // Insérer la réservation
        if (!$this->bookingModel->insert($data)) {
            $db->transRollback();
            return $this->failValidationErrors($this->bookingModel->errors());
        }

        $booking = $this->bookingModel->find($this->bookingModel->getInsertID());
        
        $db->transComplete();

        return $this->respondCreated([
            'status' => true,
            'message' => 'Réservation créée avec succès.',
            'booking' => $booking
        ]);
    }

    /**
     * 🔹 Afficher une réservation
     */
    public function show($id = null)
    {
        $booking = $this->bookingModel->find($id);
        if (!$booking) {
            return $this->failNotFound('Réservation non trouvée.');
        }

        return $this->respond([
            'status' => true,
            'booking' => $booking
        ]);
    }

    /**
     * 🔹 Mettre à jour une réservation
     */
    public function update($id = null)
    {
        $data = $this->request->getJSON(true) ?? $this->request->getRawInput();
        $booking = $this->bookingModel->find($id);
        if (!$booking) {
            return $this->failNotFound('Réservation non trouvée.');
        }

        // Vérifier l'existence du trajet ou de l'offre si ils sont mis à jour
        if (isset($data['ride_id']) && !$this->rideModel->find($data['ride_id'])) {
            return $this->failNotFound('Le trajet fourni n’existe pas.');
        }

        if (isset($data['offer_id']) && !$this->offerModel->find($data['offer_id'])) {
            return $this->failNotFound('L’offre fournie n’existe pas.');
        }

        if (!$this->bookingModel->update($id, $data)) {
            return $this->failValidationErrors($this->bookingModel->errors());
        }

        $updatedBooking = $this->bookingModel->find($id);

        return $this->respond([
            'status' => true,
            'message' => 'Réservation mise à jour avec succès.',
            'booking' => $updatedBooking
        ]);
    }

    /**
     * 🔹 Mettre à jour le statut d'une réservation
     */
    public function updateStatus($id = null)
    {
        $data = $this->request->getJSON(true) ?? $this->request->getRawInput();
        
        if (empty($data['status'])) {
            return $this->failValidationErrors('Le champ status est obligatoire.');
        }
        
        $allowedStatus = ['pending', 'confirmed', 'completed', 'cancelled'];
        if (!in_array($data['status'], $allowedStatus)) {
            return $this->failValidationErrors('Statut invalide. Les valeurs autorisées sont: ' . implode(', ', $allowedStatus));
        }
        
        $booking = $this->bookingModel->find($id);
        if (!$booking) {
            return $this->failNotFound('Réservation non trouvée.');
        }
        
        $db = \Config\Database::connect();
        $db->transStart();
        
        // Si annulation, remettre les places disponibles
        if ($data['status'] === 'cancelled' && $booking['status'] !== 'cancelled') {
            $ride = $this->rideModel->find($booking['ride_id']);
            if ($ride) {
                $availableSeats = $ride['available_seats'] ?? $ride['nombre_places'] ?? 0;
                $this->rideModel->update($booking['ride_id'], [
                    'available_seats' => $availableSeats + $booking['seats_reserved']
                ]);
            }
        }
        
        // Si confirmation d'une réservation en attente
        if ($data['status'] === 'confirmed' && $booking['status'] === 'pending') {
            $ride = $this->rideModel->find($booking['ride_id']);
            if ($ride) {
                $availableSeats = $ride['available_seats'] ?? $ride['nombre_places'] ?? 0;
                if ($availableSeats < $booking['seats_reserved']) {
                    return $this->failValidationErrors('Nombre de places insuffisant.');
                }
                $this->rideModel->update($booking['ride_id'], [
                    'available_seats' => $availableSeats - $booking['seats_reserved']
                ]);
            }
        }
        
        if (!$this->bookingModel->update($id, ['status' => $data['status']])) {
            $db->transRollback();
            return $this->failValidationErrors($this->bookingModel->errors());
        }
        
        $db->transComplete();
        
        $updatedBooking = $this->bookingModel->find($id);
        
        return $this->respond([
            'status' => true,
            'message' => 'Statut de la réservation mis à jour avec succès.',
            'booking' => $updatedBooking
        ]);
    }

    /**
     * 🔹 Supprimer une réservation
     */
    public function delete($id = null)
    {
        $booking = $this->bookingModel->find($id);
        if (!$booking) {
            return $this->failNotFound('Réservation non trouvée.');
        }

        $db = \Config\Database::connect();
        $db->transStart();

        // Si la réservation n'est pas annulée, remettre les places disponibles
        if ($booking['status'] !== 'cancelled') {
            $ride = $this->rideModel->find($booking['ride_id']);
            if ($ride) {
                $availableSeats = $ride['available_seats'] ?? $ride['nombre_places'] ?? 0;
                $this->rideModel->update($booking['ride_id'], [
                    'available_seats' => $availableSeats + $booking['seats_reserved']
                ]);
            }
        }

        $this->bookingModel->delete($id);
        
        $db->transComplete();

        return $this->respondDeleted([
            'status' => true,
            'message' => 'Réservation supprimée avec succès.'
        ]);
    }

    /**
     * 🔹 Récupérer les réservations d'un utilisateur
     */
    public function getUserBookings($userId = null)
    {
        if (!$userId) {
            return $this->fail('ID utilisateur requis', 400);
        }
        
        $bookings = $this->bookingModel
            ->where('passenger_id', $userId)
            ->orderBy('created_at', 'DESC')
            ->findAll();
            
        return $this->respond([
            'status' => true,
            'bookings' => $bookings
        ]);
    }
}
