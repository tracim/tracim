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
    <div class="content__title">
        ${ROW.TITLE_ROW(_('My Dashboard'), 'fa-home', '', 't-user-color', _('Welcome to your home, {username}.').format(username=fake_api.current_user.name))}
    </div>
</%def>

<%def name="SIDEBAR_RIGHT_CONTENT()">
    ${TOOLBAR.USER_ME(fake_api.current_user)}
</%def>


<%def name="SIDEBAR_LEFT_CONTENT()">
    ## This is the default left sidebar implementation
    ${LEFT_MENU.TREEVIEW('sidebar-left-menu', '__')}
</%def>

<%def name="REQUIRED_DIALOGS()">
    ${TIM.MODAL_DIALOG('user-edit-modal-dialog')}
    ${TIM.MODAL_DIALOG('user-edit-password-modal-dialog')}
</%def>

<div class="content__home">
    <div class="content__home__tab-wrapper">
        <div class="content__home__tab__item recent_activity active">
            <i class="fa fa-fw fa-line-chart"></i>${_('Recent Activity')}
            % if fake_api.last_actives.contents[0]:
              <span class="content__home__tab__item-lastactivity">[${fake_api.last_actives.contents[0].last_activity.delta}]</span>
            % endif
        </div>
        <div class="content__home__tab__item unread">
            <i class="fa fa-fw fa-eye-slash"></i>${_('Not Read')}
            % if fake_api.last_unread.nb > 0:
              <div class="content__home__tab__item-news fa-stack">
                <i class="fa fa-bookmark fa-stack-1x"></i>
                <i class="content__home__tab__item-news__number fa-stack-1x">
                  % if fake_api.last_unread.nb == 10:
                    ${fake_api.last_unread.nb}+
                  % else:
                    ${fake_api.last_unread.nb}
                  % endif
                </i>
              </div>
            % endif
        </div>
        <div class="content__home__tab__item workspace">
            <i class="fa fa-bank"></i>${_('My workspaces')}
        </div>
    </div>

    ## RECENT ACTIVITY
    <div class="" id="recent-activity-panel">
        <div class="panel panel-warning">
            <div class="panel-body">
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
    </div>

    ## NOT READ
    <div class="" id="unread-content-panel">
        <div class="panel panel-success">
            <div class="panel-body">
                % if fake_api.last_unread.nb <= 0:
                    ${P.EMPTY_CONTENT(_('No new content.'))}
                % else:
                    <table class="table table-hover">
                        % for item in fake_api.last_unread.contents:
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
    </div>

    ## Workspace list and notifications
    <div class="" id="workspaces-panel">
        <div class="panel panel-info">
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

