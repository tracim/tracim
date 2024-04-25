<!DOCTYPE html>
<html lang="${lang}">
<body>
  <p>${_('Hello {username},').format(username=user.display_name)}</p>

  % if len(mentions) > 0:
    <p>${_('Here is the list of your unread mentions {email_notification_type_string}:').format(email_notification_type_string=email_notification_type_string)}</p>
    <ul>
    % for mention in mentions:
      % if mention.event.content["content_type"] == 'comment':
        <%
          type = "parent_label"
          content_to_display_id = "parent_id"
        %>
      % else:
        <%
          type = "label"
          content_to_display_id = "content_id"
        %>
      % endif

      <li>
        <% mention_link = config.WEBSITE__BASE_URL + "/ui/contents/" + str(mention.event.content[content_to_display_id]) %>
        ${_('{author} mentioned you in').format(author=mention.event.author["public_name"])}
        <a href="${mention_link}" target="_blank">${mention.event.content[type]} (${mention.event.workspace['label']})</a>
      </li>
    % endfor
    </ul>
  % endif

  % if len(notification_summary) > 0:
    <p>${_('Here is the summary of your unread notifications {email_notification_type_string}:').format(email_notification_type_string=email_notification_type_string)}</p>
    <ul>
    % for notification in notification_summary:
      <li>
        ${_('{event_count} activity in the space').format(event_count=notification[0])}
        <% notification_link = config.WEBSITE__BASE_URL + "/ui/workspaces/" + str(notification[1]) + "/dashboard" %>
        <a href="${notification_link}" target="_blank">${notification[2]}</a>
      </li>
    % endfor
    </ul>
  % endif

  <p>${_("Suricat', your digital assistant")}</p>
  <p>---</p>
  <p>
    ${_("You're receiving this email because of your account on {website_title}.").format(website_title=config.WEBSITE__TITLE)}<br />
    ${_('You can change this setting by going to the "My Spaces" menu through this link:')}
    <a href="${config.WEBSITE__BASE_URL}/ui/account">${config.WEBSITE__BASE_URL}/ui/account</a>
  </p>
  <p>
    ${_("This email is automatically created, please do not reply.")}
  </p>
  <pre>
    --
    ${_("Suricat', the bot")}
    ${config.WEBSITE__TITLE}
    <a href="${config.WEBSITE__BASE_URL}">${config.WEBSITE__BASE_URL}</a>
    ${_("powered by tracim software")} - <a href="https://www.tracim.fr">https://www.tracim.fr</a>
  </pre>
</body>
</html>
