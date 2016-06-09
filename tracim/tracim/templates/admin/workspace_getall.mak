<%inherit file="local:templates.master_authenticated_left_treeview"/>
<%namespace name="LEFT_MENU" file="tracim.templates.widgets.left_menu"/>

<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="TOOLBAR" file="tracim.templates.workspace.toolbar"/>
<%namespace name="ROW" file="tracim.templates.widgets.row"/>
<%namespace name="ICON" file="tracim.templates.widgets.icon"/>
<%namespace name="BUTTON" file="tracim.templates.widgets.button"/>

<%def name="title()">${_('Workspaces')}</%def>

<%def name="SIDEBAR_LEFT_CONTENT()">
    ${LEFT_MENU.ADMIN('')}
    ${LEFT_MENU.TREEVIEW('sidebar-left-menu', '__')}
</%def>

<%def name="TITLE_ROW()">
    <div class="row-fluid">
        <div>
            ${ROW.TITLE_ROW(_('Workspaces'), 'fa-bank', 'col-md-offset-3 col-md-8', 't-user-color', _('manage workspaces and subscribed users'))}
        </div>
    </div>
</%def>

<div class="container-fluid">
    <div class="row-fluid">
        <div>
            ## ADD A WORKSPACE
            % if fake_api.current_user.profile.id>=2:
                ## In this case the user is a pod manager, so he is allowed to create workspaces (and to delete them)
                <div class="row">
                    <!-- #### CREATE A WORKSPACE #### -->
                    <div class="col-md-offset-3 col-md-12">
                        <p class="t-spacer-above">
                            <a class="btn btn-success" data-toggle="collapse" data-target="#create-workspace-form"><b>${_('Create a workspace...')}</b></a>
                        </p>
                        <div id="create-workspace-form" class="collapse">
                            <div class="pod-inline-form col-sm-6" >
                                <form role="form" method="POST" action="${tg.url('/admin/workspaces')}">
                                    <div class="form-group">
                                        <label for="workspace-name1">${_('Name')}</label>
                                        <input name="name" type="text" class="form-control" id="workspace-name" placeholder="${_('Name')}">
                                    </div>
                                    <div class="form-group">
                                        <label for="workspaceDescription">${_('Description')}</label>
                                        <textarea name="description" class="form-control" id="workspaceDescription" placeholder="${_('You may add a description of the workspace')}"></textarea>
                                    </div>
                                    <div class="checkbox form-group">
                                        <label for="workspaceCalendarEnabled">
                                            <input id="workspaceCalendarEnabled" name="calendar_enabled" type="checkbox" checked >
                                            <b>${_('Activate associated calendar')}</b>
                                        </label>
                                    </div>

                                    <div class="form-group">
                                        <p class="form-control-static">${_('<u>Note</u>: members will be added during next step.')|n}</p>
                                    </div>
                                        
                                    <span class="pull-right" style="margin-top: 0.5em;">
                                        <button type="submit" class="btn btn-small btn-success" title="${_('Validate')}"><i class=" fa fa-check"></i> ${_('Validate')}</button>
                                    </span>
                                        
                                </form>
                                <div style="clear: both;"></div>
                            </div>
                        </div>
                    </div>
                    <!-- #### CREATE A WORKSPACE [END] #### -->
                </div>
            % endif
            ## ADD A WORKSPACE [END]

            ## LIST OF WORKSPACES
            <div class="row">
                <div class="col-md-offset-3 col-md-8 t-spacer-above">
                    % if result.workspace_nb<=0:
                        ${TIM.NO_CONTENT_INFO(_('There are no workspace yet. Start by <a class="alert-link" data-toggle="collapse" data-target="#create-workspace-form">creating a workspace</a>.'))}
                    % else:
                        <table class="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>${_('Workspace')}</th>
                                    <th>${_('Description')}</th>
                                    <th>${_('User Nb')}</th>
                                    <th>${_('Calendar')}</th>
                                </tr>
                            </thead>
                            % for workspace in result.workspaces:
                                <tr>
                                    <td>${workspace.id}</td>
                                    <td><a href="${tg.url('/admin/workspaces/{}'.format(workspace.id))}">${workspace.label}</a></td>
                                    <td>${workspace.description}</td>
                                    <td>${workspace.member_nb}</td>
                                    <td class="text-center">
                                        % if workspace.calendar_enabled:
                                            ${ICON.FA('fa-check-square-o fa-lg t-enabled-color')}
                                        % else:
                                            ${ICON.FA('fa-square-o fa-lg t-disabled-color')}
                                        % endif

                                    </td>
                                </tr>
                            % endfor
                        </table>
                    % endif
                </div>
            </div>
            ## LIST OF WORKSPACES [END]
        </div>
    </div>
</div>


