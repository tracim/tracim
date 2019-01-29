## -*- coding: utf-8 -*-
<p>${_('Hello {username},').format(username=user.display_name)}</p>

<p>${_('Someone has requested to reset the password for your account on <i>{website_title}</i>.').format(website_title=config.WEBSITE_TITLE)}</p>

<p>${_('If you did not perform this request, you can safely ignore this email.')}</p>

<p>
  ${_('In order to reset your password, please click on following link :')}
  <a href="${reset_password_url}" id='call-to-action-button'>${_('Reset my password')}</a>
  <br/>
  <i>${_('If the link is not working, I suggest to copy/paste the full url: ')}</i>
</p>
<pre>${reset_password_url}</pre>

<p>${_("Suricat', your digital assistant")}</p>

<pre>
--
${_("Suricat', the bot")}
${config.WEBSITE_TITLE}
<a href="${config.WEBSITE_BASE_URL}">${config.WEBSITE_BASE_URL}</a>
${_("powered by tracim software")} - <a href="https://www.tracim.fr">https://www.tracim.fr</a>
</pre>