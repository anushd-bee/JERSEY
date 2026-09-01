import { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import { customerService } from '../../services/customerService';
import styles from './RoleModal.module.css';

const ROLES = [
    { value: 'user', label: 'User', description: 'Standard customer — can browse, order, and manage their account.' },
    { value: 'admin', label: 'Admin', description: 'Full admin access — can manage products, orders, and customers.' },
];

export default function RoleModal({ isOpen, onClose, customer, onSuccess }) {
    const [selectedRole, setSelectedRole] = useState('user');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && customer) {
            setSelectedRole(customer.role || 'user');
            setError('');
        }
    }, [isOpen, customer]);

    async function handleSave() {
        setSaving(true);
        setError('');
        const { error: err } = await customerService.updateRole(customer.id, selectedRole);
        setSaving(false);
        if (err) {
            setError(err.message || 'Failed to update role.');
            return;
        }
        onSuccess();
        onClose();
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Customer Role">
            <div className="modal__body">
                {customer && (
                    <p className={styles.customerName}>
                        {customer.full_name || customer.email}
                    </p>
                )}

                {error && <div className="alert alert--danger mb-md">{error}</div>}

                <div className={styles.roleList}>
                    {ROLES.map(role => (
                        <label key={role.value} className={`${styles.roleOption} ${selectedRole === role.value ? styles.roleOptionActive : ''}`}>
                            <input
                                type="radio"
                                name="role"
                                value={role.value}
                                checked={selectedRole === role.value}
                                onChange={() => setSelectedRole(role.value)}
                                className={styles.radioInput}
                            />
                            <div className={styles.roleInfo}>
                                <span className={styles.roleLabel}>{role.label}</span>
                                <span className={styles.roleDesc}>{role.description}</span>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            <div className="modal__footer">
                <button type="button" className="btn btn--ghost" onClick={onClose}>
                    Cancel
                </button>
                <button
                    className="btn btn--primary"
                    onClick={handleSave}
                    disabled={saving || selectedRole === (customer?.role || 'user')}
                >
                    {saving && <Loader size={16} className={styles.spin} />}
                    Save Role
                </button>
            </div>
        </Modal>
    );
}
