// vite.config.mjs
import { fileURLToPath, URL } from 'node:url';
import { PrimeVueResolver } from 'file:///C:/Users/Daniel/Desktop/DesarrolloWeb/almazen_frontend/node_modules/@primevue/auto-import-resolver/index.mjs';
import vue from 'file:///C:/Users/Daniel/Desktop/DesarrolloWeb/almazen_frontend/node_modules/@vitejs/plugin-vue/dist/index.mjs';
import Components from 'file:///C:/Users/Daniel/Desktop/DesarrolloWeb/almazen_frontend/node_modules/unplugin-vue-components/dist/vite.js';
import { defineConfig } from 'file:///C:/Users/Daniel/Desktop/DesarrolloWeb/almazen_frontend/node_modules/vite/dist/node/index.js';
var __vite_injected_original_import_meta_url = 'file:///C:/Users/Daniel/Desktop/DesarrolloWeb/almazen_frontend/vite.config.mjs';
var vite_config_default = defineConfig({
    optimizeDeps: {
        include: ['dayjs', 'dayjs/plugin/utc', 'dayjs/plugin/calendar', 'dayjs/plugin/customParseFormat', 'dayjs/plugin/timezone', 'dayjs/plugin/duration', 'dayjs/plugin/relativeTime', 'exceljs', 'file-saver', 'dayjs/locale/es', 'jsbarcode'],
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubWpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcRGFuaWVsXFxcXERlc2t0b3BcXFxcRGVzYXJyb2xsb1dlYlxcXFxhbG1hemVuX2Zyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxEYW5pZWxcXFxcRGVza3RvcFxcXFxEZXNhcnJvbGxvV2ViXFxcXGFsbWF6ZW5fZnJvbnRlbmRcXFxcdml0ZS5jb25maWcubWpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9EYW5pZWwvRGVza3RvcC9EZXNhcnJvbGxvV2ViL2FsbWF6ZW5fZnJvbnRlbmQvdml0ZS5jb25maWcubWpzXCI7aW1wb3J0IHsgZmlsZVVSTFRvUGF0aCwgVVJMIH0gZnJvbSAnbm9kZTp1cmwnO1xyXG5cclxuaW1wb3J0IHsgUHJpbWVWdWVSZXNvbHZlciB9IGZyb20gJ0BwcmltZXZ1ZS9hdXRvLWltcG9ydC1yZXNvbHZlcic7XHJcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJztcclxuaW1wb3J0IENvbXBvbmVudHMgZnJvbSAndW5wbHVnaW4tdnVlLWNvbXBvbmVudHMvdml0ZSc7XHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICAgIG9wdGltaXplRGVwczoge1xyXG4gICAgICAgIGluY2x1ZGU6IFsnZGF5anMnLCAnZGF5anMvcGx1Z2luL3V0YycsICdkYXlqcy9wbHVnaW4vY2FsZW5kYXInLCAnZGF5anMvcGx1Z2luL2N1c3RvbVBhcnNlRm9ybWF0JywgJ2RheWpzL3BsdWdpbi90aW1lem9uZScsICdkYXlqcy9wbHVnaW4vZHVyYXRpb24nLCAnZGF5anMvcGx1Z2luL3JlbGF0aXZlVGltZScsICdleGNlbGpzJywgJ2ZpbGUtc2F2ZXInLCAnZGF5anMvbG9jYWxlL2VzJywgJ2pzYmFyY29kZSddLFxyXG5cclxuICAgICAgICBub0Rpc2NvdmVyeTogdHJ1ZVxyXG4gICAgfSxcclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAgICB2dWUoKSxcclxuICAgICAgICBDb21wb25lbnRzKHtcclxuICAgICAgICAgICAgcmVzb2x2ZXJzOiBbUHJpbWVWdWVSZXNvbHZlcigpXVxyXG4gICAgICAgIH0pXHJcbiAgICBdLFxyXG4gICAgc2VydmVyOiB7XHJcbiAgICAgICAgaG9zdDogJzAuMC4wLjAnLCAvLyBBY2VwdGEgY29uZXhpb25lcyBkZXNkZSBjdWFscXVpZXIgSVBcclxuICAgICAgICBwb3J0OiA1MTczIC8vIENhbWJpYSBlbCBwdWVydG8gc2kgZXMgbmVjZXNhcmlvXHJcbiAgICB9LFxyXG4gICAgcmVzb2x2ZToge1xyXG4gICAgICAgIGFsaWFzOiB7XHJcbiAgICAgICAgICAgICdAJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYycsIGltcG9ydC5tZXRhLnVybCkpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFrVyxTQUFTLGVBQWUsV0FBVztBQUVyWSxTQUFTLHdCQUF3QjtBQUNqQyxPQUFPLFNBQVM7QUFDaEIsT0FBTyxnQkFBZ0I7QUFDdkIsU0FBUyxvQkFBb0I7QUFMbU0sSUFBTSwyQ0FBMkM7QUFRalIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDeEIsY0FBYztBQUFBLElBQ1YsU0FBUyxDQUFDLFNBQVMsb0JBQW9CLHlCQUF5QixrQ0FBa0MseUJBQXlCLHlCQUF5Qiw2QkFBNkIsV0FBVyxjQUFjLG1CQUFtQixXQUFXO0FBQUEsSUFFeE8sYUFBYTtBQUFBLEVBQ2pCO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDTCxJQUFJO0FBQUEsSUFDSixXQUFXO0FBQUEsTUFDUCxXQUFXLENBQUMsaUJBQWlCLENBQUM7QUFBQSxJQUNsQyxDQUFDO0FBQUEsRUFDTDtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ0osTUFBTTtBQUFBO0FBQUEsSUFDTixNQUFNO0FBQUE7QUFBQSxFQUNWO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDTCxPQUFPO0FBQUEsTUFDSCxLQUFLLGNBQWMsSUFBSSxJQUFJLFNBQVMsd0NBQWUsQ0FBQztBQUFBLElBQ3hEO0FBQUEsRUFDSjtBQUNKLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
