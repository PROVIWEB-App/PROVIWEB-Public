/**
 * PROVIWEB - Automatic Diamond Reward Engine
 * Agrega automáticamente +0.10 Diamantes cada 3 minutos (180,000 ms) al balance del usuario activo.
 * Sincronizado en tiempo real con Firebase Realtime Database (Balance/{uid}/diamond).
 */

(function (global) {
    'use strict';

    const REWARD_INTERVAL_MS = 3 * 60 * 1000; // 3 minutos
    const REWARD_AMOUNT = 0.10;
    const STORAGE_KEY_LAST_REWARD = 'proviweb_last_diamond_reward_time';

    let isEngineRunning = false;
    let rewardTimer = null;

    function getActiveUid() {
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
            return firebase.auth().currentUser.uid;
        }
        const cached = localStorage.getItem('id');
        return (cached && cached !== 'null' && cached !== 'undefined') ? cached : null;
    }

    function showDiamondToast(newTotal) {
        let toast = document.getElementById('proviwebDiamondToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'proviwebDiamondToast';
            toast.style.cssText = `
                position: fixed;
                bottom: 84px;
                right: 24px;
                background: linear-gradient(135deg, rgba(14, 165, 233, 0.95) 0%, rgba(99, 102, 241, 0.95) 100%);
                border: 1.5px solid rgba(255, 255, 255, 0.25);
                color: #ffffff;
                padding: 12px 18px;
                border-radius: 50px;
                font-size: 13px;
                font-weight: 800;
                display: flex;
                align-items: center;
                gap: 8px;
                box-shadow: 0 10px 30px rgba(14, 165, 233, 0.4), 0 0 20px rgba(99, 102, 241, 0.3);
                z-index: 25000;
                transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
                transform: translateY(100px);
                opacity: 0;
                pointer-events: none;
            `;
            document.body.appendChild(toast);
        }

        toast.innerHTML = `<span>💎</span> <span>+0.10 Diamantes ganados por tu tiempo en PROVIWEB (Total: ${newTotal})</span>`;
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';

        setTimeout(() => {
            toast.style.transform = 'translateY(100px)';
            toast.style.opacity = '0';
        }, 4500);
    }

    async function executeDiamondReward() {
        const uid = getActiveUid();
        if (!uid) return;

        try {
            if (typeof firebase !== 'undefined' && firebase.database) {
                const db = firebase.database();
                const balRef = db.ref('Balance/' + uid);
                
                const snap = await balRef.once('value');
                let currentDiamonds = 0;
                let data = {};

                if (snap.exists()) {
                    data = snap.val() || {};
                    const val = data.diamond || data.diamonds || 0;
                    currentDiamonds = typeof val === 'number' ? val : parseFloat(val) || 0;
                }

                const updatedTotal = parseFloat((currentDiamonds + REWARD_AMOUNT).toFixed(2));

                await balRef.update({
                    diamond: updatedTotal.toString(),
                    lastRewardTimestamp: Date.now()
                });

                db.ref('Diamond/' + uid).update({
                    diamond: updatedTotal.toString(),
                    lastUpdated: Date.now()
                }).catch(() => {});

                localStorage.setItem(STORAGE_KEY_LAST_REWARD, Date.now().toString());
                updateUiDiamondCounters(updatedTotal);
                showDiamondToast(updatedTotal);
                console.log(`[DiamondEngine] ✅ Recompensa de +0.10 Diamantes acreditada. Nuevo balance: ${updatedTotal}`);
            }
        } catch (err) {
            console.warn('[DiamondEngine] Error al acreditar recompensa de diamantes:', err);
        }
    }

    function updateUiDiamondCounters(total) {
        const formatted = parseFloat(total).toFixed(2);
        document.querySelectorAll('.user-diamond-balance, [data-diamond-balance]').forEach(el => {
            el.textContent = `${formatted} 💎`;
        });
        const pill = document.getElementById('sidebarUserDiamonds');
        if (pill) pill.textContent = `${formatted} 💎`;
    }

    function startDiamondRewardEngine() {
        if (isEngineRunning) return;
        isEngineRunning = true;

        const uid = getActiveUid();
        if (!uid) {
            setTimeout(startDiamondRewardEngine, 3000);
            return;
        }

        console.log(`[DiamondEngine] 🚀 Motor de Diamantes activo para usuario: ${uid} (Recompensa: +0.10 cada 3 minutos)`);

        const lastReward = parseInt(localStorage.getItem(STORAGE_KEY_LAST_REWARD) || '0', 10);
        const elapsed = Date.now() - lastReward;

        let nextDelay = REWARD_INTERVAL_MS;
        if (lastReward > 0 && elapsed < REWARD_INTERVAL_MS) {
            nextDelay = REWARD_INTERVAL_MS - elapsed;
        }

        rewardTimer = setTimeout(function tick() {
            executeDiamondReward();
            rewardTimer = setInterval(executeDiamondReward, REWARD_INTERVAL_MS);
        }, nextDelay);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startDiamondRewardEngine);
    } else {
        startDiamondRewardEngine();
    }

    global.ProviwebDiamondRewards = {
        start: startDiamondRewardEngine,
        executeReward: executeDiamondReward,
        getIntervalMs: () => REWARD_INTERVAL_MS,
        getRewardAmount: () => REWARD_AMOUNT
    };

})(window);
