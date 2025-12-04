# 🎾 Tennis Club - Proyecto Web Universitario

Sistema completo de gestión para club de tenis con catálogo de productos, carrito de compras, sistema de usuarios y panel de administración.

---

### Adrian Willman Chahuares Ccopacati

## 🚀 Inicio Rápido

### **Requisitos**
- XAMPP (Apache + MySQL + PHP)

### **Instalación en 3 Pasos**

1. **Iniciar XAMPP**
   - Abrir Panel de Control de XAMPP
   - Activar **Apache** (botón Start)
   - Activar **MySQL** (botón Start)
   - Esperar que ambos estén en verde

2. **Crear Base de Datos**
   ```
   http://localhost/tennis-club/init-database.php
   ```
   - Este script crea automáticamente:
     - Base de datos `tennis_club_db`
     - 4 tablas: users, products, purchases, inquiries
     - Usuario admin por defecto
     - 12 productos del catálogo

3. **Abrir el Sitio**
   ```
   http://localhost/tennis-club/index.html
   ```

---

## 🔐 Acceso Administrativo

- **Usuario:** `admin`
- **Contraseña:** `0000`

**Panel de Administración:**
```
http://localhost/tennis-club/admin-panel.html
```

---

## ✨ Características

### **Frontend (Usuario)**
- ✅ Página principal con diseño moderno
- ✅ Catálogo de productos dinámico (cargado desde BD)
- ✅ Carrito de compras funcional
- ✅ Registro de nuevos usuarios
- ✅ Inicio de sesión seguro
- ✅ Perfil de usuario (compras y consultas)
- ✅ Formulario de contacto/consultas
- ✅ Diseño responsive (móvil y desktop)

### **Backend (Administración)**
- ✅ Panel de administración completo
- ✅ Gestión de usuarios (CRUD)
- ✅ Gestión de productos (CRUD)
- ✅ Vista de compras realizadas
- ✅ Gestión de consultas/contacto
- ✅ Estadísticas en dashboard
- ✅ Control de stock en tiempo real

### **Tecnologías**
- ✅ Frontend: HTML5, CSS3, JavaScript (ES6+)
- ✅ Backend: PHP 7+, MySQL
- ✅ API REST con JSON
- ✅ Autenticación segura (password_hash)
- ✅ Protección contra SQL Injection (PDO)

---

## 📁 Estructura del Proyecto

```
tennis-club/
├── 📄 index.html                    # Página principal
├── 📄 login.html                    # Inicio de sesión
├── 📄 register.html                 # Registro de usuarios
├── 📄 user-profile.html             # Perfil del usuario
├── 📄 admin-panel.html              # Panel de administración
├── 🎨 styles.css                    # Estilos generales
├── 🎨 login-styles.css              # Estilos login/registro
├── ⚡ script.js                     # Lógica principal (carrito, contacto)
├── ⚡ login-script.js               # Lógica de login
├── ⚡ register-script-database.js   # Lógica de registro
├── ⚡ profile-script.js             # Lógica del perfil
├── ⚡ admin-panel.js                # Lógica del admin panel
├── 🔧 init-database.php             # Inicializar BD (ejecutar 1 vez)
├── 🔧 database-config.php           # Configuración de BD
├── 🔧 update-products.php           # Actualizar productos
├── 📁 api/                          # APIs REST
│   ├── auth.php                     # Autenticación (login/registro)
│   ├── users.php                    # CRUD de usuarios
│   ├── products.php                 # CRUD de productos
│   ├── purchases.php                # CRUD de compras
│   └── inquiries.php                # CRUD de consultas
├── 📁 js/
│   └── database.js                  # Clase para conectar con APIs
└── 📖 EXPLICACION-CODIGO.md         # GUÍA COMPLETA DEL CÓDIGO ⭐
```

---

## 📖 Documentación del Código

### **🌟 LEE ESTO PRIMERO:**

El archivo **`EXPLICACION-CODIGO.md`** contiene explicaciones detalladas de:

- ✅ Cómo funciona cada archivo
- ✅ Qué hace cada función
- ✅ Flujos completos del sistema (login, compra, registro, etc.)
- ✅ Explicación de conceptos técnicos (PDO, async/await, REST API, etc.)
- ✅ Ejemplos de código comentados
- ✅ Glosario de términos
- ✅ Diagramas de flujo

**Es la guía más completa del proyecto. ¡Ábrela ahora!**

---

## 🔄 Flujos del Sistema

### **1. Registro de Usuario**
```
Usuario → register.html → register-script-database.js 
→ api/auth.php → Base de Datos → Auto-login → index.html
```

### **2. Inicio de Sesión**
```
Usuario → login.html → login-script.js 
→ api/auth.php → Validar credenciales → Guardar sesión → Redirigir
```

### **3. Compra de Producto**
```
Usuario → Ver catálogo (BD) → Agregar al carrito → Checkout 
→ api/purchases.php → Guardar compra → Actualizar stock → Confirmación
```

### **4. Consulta/Contacto**
```
Usuario → Formulario contacto → script.js 
→ api/inquiries.php → Guardar en BD → Confirmación
```

---

## 🗄️ Base de Datos

### **Tablas Principales:**

1. **`users`** - Usuarios del sistema
   - id, full_name, email, phone, username, password (hash), role, created_at

2. **`products`** - Productos del catálogo
   - id, name, description, price, image_url, category, stock, is_active

3. **`purchases`** - Registro de compras
   - id, user_id, product_id, quantity, price, total, purchase_date

4. **`inquiries`** - Consultas/contacto
   - id, user_id, service_type, message, status, created_at

---

## 🔒 Seguridad

### **Implementada:**
- ✅ Contraseñas encriptadas con `password_hash()`
- ✅ Protección contra SQL Injection (PDO Prepared Statements)
- ✅ Validación en cliente y servidor
- ✅ Sesiones seguras con `sessionStorage`

### **Recomendaciones para Producción:**
- 🔐 Cambiar contraseña del admin
- 🔐 Agregar HTTPS
- 🔐 Limitar intentos de login
- 🔐 Agregar CSRF tokens
- 🔐 Configurar headers de seguridad

---

## 🛠️ Solución de Problemas

### **Error: "No se puede conectar a MySQL"**
- ✅ Verificar que MySQL esté iniciado en XAMPP (verde)
- ✅ Verificar que el puerto 3306 esté libre
- ✅ Intentar reiniciar MySQL desde XAMPP

### **Error: "window.dbAPI is not defined"**
- ✅ Verificar que `js/database.js` esté cargado antes que otros scripts
- ✅ Limpiar caché del navegador (Ctrl + Shift + Delete)
- ✅ Probar en modo incógnito

### **No aparecen los productos**
- ✅ Ejecutar `init-database.php` para crear productos
- ✅ Verificar que XAMPP esté ejecutándose
- ✅ Abrir consola del navegador (F12) y revisar errores

### **Login no funciona**
- ✅ Verificar que la base de datos esté creada
- ✅ Verificar credenciales: admin / 0000
- ✅ Revisar consola del navegador para ver logs detallados

---

## 📚 Para Aprender Más

### **Conceptos Importantes:**
- **PDO:** PHP Data Objects - Forma segura de conectarse a BD
- **REST API:** Arquitectura para crear APIs web
- **async/await:** Manejo de operaciones asíncronas en JavaScript
- **JSON:** Formato de intercambio de datos
- **CRUD:** Create, Read, Update, Delete
- **sessionStorage:** Almacenamiento temporal del navegador
- **localStorage:** Almacenamiento permanente del navegador

### **Lee el archivo `EXPLICACION-CODIGO.md` para entender:**
- 📖 Cómo funciona cada línea de código
- 📖 Flujos completos del sistema
- 📖 Explicación de conceptos avanzados
- 📖 Ejemplos paso a paso

---

## 📊 Estadísticas del Proyecto

- **Archivos HTML:** 5
- **Archivos CSS:** 2
- **Archivos JavaScript:** 6
- **Archivos PHP:** 8
- **APIs REST:** 5
- **Tablas en BD:** 4
- **Líneas de código:** ~5000+

---

## 👨‍💻 Proyecto Universitario

Este es un proyecto completo desarrollado para la universidad que demuestra:

✅ **Desarrollo Full-Stack** (Frontend + Backend)  
✅ **Bases de Datos** (MySQL + PDO)  
✅ **API REST** (JSON + HTTP)  
✅ **Autenticación** (Login + Registro)  
✅ **CRUD Completo** (Crear, Leer, Actualizar, Eliminar)  
✅ **Seguridad** (Encriptación + SQL Injection Protection)  
✅ **UX/UI** (Diseño Moderno + Responsive)  

---

## 🎯 Próximos Pasos

1. **Ejecuta `init-database.php`** para crear la base de datos
2. **Abre el archivo `EXPLICACION-CODIGO.md`** para entender el código
3. **Prueba todas las funcionalidades:**
   - Registrar un usuario
   - Iniciar sesión
   - Agregar productos al carrito
   - Hacer una compra
   - Enviar una consulta
   - Acceder al panel de administración
4. **Explora el código** usando los comentarios como guía

---

**¡Tu proyecto está listo! 🎉**  
**Para entender el código, abre: `EXPLICACION-CODIGO.md`** 📖

