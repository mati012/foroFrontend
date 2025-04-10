
FROM node:18 AS build
WORKDIR /app

# Copiar archivos de dependencias primero
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar todo el código fuente
COPY . .

# Construcción de la aplicación para producción con SSR
RUN npm run build -- --configuration=production

# Etapa 2: Servidor web con Nginx para SSR
FROM nginx:alpine

# Copiar configuración de Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar archivos construidos de Angular (notar la carpeta 'browser')
COPY --from=build /app/dist/foro/browser /usr/share/nginx/html

# Exponer puerto 80
EXPOSE 80

# Comando para iniciar nginx
CMD ["nginx", "-g", "daemon off;"]