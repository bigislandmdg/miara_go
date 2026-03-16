<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;
use CodeIgniter\Database\RawSql;

class CreateBookingsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'SERIAL',
                'auto_increment' => true,
            ],
            'ride_id' => [
                'type'     => 'INT',
                'unsigned' => true,
            ],
            'offer_id' => [
                'type'     => 'INT',
                'unsigned' => true,
                'null'     => true, // optionnel
            ],
            'seats_reserved' => [
                'type'    => 'INT',
                'default' => 1,
            ],
            'total_price' => [
                'type'       => 'DECIMAL',
                'constraint' => '10,2',
                'default'    => 0,
            ],
            'status' => [
                'type'       => 'VARCHAR',
                'constraint' => '20',
                'default'    => 'pending',
            ],
            'baby_on_board' => [
                'type'    => 'TINYINT',
                'constraint' => 1,
                'default' => 0,
                'comment' => '1 = Oui, 0 = Non',
            ],
            'pets_on_board' => [
                'type'    => 'TINYINT',
                'constraint' => 1,
                'default' => 0,
                'comment' => '1 = Oui, 0 = Non',
            ],
            'luggage_on_board' => [
                'type'    => 'TINYINT',
                'constraint' => 1,
                'default' => 0,
                'comment' => '1 = Oui, 0 = Non',
            ],
            'created_at' => [
                'type'    => 'TIMESTAMP',
                'default' => new RawSql('CURRENT_TIMESTAMP'),
            ],
            'updated_at' => [
                'type' => 'TIMESTAMP',
                'null' => true,
            ],
        ]);

        $this->forge->addKey('id', true);

        // Clés étrangères
        $this->forge->addForeignKey('ride_id', 'rides', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('offer_id', 'offers', 'id', 'SET NULL', 'CASCADE');

        $this->forge->createTable('bookings');
    }

    public function down()
    {
        $this->forge->dropTable('bookings');
    }
}
