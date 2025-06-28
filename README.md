# chat - An extremely minimal chat
chat is an extremely minimalistic chat server with a web interface.

## Prerequisites
To run this chat server you need
- Docker
- Traefik
- Any unused domain or subdomain

## Installation
1. Create a file with the name ```.env``` inside the project root (the directory which contains ```compose.yaml``` and ```Dockerfile```).

2. Paste the following template into it and replace the values with your own:
```.env
CHAT_DOMAIN=chat.example.com
CHAT_PORT=3000
CHAT_SESSION_SECRET=my-super-secret-string
CHAT_AUTH_PW=my-super-secret-login-password
```

3. In ```compose.yaml``` make sure to use the correct architecture (either ```chat:latest-amd64``` or ```chat:latest-arm64```).

4. (Optional): Exchange the ```favicon.ico``` (inside the ```public/``` directory).

5. Run ```docker compose up -d```.

## Building from source
To build from source use the command ```docker compose -f compose.dev.yaml up --build```.
