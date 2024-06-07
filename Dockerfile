FROM node:20
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
ENV PORT=8000
CMD ["npm", "start"]
EXPOSE 8000