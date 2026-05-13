# AYS MFA Movements

Este proyecto es un Micro-Frontend (MFE) encargado de la gestión y visualización de movimientos de cuentas dentro del ecosistema AYS. Está construido utilizando **Angular 21** y diseñado para integrarse dentro de una aplicación Shell mediante comunicación por mensajes (`postMessage`).

## 🚀 Despliegue en Producción

La aplicación se encuentra desplegada en **Digital Ocean App Platform**.
- **URL de la Shell (Principal):** [https://ays-shl-account-manage-35jnj.ondigitalocean.app/login](https://ays-shl-account-manage-35jnj.ondigitalocean.app/login)

## 🏗️ Arquitectura

El proyecto sigue una arquitectura de Micro-Frontends basada en las siguientes tecnologías y patrones:

- **Framework:** Angular 21 con componentes Standalone.
- **Micro-Frontend (MFE):** Diseñado para ser cargado de forma independiente pero operado bajo una Shell.
- **Comunicación (Bridge):** Utiliza un servicio llamado `MfeBridgeService` para intercambiar datos de sesión y comandos de navegación con la aplicación Shell mediante el API de `window.postMessage`.
- **Estilos:** SCSS con un enfoque modular.
- **Contenerización:** Docker para estandarizar el despliegue mediante un servidor Nginx.

## 📋 Requisitos Previos

Para ejecutar este proyecto localmente, asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) (Versión 24.x recomendada)
- [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/) (Opcional, para ejecución en contenedores)

## 🛠️ Ejecución Local

### Desarrollo con Angular CLI

1. Instala las dependencias:
   ```bash
   npm install
   ```

2. Inicia el servidor de desarrollo:
   ```bash
   npm start
   ```
   La aplicación estará disponible en `http://localhost:4200`.

### Ejecución con Docker

Si prefieres usar Docker para simular el entorno de producción:

1. Construye y levanta el contenedor:
   ```bash
   docker compose up --build
   ```
   La aplicación será accesible en `http://localhost:8083`.

## ⚙️ Configuración y Servicios

- **API Backend:** La aplicación consume servicios alojados en Digital Ocean:
  - Base URL: `https://ays-msa-dm-cuaa-cr-account-stagi-zdpms.ondigitalocean.app/movements`
- **Seguridad:** Los encabezados (`x-guid`, `x-app`) están preconfigurados en `movement.service.ts` para las peticiones a la API.

## ⚠️ A tener en cuenta

1. **Dependencia de la Shell:** Este MFE espera recibir un evento `SHELL_SESSION_DATA` para funcionar correctamente con datos de usuario reales.
2. **Orígenes de Confianza:** El `MfeBridgeService` tiene una lista de orígenes permitidos (`trustedOrigins`). Si despliegas en un nuevo dominio, asegúrate de añadirlo en `src/app/core/services/mfe-bridge.service.ts`.
3. **Manejo de CORS:** Las peticiones al backend están configuradas para dominios específicos en Digital Ocean.
4. **Standalone Components:** El proyecto utiliza el patrón de componentes Standalone de Angular (sin `AppModule`).

## 🌐 Ecosistema de Proyectos

Este micro-frontend forma parte de un ecosistema más amplio. A continuación se detallan los repositorios relacionados:

- **[ays-shl-account-management](https://github.com/chili7777/ays-shl-account-management):** La aplicación Shell que orquestra y contiene todos los micro-frontends.
- **[ays-mfa-movements](https://github.com/chili7777/ays-mfa-movements):** (Este repositorio) MFE para la gestión y consulta de movimientos.
- **[ays-mfa-customer](https://github.com/chili7777/ays-mfa-customer):** MFE para la gestión de datos de clientes.
- **[ays-mfa-account](https://github.com/chili7777/ays-mfa-account):** MFE para la gestión de cuentas bancarias.
- **[ays-msa-dm-cuaa-cr-account](https://github.com/chili7777/ays-msa-dm-cuaa-cr-account):** Microservicio de backend para el dominio de cuentas.
- **[ays-msa-dm-pain-cr-movement](https://github.com/chili7777/ays-msa-dm-pain-cr-movement):** Microservicio de backend para el dominio de movimientos y pagos.
- **[ays-custom-instructions](https://github.com/chili7777/ays-custom-instructions):** Repositorio de instrucciones y configuraciones personalizadas del proyecto.

## 🔑 Credenciales de Acceso

Para probar la aplicación en el entorno de pruebas, se pueden utilizar las siguientes credenciales:

### 💼 BackOffice (Admin)
- **Usuario:** `0103322228`
- **Contraseña:** `asdfghjk`

### 📱 Usuarios App (Transferencias)
- **Usuario 1:** `1718048232` / **Contraseña:** `qwertyui`
- **Usuario 2:** `1718048315` / **Contraseña:** `zxcvbnmq`

## 🚢 Despliegue (CI/CD)

El proyecto cuenta con un flujo de trabajo de GitHub Actions que automatiza el despliegue en Digital Ocean:
- `deploy/Dockerfile`: Construcción multi-etapa (Node build + Nginx runtime).
- `deploy/nginx.conf`: Configuración de Nginx para aplicaciones SPA (`try_files $uri $uri/ /index.html`).

---
© 2026 AYS Team
