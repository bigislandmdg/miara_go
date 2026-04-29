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
                'type' => 'SERIAL',
            ],
            'ride_id' => [
                'type'     => 'INTEGER',
                'unsigned' => true,
            ],
            'offer_id' => [
                'type'     => 'INTEGER',
                'unsigned' => true,
                'null'     => true,
            ],
            'user_id' => [  // Ajout de user_id pour lier le passager
                'type'     => 'INTEGER',
                'unsigned' => true,
            ],
            'seats_reserved' => [
                'type'    => 'INTEGER',
                'default' => 1,
            ],
            'total_price' => [
                'type'       => 'DECIMAL',
                'constraint' => '10,2',
                'default'    => 0,
            ],
            'status' => [
                'type'       => 'VARCHAR',
                'constraint' => 20,
                'default'    => 'pending',
            ],
            'baby_on_board' => [
                'type'    => 'SMALLINT',
                'default' => 0,
            ],
            'pets_on_board' => [
                'type'    => 'SMALLINT',
                'default' => 0,
            ],
            'luggage_on_board' => [
                'type'    => 'SMALLINT',
                'default' => 0,
            ],
            'payment_status' => [  // Ajout du statut de paiement
                'type'       => 'VARCHAR',
                'constraint' => 20,
                'default'    => 'unpaid',
            ],
            'payment_method' => [  // Ajout du mode de paiement
                'type'       => 'VARCHAR',
                'constraint' => 50,
                'null'       => true,
            ],
            'cancelled_at' => [  // Date d'annulation
                'type' => 'TIMESTAMP',
                'null' => true,
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
        //$this->forge->addKey('ride_id');
        $this->forge->addKey('user_id');
        $this->forge->addKey('status');
        
        // Création de la table
        $this->forge->createTable('bookings');
        
        // Ajout des clés étrangères après la création
        //$this->db->query('ALTER TABLE bookings ADD CONSTRAINT bookings_ride_id_foreign FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE');
        $this->db->query('ALTER TABLE bookings ADD CONSTRAINT bookings_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE');
        
        if ($this->db->tableExists('offers')) {
            $this->db->query('ALTER TABLE bookings ADD CONSTRAINT bookings_offer_id_foreign FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE SET NULL');
        }
        
        // Index supplémentaires
        $this->db->query('CREATE INDEX idx_bookings_user_status ON bookings(user_id, status)');
        // $this->db->query('CREATE INDEX idx_bookings_ride_status ON bookings(ride_id, status)');
        $this->db->query('CREATE INDEX idx_bookings_created_at ON bookings(created_at)');
    }

    public function down()
    {
        $this->forge->dropTable('bookings');
    }
}