FROM docker.io/node:22-alpine

ENV HOST=0.0.0.0
ENV PORT=80

WORKDIR /app

RUN apk update && apk add curl

RUN addgroup --system livingroom && \
  adduser --system -G livingroom livingroom

COPY dist livingroom/
COPY package*.json livingroom/

RUN chown -R livingroom:livingroom .

# You can remove this install step if you build with `--bundle` option.
# The bundled output will include external dependencies.
RUN npm --prefix livingroom --omit=dev -f install

CMD [ "node", "livingroom" ]

EXPOSE 80
