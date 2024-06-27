<!DOCTYPE html>
<html lang="${lang}">
<body>
  <p>${_('Hello {username},').format(username=user.display_name)}</p>

  % if len(mentions) > 0:
    <p>
      % if email_notification_type == hourly_email_notification_type:
        ${_('Here is the list of your unread mentions in the last hour:')}
      % elif email_notification_type == daily_email_notification_type:
        ${_('Here is the list of your unread mentions in the last day:')}
      % elif email_notification_type == weekly_email_notification_type:
        ${_('Here is the list of your unread mentions in the last week:')}
      % endif
    </p>
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
    <p>
      % if email_notification_type == hourly_email_notification_type:
        ${_('Here is the list of your unread notifications in the last hour:')}
      % elif email_notification_type == daily_email_notification_type:
        ${_('Here is the list of your unread notifications in the last day:')}
      % elif email_notification_type == weekly_email_notification_type:
        ${_('Here is the list of your unread notifications in the last week:')}
      % endif
    </p>
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

  <p style="font-size: 0.8em; color: #5e5c64">
    --<br/>
    ${_("You are receiving this email because you have an account on {website_title}.").format(website_title=config.WEBSITE__TITLE)}<br />
    ${_('You can change this setting by going to the "My Spaces" menu through this link:')}
    <a href="${config.WEBSITE__BASE_URL}/ui/account">${config.WEBSITE__BASE_URL}/ui/account</a>.<br/>
    ${_("This e-mail was automatically generated by the")} <a href="https://www.tracim.fr">Tracim software</a> ${_("that powers {website_title}, please do not reply.").format(website_title=config.WEBSITE__TITLE)}
  </p>
</body>
</html>
