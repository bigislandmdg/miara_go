<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;
use CodeIgniter\Database\RawSql;

class CreateRideRequestsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'SERIAL',
                'auto_increment' => true,
            ],
            'passenger_id' => [
                'type'     => 'INT',
                'unsigned' => true,
            ],
            'departure_location' => [
                'type'       => 'VARCHAR',
                'constraint' => '100',
            ],
            'arrival_location' => [
                'type'       => 'VARCHAR',
                'constraint' => '100',
            ],
            'desired_date' => [
                'type' => 'TIMESTAMP',
            ],
            'desired_time' => [
                'type'       => 'VARCHAR',
                'constraint' => '20',
                'null'       => true,
            ],
            'seats_needed' => [
                'type'    => 'INT',
                'default' => 1,
            ],
            'luggage_info' => [
                'type'       => 'VARCHAR',
                'constraint' => '255',
                'null'       => true,
            ],
            'message' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'status' => [
                'type'       => 'VARCHAR',
                'constraint' => '20',
                'default'    => 'active',
            ],
            'is_notified' => [
                'type'    => 'BOOLEAN',
                'default' => false,
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

        // Clé étrangère vers users.id
        $this->forge->addForeignKey('passenger_id', 'users', 'id', 'CASCADE', 'CASCADE');

        $this->forge->createTable('ride_requests');
    }

    public function down()
    {
        $this->forge->dropTable('ride_requests');
    }
}
