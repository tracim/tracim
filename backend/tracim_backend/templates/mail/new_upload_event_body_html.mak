<p>${_('Hello,')}</p>
<p>${_('{username} shared some files with you in  sharespace {workspace_name}:').format(username=uploader_username, workspace_name=workspace.label)}</p>

% for uploaded_content in uploaded_contents:
<li>${_('[{filename}]: {url}'.format(filename=uploaded_content.filename, url=uploaded_content.frontend_url))}</li>
% endfor


<p>${_("Enjoy your day :)")}</p>
<p>${_("Suricat', your digital assistant")}</p>

<pre>
--
${_("Suricat', the bot")}
${config.WEBSITE__TITLE}
<a href="${config.WEBSITE__BASE_URL}">${config.WEBSITE__BASE_URL}</a>
${_("powered by tracim software")} - <a href="https://www.tracim.fr">https://www.tracim.fr</a>
</pre>
