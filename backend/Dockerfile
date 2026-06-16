#
# Backend Dockerfile (skeleton)
# -----------------------------
# This builds/runs the existing Express server in `backend/server.js`.
# No business logic changes are included.
#

FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy backend source
COPY . .

ENV NODE_ENV=production

# The existing server listens on PORT (default 5000 in server.js)
# For self-hosting we set PORT via docker-compose.
EXPOSE 3000

CMD ["node", "server.js"]

