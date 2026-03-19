<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');

// -------------------------
// Auth Routes
// -------------------------
$routes->group('auth', ['namespace' => 'App\Controllers'], function ($routes) {
    $routes->post('register', 'AuthController::register');
    $routes->post('send-otp', 'AuthController::sendOtp');
     $routes->get('get-lastest-otp', 'AuthController::getLatestOtp');
    $routes->post('verify-otp', 'AuthController::verifyOtp');
    $routes->post('login', 'AuthController::login');
    $routes->post('refresh-token', 'AuthController::refreshToken');
    $routes->get('verify-token', 'AuthController::verifyToken');
    $routes->get('me', 'AuthController::me');
    $routes->get('profile', 'AuthController::profile');
    $routes->post('logout', 'AuthController::logout');

     // =========================
    // 🔐 BIOMETRIC AUTH (NEW)
    // =========================

    // ➜ Activer biométrie après OTP
    // Body: phone, biometric_token, device_id
    $routes->post('biometric-enable', 'AuthController::enableBiometric');

    // ➜ Login rapide biométrique
    // Body: biometric_token, device_id
    $routes->post('biometric-login', 'AuthController::biometricLogin');

});

// -------------------------
// Rides Routes
// -------------------------
$routes->group('rides', ['namespace' => 'App\Controllers'], function($routes) {
    $routes->get('', 'RidesController::index');
    $routes->post('', 'RidesController::create');
    $routes->get('(:num)', 'RidesController::show/$1');
    $routes->put('(:num)', 'RidesController::update/$1');
    $routes->delete('(:num)', 'RidesController::delete/$1');
    $routes->get('filter', 'RidesController::filter');
    $routes->get('count', 'RidesController::count');
    $routes->get('stats', 'RidesController::stats');
});

// -------------------------
// Messages Routes
// -------------------------
// Routes API complètes pour les messages
// Messages Routes
$routes->group('messages', ['namespace' => 'App\Controllers'], function($routes) {
    // GET
    $routes->get('/', 'MessagesController::index');
    $routes->get('conversations/(:num)', 'MessagesController::conversations/$1');
    $routes->get('unread/(:num)', 'MessagesController::unread/$1');
    $routes->get('search', 'MessagesController::search');
    $routes->get('stats/(:num)', 'MessagesController::stats/$1');
    $routes->get('last/(:num)/(:num)/(:num)', 'MessagesController::lastMessage/$1/$2/$3');
    $routes->get('between/(:num)/(:num)/(:num)', 'MessagesController::between/$1/$2/$3');
    $routes->get('recent/(:num)', 'MessagesController::recent/$1');
    $routes->get('(:num)', 'MessagesController::show/$1');
    
    // POST
    $routes->post('/', 'MessagesController::create');
    $routes->post('with-metadata', 'MessagesController::createWithMetadata');
    $routes->post('cleanup', 'MessagesController::cleanup');
    
    // PUT
    $routes->put('read', 'MessagesController::markAsRead');
    $routes->put('(:num)', 'MessagesController::update/$1');
    
    // DELETE
    $routes->delete('(:num)', 'MessagesController::delete/$1');
    $routes->delete('conversation', 'MessagesController::deleteConversation');
});

// -------------------------
// -------------------------
// Routes pour RideRequests
$routes->group('ride-requests', ['namespace' => 'App\Controllers'], function($routes) {
    
    // 🔹 Lister toutes les demandes
    $routes->get('', 'RideRequestsController::index');
    
    // 🔹 Créer une nouvelle demande (et notifier les drivers)
    $routes->post('', 'RideRequestsController::create');
    
    // 🔹 Afficher une demande spécifique
    $routes->get('(:num)', 'RideRequestsController::show/$1');
    
    // 🔹 Mettre à jour une demande
    $routes->put('(:num)', 'RideRequestsController::update/$1');
    
    // 🔹 Supprimer une demande
    $routes->delete('(:num)', 'RideRequestsController::delete/$1');
    
    // 🔹 Filtrer les demandes
    $routes->get('filter', 'RideRequestsController::filter');
    
    // 🔹 Compter le nombre total de demandes
    $routes->get('count', 'RideRequestsController::count');
    
    // 🔹 Statistiques des demandes
    $routes->get('stats', 'RideRequestsController::stats');
    
});


// -------------------------
// Vehicles Routes
// -------------------------
$routes->group('vehicles', ['namespace' => 'App\Controllers'], function($routes) {

    // 🔹 Lister tous les véhicules
    $routes->get('', 'VehiclesController::index');

    // 🔹 Créer un véhicule (+ upload photos)
    $routes->post('', 'VehiclesController::create');

    // 🔹 Voir un véhicule spécifique
    $routes->get('(:num)', 'VehiclesController::show/$1');

    // 🔹 Mettre à jour un véhicule (+ ajout photos)
    $routes->put('(:num)', 'VehiclesController::update/$1');

    // 🔹 Supprimer un véhicule
    $routes->delete('(:num)', 'VehiclesController::delete/$1');

    // 🔹 Supprimer UNE photo spécifique (JSON)
    $routes->delete('(:num)/photos', 'VehiclesController::deletePhoto/$1');

});


// -------------------------
// Luggages Routes
// -------------------------
$routes->group('luggages', ['namespace' => 'App\Controllers'], function($routes) {

    // 🔹 Lister tous les bagages
    $routes->get('', 'LuggagesController::index');

    // 🔹 Créer un bagage
    $routes->post('', 'LuggagesController::create');

    // 🔹 Voir un bagage spécifique
    $routes->get('(:num)', 'LuggagesController::show/$1');

    // 🔹 Mettre à jour un bagage
    $routes->put('(:num)', 'LuggagesController::update/$1');

    // 🔹 Supprimer un bagage
    $routes->delete('(:num)', 'LuggagesController::delete/$1');

});

// -------------------------
// MeetingPoints Routes
// -------------------------
$routes->group('meeting-points', ['namespace' => 'App\Controllers'], function($routes) {

    // 🔹 Lister tous les meeting points
    $routes->get('', 'MeetingPointsController::index');

    // 🔹 Créer un meeting point
    $routes->post('', 'MeetingPointsController::create');

    // 🔹 Voir un meeting point spécifique
    $routes->get('(:num)', 'MeetingPointsController::show/$1');

    // 🔹 Mettre à jour un meeting point
    $routes->put('(:num)', 'MeetingPointsController::update/$1');

    // 🔹 Supprimer un meeting point
    $routes->delete('(:num)', 'MeetingPointsController::delete/$1');

});



// -------------------------
// Offers Routes
// -------------------------
$routes->group('offers', ['namespace' => 'App\Controllers'], function($routes) {
    $routes->get('', 'OffersController::index');
    $routes->post('', 'OffersController::create');
    $routes->get('(:num)', 'OffersController::show/$1');
    $routes->put('(:num)', 'OffersController::update/$1');
    $routes->delete('(:num)', 'OffersController::delete/$1');
    $routes->get('filter', 'OffersController::filter');
    $routes->get('count', 'OffersController::count');
});

// -------------------------
// Bookings Routes
// -------------------------
$routes->group('bookings', ['namespace' => 'App\Controllers'], function($routes) {
    $routes->get('', 'BookingsController::index');
    $routes->post('', 'BookingsController::create');
    $routes->get('(:num)', 'BookingsController::show/$1');
    $routes->put('(:num)', 'BookingsController::update/$1');
    $routes->delete('(:num)', 'BookingsController::delete/$1');
    $routes->get('filter', 'BookingsController::filter');
    $routes->get('count', 'BookingsController::count');
    $routes->get('stats', 'BookingsController::stats');
});

// -------------------------
// Payments Routes
// -------------------------
$routes->group('payments', ['namespace' => 'App\Controllers'], function($routes) {
    $routes->get('', 'PaymentsController::index');
    $routes->post('', 'PaymentsController::create');
    $routes->get('(:num)', 'PaymentsController::show/$1');
    $routes->put('(:num)', 'PaymentsController::update/$1');
    $routes->delete('(:num)', 'PaymentsController::delete/$1');
    $routes->get('filter', 'PaymentsController::filter');
    $routes->get('count', 'PaymentsController::count');
    $routes->get('stats', 'PaymentsController::stats');
});

// -------------------------
// Wallets Routes
// -------------------------
$routes->group('wallets', ['namespace' => 'App\Controllers'], function($routes) {
    $routes->get('', 'WalletsController::index');
    $routes->post('', 'WalletsController::create');
    $routes->get('(:num)', 'WalletsController::show/$1');
    $routes->put('(:num)', 'WalletsController::update/$1');
    $routes->delete('(:num)', 'WalletsController::delete/$1');
    $routes->post('deposit', 'WalletsController::deposit');
    $routes->post('withdraw', 'WalletsController::withdraw');
    $routes->get('balance/(:num)', 'WalletsController::balance/$1');
    $routes->get('filter', 'WalletsController::filter');
    $routes->get('stats', 'WalletsController::stats');

    // Correct routes pour QR code
    $routes->get('generateQR/(:num)', 'WalletsController::generateQR/$1');
    $routes->post('scan-qr', 'WalletsController::scanQR');
});

// -------------------------
// Transactions Routes
// -------------------------
$routes->group('transactions', ['namespace' => 'App\Controllers'], function($routes) {
    $routes->get('', 'TransactionsController::index');
    $routes->post('', 'TransactionsController::create');
    $routes->get('(:num)', 'TransactionsController::show/$1');
    $routes->put('(:num)', 'TransactionsController::update/$1');
    $routes->delete('(:num)', 'TransactionsController::delete/$1');
    $routes->get('filter', 'TransactionsController::filter');
    $routes->get('count', 'TransactionsController::count');
    $routes->get('stats', 'TransactionsController::stats');
});

// -------------------------
// Notifications Routes
// -------------------------
// Notifications Routes
$routes->group('notifications', ['namespace' => 'App\Controllers'], function($routes) {

    // 🔹 Lister toutes les notifications d’un driver
    // GET /notifications?driver_id=1
    $routes->get('', 'NotificationsController::index');

    // 🔹 Lister uniquement les notifications non lues
    // GET /notifications/unread?driver_id=1
    $routes->get('unread', 'NotificationsController::unread');

    // 🔹 Marquer une notification spécifique comme lue
    // PUT /notifications/mark-read/5
    $routes->put('mark-read/(:num)', 'NotificationsController::markRead/$1');

    // 🔹 Marquer toutes les notifications d’un driver comme lues
    // PUT /notifications/mark-all-read?driver_id=1
    $routes->put('mark-all-read', 'NotificationsController::markAllRead');

    // 🔹 Créer une notification manuellement (optionnel)
    // POST /notifications
    $routes->post('', 'NotificationsController::create');

    // 🔹 Supprimer une notification
    $routes->delete('(:num)', 'NotificationsController::delete/$1');
    // 🔹 Restaurer une notification supprimée
    $routes->post('restore', 'NotificationsController::restore');

    // 🔹 Filtrer les notifications
});


// -------------------------
// Credit Transactions Routes
// -------------------------
$routes->group('credit-transactions', ['namespace' => 'App\Controllers'], function($routes) {
    $routes->get('', 'CreditTransactionsController::index');
    $routes->post('', 'CreditTransactionsController::create');
    $routes->get('(:num)', 'CreditTransactionsController::show/$1');
    $routes->delete('(:num)', 'CreditTransactionsController::delete/$1');
    $routes->get('filter', 'CreditTransactionsController::filter');
    $routes->get('count', 'CreditTransactionsController::count');
});

// -------------------------
// Credits Routes
// -------------------------
$routes->group('credits', function ($routes) {
    $routes->post('purchase', 'CreditsController::purchaseCredits');
    $routes->post('confirm/(:segment)', 'CreditsController::confirmPayment/$1');
    $routes->get('wallet/(:num)', 'CreditsController::wallet/$1');

     // 🔹 QR code stateless
    $routes->get('generate-qr/(:num)', 'CreditsController::generateQR/$1');
    $routes->post('scan-qr', 'CreditsController::scanQR');
});


// -------------------------
// Ratings Routes
// -------------------------
$routes->group('ratings', ['namespace' => 'App\Controllers'], function($routes) {
    $routes->get('', 'RatingsController::index');
    $routes->post('', 'RatingsController::create');
    $routes->get('(:num)', 'RatingsController::show/$1');
    $routes->put('(:num)', 'RatingsController::update/$1');
    $routes->delete('(:num)', 'RatingsController::delete/$1');
    $routes->get('average/(:num)', 'RatingsController::average/$1');
    $routes->get('filter', 'RatingsController::filter');
});

// -------------------------
// Rating Criteria Routes
// -------------------------
$routes->group('rating-criteria', ['namespace' => 'App\Controllers'], function ($routes) {
    $routes->get('/', 'RatingCriteriasController::index');
    $routes->post('/', 'RatingCriteriasController::create');
    $routes->get('rating/(:num)', 'RatingCriteriasController::show/$1');
    $routes->put('(:num)', 'RatingCriteriasController::update/$1');
    $routes->patch('(:num)', 'RatingCriteriasController::update/$1');
    $routes->delete('(:num)', 'RatingCriteriasController::delete/$1');
    $routes->get('average/(:num)', 'RatingCriteriasController::average/$1');
});

// -------------------------
// Rating Badges Routes
// -------------------------
$routes->group('rating-badges', ['namespace' => 'App\Controllers'], function($routes) {
    $routes->get('', 'RatingBadgesController::index');
    $routes->post('', 'RatingBadgesController::create');
    $routes->get('(:num)', 'RatingBadgesController::show/$1');
    $routes->put('(:num)', 'RatingBadgesController::update/$1');
    $routes->patch('(:num)', 'RatingBadgesController::update/$1');
    $routes->delete('(:num)', 'RatingBadgesController::delete/$1');
    $routes->get('filter', 'RatingBadgesController::filter');
});

// -------------------------
// Fallback 404
// -------------------------
$routes->set404Override(function(){
    return view('errors/custom_404');
});
