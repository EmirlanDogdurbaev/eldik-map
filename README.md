# Eldik Map

### 1. Клонирование проекта

```bash
git clone https://github.com/EmirlanDogdurbaev/eldik-map.git

cd eldik-map
```

```
npm install
```
или
```
yarn install
```

# .env.example
```
YOUR_API_KEY="",
YOUR_AUTH_DOMAIN="",
YOUR_PROJECT_ID="",
YOUR_STORAGE_BUCKET="",
YOUR_SENDER_ID="",
YOUR_APP_ID="",
#measurementId: ""
REACT_APP_FIREBASE_VAPID_KEY=""

VITE_API_URL= ""
```

```
npm run dev
# или
yarn dev
```

Сборка проекта
```
npm run build
# или
yarn build
```


Запуск через Docker
1. Сборка Docker-образа
```
docker build -t eldik-map .

```

Убедись, что в корне проекта есть Dockerfile и nginx.conf.

2. Запуск контейнера
```
docker run -d -p 80:80 --name eldik-map-container eldik-map
```

## После запуска открой http://localhost в браузере.

```
docker stop eldik-map-container
 ```


Удалить контейнер:
```
docker rm eldik-map-container

```
Удалить образ:
```
docker rmi eldik-map

```

Посмотреть все контейнеры:
```
docker ps -a
```
📄 Файлы Docker
```
Dockerfile
```
```
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:stable-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

```

```
nginx.conf
nginx

server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

```