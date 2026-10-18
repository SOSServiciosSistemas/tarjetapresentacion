/**
 * S.O.S. SERVICIOS - LOGICA PRINCIPAL
 * Arbolado Urbano & Manejo Integrado de Plagas (MIP)
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Registro de Service Worker para PWA (offline e instalación)
  registerServiceWorker();

  // 2. Inicialización de la página QR (index.html)
  if (document.getElementById('qrcode')) {
    initQRPage();
  }

  // 3. Inicialización de la tarjeta de presentación (tarjetapresentacion.html)
  if (document.getElementById('whatsappAccordion')) {
    initBusinessCardPage();
  }

  // 4. Manejo de instalación PWA (para ambas páginas si aplica)
  initPWAInstallPrompt();
});

/* ============================================================
   1. SERVICE WORKER REGISTRATION
   ============================================================ */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => {
          console.log('SOS PWA Service Worker registrado con éxito:', reg.scope);
        })
        .catch(err => {
          console.warn('Fallo al registrar Service Worker:', err);
        });
    });
  }
}

/* ============================================================
   2. QR PAGE LOGIC (index.html)
   ============================================================ */
const TARGET_FILE = 'tarjetapresentacion.html';
let qrInstance = null;

function initQRPage() {
  const previewEl = document.getElementById('qrUrlPreview');
  const shareBtn = document.getElementById('shareQrLinkBtn');
  const openCardBtn = document.getElementById('openCardDirectBtn');

  // Enlace directo al archivo en el repositorio
  if (openCardBtn) {
    openCardBtn.href = TARGET_FILE;
  }

  // Mostrar el archivo en la pastilla de texto
  if (previewEl) {
    previewEl.textContent = TARGET_FILE;
  }

  // Resolver URL para el código QR y botón compartir:
  // Si se sirve mediante http/https (servidor local o en línea), resuelve la URL absoluta actual
  // para que los teléfonos móviles puedan abrirla al escanear el QR.
  const dynamicTargetUrl = window.location.protocol.startsWith('http')
    ? new URL(TARGET_FILE, window.location.href).href
    : TARGET_FILE;

  // Generar el código QR
  renderQRCode(dynamicTargetUrl);

  // Botón Compartir Enlace Directo
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      shareBusinessCard(dynamicTargetUrl);
    });
  }
}

function renderQRCode(url) {
  const qrContainer = document.getElementById('qrcode');
  if (!qrContainer) return;

  // Limpiar contenedor previo
  qrContainer.innerHTML = '';

  if (typeof QRCode !== 'undefined') {
    qrInstance = new QRCode(qrContainer, {
      text: url,
      width: 250,
      height: 250,
      colorDark: '#040d1a',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M // Nivel M (15%) para patrones nítidos, cuadros grandes y escaneo instantáneo
    });

    // Asegurar que el canvas auxiliar quede oculto una vez generada la imagen
    setTimeout(() => {
      const canvas = qrContainer.querySelector('canvas');
      const img = qrContainer.querySelector('img');
      if (canvas && img && img.src && img.src.length > 50) {
        canvas.style.display = 'none';
      }
    }, 50);
  } else {
    // Respaldo visual en caso de que la librería tarde en responder
    qrContainer.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}" alt="QR Code" width="250" height="250" style="display:block;border-radius:10px;" />`;
  }
}


/* ============================================================
   3. BUSINESS CARD / LINKTREE LOGIC (tarjetapresentacion.html)
   ============================================================ */
function initBusinessCardPage() {
  const accordionWrapper = document.getElementById('whatsappAccordion');
  const toggleBtn = document.getElementById('whatsappToggleBtn');
  const shareCardBtn = document.getElementById('shareCardBtn');
  const downloadVCardBtn = document.getElementById('downloadVCardBtn');

  // Despliegue de los dos números de WhatsApp (Arbolado y MIP)
  if (toggleBtn && accordionWrapper) {
    toggleBtn.addEventListener('click', () => {
      const isOpen = accordionWrapper.classList.toggle('is-open');
      toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // Despliegue de los dos perfiles de Facebook (Arbolado y MIP)
  const fbAccordionWrapper = document.getElementById('facebookAccordion');
  const fbToggleBtn = document.getElementById('facebookToggleBtn');

  if (fbToggleBtn && fbAccordionWrapper) {
    fbToggleBtn.addEventListener('click', () => {
      const isOpen = fbAccordionWrapper.classList.toggle('is-open');
      fbToggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // Compartir tarjeta interactiva
  if (shareCardBtn) {
    shareCardBtn.addEventListener('click', () => {
      shareBusinessCard(window.location.href);
    });
  }

  // Descargar vCard (.vcf) de contacto
  if (downloadVCardBtn) {
    downloadVCardBtn.addEventListener('click', (e) => {
      e.preventDefault();
      generateAndDownloadVCard();
    });
  }
}

// Generador de vCard (.vcf) oficial
function generateAndDownloadVCard() {
  const vcardData = `BEGIN:VCARD
VERSION:3.0
FN:S.O.S. Servicios
ORG:S.O.S. Servicios - Arbolado y Plagas
TITLE:Soluciones Integrales en Arbolado y Manejo Integrado de Plagas (MIP)
TEL;TYPE=WORK,VOICE:+524775105714
TEL;TYPE=CELL,VOICE,WHATSAPP:+524775105714
EMAIL;TYPE=PREF,INTERNET:contacto@sosservicios.com.mx
URL:https://sosservicios.com.mx
ADR;TYPE=WORK:;;;Leon;Guanajuato;;Mexico
NOTE:Especialistas certificados en Arbolado Urbano y Manejo Integrado de Plagas (MIP). Atención mediante llamada y visitas a domicilio.
END:VCARD`;

  const blob = new Blob([vcardData], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'SOS_Servicios_Contacto.vcf');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast('¡Contacto descargado! Guárdalo en tu teléfono');
}

// Función universal de compartir con Web Share API o Portapapeles
function shareBusinessCard(urlToShare) {
  const shareData = {
    title: 'S.O.S. Servicios | Tarjeta Digital',
    text: 'Conoce los servicios de Arbolado y Manejo Integrado de Plagas (MIP) de S.O.S. Servicios.',
    url: urlToShare
  };

  if (navigator.share) {
    navigator.share(shareData).catch(err => {
      if (err.name !== 'AbortError') {
        copyToClipboard(urlToShare);
      }
    });
  } else {
    copyToClipboard(urlToShare);
  }
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('¡Enlace copiado al portapapeles!');
    }).catch(() => {
      fallbackCopy(text);
    });
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    showToast('¡Enlace copiado al portapapeles!');
  } catch (err) {
    showToast('Copia este enlace: ' + text);
  }
  document.body.removeChild(textarea);
}

/* ============================================================
   4. MANEJO DE INSTALACIÓN PWA
   ============================================================ */
let deferredInstallPrompt = null;

function initPWAInstallPrompt() {
  const banner = document.getElementById('pwaInstallBanner');
  const installBtn = document.getElementById('btnInstallPWA');
  const dismissBtn = document.getElementById('btnDismissPWA');
  const statusPill = document.getElementById('appModeBadge');

  // Detectar si ya está en modo Standalone (instalada)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  if (isStandalone) {
    if (statusPill) {
      statusPill.innerHTML = '<span class="pulse-dot"></span> App Instalada';
    }
    if (banner) {
      banner.style.display = 'none';
    }
    return;
  }

  // Escuchar evento de instalación para Android / Chrome / Edge
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    
    // Si el usuario no ha descartado el banner recientemente
    if (!sessionStorage.getItem('pwa_banner_dismissed') && banner) {
      banner.style.display = 'flex';
    }
  });

  // Botón Instalar
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          showToast('¡Instalando SOS Servicios!');
        }
        deferredInstallPrompt = null;
        if (banner) banner.style.display = 'none';
      } else {
        // En iOS Safari o navegadores donde no se dispara beforeinstallprompt
        showIOSInstallInstructions();
      }
    });
  }

  // Botón Descartar
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      if (banner) banner.style.display = 'none';
      sessionStorage.setItem('pwa_banner_dismissed', 'true');
    });
  }

  // Detectar iOS Safari para mostrar mensaje específico
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (isIOS && !isStandalone && banner && !sessionStorage.getItem('pwa_banner_dismissed')) {
    const bannerText = banner.querySelector('.install-banner-text p');
    if (bannerText) {
      bannerText.textContent = 'En Safari: Toca Compartir ⎋ y "Agregar al inicio" ➕';
    }
    banner.style.display = 'flex';
  }
}

function showIOSInstallInstructions() {
  alert('Para instalar en iPhone/iPad:\n\n1. Toca el botón Compartir en la barra de Safari (el icono del cuadrado con flecha hacia arriba).\n2. Desliza hacia abajo y selecciona "Agregar a la pantalla de inicio".\n3. ¡Listo! Tendrás el icono en tu pantalla de inicio.');
}

/* ============================================================
   5. UTILIDAD TOAST NOTIFICATION
   ============================================================ */
function showToast(message) {
  let toast = document.getElementById('toastNotice');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastNotice';
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}
