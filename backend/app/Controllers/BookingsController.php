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
     * 🔹 Créer une réservation
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
        $data['status'] = $data['status'] ?? 'pending';
        $data['baby_on_board'] = isset($data['baby_on_board']) ? (int)$data['baby_on_board'] : 0;
        $data['pets_on_board'] = isset($data['pets_on_board']) ? (int)$data['pets_on_board'] : 0;
        $data['luggage_on_board'] = isset($data['luggage_on_board']) ? (int)$data['luggage_on_board'] : 0;

        // Vérifier existence du trajet et de l'offre si fourni
        if (!$this->rideModel->find($data['ride_id'])) {
            return $this->failNotFound('Le trajet fourni n’existe pas.');
        }

        if (!empty($data['offer_id']) && !$this->offerModel->find($data['offer_id'])) {
            return $this->failNotFound('L’offre fournie n’existe pas.');
        }

        // Insérer la réservation
        if (!$this->bookingModel->insert($data)) {
            return $this->failValidationErrors($this->bookingModel->errors());
        }

        $booking = $this->bookingModel->find($this->bookingModel->getInsertID());

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
     * 🔹 Supprimer une réservation
     */
    public function delete($id = null)
    {
        $booking = $this->bookingModel->find($id);
        if (!$booking) {
            return $this->failNotFound('Réservation non trouvée.');
        }

        $this->bookingModel->delete($id);

        return $this->respondDeleted([
            'status' => true,
            'message' => 'Réservation supprimée avec succès.'
        ]);
    }
}

