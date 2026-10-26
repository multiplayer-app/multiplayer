FROM node:26.12.1 AS build
WORKDIR /usr/src/

COPY . .
RUN npm install

ENTRYPOINT ["npx", "migrate-mongo"]
CMD ["up"]
