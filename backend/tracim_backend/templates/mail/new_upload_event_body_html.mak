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

<p style="font-size: 0.8em; color: #5e5c64">
  --<br/>
  ${_("You are receiving this email because you have an account on {website_title}.").format(website_title=config.WEBSITE__TITLE)}<br />
  ${_('You can change this setting by going to the "My Spaces" menu through this link:')}
  <a href="${config.WEBSITE__BASE_URL}/ui/account">${config.WEBSITE__BASE_URL}/ui/account</a>.<br/>
  ${_("This e-mail was automatically generated by the")} <a href="https://www.tracim.fr">Tracim software</a> ${_("that powers {website_title}, please do not reply.").format(website_title=config.WEBSITE__TITLE)}
</p>
</body>
</html>
