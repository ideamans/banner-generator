FROM node:22

ADD . /app
WORKDIR /app

RUN yarn install \
    && yarn test

CMD ["yarn", "server"]
