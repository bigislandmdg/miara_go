<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddBiometricFieldsToUsers extends Migration
{
    public function up()
    {
        $this->forge->addColumn('users', [
            'biometric_enabled' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'default'    => 0,
                'after'      => 'verification_status',
            ],
            'biometric_token' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
                'null'       => true,
                'after'      => 'biometric_enabled',
            ],
            'biometric_device_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
                'null'       => true,
                'after'      => 'biometric_token',
            ],
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('users', [
            'biometric_enabled',
            'biometric_token',
            'biometric_device_id',
        ]);
    }
}
