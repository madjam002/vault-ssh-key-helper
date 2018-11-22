FROM node:10-alpine
ADD ./server /app
WORKDIR /app
ENV NODE_ENV production
ENTRYPOINT ["node", "."]
