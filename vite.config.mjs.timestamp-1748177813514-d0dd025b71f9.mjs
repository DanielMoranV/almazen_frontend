// vite.config.mjs
import { fileURLToPath, URL } from 'node:url';
import { PrimeVueResolver } from 'file:///C:/Users/Daniel/Desktop/DesarrolloWeb/almazen_frontend/node_modules/@primevue/auto-import-resolver/index.mjs';
import vue from 'file:///C:/Users/Daniel/Desktop/DesarrolloWeb/almazen_frontend/node_modules/@vitejs/plugin-vue/dist/index.mjs';
import Components from 'file:///C:/Users/Daniel/Desktop/DesarrolloWeb/almazen_frontend/node_modules/unplugin-vue-components/dist/vite.js';
import { defineConfig } from 'file:///C:/Users/Daniel/Desktop/DesarrolloWeb/almazen_frontend/node_modules/vite/dist/node/index.js';
var __vite_injected_original_import_meta_url = 'file:///C:/Users/Daniel/Desktop/DesarrolloWeb/almazen_frontend/vite.config.mjs';
var vite_config_default = defineConfig({
    optimizeDeps: {
        include: [
            'dayjs',
            'dayjs/plugin/utc',
            'dayjs/plugin/calendar',
            'dayjs/plugin/customParseFormat',
            'dayjs/plugin/timezone',
            'dayjs/plugin/duration',
            'dayjs/plugin/relativeTime',
            'exceljs',
            'file-saver',
            'dayjs/locale/es',
            'vue-barcode',
            '@chenfengyuan/vue-barcode'
        ],
        noDiscovery: true
    },
    plugins: [
        vue(),
        Components({
            resolvers: [PrimeVueResolver()]
        })
    ],
    server: {
        host: '0.0.0.0',
        // Acepta conexiones desde cualquier IP
        port: 5173
        // Cambia el puerto si es necesario
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', __vite_injected_original_import_meta_url))
        }
    }
});
export { vite_config_default as default };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubWpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcRGFuaWVsXFxcXERlc2t0b3BcXFxcRGVzYXJyb2xsb1dlYlxcXFxhbG1hemVuX2Zyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxEYW5pZWxcXFxcRGVza3RvcFxcXFxEZXNhcnJvbGxvV2ViXFxcXGFsbWF6ZW5fZnJvbnRlbmRcXFxcdml0ZS5jb25maWcubWpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9EYW5pZWwvRGVza3RvcC9EZXNhcnJvbGxvV2ViL2FsbWF6ZW5fZnJvbnRlbmQvdml0ZS5jb25maWcubWpzXCI7aW1wb3J0IHsgZmlsZVVSTFRvUGF0aCwgVVJMIH0gZnJvbSAnbm9kZTp1cmwnO1xyXG5cclxuaW1wb3J0IHsgUHJpbWVWdWVSZXNvbHZlciB9IGZyb20gJ0BwcmltZXZ1ZS9hdXRvLWltcG9ydC1yZXNvbHZlcic7XHJcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJztcclxuaW1wb3J0IENvbXBvbmVudHMgZnJvbSAndW5wbHVnaW4tdnVlLWNvbXBvbmVudHMvdml0ZSc7XHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICAgIG9wdGltaXplRGVwczoge1xyXG4gICAgICAgIGluY2x1ZGU6IFtcclxuICAgICAgICAgICAgJ2RheWpzJyxcclxuICAgICAgICAgICAgJ2RheWpzL3BsdWdpbi91dGMnLFxyXG4gICAgICAgICAgICAnZGF5anMvcGx1Z2luL2NhbGVuZGFyJyxcclxuICAgICAgICAgICAgJ2RheWpzL3BsdWdpbi9jdXN0b21QYXJzZUZvcm1hdCcsXHJcbiAgICAgICAgICAgICdkYXlqcy9wbHVnaW4vdGltZXpvbmUnLFxyXG4gICAgICAgICAgICAnZGF5anMvcGx1Z2luL2R1cmF0aW9uJyxcclxuICAgICAgICAgICAgJ2RheWpzL3BsdWdpbi9yZWxhdGl2ZVRpbWUnLFxyXG4gICAgICAgICAgICAnZXhjZWxqcycsXHJcbiAgICAgICAgICAgICdmaWxlLXNhdmVyJyxcclxuICAgICAgICAgICAgJ2RheWpzL2xvY2FsZS9lcycsXHJcbiAgICAgICAgICAgICd2dWUtYmFyY29kZScsXHJcbiAgICAgICAgICAgICdAY2hlbmZlbmd5dWFuL3Z1ZS1iYXJjb2RlJ1xyXG4gICAgICAgIF0sXHJcblxyXG4gICAgICAgIG5vRGlzY292ZXJ5OiB0cnVlXHJcbiAgICB9LFxyXG4gICAgcGx1Z2luczogW1xyXG4gICAgICAgIHZ1ZSgpLFxyXG4gICAgICAgIENvbXBvbmVudHMoe1xyXG4gICAgICAgICAgICByZXNvbHZlcnM6IFtQcmltZVZ1ZVJlc29sdmVyKCldXHJcbiAgICAgICAgfSlcclxuICAgIF0sXHJcbiAgICBzZXJ2ZXI6IHtcclxuICAgICAgICBob3N0OiAnMC4wLjAuMCcsIC8vIEFjZXB0YSBjb25leGlvbmVzIGRlc2RlIGN1YWxxdWllciBJUFxyXG4gICAgICAgIHBvcnQ6IDUxNzMgLy8gQ2FtYmlhIGVsIHB1ZXJ0byBzaSBlcyBuZWNlc2FyaW9cclxuICAgIH0sXHJcbiAgICByZXNvbHZlOiB7XHJcbiAgICAgICAgYWxpYXM6IHtcclxuICAgICAgICAgICAgJ0AnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjJywgaW1wb3J0Lm1ldGEudXJsKSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWtXLFNBQVMsZUFBZSxXQUFXO0FBRXJZLFNBQVMsd0JBQXdCO0FBQ2pDLE9BQU8sU0FBUztBQUNoQixPQUFPLGdCQUFnQjtBQUN2QixTQUFTLG9CQUFvQjtBQUxtTSxJQUFNLDJDQUEyQztBQVFqUixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUN4QixjQUFjO0FBQUEsSUFDVixTQUFTO0FBQUEsTUFDTDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDSjtBQUFBLElBRUEsYUFBYTtBQUFBLEVBQ2pCO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDTCxJQUFJO0FBQUEsSUFDSixXQUFXO0FBQUEsTUFDUCxXQUFXLENBQUMsaUJBQWlCLENBQUM7QUFBQSxJQUNsQyxDQUFDO0FBQUEsRUFDTDtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ0osTUFBTTtBQUFBO0FBQUEsSUFDTixNQUFNO0FBQUE7QUFBQSxFQUNWO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDTCxPQUFPO0FBQUEsTUFDSCxLQUFLLGNBQWMsSUFBSSxJQUFJLFNBQVMsd0NBQWUsQ0FBQztBQUFBLElBQ3hEO0FBQUEsRUFDSjtBQUNKLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
