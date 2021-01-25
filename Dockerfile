FROM node:latest

RUN mkdir -p /app

WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install

COPY . /app

RUN npm run build

ENV PORT=3000

EXPOSE 3000

CMD [ "npm", "start" ]
