/**
 * PROVIWEB - Firebase Configuration
 * Configuración centralizada de Firebase para todo el proyecto
 */

// Configuración principal de Firebase (proviweb-d8764 - homologada con Android)
export const firebaseConfig = {
    apiKey: "AIzaSyAxtXQ3a4azqY5yww9TetxouSr7jUdzdNw",
    authDomain: "proviweb-d8764.firebaseapp.com",
    databaseURL: "https://proviweb-d8764-default-rtdb.firebaseio.com",
    projectId: "proviweb-d8764",
    storageBucket: "proviweb-d8764.appspot.com",
    messagingSenderId: "475963980955",
    appId: "1:475963980955:web:8444288d8ba13e428e1a3e",
    measurementId: "G-TCH23FGP8D"
};

// Versión de Firebase a usar
export const FIREBASE_VERSION = "10.7.1";

// URLs de los módulos de Firebase
export const FIREBASE_URLS = {
    app: `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`,
    database: `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-database.js`,
    auth: `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`,
    storage: `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-storage.js`
};
