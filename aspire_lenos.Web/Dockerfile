# Dockerfile for aspire_lenos.Web (Vite + React production build)
# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# copy package files and install deps
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# copy sources and build
COPY . ./
RUN npm run build

# Production stage - serve with nginx
FROM nginx:stable-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
# Optional: include a basic nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
