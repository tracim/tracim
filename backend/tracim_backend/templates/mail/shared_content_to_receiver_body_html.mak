%if receiver.username:
    <p>${_('Hello {username},').format(username=receiver.username)}</p>
%else:
    <p>${_('Hello,')}</p>
%endif
<p>${_('I share a file with you.')}</p>
<p>${_('You can download this file here:')}</p>

<p>${_('<a href="{url}" id="call-to-action-button">{filename}</a> ({file_size})').format(
   url=html_escape(content_share.url),
   filename=html_escape(shared_content.filename),
   file_size=html_escape(humanize.naturalsize(shared_content.size))
)|n}</p>

%if share_password_enabled:
    <p>${_('This file is protected by a password, please contact me (<a href="mailto:{emitter_email}">{username}</a>) to get the password.').format(emitter_email=html_escape(emitter.email),username=html_escape(emitter.display_name))|n}</p>
    <p>${_("Note: You can also use this link: {url}").format(url=content_share.url)}<p>
%else:
    <p>${_("Note: You can also use this direct link: {direct_url}").format(direct_url=content_share.direct_url)}<p>
%endif

<p>${_("Thanks a lot")}</p>
<p>${_("{username} (through tracim)").format(username=emitter.display_name)}</p>


<pre>
--
${config.WEBSITE__TITLE}
<a href="${config.WEBSITE__BASE_URL}">${config.WEBSITE__BASE_URL}</a>
${_("powered by tracim software")} - <a href="https://www.tracim.fr">https://www.tracim.fr</a>
</pre>
