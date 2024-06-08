FROM node:20-buster

WORKDIR /app

COPY package* .
RUN npm install 

COPY . . 

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "run", "start"]