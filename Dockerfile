FROM texlive/texlive:latest

WORKDIR /app

RUN curl -fsSL https://bun.com/install | bash

COPY Fredoka-Bold.ttf .
COPY Fredoka-Regular.ttf .
COPY package.json .
COPY bun.lock .
RUN ~/.bun/bin/bun i --production

COPY src ./src

CMD ["/root/.bun/bin/bun", "run", "src/server.ts"]