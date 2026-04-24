import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                index:     resolve(__dirname, 'index.html'),
                login:     resolve(__dirname, 'src/pages/auth/login/login.html'),
                registro:  resolve(__dirname, 'src/pages/auth/registro/registro.html'),
                storeHome: resolve(__dirname, 'src/pages/store/home/home.html'),
                storeCart: resolve(__dirname, 'src/pages/store/cart/cart.html'),
                admin:     resolve(__dirname, 'src/pages/admin/home/admin.html'),
            },
        },
    },
    base: './',
});
