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
                'type' => 'SERIAL',  // PostgreSQL: SERIAL
            ],
            'departure_location' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
            ],
            'arrival_location' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
            ],
            'desired_date' => [
                'type' => 'DATE',  // PostgreSQL: DATE
            ],
            'desired_time' => [
                'type' => 'TIME',  // PostgreSQL: TIME
                'null' => true,
            ],
            'seats_needed' => [
                'type'    => 'INTEGER',  // PostgreSQL: INTEGER
                'default' => 1,
            ],
            'luggage_info' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
                'null'       => true,
            ],
            'message' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'status' => [
                'type'       => 'VARCHAR',
                'constraint' => 20,
                'default'    => 'active',
            ],
            'is_notified' => [
                'type'    => 'BOOLEAN',
                'default' => false,
            ],
            'created_at' => [
                'type'    => 'TIMESTAMP',  // PostgreSQL: TIMESTAMP
                'default' => new RawSql('CURRENT_TIMESTAMP'),
            ],
            'updated_at' => [
                'type' => 'TIMESTAMP',
                'null' => true,
            ],
        ]);

        $this->forge->addKey('id', true);
        
        // Optionnel: Ajouter des indexes pour les recherches fréquentes
        $this->forge->addKey('status');
        $this->forge->addKey('desired_date');
        
        $this->forge->createTable('ride_requests');
        
        // Index pour optimiser les recherches par lieu
        $this->db->query('CREATE INDEX idx_ride_requests_locations ON ride_requests(departure_location, arrival_location)');
    }

    public function down()
    {
        $this->forge->dropTable('ride_requests');
    }
}