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
                'unsigned' => true
                ],
            'user_id' => [
                'type' => 'INTEGER', 
                'unsigned' => true
                ],
            'vehicle_id' => [
                'type' => 'INTEGER',
                 'null' => true
                ],
            'luggage_id' => [
                'type' => 'INTEGER',
                 'null' => true
                ],
            'meeting_point_id' => [
                'type' => 'INTEGER',
                 'null' => true
                ],
            'departure' => [
                'type' => 'VARCHAR',
                 'constraint' => 100
                ],
            'destination' => [
                'type' => 'VARCHAR',
                 'constraint' => 100
                 ],
            'departure_time' => [
                'type' => 'TIMESTAMP'
                ],
            'available_seats' => [
                'type' => 'INTEGER',
                 'default' => 1
                ],
            'price' => [
                'type' => 'DECIMAL',
                 'constraint' => '10,2'
                ],
            'message' => ['type' => 'TEXT', 'null' => true],
            'is_public' => ['type' => 'BOOLEAN', 'default' => true],
            'is_boosted' => ['type' => 'BOOLEAN', 'default' => false],
            'status' => ['type' => 'VARCHAR', 'constraint' => 20, 'default' => 'open'],
            'created_at' => ['type' => 'TIMESTAMP', 'default' => new RawSql('CURRENT_TIMESTAMP')],
            'updated_at' => ['type' => 'TIMESTAMP', 'null' => true],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->createTable('rides', true);

        // Clés étrangères
        $this->forge->addForeignKey('user_id', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('vehicle_id', 'vehicles', 'id', 'SET NULL', 'CASCADE');
        $this->forge->addForeignKey('luggage_id', 'luggages', 'id', 'SET NULL', 'CASCADE');
        $this->forge->addForeignKey('meeting_point_id', 'meeting_points', 'id', 'SET NULL', 'CASCADE');

        // Index
        $this->db->query('CREATE INDEX IF NOT EXISTS idx_rides_user_id ON rides(user_id)');
        $this->db->query('CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status)');
        $this->db->query('CREATE INDEX IF NOT EXISTS idx_rides_departure_time ON rides(departure_time)');
    }

    public function down()
    {
        $this->forge->dropTable('rides', true);
    }
}