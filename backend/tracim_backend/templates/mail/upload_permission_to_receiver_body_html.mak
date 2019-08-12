<p>${_('Hello,')}</p>
<p>${_('{username} allowed you to upload on sharespace {workspace_name}').format(username=emitter.display_name, workspace_name=workspace.label)}</p>
<a href="${upload_permission.url}" id='call-to-action-button'>${_('Upload file')}</a>

%if upload_permission_password_enabled:
    <p>${_("This permission is protected by password, please contact {username} to get password.").format(username=emitter.display_name)}</p>
%endif
<p>${_("Enjoy your day :)")}</p>
<p>${_("Suricat', your digital assistant")}</p>

<pre>
--
${_("Suricat', the bot")}
${config.WEBSITE__TITLE}
<a href="${config.WEBSITE__BASE_URL}">${config.WEBSITE__BASE_URL}</a>
${_("powered by tracim software")} - <a href="https://www.tracim.fr">https://www.tracim.fr</a>
</pre>
