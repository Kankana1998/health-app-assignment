FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Environment variables must be present at build time for Next.js if they are public
ENV NEXT_PUBLIC_API_URL=http://localhost:5000/api
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
