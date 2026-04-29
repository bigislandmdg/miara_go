<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;
use CodeIgniter\Database\RawSql;

class CreateMeetingPointsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type' => 'SERIAL',  // PostgreSQL: SERIAL
            ],
            'name' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
            ],
            'city' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
            ],
            'latitude' => [
                'type'       => 'DECIMAL',
                'constraint' => '10,7',
            ],
            'longitude' => [
                'type'       => 'DECIMAL',
                'constraint' => '10,7',
            ],
            'address' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
                'null'       => true,
            ],
            'place_type' => [
                'type'       => 'VARCHAR',
                'constraint' => 50,
                'null'       => true,
            ],
            'is_active' => [
                'type'    => 'BOOLEAN',
                'default' => true,
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
        $this->forge->addKey('city');
        $this->forge->addKey('place_type');
        $this->forge->addKey('is_active');

        $this->forge->createTable('meeting_points');
        
        // Index supplémentaires pour les performances
        $this->db->query('CREATE INDEX idx_meeting_points_city_active ON meeting_points(city, is_active)');
        $this->db->query('CREATE INDEX idx_meeting_points_place_type_city ON meeting_points(place_type, city)');
        $this->db->query('CREATE INDEX idx_meeting_points_coordinates ON meeting_points(latitude, longitude)');
    }

    public function down()
    {
        $this->forge->dropTable('meeting_points');
    }
}