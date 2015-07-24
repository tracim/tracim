<%namespace name="BUTTON" file="tracim.templates.widgets.button"/>
<%namespace name="ICON" file="tracim.templates.widgets.icon"/>
<%namespace name="SPAN" file="tracim.templates.widgets.span"/>

<%def name="USER_ROLE_IN_WORKSPACE(role, show_id=True, enable_link=None, disable_link=None)">
    <tr>
        % if show_id:
            <td class="text-right">${role.workspace.id}</td>
        % endif
        <td><a href="${tg.url('/admin/workspaces/{}').format(role.workspace.id)}">${role.workspace.name}</a></td>
        <td><span style="${role.style}"><i class="fa ${role.icon}"></i> ${role.label}</span></td>
        % if enable_link or disable_link:
            <td>${SPAN.NOTIFICATION_SUBSCRIBED(role.user, role.workspace, role.notifications_subscribed, enable_link, disable_link)}</td>
        % else:
            <td>${SPAN.NOTIFICATION_SUBSCRIBED(role.user, role.workspace, role.notifications_subscribed)}</td>
        % endif

    </tr>
</%def>

<%def name="SECURED_MEMBER_IN_WORKSPACE(current_user, workspace, member, role_types)">
    <tr>
        <td class="text-right">${member.id}</td>
        <td ><a href="${tg.url('/admin/users/{}'.format(member.id))}">${member.name}</a></td>
        <td>${BUTTON.SECURED_ROLE_SELECTOR(fake_api.current_user, result.workspace, member, fake_api.role_types)}</td>
        <td>${SPAN.NOTIFICATION_SUBSCRIBED(member, workspace, member.notifications_subscribed)}</td>
        <td><a title="${_('Remove this user from the current workspace')}" class="t-less-visible t-red-on-hover t-red btn btn-default btn-xs" href="${tg.url('/admin/workspaces/{}/roles/{}/delete'.format(result.workspace.id, member.id))}">${ICON.FA('fa-remove fa-fw')}</a></td>
    </tr>
</%def>

<%def name="CONTENT(content)">
    <tr class="t-table-row-${content.type.type}">
        <td>
            <span class="${content.type.color}"><i class="fa-fw ${content.type.icon}"></i> ${content.type.label}</span>

            ## <span class="tracim-less-visible"><i class="fa fa-file-text-o fa-tw"></i> ${content}</span>
        </td>
        <td>
            % if content.folder:
                <a href="${tg.url('/workspaces/{}/folders/{}/pages/{}'.format(content.workspace.id, content.folder.id, content.id))}">${content.label}</a>
            % else:
                <a href="${tg.url('/workspaces/{}/{}s/{}'.format(content.workspace.id, content.type.id, content.id))}">${content.label}</a>
            % endif
        </td>
        % if 'folder' == content.type.id:
            <td class="text-center t-less-visible">-</td>
        % else:
            <td>
                % if 'open' == content.status.id:
                    <i class="fa fa-fw fa-square-o"></i>
                % elif 'closed-validated' == content.status.id:
                    <i class="fa fa-fw fa-check-square-o"></i>
                % elif 'closed-unvalidated' == content.status.id:
                    <i class="fa fa-fw fa-check-square-o"></i>
                % elif 'closed-deprecated' == content.status.id:
                    <i class="fa fa-fw fa-bell-slash-o"></i>
                % else:
                    <i class="fa fa-fw fa-close"></i>
                % endif
                <span class="t-less-visible">${content.status.label}</span>
            </td>
        % endif
        <td>
            <span class="t-less-visible">${content.notes|n}</span>
        </td>
    </tr>
</%def>
