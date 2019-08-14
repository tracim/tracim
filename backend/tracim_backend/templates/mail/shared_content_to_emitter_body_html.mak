<p>${_('Hello, {username}').format(username=emitter.display_name)}</p>
<p>${_('You share the file : {content_filename} with :'.format(content_filename=shared_content.file_name))}</p>
<ul>
% for content_share in content_share_receivers:
    <li>${_('<i>{email}</i>: <a href="{url}">{url}</a>').format(email=html_escape(content_share.email), url=html_escape(content_share.url))| n}</li>
% endfor
</ul>

%if share_password:
    <p>${_('This content is protected by password, password is "{share_password}"').format(share_password=share_password)}</p>
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
