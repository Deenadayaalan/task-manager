FROM node:18-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY tsconfig.json webpack.config.js ./
COPY src ./src
RUN npm run build

FROM nginx:alpine
# Template with BACKEND_HOST env var (defaults to "backend" for docker-compose)
ENV BACKEND_HOST=backend
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY index.html /usr/share/nginx/html/
COPY css /usr/share/nginx/html/css/
COPY views /usr/share/nginx/html/views/
COPY --from=build /app/dist /usr/share/nginx/html/dist/
EXPOSE 80
