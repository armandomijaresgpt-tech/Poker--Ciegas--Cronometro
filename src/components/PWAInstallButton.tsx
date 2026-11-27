import React, { useState } from 'react';
import { Download, Share, PlusSquare, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Tooltip } from './Tooltip';

interface PWAInstallButtonProps {
  variant?: 'header' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className="flex items-center gap-3 text-sm text-emerald-400">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Aplicación instalada en este dispositivo (lista para usar sin internet)</span>
        </div>
      );
    }
    return null;
  }

  if (isInstallable) {
    return (
      <Tooltip
        title="Instalar App Offline"
        content="Guarda MesaPoker en tu teléfono, tablet u ordenador para abrirla sin navegador y usarla sin internet."
        placement="bottom"
        className={variant === 'card' ? 'w-full' : 'inline-flex'}
      >
        <button
          type="button"
          onClick={install}
          className={
            variant === 'card'
              ? 'w-full min-h-[48px] flex items-center justify-center gap-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] px-5 py-3 text-sm font-semibold text-white transition-all whitespace-nowrap shrink-0 cursor-pointer'
              : 'min-h-[40px] flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-500 active:scale-[0.98] px-3.5 py-2 text-xs font-semibold text-white transition-all whitespace-nowrap shrink-0 cursor-pointer'
          }
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>Instalar App Offline</span>
        </button>
      </Tooltip>
    );
  }

  if (isIOS) {
    return (
      <>
        <Tooltip
          title="Instalar en iPhone / iPad"
          content="Muestra los pasos para añadir MesaPoker a tu pantalla de inicio en Safari y usarla sin conexión."
          placement="bottom"
          className={variant === 'card' ? 'w-full' : 'inline-flex'}
        >
          <button
            type="button"
            onClick={() => setShowIOSGuide(true)}
            className={
              variant === 'card'
                ? 'w-full min-h-[48px] flex items-center justify-center gap-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 px-5 py-3 text-sm font-semibold text-slate-100 transition-all whitespace-nowrap shrink-0 cursor-pointer'
                : 'min-h-[40px] flex items-center gap-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition-all whitespace-nowrap shrink-0 cursor-pointer'
            }
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Instalar en iOS</span>
          </button>
        </Tooltip>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
          >
            <div className="w-full max-w-md rounded-2xl bg-[#12151C] border border-white/10 p-6 shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <h3 id="ios-install-title" className="text-lg font-semibold text-white">
                  Instalar en iPhone o iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                  aria-label="Cerrar guía"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Instala MesaPoker en tu pantalla de inicio para usarla a pantalla completa y sin conexión a internet:
              </p>
              <ol className="mt-4 space-y-3 text-sm text-slate-200">
                <li className="flex items-start gap-3">
                  <Share className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    1. Toca el botón <strong className="text-white">Compartir</strong> en la barra de Safari.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <PlusSquare className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    2. Desliza hacia abajo y selecciona <strong className="text-white">Añadir a pantalla de inicio</strong>.
                  </span>
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full min-h-[48px] rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-semibold text-white transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  if (variant === 'card') {
    return (
      <p className="text-sm text-slate-400 leading-relaxed">
        Puedes instalar esta aplicación en tu dispositivo desde el menú de tu navegador («Instalar aplicación» o «Añadir a pantalla de inicio») para usarla sin conexión.
      </p>
    );
  }

  return null;
};
