import React, { useState, useEffect, useCallback } from 'react';
import { IoDownloadOutline, IoClose } from 'react-icons/io5';

const DISMISS_KEY = 'pwa_install_dismissed';

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.navigator.standalone === true;
    if (isIOS && !isStandalone) setVisible(true);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setVisible(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  }, []);

  if (!visible) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div data-testid="install-banner" style={{ position: 'fixed', bottom: 70, left: 12, right: 12, zIndex: 1000, animation: 'slideUp 0.3s ease-out' }}>
      <style>{`@keyframes slideUp { from { transform: translateY(120px); } to { transform: translateY(0); } }`}</style>
      <div style={{ display: 'flex', alignItems: 'center', background: '#1e293b', borderRadius: 16, padding: 14, gap: 12, border: '1px solid #8B5CF6' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <IoDownloadOutline size={24} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Install Spaw Group</div>
          <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: '16px' }}>
            {isIOS ? 'Tap Share → Add to Home Screen' : 'Add to your home screen for quick access'}
          </div>
        </div>
        {!isIOS && deferredPrompt && (
          <button onClick={handleInstall} data-testid="install-banner-install-btn" style={{ background: '#8B5CF6', border: 'none', padding: '8px 16px', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700 }}>
            Install
          </button>
        )}
        <button onClick={handleDismiss} data-testid="install-banner-close-btn" style={{ background: 'none', border: 'none', padding: 4 }}>
          <IoClose size={20} color="#94a3b8" />
        </button>
      </div>
    </div>
  );
}
