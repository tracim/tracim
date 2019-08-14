<p>${_('Hello,')}</p>
<p>${_('{username}(<a href="mailto:{email}">{email}</a>) allowed you to upload file in this shared space (number: {workspace_id}):').format(username=html_escape(emitter.display_name), email=html_escape(emitter.email) ,workspace_id=html_escape(workspace.workspace_id))|n}</p>
<a href="${upload_permission.url}" id='call-to-action-button'>${_('Upload file')}</a>

%if upload_permission_password_enabled:
    <p>${_('This upload is protected by a password, please contact me (<a href="mailto:{emitter_email}">{username}</a>) to get the password.').format(emitter_email=html_escape(emitter.email),username=html_escape(emitter.display_name))|n}</p>
%endif

<p>${_("Note: You can also use this link: {url}").format(url=upload_permission.url)}<p>
<p>${_("Enjoy your day :)")}</p>
<p>${_("Suricat', your digital assistant")}</p>

<pre>
--
${_("Suricat', the bot")}
${config.WEBSITE__TITLE}
<a href="${config.WEBSITE__BASE_URL}">${config.WEBSITE__BASE_URL}</a>
${_("powered by tracim software")} - <a href="https://www.tracim.fr">https://www.tracim.fr</a>
</pre>
