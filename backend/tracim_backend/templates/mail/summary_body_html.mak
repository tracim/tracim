<!DOCTYPE html>
<html lang="${lang}">
<body>
<p>${_('Hello {username},').format(username=user.display_name)}</p>
% if len(mentions) > 0:
  <p>${_('Here is a list of your unread mentions:')}</p>
  <ul>
  % for mention in mentions:
    % if mention.event.content["content_type"] == 'comment':
      <%
        type = "parent_label"
      %>
    % else:
      <%
        type = "label"
      %>
    % endif
    <li>${_('{author} mentionned you in {file}').format(author=mention.event.author["public_name"], file=mention.event.content[type])}</li>
  % endfor
  </ul>
% endif
% if len(notification_summary) > 0:
  <p>${_('Here is a summary of your unread notifications:')}</p>
  <ul>
  % for t in notification_summary:
    <li>${_('{event_count} events in the space {space}').format(event_count=t[0], space=t[1])}</li>
  % endfor
  </ul>
% endif

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
