# Landing Page - Sistema de Reportes

## Estructura del Proyecto

El proyecto está organizado de forma modular:

```
├── index.html          # Versión original (legacy)
├── index_modular.html  # Nueva versión modular (USAR ESTA)
├── css/
│   └── styles.css      # Estilos centralizados
├── js/
│   ├── config.js       # Configuración global
│   ├── storage.js      # Manejo de localStorage
│   ├── api.js          # Comunicación con APIs
│   ├── ui.js           # Interfaz de usuario
│   ├── charts.js       # Gráficos y visualizaciones
│   ├── issues.js       # Manejo de issues
│   ├── filters.js      # Filtros de datos
│   ├── pdf.js          # Generación de PDFs
│   └── main.js         # Punto de entrada principal
└── README.md           # Este archivo
```

## Configuración de Proxy Local (Recomendado)

Para evitar errores CORS, configura un proxy local que redirija las rutas `/gs/macros/s/*` a `https://script.google.com/macros/s/*`.

### 1. Live Server (VS Code) - Recomendado

Crea un archivo `.vscode/settings.json` en la raíz del proyecto:

```json
{
  "liveServer.settings.proxy": [
    ["/gs/macros/s/", "https://script.google.com/macros/s/"]
  ]
}
```

O agrega la configuración a tu `settings.json` global de VS Code.

### 2. Nginx

```nginx
location /gs/macros/s/ {
    proxy_pass https://script.google.com/macros/s/;
    proxy_set_header Host script.google.com;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

### 3. Apache (.htaccess)

```apache
RewriteEngine On
RewriteRule ^gs/macros/s/(.*)$ https://script.google.com/macros/s/$1 [P,L]
```

### 4. Express.js/Node.js

```javascript
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use('/gs/macros/s/', createProxyMiddleware({
    target: 'https://script.google.com',
    changeOrigin: true,
    pathRewrite: {
        '^/gs/macros/s/': '/macros/s/'
    }
}));

app.listen(3000);
```

## Funcionamiento Sin Proxy

Si no configuras proxy, el sistema automáticamente:

1. **Intenta primero** la ruta relativa (proxy local)
2. **Si da 404**, automáticamente usa la URL absoluta de Google Apps Script
3. **Si hay CORS**, muestra un mensaje informativo al usuario

## Logs de Debug

El sistema incluye logs detallados para facilitar el debug:

- 🚀 Inicialización de módulos
- 🔄 Peticiones de API (con fallback automático)
- 📊 Procesamiento de datos
- ⚠️ Advertencias y errores
- 💬 Mensajes al usuario

Para ver todos los logs, abre la consola del navegador (F12).

## Uso

1. **Abre `index_modular.html`** en tu navegador
2. Si usas VS Code, instala la extensión "Live Server"
3. Configura el proxy según las instrucciones arriba
4. Haz clic en "Go Live" en la barra de estado

## Archivos Principales

- **`index_modular.html`**: Versión nueva y mejorada (usar esta)
- **`index.html`**: Versión original (mantener como backup)

## Troubleshooting

### Error 404 en /gs/macros/s/...
- **Causa**: No hay proxy configurado
- **Solución**: El sistema automáticamente usa URL absoluta, pero configura proxy para mejor rendimiento

### Error CORS
- **Causa**: Google Apps Script no permite el origen
- **Solución**: Configura proxy local o pide al administrador de GAS que configure CORS

### Los datos no cargan
1. Verifica que las URLs en `js/config.js` sean correctas
2. Revisa la consola para ver logs detallados
3. Verifica conectividad a internet
4. Comprueba que Google Apps Script esté funcionando

## Desarrollo

Para modificar el proyecto:

1. **Funcionalidad de API**: Edita `js/api.js`
2. **Interfaz de usuario**: Edita `js/ui.js` y `css/styles.css`
3. **Configuración**: Edita `js/config.js`
4. **Gráficos**: Edita `js/charts.js`
5. **Filtros**: Edita `js/filters.js`

Cada módulo tiene logs detallados para facilitar el debug.
#   R e p o r t e - L a n z a m i e n t o  
 