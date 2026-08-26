# MDS Bajas Internas — versión GitHub Pages directa

Esta versión está preparada para publicarse **sin npm, sin Vite, sin GitHub Actions y sin carpeta `.github`**.

## Archivos que debes subir

Sube a la raíz del repositorio estos 8 archivos:

- `index.html`
- `app.js`
- `db.js`
- `style.css`
- `manifest.webmanifest`
- `sw.js`
- `icon.svg`
- `README.md`

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub.
2. Entra en **Add file > Upload files**.
3. Arrastra los 8 archivos anteriores y pulsa **Commit changes**.
4. Ve a **Settings > Pages**.
5. En **Build and deployment**, selecciona **Deploy from a branch**.
6. En **Branch**, selecciona `main` y la carpeta `/(root)`.
7. Pulsa **Save**.
8. GitHub mostrará la dirección HTTPS de la aplicación cuando Pages quede publicado.

La cámara del móvil necesita que la aplicación esté servida por HTTPS; GitHub Pages ya proporciona HTTPS.

## Datos

Los productos, stock e historial se guardan en IndexedDB en el navegador del dispositivo. Utiliza la exportación JSON para hacer copias de seguridad.
