FROM node:8.7
RUN apt-get update -y
RUN apt-get install -y make g++ pkg-config
RUN apt-get install -y libgd-dev
COPY package.json ./
RUN npm i
COPY Makefile ./
COPY . .
CMD node bobot.js
