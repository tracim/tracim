<%inherit file="local:templates.master_authenticated_left_treeview_right_toolbar"/>
<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="ROW" file="tracim.templates.widgets.row"/>
<%namespace name="TABLE_ROW" file="tracim.templates.widgets.table_row"/>
<%namespace name="LEFT_MENU" file="tracim.templates.widgets.left_menu"/>
<%namespace name="P" file="tracim.templates.widgets.paragraph"/>
<%namespace name="TOOLBAR" file="tracim.templates.user_toolbars"/>

<%def name="title()">
    ${_('Dashboard')}
</%def>

<%def name="TITLE_ROW()">
    <div class="row-fluid">
        <div>
            ${ROW.TITLE_ROW(_('My Dashboard'), 'fa-home', 'col-md-offset-3 col-md-7', 't-user-color', _('Welcome to your home, {username}.').format(username=fake_api.current_user.name))}
        </div>
    </div>
</%def>

<%def name="SIDEBAR_RIGHT_CONTENT()">
    ${TOOLBAR.USER_ME(fake_api.current_user)}
</%def>


<%def name="SIDEBAR_LEFT_CONTENT()">
    ## This is the default left sidebar implementation
    % if fake_api.current_user.profile.id>2:
        ${LEFT_MENU.ADMIN('')}
    % endif
    ${LEFT_MENU.TREEVIEW('sidebar-left-menu', '__')}
</%def>

<%def name="REQUIRED_DIALOGS()">
    ${TIM.MODAL_DIALOG('user-edit-modal-dialog')}
    ${TIM.MODAL_DIALOG('user-edit-password-modal-dialog')}
</%def>

<div class="container-fluid">
    <div class="row-fluid">
        <div>
            <div class="row">
                <div class="col-md-offset-3 col-sm-7">
                    <div class="row t-spacer-above">
##                        <div class="col-sm-6">
##                            <div class="panel panel-default">
##                              <div class="panel-heading">
##                                <h3 class="panel-title"><i class="fa fa-eye-slash"></i> ${_('Unread content')}</h3>
##                              </div>
##                              <div class="panel-body">
##                                Panel content
##                              </div>
##                            </div>
##                        </div>

                        <div class="col-sm-12">
                            <div class="panel panel-default">
                                <div class="panel-heading">
                                    <h3 class="panel-title"><i class="fa fa-line-chart"></i> ${_('Recent activity')}</h3>
                                </div>
                                % if fake_api.last_actives.nb <= 0:
                                    ${P.EMPTY_CONTENT(_('There\'s no activity yet.'))}
                                % else:
                                    <table class="table table-hover">
                                        % for item in fake_api.last_actives.contents:
                                            <tr>
                                                <td>
                                                    <i class="${item.type.icon} fa-fw ${item.type.color}"></i>
                                                    <a href="${item.url}">${item.label}</a>
                                                    <br/>
                                                    <span class="t-less-visible">${item.workspace.label}</span>
                                                </td>
                                                <td title="${_('Last activity: {datetime}').format(datetime=item.last_activity.label)}">
                                                    ${item.last_activity.delta}
                                                </td>
                                            </tr>
                                        % endfor
                                    </table>
                                % endif
                            </div>
                        </div>

##                        <div class="col-sm-6">
##                            <div class="panel panel-default">
##                                <div class="panel-heading">
##                                    <h3 class="panel-title"><i class="fa fa-thumbs-down"></i> ${_('Still open after...')}</h3>
##                                </div>
##                                % if fake_api.oldest_opens.nb <= 0:
##                                    ${P.EMPTY_CONTENT(_('Nothing to close.'))}
##                                % else:
##                                    <table class="table table-hover">
##                                        % for item in fake_api.oldest_opens.contents:
##                                            <tr>
##                                                <td>
##                                                    <i class="${item.type.icon} fa-fw ${item.type.color}"></i>
##                                                    <a href="${item.url}">${item.label}</a>
##                                                </td>
##                                                <td title="${_('Last activity: {datetime}').format(datetime=item.last_activity.label)}">
##                                                    ${item.last_activity.delta}
##                                                </td>
##                                            </tr>
##                                        % endfor
##                                    </table>
##                                % endif
##                            </div>
##                        </div>


##                        <div class="col-sm-6">
##                            <div class="panel panel-default">
##                                <div class="panel-heading">
##                                    <h3 class="panel-title"><i class="fa fa-star"></i> ${_('Favorites')}</h3>
##                                </div>
##
##                                last_active_contents
##
##                                    % if fake_api.favorites.nb <= 0:
##                                        ${P.EMPTY_CONTENT(_('You did not set any favorite yet.'))}
##                                    % else:
##                                        <table class="table table-hover">
##                                            % for item in fake_api.favorites.contents:
##                                                <tr>
##                                                    <td>
##                                                        <i class="${item.type.icon} fa-fw ${item.type.color}"></i>
##                                                        <a href="${item.url}">${item.label}</a>
##                                                    </td>
##                                                    <td class="text-right">
##                                                        <i class="${item.status.icon} fa-fw ${item.status.css}" title="${item.status.label}"></i>
##                                                    </td>
##                                                </tr>
##                                            % endfor
##                                        </table>
##                                    % endif
####                                </div>
##                            </div>
##                        </div>
                    </div>

                    ## Workspace list and notifications
                    <div class="row">
                        <div class="col-sm-12">
                            <div class="panel panel-default">
                                <div class="panel-heading">
                                    <h3 class="panel-title"><i class="fa fa-bank"></i> ${_('Your workspaces')}</h3>
                                </div>
                                <div class="panel-body">

                                    % if len(fake_api.current_user.roles)<=0:
                                        ${P.EMPTY_CONTENT(_('I\'m not member of any workspace.'))}
                                    % else:
                                        <table class="table">
                                            <thead>
                                                <tr>
                                                    <th>${_('Workspace')}</th>
                                                    <th>${_('Role')}</th>
                                                    <th>${_('Email Notifications')}</th>
                                                </tr>
                                            </thead>
                                            % for role in fake_api.current_user.roles:
                                                ${TABLE_ROW.USER_ROLE_IN_WORKSPACE(fake_api.current_user, role, show_id=False, enable_link='/user/me/workspaces/{workspace}/enable_notifications?next_url=/home', disable_link='/user/me/workspaces/{workspace}/disable_notifications?next_url=/home')}
                                            % endfor
                                        </table>
                                    % endif
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

