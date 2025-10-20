# Use PostgreSQL 16 with pgvector preinstalled
FROM pgvector/pgvector:pg16

# (Optional) Set environment variables for Postgres
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres
ENV POSTGRES_DB=financeai

# Create data directory
RUN mkdir -p /var/lib/postgresql/data
RUN chown -R postgres:postgres /var/lib/postgresql

VOLUME ["/var/lib/postgresql/data"]

EXPOSE 5432

# Use the default entrypoint from postgres
