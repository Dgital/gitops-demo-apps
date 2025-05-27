FROM docker.io/node:22-alpine

ENV HOST=0.0.0.0
ENV PORT=80

WORKDIR /app

RUN apk update && apk add curl busybox-extras

RUN addgroup --system home && \
    adduser --system -G home home

COPY dist home/
COPY package*.json home/

RUN chown -R home:home .

# You can remove this install step if you build with `--bundle` option.
# The bundled output will include external dependencies.
RUN npm --prefix home --omit=dev -f install

CMD [ "node", "home" ]
