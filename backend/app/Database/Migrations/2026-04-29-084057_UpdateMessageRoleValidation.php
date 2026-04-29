<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class UpdateMessageRoleValidation extends Migration
{
    public function up()
    {
        // Pour PostgreSQL
        if ($this->db->DBDriver === 'Postgre') {
            
            // Supprimer l'ancien trigger et fonction s'ils existent
            $this->db->query("DROP TRIGGER IF EXISTS trigger_validate_message_roles ON messages");
            $this->db->query("DROP TRIGGER IF EXISTS trigger_validate_message_roles_update ON messages");
            $this->db->query("DROP FUNCTION IF EXISTS validate_message_roles()");
            
            // Créer la nouvelle fonction qui permet les deux sens
            $function = <<<SQL
            CREATE OR REPLACE FUNCTION validate_message_roles()
            RETURNS TRIGGER AS $$
            DECLARE
                sender_role VARCHAR(20);
                receiver_role VARCHAR(20);
            BEGIN
                -- Récupérer les rôles des utilisateurs
                SELECT role INTO sender_role FROM users WHERE id = NEW.sender_id;
                IF NOT FOUND THEN
                    RAISE EXCEPTION 'sender_id % n''existe pas dans la table users', NEW.sender_id;
                END IF;
                
                SELECT role INTO receiver_role FROM users WHERE id = NEW.receiver_id;
                IF NOT FOUND THEN
                    RAISE EXCEPTION 'receiver_id % n''existe pas dans la table users', NEW.receiver_id;
                END IF;
                
                -- Empêcher l'envoi à soi-même
                IF NEW.sender_id = NEW.receiver_id THEN
                    RAISE EXCEPTION 'Un utilisateur ne peut pas s''envoyer un message à lui-même';
                END IF;
                
                -- Vérifier que les rôles sont différents (user ↔ driver)
                -- Cela permet les deux sens : user→driver ET driver→user
                -- Accepte également 'passenger' comme alias de 'user' et 'both' comme alias de 'driver'
                IF (sender_role IN ('user', 'passenger') AND receiver_role IN ('driver', 'both')) OR
                   (sender_role IN ('driver', 'both') AND receiver_role IN ('user', 'passenger')) THEN
                    -- Communication valide
                    RETURN NEW;
                ELSE
                    RAISE EXCEPTION 'Communication non autorisée: % → % (doit être passager ↔ conducteur)', sender_role, receiver_role;
                END IF;
            END;
            $$ LANGUAGE plpgsql;
            SQL;

            // Trigger pour INSERT
            $triggerInsert = <<<SQL
            CREATE TRIGGER trigger_validate_message_roles
            BEFORE INSERT ON messages
            FOR EACH ROW
            EXECUTE FUNCTION validate_message_roles();
            SQL;

            // Trigger pour UPDATE (empêcher la modification des IDs après création)
            $triggerUpdate = <<<SQL
            CREATE TRIGGER trigger_validate_message_roles_update
            BEFORE UPDATE OF sender_id, receiver_id ON messages
            FOR EACH ROW
            EXECUTE FUNCTION validate_message_roles();
            SQL;

            $this->db->query($function);
            $this->db->query($triggerInsert);
            $this->db->query($triggerUpdate);
            
            // Créer un index pour améliorer les performances des triggers
            $this->db->query("CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)");
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