# Use a base image with Node.js
FROM node:16

# Set working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json
COPY package*.json ./

# Install dependencies (this will install react-icons too)
RUN npm install
RUN npm install react-icons
# Copy all the frontend code
COPY . .

# Expose the port (assuming you're running on port 3000)
EXPOSE 3000

# Start the React app
CMD ["npm", "start"]
