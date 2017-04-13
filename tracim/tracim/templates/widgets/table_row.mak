<%namespace name="BUTTON" file="tracim.templates.widgets.button"/>
<%namespace name="ICON" file="tracim.templates.widgets.icon"/>
<%namespace name="SPAN" file="tracim.templates.widgets.span"/>

<%def name="USER_ROLE_IN_WORKSPACE(current_user, role, show_id=True, enable_link=None, disable_link=None, role_types=None, base_link='/admin/workspaces/{workspace}')">
    <tr>
        % if show_id:
            <td>${role.workspace.id}</td>
        % endif
        <td><a href="${tg.url(base_link).format(workspace=role.workspace.id)}">${role.workspace.name}</a></td>

        % if role_types:
            ## <td>${BUTTON.SECURED_ROLE_SELECTOR(fake_api.current_user, result.workspace, member, fake_api.role_types)}</td>
            <td><span style="${role.style}"><i class="fa ${role.icon}"></i> ${role.label}</span></td>
        % else:
            <td><span style="${role.style}"><i class="fa ${role.icon}"></i> ${role.label}</span></td>
        % endif

        <%
            user_is_himself = current_user.id == role.user.id
            user_is_manager = h.user_role(current_user, role.workspace) >= 8
            ## allow user to change notification status only if current user is manager on the given workspace
        %>

        % if (enable_link or disable_link) and (user_is_himself or user_is_manager) :
            <td>${SPAN.NOTIFICATION_SUBSCRIBED(role.user, role.workspace, role.notifications_subscribed, enable_link, disable_link)}</td>
        % else:
            <td>${SPAN.NOTIFICATION_SUBSCRIBED(role.user, role.workspace, role.notifications_subscribed)}</td>
        % endif

    </tr>
</%def>

<%def name="SECURED_MEMBER_IN_WORKSPACE(current_user, workspace, member, role_types)">
    <tr>
        <td>${member.id}</td>
        <td><a href="${tg.url('/admin/users/{}'.format(member.id))}">${member.name}</a></td>
        <td>${BUTTON.SECURED_ROLE_SELECTOR(fake_api.current_user, result.workspace, member, fake_api.role_types)}</td>
        <%
            user_is_himself = current_user.id == member.id
            user_is_manager = h.user_role(current_user, workspace) >= 8
            ## allow user to change notification status only if current user is manager on the given workspace

            enable_link = '/admin/users/{user}/workspaces/{workspace}/enable_notifications?next_url=/admin/workspaces/{workspace}'
            disable_link = '/admin/users/{user}/workspaces/{workspace}/disable_notifications?next_url=/admin/workspaces/{workspace}'
        %>
        % if (enable_link or disable_link) and (user_is_himself or user_is_manager) :
            <td>${SPAN.NOTIFICATION_SUBSCRIBED(member, workspace, member.notifications_subscribed, enable_link, disable_link)}</td>
        % else:
            <td>${SPAN.NOTIFICATION_SUBSCRIBED(member, workspace, member.notifications_subscribed)}</td>
        % endif

        <td><a title="${_('Remove this user from the current workspace')}" class="t-less-visible t-red-on-hover t-red btn btn-default btn-xs" href="${tg.url('/admin/workspaces/{}/roles/{}/delete'.format(result.workspace.id, member.id))}">${ICON.FA('fa-remove fa-fw')}</a></td>
    </tr>
</%def>

<%def name="CONTENT(content)">
    <tr class="t-table-row-${content.type.type} folder__content__list__item ${'archived' if content.is_archived else ''} ${'deleted' if content.is_deleted else ''}">
        <td class="folder__content__list__item__title">
            <a href="${content.url}" id="folder__content__list__item__link_${content.id}">
                <i class="fa-fw ${content.type.icon} ${content.type.color}"></i> ${content.label}
            </a>
        </td>

        <!--td class="folder__content__list__type">
            <span class="${content.type.color}">
                % if (content.is_archived) :
                    <i class="fa fa-archive fa-fw tracim-less-visible" title="Archivé"></i>
                % elif (content.is_deleted) :
                    <i class="fa fa-trash-o fa-fw tracim-less-visible" title="Supprimé"></i>
                % endif
                ${content.type.label}
            </span>

            ## <span class="tracim-less-visible"><i class="fa fa-file-text-o fa-tw"></i> ${content}</span>
        </td-->

        % if 'folder' == content.type.id:
            <td class="text-center t-less-visible">-</td>
        % else:
            <td>
                <a href="${content.url}">
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

                    <span class="t-less-visible">
                      ${content.status.label}
                      % if (content.is_archived) :
                          - Archivé
                      % elif (content.is_deleted) :
                          - Supprimé
                      % endif
                    </span>
                </a>
            </td>
        % endif

        <td><a href="${content.url}"><span class="t-less-visible">${content.notes|n}</span></a></td>

        <td><a href="${content.url}">${content.type.label}</a></td>
    </tr>
</%def>
