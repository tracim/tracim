# Using the Tracim API

Tracim is based on a REST/JSON api; 100% of the features should be available through the REST API.

The API documentation is available on your running server at: `(tracim_backend_url)/api/v2/doc/`

For example, if you run Tracim locally with the default configuration, you can visit `http://localhost:6543/api/v2/doc/`

Here, we explain two general topics of the API: authentication and error reporting.

Note: most of these endpoints require to be authenticated.

## Authentication

There are several authentication mechanisms in Tracim, as you can see in the [setting documentation](setting.md).
Each one is best suited for a specific usage:

- `Basic-Auth` if you want to communicate easily as a Tracim user.
- `Api-Key` if you are administrator and you want to create daemon, gateways between applications... note that you will get full access to Tracim data: be careful!
- `Cookie` if you work with a frontend (ui/) and don't want to store credentials for security reasons (use `/api/v2/auth/login` to log in).

Examples will be given based on the use of [httpie](https://httpie.org/).

## Who am I?

`/api/v2/auth/whoami` is a the endpoint to know if you are authenticated.

### Basic-Auth

You need to use your username/password like in standard basic auth. See [rfc7616](https://tools.ietf.org/html/rfc7617).

As a resume, the standard is to base64-encode username and password in `Authorization` header.

```
$ http -a admin@admin.admin:admin@admin.admin GET http://127.0.0.1:6543/api/v2/auth/whoami
HTTP/1.1 200 OK
Content-Length: 276
Content-Type: application/json
Date: Tue, 22 Jan 2019 11:26:53 GMT
Server: waitress
Set-Cookie:  session_key=22fd293b6d850faabc8e3f167bcfc804d8713deed03bc15e5029434687050fb809ef2076; expires=Mon, 22-Jan-2019 11:26:53 GMT; Path=/; SameSite=Lax

{
    "auth_type": "internal", 
    "avatar_url": null, 
    "created": "2019-01-18T13:07:02Z", 
    "email": "admin@admin.admin", 
    "is_active": true, 
    "is_deleted": false, 
    "lang": null, 
    "profile": "administrators", 
    "public_name": "Global manager", 
    "timezone": "", 
    "user_id": 1
}
```

### Api-Key

You need to set 2 custom headers: `Tracim-Api-Key` with a correct API key and `Tracim-Api-Login` with a valid user login.

The Api-Key will make the authentication/authorization while the Login will allow to exec a command "as a sudoer".

```
$ http GET http://127.0.0.1:6543/api/v2/auth/whoami Tracim-Api-Key:changethisnow! Tracim-Api-Login:admin@admin.admin
HTTP/1.1 200 OK
Content-Length: 276
Content-Type: application/json
Date: Tue, 22 Jan 2019 13:00:49 GMT
Server: waitress
Set-Cookie:  session_key=50307c9007fff16791f660eed14d47a33cf11eef365b3e0403ce42f5a8b8f1f12c254b58; expires=Mon, 22-Jan-2018 13:00:49 GMT; Path=/; SameSite=Lax

{
    "auth_type": "internal", 
    "avatar_url": null, 
    "created": "2019-01-18T13:07:02Z", 
    "email": "admin@admin.admin", 
    "is_active": true, 
    "is_deleted": false, 
    "lang": null, 
    "profile": "administrators", 
    "public_name": "Global manager", 
    "timezone": "", 
    "user_id": 1
}
```

### Login strategy to get Auth Cookie

You need to send a json with `email` and `password` fields:

```                                                                                                                                                                                                     
$ http POST http://127.0.0.1:6543/api/v2/auth/login email=admin@admin.admin password=admin@admin.admin
HTTP/1.1 200 OK
Content-Length: 276
Content-Type: application/json
Date: Tue, 22 Jan 2019 16:04:37 GMT
Server: waitress
Set-Cookie:  session_key=92504e7310aa6433b523405591a9785e056927dab15e49f7c3204aed88ccc35a70761638; expires=Tue, 29-Jan-2019 16:04:37 GMT; Path=/; SameSite=Lax

{
    "auth_type": "internal",
    "avatar_url": null,
    "created": "2019-01-18T13:07:02Z", 
    "email": "admin@admin.admin", 
    "is_active": true, 
    "is_deleted": false, 
    "lang": null, 
    "profile": "administrators", 
    "public_name": "Global manager", 
    "timezone": "", 
    "user_id": 1
}
```

Then you need to send cookie using `Cookie` header like any browser do in order to have a temporary access.

```
$ http GET http://127.0.0.1:6543/api/v2/auth/whoami Cookie:" session_key=92504e7310aa6433b523405591a9785e056927dab15e49f7c3204aed88ccc35a70761638"
HTTP/1.1 200 OK
Content-Length: 276
Content-Type: application/json
Date: Tue, 22 Jan 2019 16:05:38 GMT
Server: waitress
Set-Cookie:  session_key=978301c4058de0646a4c6acf55a2b28b102b297f590edf75ffec4295b34435d8bedd3cb7; expires=Tue, 29-Jan-2019 16:05:38 GMT; Path=/; SameSite=Lax

{
    "auth_type": "internal", 
    "avatar_url": null,
    "created": "2019-01-18T13:07:02Z", 
    "email": "admin@admin.admin", 
    "is_active": true, 
    "is_deleted": false, 
    "lang": null, 
    "profile": "administrators", 
    "public_name": "Global manager", 
    "timezone": "", 
    "user_id": 1
}
```

## Error management in the Api

The Tracim API returns explicit errors when fields are incorrectly filled:

```
$ http POST  http://127.0.0.1:6543/api/v2/auth/login
HTTP/1.1 400 Bad Request
Content-Length: 169
Content-Type: application/json
Date: Tue, 22 Jan 2019 12:47:52 GMT
Server: waitress

{
    "code": 2001, 
    "details": {
        "email": [
            "Missing data for required field."
        ], 
        "password": [
            "Missing data for required field."
        ]
    }, 
    "message": "Validation error of input data"
}
```

A detailed error code in given in field `code`, in addition to the more general HTTP error status for a more fine-grained error handling.

Look at [error.py](../tracim_backend/error.py) for more details.

Note: a specific endpoint about error cases code [will be added later](https://github.com/tracim/tracim/issues/1006).
 
