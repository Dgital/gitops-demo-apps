FROM docker.io/node:22-alpine

ENV HOST=0.0.0.0
ENV PORT=80

WORKDIR /app

RUN apk update && apk add curl

RUN addgroup --system kitchen && \
  adduser --system -G kitchen kitchen

COPY dist kitchen/
COPY package*.json kitchen/

RUN chown -R kitchen:kitchen .

# You can remove this install step if you build with `--bundle` option.
# The bundled output will include external dependencies.
RUN npm --prefix kitchen --omit=dev -f install

CMD [ "node", "kitchen" ]

EXPOSE 80
