FROM node:22 AS build
WORKDIR /usr/src/

COPY . .
RUN npm install

ENTRYPOINT ["npx", "migrate-mongo"]
CMD ["up"]
