<%inherit file="local:templates.master_authenticated_left_treeview_right_toolbar"/>

<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="TOOLBAR" file="tracim.templates.page_toolbars"/>
<%namespace name="FORMS" file="tracim.templates.user_workspace_forms"/>
<%namespace name="WIDGETS" file="tracim.templates.user_workspace_widgets"/>

<%def name="title()">${result.page.label}</%def>

<%def name="SIDEBAR_LEFT_CONTENT()">
    <h4>${_('Workspaces')}</h4>
    ${WIDGETS.TREEVIEW('sidebar-left-menu', 'workspace_{}__folder_{}'.format(result.page.workspace.id, result.page.parent.id))}
    <hr/>
</%def>

<%def name="SIDEBAR_RIGHT_CONTENT()">
    ${TOOLBAR.SECURED_PAGE(fake_api.current_user, result.page.workspace, result.page)}
</%def>

<%def name="REQUIRED_DIALOGS()">
    ${TIM.HELP_MODAL_DIALOG('content-wiki-page-definition')}
    ${TIM.MODAL_DIALOG('page-edit-modal-dialog', 'modal-lg')}
</%def>

############################################################################
##
## PAGE CONTENT BELOW
##
############################################################################

% if result.page.selected_revision!='latest':
    <div class="alert alert-warning" role="alert" style="margin-top: 1em;">
        ${TIM.ICO(16, 'status/dialog-warning')}
        ${_('You are reading <b>an old revision</b> of the current page. (the shown revision is r{}).').format(result.page.selected_revision)|n}
        <a class="pull-right alert-link" href="${tg.url('/workspaces/{}/folders/{}/pages/{}').format(result.page.workspace.id, result.page.parent.id, result.page.id)}">${_('Show latest revision')}</a>
    </div>
% endif

% if result.page.status.id=='closed-deprecated':
    <div class="alert alert-warning" role="alert" style="margin-top: 1em;">
        ${TIM.ICO(16, 'status/status-outdated')}
        ${_('<b>This information is deprecated</b>')|n}
    </div>
% endif


<h1 class="page-header">
    ${TIM.ICO(32, result.page.icon)} ${result.page.label}
    <button id="current-page-breadcrumb-toggle-button" class="btn btn-link" title="${_('Show localisation')}"><i class="fa fa-map-marker"></i></button>
</h1>
${WIDGETS.BREADCRUMB('current-page-breadcrumb', fake_api.breadcrumb)}

<p style="margin: -1.5em auto 1em auto;">
    ${WIDGETS.SECURED_SHOW_CHANGE_STATUS_FOR_PAGE(fake_api.current_user, result.page.workspace, result.page)}
    &mdash;&nbsp;&nbsp;&nbsp;
    ${_('created on {} by <b>{}</b>').format(h.date_time_in_long_format(result.page.created), result.page.owner.name)|n}</p>
</p>

<div>
    ${result.page.content|n}
</div>

<hr class="pod-panel-separator"/>
<div>
    <h4 id="associated-links" class="anchored-title" >${_('Links extracted from the page')}</h4>
    <div>
        % if len(result.page.links)<=0:
            <p class="pod-empty">${_('No link found.')}</p>
        % else:
            <ul>
                % for link in result.page.links:
                    <li><a href="${link.href}">${link.label if link.label else link.href}</a></li>
                % endfor
            </ul>
        % endif
    </div>
    <hr/>


    <h4 id="associated-links" class="anchored-title" >${_('Page revisions')}</h4>
    <div>
        <table class="table table-striped table-hover">
            % for revid, revision in reversed(list(enumerate(reversed(result.page.revisions)))):
                <% warning_or_not = ('', 'warning')[result.page.selected_revision==revision.id] %>
                <tr class="${warning_or_not}">
                    <td><span class="label label-default">v${revid}</span></td>
                    <td>${TIM.ICO(16, 'mimetypes/text-html')}</td>
                    <td>${revision.owner.name}</td>
                    <td><a href="${tg.url('/workspaces/{}/folders/{}/pages/{}?revision_id={}').format(result.page.workspace.id, result.page.parent.id, result.page.id, revision.id)}">${revision.label}</a></td>
                    <td>${h.date_time_in_long_format(revision.created, _('%Y-%m-%d at %H:%M'))}</td>
                    <td>${TIM.ICO(16, revision.action.icon, revision.action.label)}</td>
                    <td>
                        % if warning_or_not:
                            ${TIM.ICO(16, 'actions/go-previous')} <strong>${_('Revision r{}').format(result.page.selected_revision)}</strong>
                        % endif
                    </td>
                </tr>
            % endfor
        </table>
    </div>
</div>
