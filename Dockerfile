FROM node:24-alpine

# Create user and group with specific UID/GID
RUN addgroup -g 1007 chat-owner && \
    adduser -D -u 1007 -G chat-owner chat-owner

WORKDIR /app

# Change ownership of the working directory
RUN chown -R chat-owner:chat-owner /app

COPY package.json ./

RUN npm install --omit=dev

COPY . .

# Ensure all files are owned by the chat-owner user
RUN chown -R chat-owner:chat-owner /app

EXPOSE 3000

USER chat-owner

CMD ["npm", "start"]
