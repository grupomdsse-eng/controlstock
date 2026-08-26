# MDS Bajas Internas V3

Aplicación web/PWA estática para controlar entradas y retiradas de stock mediante código de barras.

## Publicación en GitHub Pages

1. Sube **todos los archivos de esta carpeta** a la raíz del repositorio.
2. GitHub → Settings → Pages.
3. Source: **Deploy from a branch**.
4. Branch: `main` y carpeta `/(root)`.
5. Guarda y abre la URL HTTPS que proporciona GitHub Pages.

No necesita `.github`, npm, Vite ni compilación.

## Importante

- La cámara requiere HTTPS o localhost.
- La interfaz ya no depende de librerías externas para arrancar.
- En navegadores con `BarcodeDetector`, el escaneo es nativo.
- En navegadores sin `BarcodeDetector`, ZXing se carga únicamente al abrir el escáner. Si no hay conexión a ese recurso, siempre queda disponible la introducción manual.
- Los datos se almacenan localmente en el dispositivo (IndexedDB, con fallback a localStorage).
