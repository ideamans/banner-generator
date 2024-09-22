#!/bin/bash

LOCAL_IMAGE=banner-generator
VERSION=$(cat package.json | jq -r .version)
DOCKERHUB_IMAGE=${DOCKERHUB_IMAGE:-"ideamans/banner-generator"}

docker build -t $LOCAL_IMAGE .

for TAG in $VERSION latest; do
  docker tag $LOCAL_IMAGE $DOCKERHUB_IMAGE:$TAG
  docker push $DOCKERHUB_IMAGE:$TAG
done
