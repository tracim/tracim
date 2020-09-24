<!DOCTYPE html>
<html lang="${lang}">
<body>
<p>${_('Hello {username},').format(username=receiver.display_name)}</p>
<p>${_('{username} (<a href="{email_link}">{email}</a>) shared one or several files with you in this space: <a href={sharedspace_url}>{sharedspace_name}</a>').format(username=html_escape(uploader.username), sharedspace_name=html_escape(workspace.label), sharedspace_url=html_escape(workspace.frontend_url), email=html_escape(uploader.email_address), email_link=html_escape(uploader.email_link))|n}</p>

% for uploaded_content in uploaded_contents:
<li>${'<a href="{url}">{filename}</a> ({file_size})'.format(filename=html_escape(uploaded_content.filename), url=html_escape(uploaded_content.frontend_url), file_size=html_escape(humanize.naturalsize(uploaded_content.size)))|n}</li>
% endfor

%if uploader_message:
   <p>${_("Message:").format(username=uploader.username)}</p>
   <blockquote>${uploader_message}</blockquote>
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
