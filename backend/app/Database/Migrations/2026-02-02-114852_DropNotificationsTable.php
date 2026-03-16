<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class DropNotificationsTable extends Migration
{
    public function up()
    {
        //
        // Supprime la table notifications ET toutes les contraintes qui dépendent
        $this->db->query('DROP TABLE IF EXISTS notifications CASCADE');
    }

    public function down()
    {
        //
    }
}
