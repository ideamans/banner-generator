FROM node:22.23.4

ADD . /app
WORKDIR /app

RUN yarn install \
    && yarn test

CMD ["yarn", "server"]
