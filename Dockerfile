FROM node:10-stretch
WORKDIR /app
ADD ./server /app
RUN yarn

FROM node:10-alpine
WORKDIR /app
COPY --from=0 /app .
ENV NODE_ENV production
ENTRYPOINT ["node", "."]
