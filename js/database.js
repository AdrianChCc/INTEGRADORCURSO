/**
 * ============================================================================
 * DATABASE.JS - CLASE PARA COMUNICACIÓN CON APIs
 * ============================================================================
 * 
 * PROPÓSITO:
 * Esta clase proporciona métodos JavaScript para comunicarse con las APIs PHP
 * del backend. Actúa como puente entre el frontend y la base de datos MySQL.
 * 
 * FUNCIONALIDAD PRINCIPAL:
 * - Hacer peticiones HTTP (GET, POST, PUT, DELETE) a las APIs PHP
 * - Convertir respuestas JSON a objetos JavaScript
 * - Manejar errores de red y servidor
 * - Proporcionar métodos sencillos para CRUD de todas las entidades
 * 
 * ENTIDADES MANEJADAS:
 * - Users (Usuarios)
 * - Products (Productos)
 * - Purchases (Compras)
 * - Inquiries (Consultas/Contacto)
 * 
 * USO:
 * La clase se instancia automáticamente al final del archivo como:
 * window.dbAPI = new DatabaseAPI();
 * 
 * Luego se puede usar en cualquier parte del código como:
 * await window.dbAPI.getProducts();
 * await window.dbAPI.createUser(userData);
 * await window.dbAPI.login(username, password);
 * 
 * ============================================================================
 */

console.log('🔄 database.js está cargando...');

// ============================================================================
// CLASE: DatabaseAPI
// ============================================================================
class DatabaseAPI {
    /**
     * Constructor - Inicializa la clase con la URL base de las APIs
     */
    constructor() {
        this.baseURL = 'api/';  // Carpeta donde están las APIs PHP
        console.log('✅ DatabaseAPI constructor ejecutado');
    }

    /**
     * -------------------------------------------------------------------------
     * MÉTODO GENÉRICO: request
     * -------------------------------------------------------------------------
     * Este método es la base de todas las peticiones HTTP a las APIs
     * 
     * @param {string} endpoint - El archivo PHP de la API (ej: 'users.php')
     * @param {object} options - Opciones de la petición (method, body, headers)
     * @returns {Promise} - Promesa que resuelve con los datos JSON
     */
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(this.baseURL + endpoint, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Authentication - Método especial que maneja errores de autenticación
    async login(username, password) {
        try {
            const response = await fetch(this.baseURL + 'auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    action: 'login',
                    username, 
                    password 
                })
            });

            const data = await response.json();
            
            // Retornar la respuesta tal cual (con success: true o error)
            return data;
        } catch (error) {
            console.error('Login request failed:', error);
            throw error;
        }
    }

    // Password Reset - Solicitar token de restablecimiento
    async requestPasswordReset(identifier) {
        try {
            const response = await fetch(this.baseURL + 'auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    action: 'request_password_reset',
                    identifier
                })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Password reset request failed:', error);
            throw error;
        }
    }

    // Password Reset - Restablecer contraseña con token
    async resetPassword(token, newPassword) {
        try {
            const response = await fetch(this.baseURL + 'auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    action: 'reset_password',
                    token,
                    new_password: newPassword
                })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Password reset failed:', error);
            throw error;
        }
    }

    // Users
    async getUsers() {
        return await this.request('users.php');
    }

    async getUser(id) {
        return await this.request(`users.php?id=${id}`);
    }

    async createUser(userData) {
        return await this.request('users.php', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async updateUser(id, userData) {
        return await this.request(`users.php?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    async deleteUser(id) {
        return await this.request(`users.php?id=${id}`, {
            method: 'DELETE'
        });
    }

    // Products
    async getProducts(category = null, active = null) {
        let url = 'products.php';
        const params = new URLSearchParams();
        
        if (category) params.append('category', category);
        if (active !== null) params.append('active', active);
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        return await this.request(url);
    }

    async getProduct(id) {
        return await this.request(`products.php?id=${id}`);
    }

    async createProduct(productData) {
        return await this.request('products.php', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    }

    async updateProduct(id, productData) {
        return await this.request(`products.php?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });
    }

    async deleteProduct(id) {
        return await this.request(`products.php?id=${id}`, {
            method: 'DELETE'
        });
    }

    // Purchases
    async getPurchases(userId = null, dateFrom = null, dateTo = null) {
        let url = 'purchases.php';
        const params = new URLSearchParams();
        
        if (userId) params.append('user_id', userId);
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        return await this.request(url);
    }

    async createPurchase(purchaseData) {
        return await this.request('purchases.php', {
            method: 'POST',
            body: JSON.stringify(purchaseData)
        });
    }

    // Inquiries
    async getInquiries(userId = null, status = null, serviceType = null) {
        let url = 'inquiries.php';
        const params = new URLSearchParams();
        
        if (userId) params.append('user_id', userId);
        if (status) params.append('status', status);
        if (serviceType) params.append('service_type', serviceType);
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        return await this.request(url);
    }

    async createInquiry(inquiryData) {
        return await this.request('inquiries.php', {
            method: 'POST',
            body: JSON.stringify(inquiryData)
        });
    }

    async updateInquiry(id, inquiryData) {
        return await this.request(`inquiries.php?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify(inquiryData)
        });
    }

    // Statistics
    async getStats() {
        try {
            const [users, products, purchases, inquiries] = await Promise.all([
                this.getUsers(),
                this.getProducts(),
                this.getPurchases(),
                this.getInquiries()
            ]);

            const totalRevenue = purchases.reduce((sum, purchase) => sum + parseFloat(purchase.total || 0), 0);

            return {
                totalUsers: users.length,
                totalProducts: products.length,
                totalPurchases: purchases.length,
                totalInquiries: inquiries.length,
                totalRevenue: totalRevenue
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            return {
                totalUsers: 0,
                totalProducts: 0,
                totalPurchases: 0,
                totalInquiries: 0,
                totalRevenue: 0
            };
        }
    }
}

// Create global instance
console.log('🔧 Creando instancia global de window.dbAPI...');
window.dbAPI = new DatabaseAPI();
console.log('✅ window.dbAPI creado:', window.dbAPI);
console.log('✅ database.js cargado completamente');

// Migration helper to move from localStorage to database
class DataMigration {
    static async migrateToDatabase() {
        try {
            // Migrate users
            const localUsers = JSON.parse(localStorage.getItem('tennisClubUsers')) || [];
            for (const user of localUsers) {
                if (user.username !== 'admin') { // Skip admin as it's already in DB
                    try {
                        await window.dbAPI.createUser({
                            full_name: user.fullName,
                            email: user.email,
                            phone: user.phone,
                            username: user.username,
                            password: user.password, // This should be hashed
                            role: user.role
                        });
                    } catch (error) {
                        console.warn('User migration failed for:', user.username, error);
                    }
                }
            }

            // Migrate purchases
            const localPurchases = JSON.parse(localStorage.getItem('tennisClubPurchases')) || [];
            for (const purchase of localPurchases) {
                try {
                    // You'll need to map product names to IDs
                    const products = await window.dbAPI.getProducts();
                    const product = products.find(p => p.name.toLowerCase().includes(purchase.product.toLowerCase()));
                    
                    if (product) {
                        await window.dbAPI.createPurchase({
                            user_id: 1, // You'll need to map usernames to user IDs
                            product_id: product.id,
                            quantity: purchase.quantity,
                            price: purchase.price
                        });
                    }
                } catch (error) {
                    console.warn('Purchase migration failed:', error);
                }
            }

            // Migrate inquiries
            const localInquiries = JSON.parse(localStorage.getItem('tennisClubInquiries')) || [];
            for (const inquiry of localInquiries) {
                try {
                    await window.dbAPI.createInquiry({
                        user_id: 1, // You'll need to map usernames to user IDs
                        service_type: inquiry.service,
                        message: inquiry.message || '',
                        status: inquiry.status || 'new'
                    });
                } catch (error) {
                    console.warn('Inquiry migration failed:', error);
                }
            }

            console.log('Data migration completed');
        } catch (error) {
            console.error('Data migration failed:', error);
        }
    }
}

// Auto-migrate on page load (optional)
// DataMigration.migrateToDatabase();

