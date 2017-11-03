<%inherit file="local:templates.master_authenticated_left_treeview_right_toolbar"/>
<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="ROW" file="tracim.templates.widgets.row"/>
<%namespace name="TABLE_ROW" file="tracim.templates.widgets.table_row"/>
<%namespace name="ICON" file="tracim.templates.widgets.icon"/>
<%namespace name="P" file="tracim.templates.widgets.paragraph"/>
<%namespace name="LEFT_MENU" file="tracim.templates.widgets.left_menu"/>
<%namespace name="BUTTON" file="tracim.templates.widgets.button"/>

<%namespace name="TOOLBAR" file="tracim.templates.user_toolbars"/>
<%namespace name="WIDGETS" file="tracim.templates.user_workspace_widgets"/>
<%def name="title()">${_('User {}').format(result.user.name)}</%def>

<%def name="SIDEBAR_LEFT_CONTENT()">
    ## This is the default left sidebar implementation
    ${LEFT_MENU.TREEVIEW('sidebar-left-menu', '__')}
</%def>

<%def name="SIDEBAR_RIGHT_CONTENT()">
    ${TOOLBAR.USER(fake_api.current_user, result.user)}
</%def>

<%def name="TITLE_ROW()">
    <div>
        <%
            if result.user.profile.id>=3:
                subtitle = _('This user is an administrator.')
            elif result.user.profile.id>=2:
                subtitle = _('This user can create workspaces.')
            else:
                subtitle = _('This user a standard user.')
        %>
        ${ROW.TITLE_ROW(result.user.name, 'fa-user', '', 't-user-color', subtitle)}
    </div>
</%def>

<div class="adminuser__detail">
    <div class="" id='user-profile-global-info'>
        <div>
            % if not result.user.enabled:
                <div class="alert alert-warning" style="margin-top: 1em;">
                    <i class="fa fa-lg fa-warning"></i> ${_('This user is disabled')}
                </div>
            % endif
            ## TODO - D.A. - 2015-05-14
            ## Add extra information like skype, phone, website...
            <h3 style="margin-top: 1em;">
                ${ICON.FA('fa-user t-less-visible')}
                ${_('Contact')}
            </h3>
            ${P.USER_CONTACT(result.user)}
        </div>
        <div style="margin-top: 4em;">
            <h3>
                ${ICON.FA('fa-bar-chart t-less-visible')}
                ${_('Global profile')}
            </h3>
            ${P.USER_PROFILE(fake_api.current_user, result.user)}
        </div>
        <div style="margin-top: 4em;">
            <h3>
                ${ICON.FA('fa-group t-less-visible')}
                ${_('Roles')}
            </h3>
            % if len(result.user.roles)<=0:
                ${WIDGETS.EMPTY_CONTENT(_('This user is not member of any workspace.'))}
            % else:
                <table class="table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>${_('Workspace')}</th>
                            <th>${_('Role')} ${BUTTON.HELP_MODAL_DIALOG('user-role-definition', 'margin-left: 0.5em;')}</th>
                            <th>${_('Notifications')}</th>
                        </tr>
                    </thead>
                    % for role in result.user.roles:
                        % if not role.workspace.is_deleted:
                        <%
                            enable_link = '/admin/users/{user}/workspaces/{workspace}/enable_notifications?next_url=/admin/users/{user}'
                            disable_link = '/admin/users/{user}/workspaces/{workspace}/disable_notifications?next_url=/admin/users/{user}'
                        %>
                        ${TABLE_ROW.USER_ROLE_IN_WORKSPACE(fake_api.current_user, role, show_id=True, enable_link=enable_link, disable_link=disable_link)}
                        % endif
                    % endfor
                </table>
            % endif
        </div>
    </div>
</div>

<div id="user-edit-modal-dialog" class="modal" tabindex="-1" role="dialog" aria-hidden="true">
  <div class="modal-dialog modal-sm">
    <div class="modal-content">
    </div>
  </div>
</div>

<div id="user-edit-password-modal-dialog" class="modal" tabindex="-1" role="dialog" aria-hidden="true">
  <div class="modal-dialog modal-sm">
    <div class="modal-content">
    </div>
  </div>
</div>

## HERE COME HELP MODAL DIALOGS
${TIM.HELP_MODAL_DIALOG('user-role-definition')}
