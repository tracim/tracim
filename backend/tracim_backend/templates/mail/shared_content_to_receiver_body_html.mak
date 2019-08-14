<p>${_('Hello,')}</p>
<p>${_('I share a file with you.')}</p>
<p>${_('You can see it there: <a href="{url}" id="call-to-action-button">{filename}</a>').format(url=html_escape(content_share.url),filename=html_escape(shared_content.file_name))|n}</p>

%if share_password_enabled:
    <p>${_("This content is protected by password, please contact me ({username}) to get password.").format(username=emitter.display_name)}</p>
    <p>${_("Note: if the link does not work, please copy/paste the following one: {url}").format(url=content_share.url)}<p>
%else:
    <p>${_("Note: if the link does not work, you can copy/paste the following direct link: {direct_url}").format(direct_url=content_share.direct_url)}<p>
%endif

<p>${_("Thanks a lot")}</p>
<p>${_("{} (through tracim)".format(emitter.display_name))}</p>


<pre>
--
${config.WEBSITE__TITLE}
<a href="${config.WEBSITE__BASE_URL}">${config.WEBSITE__BASE_URL}</a>
${_("powered by tracim software")} - <a href="https://www.tracim.fr">https://www.tracim.fr</a>
</pre>
