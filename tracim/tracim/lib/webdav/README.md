## What is webdav ?

Webdav's a extension of the HTTP protocol that introduces new requests (MKCOL, PROPFIND...) to ease the
management of files on a distant server. More information can be found [here](https://tools.ietf.org/html/rfc4918).

This project is based on the project [WSGIDav](https://github.com/mar10/wsgidav), which is an implementation of webdav in python that
provides all basic needs to install a webdav on your server. This library intends to adapt WSGIDav implementation
with the database based file management of Tracim, allowing users to access and modify files through their
Window's file system.

## Behavior to know about Windows' client and Webdav

There are behaviors you may observe while using the windows' client for webdav which differ from other clients.

* Window's will send twice each request. The first one as Anonymous, which will get a 401 Not Authorized, and then
the second authentified which will proceed normally. This is the correct behavior that you have to observe for every webdav's client.
In fact when sending
The thing is that you'll observe only one request for clients like Debian's default filesystem because they cache the first response
they got when sending an Anonymous request and they know that they have to send an authentication, thus they don't waste time sending
twice the request.

* When uploading new documents, windows will call twice put if the files does not exist. The first one with a length of 0 so that the resources
can be locked before sending the whole file.

* To display names, Windows won't use the displayName property but the object's path. Thus even if /a/b/c can link to a file named 'readme.txt' with
   other webdav's client, you'll need to have a path named '/a/b/readme.txt' with Windows' client.

## Known issues

As for now, there's still some flaws or unexpected behaviors in the webdav implementation when using Windows' client.
Though we could - and may - use github's issues to report them, we'll first write them down here to not pollute the
original reports on tracim's _normal use_.

* When moving files or folders from webdav to webdav, windows will warn you that this action may harm your computer. Though it won't say anything
when moving files from your computer to webdav or vice-versa.

* When deleting folders, Windows will go through all sub-folders and files recursively and request to delete them itself before going back to the main
target. In our case it means it'll delete all sub-contents in database when we only want the parent to be in _deleted state_.
Plus as a folder is _never empty_ (always contains .deleted and .archived) it won't even delete the folder because it'll first check if the target
isn't empty before sending the final delete request.

* Lock/unlock system is currently broken, thus it's not possible to work with office as it'll lock both the document and its temporary files and
will be unable to unlock afterward, making it impossible to update them and making windows make a lot of unwanted request because the first failed.
**Imma gonna correct it asap**.

## Improving performances

All request aren't still optimal and may take longer than what we want or expect. Here will be some tracks that will ease
code refactoring to improve performances.