### Start the API and PostgreSQL

From the repository root, run `docker compose up --build -d`.

The API is available at `http://localhost:4000`; GraphQL is served at `/graphql` and health checks at `/health`.

Compose starts PostgreSQL as `db`, waits for its health check, and passes the API a `DATABASE_URL` using that service name. The local server uses PostgreSQL; `DB_PATH` and SQLite files do not configure this data source.

### Deploying your application to the cloud

First, build your image, e.g.: `docker build -t myapp .`.
If your cloud uses a different CPU architecture than your development
machine (e.g., you are on a Mac M1 and your cloud provider is amd64),
you'll want to build the image for that platform, e.g.:
`docker build --platform=linux/amd64 -t myapp .`.

Then, push it to your registry, e.g. `docker push myregistry.com/myapp`.

Consult Docker's [getting started](https://docs.docker.com/go/get-started-sharing/)
docs for more detail on building and pushing.

### References
* [Docker's Node.js guide](https://docs.docker.com/language/nodejs/)
