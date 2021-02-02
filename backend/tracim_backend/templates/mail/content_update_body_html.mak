<!DOCTYPE html>
<html lang="${lang}">
<body>
    <%
        # FIXME - G.M - 2019-05-09 - After discuss with Damien: dont add intelligent code in template,
        # see issue #1691
        call_to_action_url = content_in_context.frontend_url
        content_name_pattern = "<i><a href={call_to_action_url}>{content}</a></i>"
        content_name = content_name_pattern.format(
                    call_to_action_url=html_escape(call_to_action_url),
                    content=html_escape(content_in_context.label)
         )
        if action == ActionDescription.COMMENT:
          call_to_action_url = parent_in_context.frontend_url
    %>
<style>
  ins { background-color: #c0ffc0; }
  del { background-color: #ffc0c0; }
</style>

<%block>
    %if action == ActionDescription.COMMENT:
        <%
            call_to_action_url = parent_in_context.frontend_url
        %>
        <div>
            ${content_in_context.raw_content| n}
        </div>
    %elif action == ActionDescription.STATUS_UPDATE:
        <p>
            ${_( "I modified the status of {content_name}. The new status is <i>{new_status}</i>" ).format(content_name=content_name, new_status=html_escape(new_status))| n}
        </p>
    %elif action == ActionDescription.CREATION:
        <p>
            ${_("I added an item entitled {content_name}.").format(
                content_name=content_name
            )| n }
        </p>
    %elif action in (ActionDescription.REVISION, ActionDescription.EDITION):
        <p>
            ${_("I updated {content_name}.").format(content_name=content_name)|n}
        </p>
        <%
            title_diff = htmldiff(html_escape(previous_revision.label), html_escape(content_in_context.label))
            content_diff = htmldiff(previous_revision.raw_content, content_in_context.raw_content)
        %>
        %if title_diff or content_diff:
            <p>${_("Here is an overview of the changes:")}</p>
            <br/>
            <div style="border-left: 1em solid #ccc; padding-left: 0.5em;">
                <br/>
                <b>${title_diff| n}</b>
                ${content_diff| n}
            </div>
        %endif
    %endif
</%block>
<pre>
--
% if config.EMAIL__REPLY__ACTIVATED:
    ${_('Reply to this email directly or <a href="{call_to_action_url}">view it on tracim</a>').format(call_to_action_url=html_escape(call_to_action_url))|n}
% else:
    ${_('<a href="{call_to_action_url}">view it on tracim</a>').format(call_to_action_url=html_escape(call_to_action_url))|n}
%endif
    ${_("You're receiving this email because of your account on {website_title}.").format(website_title=config.WEBSITE__TITLE)}
    ${_("If you'd like to receive fewer emails, you can <a href=\"{website_title}/ui/account\">unsubscribe from notifications</a>.").format(website_title=html_escape(config.WEBSITE__BASE_URL))|n}
</pre>
</body>
</html>
