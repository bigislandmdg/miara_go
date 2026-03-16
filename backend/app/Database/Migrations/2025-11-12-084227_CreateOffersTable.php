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
                'type'           => 'SERIAL',
                'auto_increment' => true,
            ],
            'ride_request_id' => [
                'type'     => 'INT',
                'unsigned' => true,
            ],
            'driver_id' => [
                'type'     => 'INT',
                'unsigned' => true,
            ],
            'price_per_seat' => [
                'type'       => 'DECIMAL',
                'constraint' => '10,2',
            ],
            'seats_offered' => [
                'type'    => 'INT',
                'default' => 1,
            ],
            'message' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'car_info' => [
                'type'       => 'VARCHAR',
                'constraint' => '255',
                'null'       => true,
            ],
            'status' => [
                'type'       => 'VARCHAR',
                'constraint' => '20',
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

        // Clés étrangères
        $this->forge->addForeignKey('ride_request_id', 'ride_requests', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('driver_id', 'users', 'id', 'CASCADE', 'CASCADE');

        $this->forge->createTable('offers');
    }

    public function down()
    {
        $this->forge->dropTable('offers');
    }
}
