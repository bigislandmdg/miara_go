<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;
use CodeIgniter\Database\RawSql;

class CreateRidesTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type' => 'SERIAL',
                'auto_increment' => true,
            ],
            'user_id' => [
                'type' => 'INT',
                'unsigned' => true,
            ],
            'vehicle_id' => [
                'type' => 'INT',
            ],

            'luggage_id' => [
                'type' => 'INT',
                'null' => true,
            ],

            'meeting_point_id' => [
                'type' => 'INT',
                'null' => true,
            ],

            'departure' => [
                'type'       => 'VARCHAR',
                'constraint' => '100',
            ],

            'destination' => [
                'type'       => 'VARCHAR',
                'constraint' => '100',
            ],

            'departure_time' => [
                'type' => 'TIMESTAMP',
            ],

            'available_seats' => [
                'type'    => 'INT',
                'default' => 1,
            ],

            'price' => [
                'type'       => 'DECIMAL',
                'constraint' => '10,2',
            ],

            'message' => [
                'type' => 'TEXT',
                'null' => true,
            ],

            'is_public' => [
                'type'    => 'BOOLEAN',
                'default' => true,
            ],

            'is_boosted' => [
                'type'    => 'BOOLEAN',
                'default' => false,
            ],

            'status' => [
                'type'       => 'VARCHAR',
                'constraint' => '20',
                'default'    => 'open',
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

        // Relations
        $this->forge->addForeignKey('user_id', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('vehicle_id', 'vehicles', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('luggage_id', 'luggages', 'id', 'SET NULL', 'CASCADE');
        $this->forge->addForeignKey('meeting_point_id', 'meeting_points', 'id', 'SET NULL', 'CASCADE');

        $this->forge->createTable('rides');
    }

    public function down()
    {
        $this->forge->dropTable('rides');
    }
}