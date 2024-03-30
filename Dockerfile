FROM haskell:9.4.8

WORKDIR /opt/todo-app

RUN cabal update

COPY ./todo-app.cabal /opt/todo-app/todo-app.cabal

RUN cabal build --only-dependencies -j4

COPY . /opt/todo-app
RUN cabal install

CMD ["todo-app"]

EXPOSE 8080