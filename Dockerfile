################## Builder Stage ##################
FROM node:20-alpine AS builder
 # Set the working directory in the container
WORKDIR /app
 # Copy the package.json file and install the dependencies
COPY package.json ./
COPY ca.pem ./
RUN npm install
COPY . .
RUN npm run build 

################## Production Stage ##################
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY ca.pem ./
COPY --from=builder /app/dist ./dist
COPY .env.production ./dist/.env.production
EXPOSE 3000
CMD ["node", "dist/main.js"]