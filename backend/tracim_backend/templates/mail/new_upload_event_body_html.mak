<p>${_('Hello,')}</p>
<p>${_('{username}(<a href="mailto:{email}">{email}</a>) shared one or several files with you in this shared space: <a href={sharedspace_url}>{sharedspace_name}</a>').format(username=html_escape(uploader_username), sharedspace_name=html_escape(workspace.label), sharedspace_url=html_escape(workspace.frontend_url), email=html_escape(uploader_email))|n}</p>

% for uploaded_content in uploaded_contents:
<li>${'<a href="{url}">{filename}</a> ({file_size})'.format(filename=html_escape(uploaded_content.filename), url=html_escape(uploaded_content.frontend_url), file_size=html_escape(uploaded_content.size))|n}</li>
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
