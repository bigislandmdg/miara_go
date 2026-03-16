<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class DropRideRequestsTable extends Migration
{
    public function up()
    {
        //
         // Supprime la table ride_requests ET toutes les contraintes qui dépendent
        $this->db->query('DROP TABLE IF EXISTS ride_requests CASCADE');
    }

    public function down()
    {
        //
    }
}
