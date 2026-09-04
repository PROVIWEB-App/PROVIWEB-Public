/**
 * PROVIWEB - Hook de permisos de usuario
 * Verifica si el usuario tiene acceso gratuito o necesita pago
 */

import { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js';

// Roles con acceso gratuito
const FREE_ACCESS_ROLES = ['admin', 'ally', 'moderator', 'vip'];

export const useUserPermissions = () => {
  const [user, setUser] = useState(null);
  const [isAdminOrAlly, setIsAdminOrAlly] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserPermissions = async () => {
      const username = localStorage.getItem('proviweb_username');
      const userId = localStorage.getItem('proviweb_userid');
      
      if (!username || !userId) {
        setLoading(false);
        return;
      }

      const db = getDatabase();
      
      // Verificar rol del usuario
      const userRef = ref(db, `Users/${userId}`);
      const unsubscribe = onValue(userRef, (snapshot) => {
        const userData = snapshot.val() || {};
        const role = userData.role || 'user';
        
        setUser({
          id: userId,
          name: username,
          role,
          ...userData
        });
        
        // Verificar acceso gratuito
        const hasFreeAccess = FREE_ACCESS_ROLES.includes(role.toLowerCase());
        setIsAdminOrAlly(hasFreeAccess);
        
        // Verificar si ha pagado
        setHasPaid(!!userData.hasPaidAccess);
        
        setLoading(false);
      });

      return () => unsubscribe();
    };

    checkUserPermissions();
  }, []);

  const canAccess = isAdminOrAlly || hasPaid;

  return {
    user,
    isAdminOrAlly,
    hasPaid,
    canAccess,
    loading,
    // Helper para mostrar modal de pago si es necesario
    showPaymentModal: !canAccess && !loading
  };
};

// Verificación simple de acceso
export const checkUserAccess = () => {
  const role = localStorage.getItem('proviweb_role') || 'user';
  return FREE_ACCESS_ROLES.includes(role.toLowerCase());
};

export default useUserPermissions;
