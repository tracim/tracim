<!DOCTYPE html>
<html lang="${lang}">
<body>
<p>${_('Hello {username},').format(username=emitter.display_name)}</p>
<p>${_('You have invited {nb_receivers} people to upload files in this space <a href={sharedspace_url}>{sharedspace_name}</a>:').format(sharedspace_name=html_escape(workspace.label), sharedspace_url=html_escape(workspace.frontend_url), nb_receivers=html_escape(len(upload_permission_receivers)))|n}</p>
<ul>
% for upload_permission in upload_permission_receivers:
<li>${_('<i><a href="{email_link}">{email}</a></i> at this link: <a href="{url}">{url}</a>').format(email=html_escape(upload_permission.email_user.email_address), email_link=html_escape(upload_permission.email_user.email_link), url=html_escape(upload_permission.url))| n}</li>
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
</body>
</html>
