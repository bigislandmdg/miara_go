<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;
use CodeIgniter\Database\RawSql;

class CreateOffersTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type' => 'SERIAL',  // PostgreSQL: SERIAL
            ],
            'ride_request_id' => [
                'type'     => 'INTEGER',  // PostgreSQL: INTEGER
                'unsigned' => true,
            ],
            'driver_id' => [
                'type'     => 'INTEGER',
                'unsigned' => true,
                'comment'  => 'Référence vers users avec rôle driver',  // Commentaire pour PostgreSQL
            ],
            'price_per_seat' => [
                'type'       => 'DECIMAL',
                'constraint' => '10,2',
            ],
            'seats_offered' => [
                'type'    => 'INTEGER',
                'default' => 1,
            ],
            'message' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'car_info' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
                'null'       => true,
            ],
            'status' => [
                'type'       => 'VARCHAR',
                'constraint' => 20,
                'default'    => 'pending',
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
        
        // Index pour améliorer les performances
        $this->forge->addKey('ride_request_id');
        $this->forge->addKey('driver_id');
        $this->forge->addKey('status');

        // Clés étrangères
        $this->forge->addForeignKey('ride_request_id', 'ride_requests', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('driver_id', 'users', 'id', 'CASCADE', 'CASCADE');

        $this->forge->createTable('offers');
        
        // Note: La contrainte que driver_id doit avoir le rôle 'driver' 
        // sera gérée au niveau de l'application ou par un trigger PostgreSQL
        $this->db->query("
            COMMENT ON COLUMN offers.driver_id IS 'Doit correspondre à un user avec le rôle driver'
        ");
    }

    public function down()
    {
        $this->forge->dropTable('offers');
    }
}