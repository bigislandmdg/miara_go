<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class DropBookingsTable extends Migration
{
    public function up()
    {
        //
        $this->forge->dropTable('bookings', true); // true = ignore si n'existe pas
    }

    public function down()
    {
        //
    }
}
