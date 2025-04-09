# Etapa 1: build de Angular
FROM node:18 AS build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build --configuration foro

# Etapa 2: servidor web (nginx)
FROM nginx:alpine
COPY --from=build /app/dist/foro /usr/share/nginx/html
EXPOSE 80
