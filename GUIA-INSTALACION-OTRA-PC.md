# 📦 GUÍA: Instalar el Proyecto en Otra Computadora

## ⚠️ IMPORTANTE: No necesitas Node.js

Este proyecto usa **PHP + MySQL**, NO Node.js.

**Lo que SÍ necesitas:**
- ✅ XAMPP (incluye Apache + MySQL + PHP)
- ✅ Los archivos del proyecto
- ✅ La base de datos (opcional, se crea automáticamente)

**Lo que NO necesitas:**
- ❌ Node.js
- ❌ npm
- ❌ Servidor Node

---

## 🚀 MÉTODO 1: Instalación Limpia (Recomendado)

### **PASO 1: En la PC Original (Exportar)**

#### **1.1 Copiar los archivos del proyecto**

**Opción A: Copiar carpeta completa**
```
1. Ve a: C:\xampp\htdocs\
2. Copia TODA la carpeta "tennis-club"
3. Pégala en una USB o súbela a la nube
```

**Opción B: Crear ZIP**
```
1. Ve a: C:\xampp\htdocs\
2. Haz clic derecho en "tennis-club"
3. Comprimir → "tennis-club.zip"
4. Copia el ZIP a USB o nube
```

#### **1.2 Exportar la base de datos (OPCIONAL)**

Si quieres conservar los usuarios y productos que ya tienes:

```
1. Abre: http://localhost/phpmyadmin
2. Haz clic en "tennis_club_db" (izquierda)
3. Clic en la pestaña "Exportar" (arriba)
4. Método: Rápido
5. Formato: SQL
6. Clic en "Continuar"
7. Se descarga: tennis_club_db.sql
8. Copia este archivo a USB o nube
```

---

### **PASO 2: En la PC Nueva (Importar)**

#### **2.1 Instalar XAMPP**

```
1. Descarga XAMPP desde:
   https://www.apachefriends.org/download.html

2. Versión recomendada:
   - XAMPP 8.2.x o superior (incluye PHP 8.2)
   - Windows, Mac o Linux según tu sistema

3. Ejecuta el instalador:
   - Selecciona: Apache, MySQL, PHP, phpMyAdmin
   - Ruta de instalación: C:\xampp (por defecto)

4. Instala y finaliza

5. Abre el Panel de Control de XAMPP

6. Inicia Apache y MySQL
```

#### **2.2 Copiar los archivos del proyecto**

**Si copiaste la carpeta:**
```
1. Ve a: C:\xampp\htdocs\
2. Pega la carpeta "tennis-club"
3. Verifica que quede así:
   C:\xampp\htdocs\tennis-club\
```

**Si tienes un ZIP:**
```
1. Extrae tennis-club.zip
2. Copia la carpeta extraída
3. Pégala en: C:\xampp\htdocs\
4. Verifica que quede así:
   C:\xampp\htdocs\tennis-club\
```

#### **2.3 Crear la base de datos**

**Opción A: Auto-crear (Recomendado si empiezas desde cero)**
```
1. Abre el navegador
2. Ve a: http://localhost/tennis-club/init-database.php
3. Espera que termine
4. ¡Listo! Base de datos creada con:
   - Usuario admin (admin / 0000)
   - 12 productos del catálogo
```

**Opción B: Importar base de datos existente**

Si exportaste la base de datos en la PC original:

```
1. Abre: http://localhost/phpmyadmin
2. Clic en "Nueva" (izquierda arriba)
3. Nombre de BD: tennis_club_db
4. Cotejamiento: utf8mb4_unicode_ci
5. Clic en "Crear"
6. Selecciona "tennis_club_db" (izquierda)
7. Clic en "Importar" (arriba)
8. Clic en "Seleccionar archivo"
9. Busca: tennis_club_db.sql
10. Clic en "Continuar" (abajo)
11. Espera que termine
12. ¡Listo! Conservaste todos tus datos
```

#### **2.4 Probar el proyecto**

```
1. Abre el navegador
2. Ve a: http://localhost/tennis-club/index.html
3. Prueba el login: admin / 0000
4. ¡Funciona! 🎉
```

---

## 🚀 MÉTODO 2: Con GitHub (Para desarrolladores)

### **En la PC Original:**

```bash
1. Instala Git (si no lo tienes)
2. Abre terminal en: C:\xampp\htdocs\tennis-club\
3. Ejecuta:
   git init
   git add .
   git commit -m "Proyecto Tennis Club completo"
   git branch -M main
   git remote add origin [URL-de-tu-repo]
   git push -u origin main
```

### **En la PC Nueva:**

```bash
1. Instala XAMPP
2. Instala Git
3. Abre terminal en: C:\xampp\htdocs\
4. Ejecuta:
   git clone [URL-de-tu-repo] tennis-club
5. Abre: http://localhost/tennis-club/init-database.php
6. ¡Listo!
```

---

## 📋 CHECKLIST DE VERIFICACIÓN

### **En la PC Nueva, verifica que:**

```
□ XAMPP está instalado
□ Apache está en VERDE (iniciado)
□ MySQL está en VERDE (iniciado)
□ La carpeta existe en: C:\xampp\htdocs\tennis-club\
□ Ejecutaste: http://localhost/tennis-club/init-database.php
□ Puedes abrir: http://localhost/tennis-club/index.html
□ El login funciona: admin / 0000
□ Los productos aparecen en el catálogo
```

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### **Problema 1: "No se puede conectar al servidor"**

**Causa:** XAMPP no está ejecutándose

**Solución:**
```
1. Abre Panel de Control de XAMPP
2. Clic en "Start" junto a Apache
3. Clic en "Start" junto a MySQL
4. Espera que ambos estén en VERDE
```

---

### **Problema 2: "404 Not Found"**

**Causa:** La carpeta no está en el lugar correcto

**Solución:**
```
Verifica la ruta:
✅ Correcto: C:\xampp\htdocs\tennis-club\
❌ Incorrecto: C:\Users\[tu-usuario]\tennis-club\
```

---

### **Problema 3: "Base de datos no existe"**

**Causa:** No ejecutaste init-database.php

**Solución:**
```
1. Ve a: http://localhost/tennis-club/init-database.php
2. Espera que termine
3. Recarga la página del proyecto
```

---

### **Problema 4: "Puerto 80 ya está en uso"**

**Causa:** Otro programa usa el puerto 80 (Skype, IIS, etc.)

**Solución A: Cerrar el otro programa**
```
1. Cierra Skype o el programa que use el puerto
2. Reinicia Apache en XAMPP
```

**Solución B: Cambiar puerto de Apache**
```
1. En XAMPP, clic en "Config" junto a Apache
2. Selecciona "httpd.conf"
3. Busca: Listen 80
4. Cámbialo por: Listen 8080
5. Guarda
6. Reinicia Apache
7. Ahora usa: http://localhost:8080/tennis-club/
```

---

### **Problema 5: "Failed to fetch"**

**Causa:** Estás abriendo el archivo directamente (file://)

**Solución:**
```
❌ NO hagas doble clic en index.html
✅ Usa: http://localhost/tennis-club/index.html
```

---

## 📦 ESTRUCTURA DE ARCHIVOS A COPIAR

Asegúrate de copiar TODO esto:

```
tennis-club/
├── api/                    ← IMPORTANTE
│   ├── auth.php
│   ├── users.php
│   ├── products.php
│   ├── purchases.php
│   └── inquiries.php
├── js/                     ← IMPORTANTE
│   └── database.js
├── index.html              ← IMPORTANTE
├── login.html              ← IMPORTANTE
├── register.html           ← IMPORTANTE
├── user-profile.html       ← IMPORTANTE
├── admin-panel.html        ← IMPORTANTE
├── script.js               ← IMPORTANTE
├── login-script.js         ← IMPORTANTE
├── register-script-database.js  ← IMPORTANTE
├── profile-script.js       ← IMPORTANTE
├── admin-panel.js          ← IMPORTANTE
├── styles.css              ← IMPORTANTE
├── login-styles.css        ← IMPORTANTE
├── database-config.php     ← IMPORTANTE
├── init-database.php       ← IMPORTANTE
├── update-products.php     
├── README.md               
├── EXPLICACION-CODIGO.md   
└── ... otros archivos
```

**ARCHIVOS CRÍTICOS (no pueden faltar):**
- ✅ Carpeta `api/` completa
- ✅ Carpeta `js/` completa
- ✅ Todos los archivos .html
- ✅ Todos los archivos .js
- ✅ Todos los archivos .css
- ✅ `database-config.php`
- ✅ `init-database.php`

---

## 🎯 RESUMEN RÁPIDO

### **3 PASOS SIMPLES:**

```
1. PC ORIGINAL:
   - Copia carpeta "tennis-club" a USB

2. PC NUEVA:
   - Instala XAMPP
   - Pega carpeta en C:\xampp\htdocs\
   - Ejecuta: http://localhost/tennis-club/init-database.php

3. ¡LISTO!
   - Abre: http://localhost/tennis-club/index.html
```

---

## ⚠️ IMPORTANTE: Node.js NO ES NECESARIO

Si alguien te dice que necesitas Node.js para este proyecto, **está equivocado**.

### **Este proyecto usa:**
- ✅ PHP (incluido en XAMPP)
- ✅ MySQL (incluido en XAMPP)
- ✅ Apache (incluido en XAMPP)
- ✅ HTML, CSS, JavaScript (nativos del navegador)

### **Este proyecto NO usa:**
- ❌ Node.js
- ❌ npm
- ❌ Express
- ❌ React, Vue, Angular

### **¿Por qué funcionó con Node.js en tu otra PC?**

Posibles razones:
1. **Coincidencia:** Instalaste Node.js, pero no era necesario
2. **XAMPP estaba instalado:** Y no te diste cuenta
3. **Instalaste algo más:** Junto con Node.js (como PHP)

**La realidad:** Solo necesitas XAMPP. Node.js no hace nada en este proyecto.

---

## 📞 SOPORTE

Si algo no funciona en la PC nueva:

1. ✅ Verifica que XAMPP esté ejecutándose
2. ✅ Verifica la ruta: C:\xampp\htdocs\tennis-club\
3. ✅ Ejecuta: http://localhost/tennis-club/init-database.php
4. ✅ Usa: http://localhost/ (NO file://)

---

## 💾 BACKUP RECOMENDADO

### **Qué guardar siempre:**

1. **Carpeta del proyecto:**
   ```
   C:\xampp\htdocs\tennis-club\
   ```

2. **Base de datos (SQL):**
   ```
   Exportar desde phpMyAdmin → tennis_club_db.sql
   ```

### **Dónde guardarlo:**

- ✅ USB o disco externo
- ✅ Google Drive / OneDrive / Dropbox
- ✅ GitHub (privado)
- ✅ Múltiples ubicaciones (redundancia)

---

**FIN DE LA GUÍA**

Con estos pasos, tu proyecto funcionará en cualquier PC con XAMPP.
¡No necesitas Node.js para nada!

