FROM mcr.microsoft.com/playwright:v1.55.0-noble

WORKDIR /app

COPY package.json ./
RUN npm install

COPY server.js ./

EXPOSE 3001

CMD ["npm", "start"]