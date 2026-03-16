<?php

namespace App\Controllers;

use App\Models\OfferModel;
use App\Models\UserModel;
use App\Models\RideRequestModel;
use CodeIgniter\RESTful\ResourceController;

class OffersController extends ResourceController
{
    protected $format = 'json';
    protected $offerModel;
    protected $userModel;
    protected $rideRequestModel;

    public function __construct()
    {
        $this->offerModel = new OfferModel();
        $this->userModel = new UserModel();
        $this->rideRequestModel = new RideRequestModel();
    }

    /**
     * 🔹 Lister toutes les offres
     */
    public function index()
    {
        $offers = $this->offerModel->findAll();
        return $this->respond(['status' => true, 'offers' => $offers]);
    }

    /**
     * 🔹 Créer une offre
     */
    public function create()
    {
        $data = $this->request->getJSON(true) ?? $this->request->getPost();

        // Vérification du conducteur
        $driverId = $data['driver_id'] ?? null;
        $driver = $this->userModel->find($driverId);
        if (!$driver || $driver['role'] !== 'driver') {
            return $this->failValidationErrors('Le conducteur fourni est invalide.');
        }

        // Vérification de la demande
        $rideRequestId = $data['ride_request_id'] ?? null;
        if (!$this->rideRequestModel->find($rideRequestId)) {
            return $this->failNotFound('La demande de course n’existe pas.');
        }

        if (!$this->offerModel->insert($data)) {
            return $this->failValidationErrors($this->offerModel->errors());
        }

        $offer = $this->offerModel->find($this->offerModel->getInsertID());

        return $this->respondCreated(['status' => true, 'message' => 'Offre créée avec succès.', 'offer' => $offer]);
    }

    /**
     * 🔹 Afficher une offre
     */
    public function show($id = null)
    {
        $offer = $this->offerModel->find($id);
        if (!$offer) {
            return $this->failNotFound('Offre non trouvée.');
        }
        return $this->respond(['status' => true, 'offer' => $offer]);
    }

    /**
     * 🔹 Mettre à jour une offre
     */
    public function update($id = null)
    {
        $offer = $this->offerModel->find($id);
        if (!$offer) {
            return $this->failNotFound('Offre non trouvée.');
        }

        $data = $this->request->getJSON(true) ?? $this->request->getRawInput();

        if (!$this->offerModel->update($id, $data)) {
            return $this->failValidationErrors($this->offersModel->errors());
        }

        $updatedOffer = $this->offerModel->find($id);
        return $this->respond(['status' => true, 'message' => 'Offre mise à jour avec succès.', 'offer' => $updatedOffer]);
    }

    /**
     * 🔹 Supprimer une offre
     */
    public function delete($id = null)
    {
        $offer = $this->offerModel->find($id);
        if (!$offer) {
            return $this->failNotFound('Offre non trouvée.');
        }

        $this->offerModel->delete($id);

        return $this->respondDeleted(['status' => true, 'message' => 'Offre supprimée avec succès.']);
    }

    /**
     * 🔹 Filtrer les offres
     */
    public function filter()
    {
        $rideRequestId = $this->request->getVar('ride_request_id');
        $driverId = $this->request->getVar('driver_id');
        $status = $this->request->getVar('status');

        $builder = $this->offerModel;

        if ($rideRequestId) $builder = $builder->where('ride_request_id', (int) $rideRequestId);
        if ($driverId) $builder = $builder->where('driver_id', (int) $driverId);
        if ($status) $builder = $builder->where('status', $status);

        $offers = $builder->findAll();

        return $this->respond(['status' => true, 'offers' => $offers]);
    }

    /**
     * 🔹 Compter les offres
     */
    public function count()
    {
        $total = $this->offerModel->countAllResults();
        return $this->respond(['status' => true, 'total_offers' => $total]);
    }
}
