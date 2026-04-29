<?php
// app/Database/Migrations/2024_01_01_000003_add_message_role_validation.php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddMessageRoleValidation extends Migration
{
    public function up()
    {
        // Vérifier que le driver PostgreSQL est utilisé
        if ($this->db->DBDriver === 'Postgre') {
            
            // Fonction de validation des rôles
            $function = <<<SQL
            CREATE OR REPLACE FUNCTION validate_message_roles()
            RETURNS TRIGGER AS $$
            DECLARE
                sender_role VARCHAR(20);
                receiver_role VARCHAR(20);
            BEGIN
                -- Récupérer les rôles des utilisateurs
                SELECT role INTO sender_role FROM users WHERE id = NEW.sender_id;
                SELECT role INTO receiver_role FROM users WHERE id = NEW.receiver_id;
                
                -- Vérifier que l'expéditeur existe
                IF NOT FOUND THEN
                    RAISE EXCEPTION 'sender_id % n''existe pas', NEW.sender_id;
                END IF;
                
                -- Vérifier que le destinataire existe
                IF NOT FOUND THEN
                    RAISE EXCEPTION 'receiver_id % n''existe pas', NEW.receiver_id;
                END IF;
                
                -- Validation des rôles (conversations passager <-> conducteur)
                IF sender_role NOT IN ('user', 'passenger') THEN
                    RAISE EXCEPTION 'Le sender_id (%) doit être un passager (rôle: user ou passenger)', sender_role;
                END IF;
                
                IF receiver_role NOT IN ('driver', 'both') THEN
                    RAISE EXCEPTION 'Le receiver_id (%) doit être un conducteur (rôle: driver ou both)', receiver_role;
                END IF;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            SQL;

            // Trigger avant insertion
            $triggerInsert = <<<SQL
            CREATE TRIGGER trigger_validate_message_roles
            BEFORE INSERT ON messages
            FOR EACH ROW
            EXECUTE FUNCTION validate_message_roles();
            SQL;
            
            // Trigger avant mise à jour (pour éviter les modifications frauduleuses)
            $triggerUpdate = <<<SQL
            CREATE TRIGGER trigger_validate_message_roles_update
            BEFORE UPDATE OF sender_id, receiver_id ON messages
            FOR EACH ROW
            EXECUTE FUNCTION validate_message_roles();
            SQL;

            $this->db->query($function);
            $this->db->query($triggerInsert);
            $this->db->query($triggerUpdate);
        }
    }

    public function down()
    {
        if ($this->db->DBDriver === 'Postgre') {
            $this->db->query("DROP TRIGGER IF EXISTS trigger_validate_message_roles_update ON messages");
            $this->db->query("DROP TRIGGER IF EXISTS trigger_validate_message_roles ON messages");
            $this->db->query("DROP FUNCTION IF EXISTS validate_message_roles()");
        }
    }
}