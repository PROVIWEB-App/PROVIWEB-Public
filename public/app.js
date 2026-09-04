import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAxtXQ3a4azqY5yww9TetxouSr7jUdzdNw",
  authDomain: "proviweb-d8764.firebaseapp.com",
  databaseURL: "https://proviweb-d8764-default-rtdb.firebaseio.com",
  projectId: "proviweb-d8764",
  storageBucket: "proviweb-d8764.appspot.com",
  messagingSenderId: "475963980955",
  appId: "1:475963980955:web:8444288d8ba13e428e1a3e",
  measurementId: "G-TCH23FGP8D"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorMsg = document.getElementById("errorMsg");
const loginForm = document.getElementById("loginForm");
const googleLoginBtn = document.getElementById("googleLogin");

const setMessage = (message, isError = false) => {
  if (!errorMsg) {
    return;
  }
  errorMsg.textContent = message;
  errorMsg.style.color = isError ? "#dc3545" : "#0f5132";
};

const setLoadingState = (isLoading) => {
  if (!loginForm) {
    return;
  }
  const submitBtn = loginForm.querySelector("button");
  const btnText = document.getElementById("btnText");
  const btnLoader = document.getElementById("btnLoader");

  if (submitBtn) {
    submitBtn.disabled = isLoading;
  }
  if (btnText && btnLoader) {
    btnText.style.display = isLoading ? "none" : "inline";
    btnLoader.style.display = isLoading ? "inline" : "none";
  }
};

/**
 * Manejar usuario no existente - Redirigir a registro después de 5 segundos
 */
const handleNonExistentUser = (email, password) => {
  let countdown = 5;
  
  // Mostrar mensaje con cuenta regresiva
  const updateMessage = () => {
    setMessage(
      `⏳ No eres usuario de PROVIWEB. Serás redirigido al registro en ${countdown} segundos...`,
      true
    );
  };
  
  updateMessage();
  
  // Actualizar cada segundo
  const interval = setInterval(() => {
    countdown--;
    if (countdown > 0) {
      updateMessage();
    } else {
      clearInterval(interval);
    }
  }, 1000);
  
  // Redirigir después de 5 segundos
  setTimeout(() => {
    // Codificar datos para URL
    const encodedEmail = encodeURIComponent(email);
    const encodedPassword = encodeURIComponent(password);
    
    // Redirigir a registro con datos pre-llenados
    window.location.href = `register.html?email=${encodedEmail}&password=${encodedPassword}&autoFill=true`;
  }, 5000);
};

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";

    if (!email || !password) {
      setMessage("Completa tu correo y contraseña.", true);
      return;
    }

    if (password.length < 6) {
      setMessage("La contraseña debe tener al menos 6 caracteres.", true);
      return;
    }

    setLoadingState(true);
    setMessage("Iniciando sesión...");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user) {
        setMessage("No se pudo iniciar sesión. Intenta nuevamente.", true);
        return;
      }

      console.log("Usuario logeado:", user);
      setMessage("");
      window.location.href = "home.html";
    } catch (error) {
      console.error(error);
      switch (error.code) {
        case "auth/user-not-found":
          // Usuario no existe - ofrecer redirección a registro
          handleNonExistentUser(email, password);
          break;
        case "auth/wrong-password":
          setMessage("La contraseña no coincide. Intenta otra vez.", true);
          break;
        case "auth/invalid-email":
          setMessage("El correo electrónico no es válido.", true);
          break;
        case "auth/user-disabled":
          setMessage("Esta cuenta está deshabilitada.", true);
          break;
        case "auth/too-many-requests":
          setMessage("Demasiados intentos. Espera un momento e intenta de nuevo.", true);
          break;
        default:
          setMessage("Ocurrió un error al iniciar sesión.", true);
      }
    } finally {
      setLoadingState(false);
    }
  });
}

if (googleLoginBtn) {
  googleLoginBtn.addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();
    setLoadingState(true);
    setMessage("Conectando con Google...");

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user) {
        setMessage("No se pudo completar el acceso con Google.", true);
        return;
      }

      console.log("Usuario logeado con Google:", user);
      setMessage("");
      window.location.href = "home.html";
    } catch (error) {
      console.error(error);
      setMessage("No se pudo iniciar sesión con Google.", true);
    } finally {
      setLoadingState(false);
    }
  });
}