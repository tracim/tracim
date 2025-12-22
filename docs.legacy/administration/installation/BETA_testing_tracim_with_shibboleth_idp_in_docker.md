# Shibboleth IDP test container
## ML - 2024-08-29 - BETA - This documentation is neither definitive or guaranteed to work properly

This container is a shibboleth SAML IdP designed to test SAML SPs (as tracim).

## Configuration

The Dockerfile is in [/tools_docker/shibboleth_idp/](/tools_docker/shibboleth_idp/)

Configuration is set at build time, to apply a new configuration the image must be re-built:
```sh
docker build --no-cache -t shibboleth-idp-test-image .
```

To add a SP to shibboleth's known SPs, add the following line at the end of `shibboleth-idp/conf/metadata-providers.xml` before the closing `</MetadataProvider>` tag:
```xml
    <MetadataProvider id="MY_ID" xsi:type="FileBackedHTTPMetadataProvider" backingFile="%{idp.home}/metadata/MY_ID.xml" metadataURL="URL_TO_SP_METADATA"/>
```
Then provide the SP's metadata in `shibboleth-idp/metadata/MY_ID.xml`.

## Usage

Make sure to have port 8080 available, then run the container:
```sh
docker run --rm -d --name="shibboleth-idp-test-container" --network=host shibboleth-idp-test-image
```

Shibboleth is now accessible at `http://localhost:8080`, and it's metadata URL (entityID) is `http://localhost:8080/idp/shibboleth`

## Caveats

For now shibboleth doesn't require encryption from the SP, this is not fit for production.

## Note

Some certificates are included in the shibboleth-idp folder. They are not used but here in order to fill
configuration because they are technically required (even if not used).
