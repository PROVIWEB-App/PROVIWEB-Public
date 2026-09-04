/**
 * PROVIWEB - Sistema de Verificación de Roles
 * Determina si un usuario tiene acceso libre al modo inmersivo
 */

import { getDatabase, ref, get } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js';

// Lista de UIDs de administradores (puedes agregar más aquí)
const ADMIN_UIDS = [
  // Agrega aquí los UIDs de los administradores
  // Ejemplo: 'abc123xyz789',
];

// Roles que tienen acceso libre al modo inmersivo
const FREE_ACCESS_ROLES = {
  // Por accountType
  accountTypes: ['ally', 'admin', 'partner'],
  
  // Por organización
  organizations: ['Aliado', 'Admin', 'PROVIWEB'],
  
  // Por rol específico
  roles: ['admin', 'moderator', 'ally', 'partner'],
  
  // Por verificación especial
  verifiedTypes: ['admin', 'ally'],
};

// Estado de verificación
export const userAccessState = {
  isAdmin: false,
  isAlly: false,
  hasFreeAccess: false,
  userData: null,
  checked: false,
};

/**
 * Verificar si el usuario actual tiene acceso libre
 */
export const checkUserFreeAccess = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      console.log('[UserRoles] No hay usuario autenticado');
      return false;
    }
    
    const uid = user.uid;
    console.log('[UserRoles] Verificando acceso para UID:', uid);
    
    // Verificar si está en lista de admins
    if (ADMIN_UIDS.includes(uid)) {
      console.log('[UserRoles] Usuario es Admin (por UID)');
      userAccessState.isAdmin = true;
      userAccessState.hasFreeAccess = true;
      userAccessState.checked = true;
      return true;
    }
    
    // Obtener datos del usuario desde Firebase
    const db = getDatabase();
    
    // Verificar si es Admin en el nodo Admin/{uid}
    const adminRef = ref(db, `Admin/${uid}`);
    const adminSnapshot = await get(adminRef);
    
    if (adminSnapshot.exists()) {
      const adminData = adminSnapshot.val();
      if (adminData === true || adminData.administrador === true || adminData.admin === true) {
        console.log('[UserRoles] Usuario es Admin (por nodo Admin)');
        setFreeAccess('admin');
        userAccessState.isAdmin = true;
        return true;
      }
    }
    
    // Verificar si es Aliado en el nodo Ally/{uid} (si existe)
    const allyRef = ref(db, `Ally/${uid}`);
    const allySnapshot = await get(allyRef);
    
    if (allySnapshot.exists()) {
      const allyData = allySnapshot.val();
      if (allyData === true || allyData.ally === true || allyData.aliado === true) {
        console.log('[UserRoles] Usuario es Aliado (por nodo Ally)');
        setFreeAccess('ally');
        userAccessState.isAlly = true;
        return true;
      }
    }
    
    const userRef = ref(db, `Users/${uid}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      console.log('[UserRoles] No se encontraron datos de usuario');
      return false;
    }
    
    const userData = snapshot.val();
    userAccessState.userData = userData;
    
    console.log('[UserRoles] Datos de usuario:', {
      accountType: userData.accountType,
      organizaton: userData.organizaton,
      role: userData.role,
      verified: userData.verified,
    });
    
    // Verificar por accountType
    if (userData.accountType) {
      const accountType = userData.accountType.toLowerCase();
      if (FREE_ACCESS_ROLES.accountTypes.includes(accountType)) {
        console.log('[UserRoles] Acceso libre por accountType:', accountType);
        setFreeAccess(accountType);
        return true;
      }
    }
    
    // Verificar por organización
    if (userData.organizaton) {
      const org = userData.organizaton;
      if (FREE_ACCESS_ROLES.organizations.includes(org)) {
        console.log('[UserRoles] Acceso libre por organización:', org);
        setFreeAccess('organization');
        userAccessState.isAlly = true;
        return true;
      }
    }
    
    // Verificar por rol
    if (userData.role) {
      const role = userData.role.toLowerCase();
      if (FREE_ACCESS_ROLES.roles.includes(role)) {
        console.log('[UserRoles] Acceso libre por rol:', role);
        setFreeAccess(role);
        return true;
      }
    }
    
    // Verificar si es aliado por verified (compatibilidad con sistema antiguo)
    if (userData.verified === 'ally' || userData.verifiedally === 'yes') {
      console.log('[UserRoles] Usuario es Aliado (por verified)');
      setFreeAccess('ally');
      userAccessState.isAlly = true;
      return true;
    }
    
    // Verificar si es admin por verified
    if (userData.verified === 'admin') {
      console.log('[UserRoles] Usuario es Admin (por verified)');
      setFreeAccess('admin');
      userAccessState.isAdmin = true;
      return true;
    }
    
    console.log('[UserRoles] Usuario no tiene acceso libre');
    userAccessState.checked = true;
    return false;
    
  } catch (error) {
    console.error('[UserRoles] Error verificando acceso:', error);
    return false;
  }
};

/**
 * Establecer estado de acceso libre
 */
const setFreeAccess = (type) => {
  userAccessState.hasFreeAccess = true;
  userAccessState.checked = true;
  
  if (type === 'admin' || type === 'administrator') {
    userAccessState.isAdmin = true;
  }
  if (type === 'ally' || type === 'partner' || type === 'organization') {
    userAccessState.isAlly = true;
  }
  
  // Guardar en localStorage para persistencia
  localStorage.setItem('proviweb_immersive_free_access', 'true');
  localStorage.setItem('proviweb_immersive_user_type', type);
};

/**
 * Verificar si tiene acceso libre (usando caché local)
 */
export const hasFreeAccess = () => {
  // Si ya verificamos, usar el estado
  if (userAccessState.checked) {
    return userAccessState.hasFreeAccess;
  }
  
  // Verificar localStorage
  const hasFreeAccessStored = localStorage.getItem('proviweb_immersive_free_access');
  if (hasFreeAccessStored === 'true') {
    return true;
  }
  
  return false;
};

/**
 * Limpiar estado (al cerrar sesión)
 */
export const clearUserAccessState = () => {
  userAccessState.isAdmin = false;
  userAccessState.isAlly = false;
  userAccessState.hasFreeAccess = false;
  userAccessState.userData = null;
  userAccessState.checked = false;
  
  localStorage.removeItem('proviweb_immersive_free_access');
  localStorage.removeItem('proviweb_immersive_user_type');
};

/**
 * Obtener badge para mostrar en UI
 */
export const getUserAccessBadge = () => {
  if (userAccessState.isAdmin) {
    return {
      text: 'ADMIN',
      icon: '👑',
      color: '#f59e0b', // dorado
    };
  }
  
  if (userAccessState.isAlly) {
    return {
      text: 'ALIADO',
      icon: '🤝',
      color: '#10b981', // verde
    };
  }
  
  return null;
};

/**
 * Agregar UID de admin (para uso programático)
 */
export const addAdminUID = (uid) => {
  if (!ADMIN_UIDS.includes(uid)) {
    ADMIN_UIDS.push(uid);
  }
};

/**
 * Verificar si es admin
 */
export const isAdmin = () => userAccessState.isAdmin;

/**
 * Verificar si es aliado
 */
export const isAlly = () => userAccessState.isAlly;

export default {
  checkUserFreeAccess,
  hasFreeAccess,
  clearUserAccessState,
  getUserAccessBadge,
  addAdminUID,
  isAdmin,
  isAlly,
};
