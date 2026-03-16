<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;
use CodeIgniter\Database\RawSql;

class CreateMeetingPointsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([

            // PostgreSQL auto increment
            'id' => [
                'type' => 'SERIAL',
            ],

            // Nom du point de rencontre
            'name' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
            ],

            // Ville (important pour éviter confusion Tana / Fianar / etc.)
            'city' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
            ],

            // Coordonnées GPS
            'latitude' => [
                'type'       => 'DECIMAL',
                'constraint' => '10,7',
            ],

            'longitude' => [
                'type'       => 'DECIMAL',
                'constraint' => '10,7',
            ],

            // Adresse simple optionnelle
            'address' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
                'null'       => true,
            ],

            // Type de lieu : gare, aéroport, station, parking…
            'place_type' => [
                'type'       => 'VARCHAR',
                'constraint' => 50,
                'null'       => true,
            ],

            // Activation du point
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

        // index utiles
        $this->forge->addKey('city');
        $this->forge->addKey('place_type');
        $this->forge->addKey('is_active');

        $this->forge->createTable('meeting_points');
    }

    public function down()
    {
        $this->forge->dropTable('meeting_points');
    }
}