FROM node:22.5.1-bookworm-slim
WORKDIR /frontend
COPY package*.json .
RUN npm install -g npm@10.8.2 && npm i && npm cache clean --force
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
