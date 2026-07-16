# 🍽️ DineSync - Sistema Integral para Restaurantes

DineSync es una aplicación web interactiva construida con **React** que simula un ecosistema completo de gestión de restaurantes. Conecta de manera fluida la experiencia del cliente con la operación interna del restaurante (Punto de Venta, Cocina y Administración).

---

## ✨ Características Principales

La aplicación está dividida en tres módulos principales, accesibles mediante un selector de roles:

### 👁️ Modo Cliente (Consumidor)
* **Landing Page Dinámica:** Interfaz atractiva con imágenes, descripciones de platillos estrella y testimonios.
* **Reserva de Mesas:** Mapa interactivo para visualizar y seleccionar mesas disponibles.
* **Menú Digital Interactivo:** Catálogo visual con imágenes, calificaciones y descripciones de los platillos.
* **Carrito de Compras:** Sistema para agregar/quitar productos, calcular el total y enviar la orden directamente a la cocina sin necesidad de un mesero.

### 👔 Modo Mesero (POS - Punto de Venta)
* *Acceso protegido por contraseña.*
* **Gestión de Mesas:** Visualización del estado de las mesas (Disponible, Ocupada, Reservada, En Limpieza).
* **Toma de Pedidos Rápida:** Interfaz optimizada para agregar productos a la cuenta de una mesa.
* **Envío de Comandas:** Sincronización directa con el monitor de la cocina (KDS).
* **Facturación:** Generación de recibos desglosados (subtotal, impuestos, propina) y liberación automática de la mesa.

### ⚙️ Modo Administrador
* *Acceso protegido por contraseña.*
* **Gestión del Menú:** Formulario para agregar nuevos platillos en tiempo real, incluyendo nombre, precio, descripción y URL de la imagen.

### 👩‍🍳 Pantalla de Cocina (KDS)
* Monitor de tickets en tiempo real que muestra el número de mesa, la hora del pedido y los platillos solicitados.
* Sistema para marcar comandas como "Listas" y despacharlas.

---

## 🔒 Accesos y Credenciales

Para simular un entorno seguro, los roles del personal están protegidos por contraseñas básicas mediante `prompt`:

* **Rol Cliente:** Sin contraseña (Acceso libre).
* **Rol Mesero:** `mesero123`
* **Rol Administrador:** `admin123`

---

## 🛠️ Tecnologías Utilizadas

* **Frontend:** React (Hooks: `useState`), JSX.
* **Estilos:** CSS3 puro (Flexbox, CSS Grid, variables CSS).
* **Estructura:** Single Page Application (SPA) en un entorno de desarrollo simplificado.
* **Imágenes:** Integración con URLs de Unsplash para recursos visuales gratuitos.

---

## 🚀 Cómo ejecutar el proyecto

*(Nota: Ajusta esta sección dependiendo de cómo tengas configurado tu entorno, por ejemplo, si usas Create React App, Vite, o un archivo HTML con CDN).*

**Opción 1: Servidor Local (Node.js)**
1. Clona este repositorio.
2. Abre la carpeta en tu terminal.
3. Ejecuta `npm install` para instalar las dependencias (si aplica).
4. Ejecuta `npm start` o `npm run dev`.
5. Abre `http://localhost:3000` en tu navegador.

**Opción 2: Archivo estático con CDN**
1. Simplemente abre el archivo `index.html` en tu navegador web moderno favorito (Recomendamos usar la extension gratuita "Live Server" para mayor facilidad).
2. Asegúrate de tener una conexión a internet activa para cargar las librerías de React y las imágenes.

---

## 📌 Próximos pasos (Roadmap)
- [ ] Conectar a una base de datos real (Firebase / MongoDB).
- [ ] Implementar pasarela de pagos para el cliente.
- [ ] Agregar panel de estadísticas y ventas para el administrador.
- [ ] Autenticación de usuarios reales con JWT.

---
*Creado para revolucionar la gestión gastronómica.*