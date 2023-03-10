# Setup Tracim with min.io encrypted file storage

This guide explains the steps needed to store tracim files in a min.io server with server-side encryption of the files.

The steps are kept minimal and the resulting configuration is not necessarily adapted to your production use-case (for instance sqlite is configured as the database and the encryption master key is directly written in a file).

## Needed tools

Make sure you have:

- the minio client, `mc` available ([Installation instructions](https://docs.min.io/docs/minio-client-quickstart-guide.html))
  - can be used with docker image
- the `kes` binary available ([Installation instructions](https://github.com/minio/kes/#install))
  - Example for amd64:
```
wget https://github.com/minio/kes/releases/latest/download/kes-linux-amd64
chmod +x kes-linux-amd64
```
- `openssl` utilities to generate the needed key (`openssl` package in Debian >= 1.1.1).

This guide uses a docker compose and some configuration available in [tools_docker/minio-encryption](../../tools_docker/minio-encryption).

## General principle

This guide setups 3 services:

- a Tracim backend
- a simple min.io instance where files will be stored
- a kes instance where the encryption master keys will be stored

The encrypted files will be written in the `files` directory on the docker host.

You should properly backup the `kes-config/keys` directory as it will contain the encryption master key. If you lose it you'll also lose all files uploaded to Tracim.

## Instructions

**All the commands should be executed from the `tools_docker/minio-encryption` directory.**

Choose an access and secret key for authenticating Tracim with min.io then write them in a `.env` file next to the `docker-compose.yml` file:

```
MINIO_ACCESS_KEY=<minio_access_key>
MINIO_SECRET_KEY=<minio_secret_key>
```

Generate a TLS key/certificate as the min.io connection to `kes` must be TLS based:

```
openssl ecparam -genkey -name prime256v1 | openssl ec -out kes-config/kes.key
```

Create a self-signed certificate:

```
openssl req -new -x509 -days 30 -key kes-config/kes.key -out kes-config/kes.cert -subj "/C=/ST=/L=/O=/CN=kes" -addext "subjectAltName = DNS:kes"
cp kes-config/kes.cert minio-config/certs/CAs/
```

Create an identity key/certificate for authenticating min.io with kes:

```
cd minio-config
kes-linux-amd64 tool identity new minio
```

Display the generated identity:

```
kes-linux-amd64 tool identity of public.cert
cd -
```

And add it to the `.env` file:

```
MINIO_IDENTITY=<minio_identity_as_displayed>
```

Your `.env` file should now have 3 lines:

```
MINIO_ACCESS_KEY=<minio_access_key>
MINIO_SECRET_KEY=<minio_secret_key>
MINIO_IDENTITY=<minio_identity_as_displayed>
```

Now start the docker-compose file:

```
docker-compose up -d
```

Configure the `mc` client to access the minio instance:

```
mc alias set myminio http://localhost:9000 <minio_access_key> <minio_secret_key>
```

- If you use `mc` with docker:

```
docker run -d --entrypoint=/bin/sh minio/mc
docker exec -it <container_id> /bin/bash
```

- You can now execute all necessary `mc` command.

```
mc alias set myminio http://<ip_address_minio_server>:9000 <minio_access_key> <minio_secret_key>
```

Create the encryption master key:

```
mc admin kms key create myminio minio
```

And enable encryption for the `tracim` bucket:

```
mc encrypt set sse-s3 myminio/tracim/
```

**You are done!**

### Tips

- Check list of all alias

```
mc alias list
```

- Check if sse-s3 is enabled on selected bucket

```
mc encrypt info myminio/<bucket-name>
```
