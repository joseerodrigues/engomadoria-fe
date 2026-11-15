"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { SparkleMark } from "@/components/sparkle-mark";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function subscribeToDisplayMode(onChange: () => void) {
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getDisplayMode() {
  return window.matchMedia("(display-mode: standalone)").matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function getServerDisplayMode() {
  return false;
}

export function PwaInstall() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const standalone = useSyncExternalStore(subscribeToDisplayMode, getDisplayMode, getServerDisplayMode);

  useEffect(() => {
    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    }

    function onAppInstalled() {
      setInstalled(true);
      setInstallPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setInstallPrompt(null);
  }

  if (standalone || installed) return null;

  return (
    <section className="pwa-install-card" aria-labelledby="pwa-install-title">
      <div className="pwa-install-mark"><SparkleMark /></div>
      <div className="pwa-install-content">
        <h3 id="pwa-install-title">Leve a Roupa em Dia consigo</h3>
        <p>Adicione a aplicação ao ecrã principal para a abrir numa janela própria.</p>
        {installPrompt && <button className="pwa-install-button" type="button" onClick={installApp}>Instalar aplicação</button>}
        <p className="pwa-install-help">iPhone ou iPad: no Safari, toque em Partilhar e escolha “Adicionar ao ecrã principal”. Android: use “Instalar aplicação” ou a opção de instalação no menu do navegador.</p>
      </div>
    </section>
  );
}
