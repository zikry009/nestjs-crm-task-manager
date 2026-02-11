################## Builder Stage ##################
FROM node:20-alpine AS builder
 # Set the working directory in the container
WORKDIR /app
 # Copy the package.json file and install the dependencies
COPY package.json ./
# Copy the ca.pem file from the root directory for the production environment
COPY ca.pem ./
RUN npm install
COPY . .
RUN npm run build 

################## Production Stage ##################
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
# Copy the ca.pem file from the root directory for the production environment
COPY ca.pem ./
COPY --from=builder /app/dist ./dist
# Copy the .env.production file from the root directory for the production environment
COPY .env.production ./dist/.env.production
EXPOSE 3000
CMD ["node", "dist/main.js"]