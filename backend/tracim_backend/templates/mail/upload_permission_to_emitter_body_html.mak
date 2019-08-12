<p>${_('Hello, {username}').format(username=emitter.display_name)}</p>
<p>${_('You give permission on workspace {workspace_name} with :'.format(workspace_name=workspace.label))}</p>
<ul>
% for upload_permission in upload_permission_receivers:
<li>${_('{email} : {url}'.format(email=upload_permission.email, url=upload_permission.url))}</li>
% endfor
</ul>

%if upload_permission_password:
    <p>${_('This content is protected by password, password is "{upload_permission_password}"').format(upload_permission_password=upload_permission_password)}</p>
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
