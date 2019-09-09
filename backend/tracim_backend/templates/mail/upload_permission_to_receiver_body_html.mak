%if receiver.username:
    <p>${_('Hello {username},').format(username=receiver.username)}</p>
%else:
    <p>${_('Hello,')}</p>
%endif
<p>${_( 'I invited you to upload files here:')|n}</p>
<a href="${upload_permission.url}" id='call-to-action-button'>${_('Upload files')}</a>

%if upload_permission_password_enabled:
    <p>${_('This upload is protected by a password, please contact me (<a href="mailto:{emitter_email}">{username}</a>) to get the password.').format(emitter_email=html_escape(emitter.email),username=html_escape(emitter.display_name))|n}</p>
%endif

<p>${_("Note: You can also use this link: {url}").format(url=upload_permission.url)}<p>

<p>${_("Thanks a lot")}</p>
<p>${_("{username} (through tracim)").format(username=emitter.display_name)}</p>


<pre>
--
${config.WEBSITE__TITLE}
<a href="${config.WEBSITE__BASE_URL}">${config.WEBSITE__BASE_URL}</a>
${_("powered by tracim software")} - <a href="https://www.tracim.fr">https://www.tracim.fr</a>
</pre>
