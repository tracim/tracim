<p>${_('Hello,')}</p>
<p>${_('{username} shared a file with you:').format(username=emitter.display_name)}</p>
<a href="${content_share.url}" id='call-to-action-button'>${shared_content.file_name}</a>

%if share_password_enabled:
    <p>${_("This content is protected by password, please contact {username} to get password.").format(username=emitter.display_name)}</p>
%else:
        <p>${_("Note: you can also use the direct link: {direct_url}").format(direct_url=content_share.direct_url)}<p>
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
