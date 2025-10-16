FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci && npm cache clean --force

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
