<p>${_('Hello {username},').format(username=emitter.display_name)}</p>
<p>${_('You allowed the upload in this shared space <a href={sharedspace_url}>{sharedspace_name}</a> with:').format(sharedspace_name=html_escape(workspace.label), sharedspace_url=html_escape(workspace.frontend_url))|n}</p>
<ul>
% for upload_permission in upload_permission_receivers:
<li>${_('<i><a href="mailto:{email}">{email}</a></i> at this link: <a href="{url}">{url}</a>').format(email=html_escape(upload_permission.email), url=html_escape(upload_permission.url))| n}</li>
% endfor
</ul>

%if upload_permission_password:
    <p>${_('This upload is protected by this password: "{upload_permission_password}"').format(upload_permission_password=upload_permission_password)}</p>
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
