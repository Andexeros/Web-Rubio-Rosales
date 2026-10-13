# Rubio & Rosales — Web lista para GitHub y Vercel

Incluye la web completa: diseño responsive, imagen de arquitectura, navegación, preguntas frecuentes y consulta por WhatsApp con selección del profesional. HTML, CSS y JavaScript, sin dependencias ni compilación.

## 1. Subir a GitHub

1. Descomprimí `Rubio_Rosales_Vercel.zip` en tu computadora.
2. Creá un repositorio nuevo en GitHub, por ejemplo `rubio-rosales-web`.
3. En el repositorio, elegí **Add file → Upload files**. Si está vacío, usá **uploading an existing file**.
4. Abrí la carpeta descomprimida y arrastrá **su contenido**, incluyendo la carpeta `public`, el archivo `vercel.json` y este `README.md`. No subas el ZIP, ni arrastres una carpeta contenedora adicional. Mantené la carpeta `assets` dentro de `public`.
5. Elegí **Commit changes** para guardar.

La raíz del repositorio debe mostrar `public`, `vercel.json` y `README.md`. Dentro de `public` debe estar `index.html` y la carpeta `assets` con los tres archivos: `styles.css`, `main.js` y `casa-moderna.webp`.

## 2. Publicar en Vercel

1. Iniciá sesión en Vercel y elegí **Add New → Project**.
2. Conectá tu cuenta de GitHub, autorizá el acceso al repositorio e importalo.
3. Usá esta configuración:

| Campo | Valor |
| --- | --- |
| Framework Preset | Other |
| Root Directory | Raíz del repositorio (dejá el valor predeterminado) |
| Build Command | Vacío, sin comando de compilación |
| Output Directory | public |
| Install Command | Vacío, sin comando de instalación |
| Environment Variables | Ninguna |

`vercel.json` ya define el framework, la carpeta de salida y los comandos vacíos. No elijas Next.js ni cambies Root Directory a `public`.

4. Elegí **Deploy**. Cuando termine, Vercel mostrará la dirección del sitio.
5. Revisá la portada, las preguntas frecuentes y los botones de contacto desde tu computadora y tu celular.

Si aparece un error 404, comprobá que `vercel.json` esté en la raíz del repositorio y que exista `public/index.html`. Si falta la imagen, comprobá que `public/assets/casa-moderna.webp` se haya subido conservando ese nombre.

## 3. Cambios futuros

- Textos, datos de contacto y estructura: `public/index.html`.
- Colores, tipografías y diseño responsive: `public/assets/styles.css`.
- Mensaje de WhatsApp y animaciones: `public/assets/main.js`.
- Imagen de portada: `public/assets/casa-moderna.webp`.

Al guardar cambios en la rama conectada a Vercel, se genera un nuevo despliegue automáticamente.

Los números de WhatsApp usan formato internacional argentino: Juan, `5492604410045`; José Luis, `5492604513113`. El formulario prepara el mensaje en WhatsApp; el visitante lo envía manualmente. No almacena consultas ni envía correos.

La imagen de portada es ilustrativa y fue generada para esta web; no se presenta como una obra realizada por los profesionales. La información de la moratoria mantiene la recomendación de consultar vigencia y requisitos, sin fechas o beneficios específicos.

## Vista local opcional

Podés abrir `public/index.html` en el navegador para una revisión rápida. También podés servir la carpeta `public` con cualquier servidor de archivos estáticos.

## Documentación de referencia

- https://vercel.com/docs/builds/configure-a-build
- https://vercel.com/docs/project-configuration/vercel-json

Paquete verificado: archivos locales referenciados, enlaces internos, sintaxis JavaScript y generación del mensaje de WhatsApp. No se realizó un despliegue en tu cuenta de Vercel ni una revisión visual en navegador.

## Ajuste responsive

Márgenes laterales de 24 px en mobile y 20 px en pantallas menores a 360 px. Encabezado compacto, tipografías adaptables y tarjetas con columnas flexibles. Actualizá `public/index.html` y `public/assets/styles.css` en el repositorio si ya habías cargado la versión anterior.
