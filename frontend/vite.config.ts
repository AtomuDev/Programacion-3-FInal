import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                index:           resolve(__dirname, 'index.html'),
                login:           resolve(__dirname, 'src/pages/auth/login/login.html'),
                register:        resolve(__dirname, 'src/pages/auth/register/register.html'),
                storeHome:       resolve(__dirname, 'src/pages/store/home/home.html'),
                storeCart:       resolve(__dirname, 'src/pages/store/cart/cart.html'),
                productDetail:   resolve(__dirname, 'src/pages/store/productDetail/productDetail.html'),
                clientOrders:    resolve(__dirname, 'src/pages/client/orders/orders.html'),
                admin:           resolve(__dirname, 'src/pages/admin/adminHome/adminHome.html'),
                adminCategories: resolve(__dirname, 'src/pages/admin/categories/categories.html'),
                adminProducts:   resolve(__dirname, 'src/pages/admin/products/products.html'),
                adminOrders:     resolve(__dirname, 'src/pages/admin/orders/orders.html'),
            },
        },
    },
    base: './',
});
