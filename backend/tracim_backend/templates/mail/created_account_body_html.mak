## -*- coding: utf-8 -*-
<p>${_('Hello {username},').format(username=user.display_name)}</p>

<p>${_('Someone invited you to join <i>{website_title}</i>.').format(website_title=config.WEBSITE_TITLE)}</p>

<p>${_('Your credentials are:')}</p>

<ul>
    <li>${_('login: {email_address}').format(email_address=user.email)}</li>
    <li>${_('password: {password}').format(password=password)}</li>
</ul>

<p>
    ${_('Let start to discuss, share files, agenda and documentation with collaborators by logging into your shared space: {a_link}').format(a_link='<a href="{url}">{url}</a>'.format(url=login_url))}
</p>
<p>${_("note: as soon as you are connected, we strongly recommend that you change your password and delete this email.")}</p>
<p>${_("Enjoy your day :)")}</p>
<p>${_("Suricat', your digital assistant")}</p>

<pre>
--
${_("Suricat', the bot")}
${config.WEBSITE_TITLE}
<a href="${config.WEBSITE_BASE_URL}">${config.WEBSITE_BASE_URL}</a>
${_("powered by tracim software")} - <a href="https://www.tracim.fr">https://www.tracim.fr</a>
</pre>
