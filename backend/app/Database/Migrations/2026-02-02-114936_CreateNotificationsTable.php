<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;
use CodeIgniter\Database\RawSql;

class CreateNotificationsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'SERIAL',
                'auto_increment' => true,
            ],
            'driver_id' => [   // Renommé de user_id → driver_id
                'type'     => 'INT',
                'unsigned' => true,
            ],
            'ride_request_id' => [ // pour relier la notification à une course
                'type'     => 'INT',
                'unsigned' => true,
                'null'     => true,
            ],
            'title' => [
                'type'       => 'VARCHAR',
                'constraint' => '255',
            ],
            'message' => [
                'type' => 'TEXT',
            ],
            'type' => [
                'type'       => 'VARCHAR',
                'constraint' => '100',
                'null'       => true, // ride_request, offer_update, booking_update, system, etc.
            ],
            'read' => [
                'type'    => 'BOOLEAN',
                'default' => false,
            ],
            'created_at' => [
                'type'    => 'TIMESTAMP',
                'default' => new RawSql('CURRENT_TIMESTAMP'),
            ],
        ]);

        $this->forge->addKey('id', true);

        // Clés étrangères
        $this->forge->addForeignKey('driver_id', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('ride_request_id', 'ride_requests', 'id', 'CASCADE', 'CASCADE');

        $this->forge->createTable('notifications');
    }

    public function down()
    {
        $this->forge->dropTable('notifications', true); // true pour forcer la suppression même si contraintes
    }
}
