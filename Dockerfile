FROM node:14

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001

# Command to run the application
CMD ["node", "app.js"]
