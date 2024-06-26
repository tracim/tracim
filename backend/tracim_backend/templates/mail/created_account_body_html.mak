<!DOCTYPE html>
<html lang="${lang}">
<body>
<% a_link='<a href="{url}">{url}</a>'.format(url=html_escape(login_url)) %>
<p>${_('Hello {username},').format(username=user.display_name)}</p>

%if origin_user:
    <p>${_('{origin_user_name} invited you to join <i>{website_title}</i>.').format(origin_user_name=html_escape(origin_user.display_name), website_title=html_escape(config.WEBSITE__TITLE))| n}</p>
%else:
    <p>${_('Someone invited you to join <i>{website_title}</i>.').format(website_title=html_escape(config.WEBSITE__TITLE))| n}</p>
%endif

<p>${_('Your credentials are:')}</p>

<ul>
    <li>${_('login: {email_address}').format(email_address=user.email)}</li>
    <li>${_('password: {password}').format(password=password)}</li>
</ul>

<p>
    ${_('Let start to discuss, share files, agenda and documentation with collaborators by logging into your space: {a_link}').format(a_link=a_link)| n}
</p>
<p>${_("note: as soon as you are connected, we strongly recommend that you change your password and delete this email.")}</p>
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
