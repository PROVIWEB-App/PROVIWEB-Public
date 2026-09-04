/**
 * Pausa temporalmente todos los flujos de acceso y registro web.
 * El registro e inicio de sesión continúan disponibles en la aplicación móvil.
 */
(function () {
    const APP_URL = 'https://proviweb.com/#app-download';
    const AUTH_FORMS = [
        '#loginForm',
        '#allyRegisterForm',
        '#registrationForm',
        '#ssoLoginForm',
        '#brandRegisterForm',
        '#adminAccessForm'
    ].join(',');
    const AUTH_BUTTONS = [
        '#loginSubmitBtn',
        '#googleLogin',
        '#signUpBtn',
        '#nextStepBtn',
        '#btnLoginAndAuthorize',
        '#btnAuthorizeSso',
        '#btnSwitchAccount',
        '#btnSubmitBrandAuth',
        '#btnToggleAuthMode',
        '#loginLink',
        '#resetBtn',
        '#backLink',
        '#adminAccessBtn',
        '.ally-login-link',
        '#loginRequired a[href*="index.html"]',
        '#loginRequired a[href*="register.html"]'
    ].join(',');
    let redirectTimer;

    const style = document.createElement('style');
    style.textContent = `
        #authMaintenanceOverlay {
            position: fixed;
            inset: 0;
            z-index: 2147483647;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(5, 5, 12, 0.86);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
        .auth-maintenance-card {
            width: min(100%, 390px);
            padding: 32px 28px;
            color: #fff;
            text-align: center;
            font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: linear-gradient(145deg, #211c35, #111827);
            border: 1px solid rgba(168, 85, 247, 0.55);
            border-radius: 22px;
            box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55), 0 0 32px rgba(168, 85, 247, 0.22);
        }
        .auth-maintenance-icon { font-size: 42px; margin-bottom: 12px; }
        .auth-maintenance-card h2 {
            margin: 0 0 10px;
            font-size: 25px;
            background: linear-gradient(135deg, #c084fc, #38bdf8);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .auth-maintenance-card p { margin: 0; color: #e2e8f0; line-height: 1.5; }
        .auth-maintenance-card .auth-maintenance-subtitle {
            margin-top: 8px;
            color: #94a3b8;
            font-size: 13px;
        }
        .auth-maintenance-loader {
            width: 26px;
            height: 26px;
            margin: 22px auto 0;
            border: 3px solid rgba(255,255,255,0.18);
            border-top-color: #a855f7;
            border-radius: 50%;
            animation: authMaintenanceSpin 0.8s linear infinite;
        }
        @keyframes authMaintenanceSpin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);

    function showMaintenanceCard() {
        if (document.getElementById('authMaintenanceOverlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'authMaintenanceOverlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.innerHTML = `
            <div class="auth-maintenance-card">
                <div class="auth-maintenance-icon" aria-hidden="true">🛠️</div>
                <h2>En Reparaciones</h2>
                <p>El inicio de sesión y el registro web están temporalmente en reparaciones.</p>
                <p class="auth-maintenance-subtitle">Te llevaremos a la aplicación PROVIWEB.</p>
                <div class="auth-maintenance-loader" aria-hidden="true"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        redirectTimer = window.setTimeout(function () {
            window.location.assign(APP_URL);
        }, 1800);
    }

    function isAuthLink(element) {
        if (!element || element.tagName !== 'A') return false;
        const href = (element.getAttribute('href') || '').toLowerCase();
        const text = (element.textContent || '').toLowerCase();
        return href === '#login'
            || href.indexOf('register.html') !== -1
            || href.indexOf('forgotpass.html') !== -1
            || element.matches('.ally-login-link')
            || text.indexOf('iniciar sesión') !== -1
            || text.indexOf('crear cuenta') !== -1
            || text.indexOf('registrar cuenta') !== -1;
    }

    document.addEventListener('submit', function (event) {
        if (event.target && event.target.matches(AUTH_FORMS)) {
            event.preventDefault();
            event.stopImmediatePropagation();
            showMaintenanceCard();
        }
    }, true);

    document.addEventListener('click', function (event) {
        const target = event.target.closest('button, a');
        if (!target) return;

        if (target.matches(AUTH_BUTTONS) || isAuthLink(target)) {
            event.preventDefault();
            event.stopImmediatePropagation();
            showMaintenanceCard();
        }
    }, true);

    window.addEventListener('beforeunload', function () {
        if (redirectTimer) window.clearTimeout(redirectTimer);
    });
})();
