FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Set internal Docker DNS for Next.js proxy rewrite
ENV BACKEND_URL=http://backend:5000
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
