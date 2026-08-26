# MDS Bajas Internas

PWA para controlar **entradas y retiradas internas de stock** escaneando códigos de barras con la cámara del móvil.

## Funciones

- Escaneo por cámara (EAN, UPC, Code 128, QR y otros formatos soportados por ZXing).
- Introducción manual del código.
- Alta del producto la primera vez que se escanea.
- Retirar o añadir unidades.
- Stock actual por producto.
- Historial completo de movimientos.
- Buscador de productos e historial.
- Exportación de copia de seguridad JSON.
- Importación/restauración de copia JSON.
- Exportación del historial a CSV.
- Instalable como PWA en móvil y escritorio.
- Funciona en GitHub Pages mediante HTTPS.

## Importante sobre los datos

Esta versión guarda los datos en **IndexedDB dentro del navegador del dispositivo**. Por tanto:

- No necesita servidor ni base de datos.
- Los datos no se sincronizan entre varios móviles/ordenadores.
- Conviene usar la exportación JSON como copia de seguridad.

Si se necesita uso multiusuario y stock compartido en tiempo real, se puede conectar posteriormente a Supabase, PostgreSQL o una API propia.

## Ejecutar en local

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev
```

Abre la dirección indicada por Vite.

> La cámara del navegador normalmente requiere HTTPS o `localhost`.

## Compilar

```bash
npm run build
```

La versión final se genera en `dist/`.

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub, por ejemplo `mds-bajas-internas`.
2. Sube todos los archivos de este proyecto.
3. Asegúrate de que la rama principal se llame `main`.
4. En GitHub entra en **Settings → Pages**.
5. En **Build and deployment → Source**, selecciona **GitHub Actions**.
6. Haz un push a `main`.
7. La acción `.github/workflows/deploy-pages.yml` compilará y publicará la aplicación.

La URL tendrá normalmente esta forma:

`https://TU-USUARIO.github.io/mds-bajas-internas/`

## Instalar en el móvil

### Android / Chrome

Abre la URL publicada → menú de Chrome → **Añadir a pantalla de inicio / Instalar aplicación**.

### iPhone / Safari

Abre la URL publicada → botón **Compartir** → **Añadir a pantalla de inicio**.

## Flujo de uso

1. Pulsa **Escanear código**.
2. Apunta la cámara al código de barras.
3. Si es nuevo, indica nombre y opcionalmente SKU.
4. Selecciona **Retirar** o **Añadir**.
5. Introduce las unidades.
6. Opcionalmente añade una nota o motivo.
7. Pulsa **Guardar movimiento**.

El stock y el historial se actualizan automáticamente.
