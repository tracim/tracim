<%inherit file="local:templates.master_authenticated_left_treeview_right_toolbar"/>
<%namespace name="BUTTON" file="tracim.templates.widgets.button"/>
<%namespace name="ICON" file="tracim.templates.widgets.icon"/>
<%namespace name="LEFT_MENU" file="tracim.templates.widgets.left_menu"/>
<%namespace name="P" file="tracim.templates.widgets.paragraph"/>
<%namespace name="ROW" file="tracim.templates.widgets.row"/>
<%namespace name="TABLE_ROW" file="tracim.templates.widgets.table_row"/>
<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="TITLE" file="tracim.templates.widgets.title"/>

<%namespace name="TOOLBAR" file="tracim.templates.workspace.toolbar"/>
<%namespace name="WIDGETS" file="tracim.templates.user_workspace_widgets"/>
<%def name="title()">${_('Workspace {}').format(result.workspace.label)}</%def>

<%def name="SIDEBAR_LEFT_CONTENT()">
    ## This is the default left sidebar implementation
    ${LEFT_MENU.TREEVIEW('sidebar-left-menu', '__')}
</%def>

<%def name="SIDEBAR_RIGHT_CONTENT()">
    ${TOOLBAR.WORKSPACE(fake_api.current_user, result.workspace)}
</%def>

<%def name="TITLE_ROW()">
    <% created_localized = h.get_with_timezone(result.workspace.created) %>
    <% subtitle = _('workspace created on {date} at {time}').format(date=h.date(created_localized), time=h.time(created_localized)) %>
    ${ROW.TITLE_ROW(_('Workspace {}').format(result.workspace.label), 'fa-bank', '', 't-user-color', subtitle)}
</%def>

<div class="workspace__detail__wrapper">
    <div class="workspace__detail__detail-descr">
        ${TITLE.H3(_('Detail'), 'fa-align-justify', 'workspace-members')}
        % if result.workspace.description:
            <p>${result.workspace.description}</p>
        % else:
            <p class="t-less-visible">${_('No description available')}</p>
        % endif
    </div>

    <div class="workspace__detail__calendar">
        % if not result.workspace.calendar_enabled:
            ${_('The calendar is disabled.')}
        % else:
            ${TITLE.H3(_('Calendar'), 'fa-calendar', 'workspace-members')}
            <p>${_('This workspace offers a calendar that you can configure in your software: Outlook, Thunderbird, etc.')}</p>
            <p>${_('The url to configure is the following one:')}</p>
            <p class="form-control">${result.workspace.calendar_url}</p>
        % endif
    </div>

    <div class="workspace__detail__user">
        <% potential_new_user_nb = sum(1 for user in fake_api.users if user.id not in (user.id for user in result.workspace.members)) %>
        % if potential_new_user_nb<=0:
            ${TITLE.H3(_('Members'), 'fa-user', 'workspace-members')}
        % else:
            ${TITLE.H3_WITH_BUTTON(fake_api.current_user, result.workspace, 'workspace-members', _('Members'), 'add-role-from-existing-user-form', _('add one...'), 'fa-user', 'btn btn-link')}

            <div id="add-role-from-existing-user-form" class="collapse col-sm-9">
                <div class="pod-inline-form">
                    <form role="form" method="POST" action="${tg.url('/admin/workspaces/{}/roles'.format(result.workspace.id))}">
                        <div class="form-group">
                            <label for="user_id">${_('User')}</label>
                            <select name="user_id" id="user_id" class="form-control" style="width:100%">
                                % for user in fake_api.users:
                                    % if user.id not in (user.id for user in result.workspace.members):
                                        <option value="${user.id}">${user.name}</option>
                                    % endif
                                % endfor
                            </select>
                        </div>

                        <div class="form-group">
                            <label>${_('Role')} ${BUTTON.HELP_MODAL_DIALOG('user-role-definition', 'margin-left: 0.5em;')}</label>
                            % for role in fake_api.role_types:
                            <div class="radio">
                              <label>
                                <% checked = ('', 'checked="checked"')[role.id==1]%>
                                <input type="radio" name="role_id" id="role-id-${role.id}" value="${role.id}" ${checked}>
                                <span style="${role.style}"><b>${role.label}</b></span>
                              </label>
                            </div>
                            % endfor
                        </div>

                        <div class="checkbox">
                            <label>
                                <input type="checkbox" id="with_notif" name="with_notif" checked="checked"/> ${_('Subscribe to mail notifications')}
                            </label>
                        </div>

                        <span class="pull-right" style="margin-top: 0.5em;">
                            <button id="current-document-add-comment-save-button" type="submit" class="btn btn-small btn-success" title="Add first comment"><i class=" fa fa-check"></i> ${_('Validate')}</button>
                        </span>
                    </form>
                    <div style="clear: both;"></div>
                </div>
            </div>
            ## END OF ADD MEMBER FORM
        % endif

        % if result.workspace.member_nb<=0:
            ${WIDGETS.EMPTY_CONTENT(_('There are no user associated to the current workspace. <a class="alert-link" data-toggle="collapse" data-target="#add-role-from-existing-user-form">Add one</a>.'))}
        % else:
            <table class="table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>${_('User')}</th>
                        <th>${_('Role')} ${BUTTON.HELP_MODAL_DIALOG('user-role-definition', 'margin-left: 0.5em;')}</th>
                        <th>${_('Notifications')}</th>
                        <th></th>
                    </tr>
                </thead>
                % for member in result.workspace.members:
                    ${TABLE_ROW.SECURED_MEMBER_IN_WORKSPACE(fake_api.current_user, result.workspace, member, fake_api.role_types)}
                % endfor
            </table>
        % endif
    </div>
</div>

## HERE COME HELP MODAL DIALOGS
${TIM.HELP_MODAL_DIALOG('user-role-definition')}



## EDIT WORKSPACE DIALOG
<div id="workspace-edit-modal-dialog" class="modal bs-example-modal-lg" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
    </div>
  </div>
</div>

