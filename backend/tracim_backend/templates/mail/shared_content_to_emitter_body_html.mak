<!DOCTYPE html>
<html lang="${lang}">
<body>
<p>${_('Hello {username},').format(username=emitter.display_name)}</p>
<p>${_('You shared the file <i>{content_filename}</i> with:').format(content_filename=html_escape(shared_content.filename))|n}</p>
<ul>
% for content_share in content_share_receivers:
    <li>${_('<i><a href="{email_link}">{email}</a></i> at this link: <a href="{url}">{url}</a>').format(email=html_escape(content_share.email_user.email_address), email_link=html_escape(content_share.email_user.email_link), url=html_escape(content_share.url))| n}</li>
% endfor
</ul>

%if share_password:
    <p>${_('This file is protected by this password: "{share_password}"').format(share_password=share_password)}</p>
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
