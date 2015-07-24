<%inherit file="local:templates.master_authenticated_left_treeview_right_toolbar"/>

<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="FORMS" file="tracim.templates.user_workspace_forms"/>
<%namespace name="WIDGETS" file="tracim.templates.user_workspace_widgets"/>

<%namespace name="TOOLBAR" file="tracim.templates.page.toolbar"/>

<%namespace name="BUTTON" file="tracim.templates.widgets.button"/>
<%namespace name="TABLE_ROW" file="tracim.templates.widgets.table_row"/>
<%namespace name="ICON" file="tracim.templates.widgets.icon"/>
<%namespace name="P" file="tracim.templates.widgets.paragraph"/>

<%def name="title()">${result.page.label}</%def>

<%def name="SIDEBAR_LEFT_CONTENT()">
    <h4>${_('Workspaces')}</h4>
    ${WIDGETS.TREEVIEW('sidebar-left-menu', 'workspace_{}__item_{}'.format(result.page.workspace.id, result.page.id))}
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


<div class="row t-page-header-row">
    <div class="col-sm-7 col-sm-offset-3 main">
        <h1 class="page-header t-page-color-border">
            <i class="fa fa-fw fa-lg fa-file-text-o tracim-less-visible t-page-color"></i>
            ${result.page.label}

            <span class="pull-right">
                ${WIDGETS.SECURED_SHOW_CHANGE_STATUS_FOR_PAGE(fake_api.current_user, result.page.workspace, result.page)}
            </span>
        </h1>

        <div style="margin: -1.5em auto -1.5em auto;" class="tracim-less-visible">
          <p>${_('page created on {date} at {time} by <b>{author}</b>').format(date=h.date(result.page.created), time=h.time(result.page.created), author=result.page.owner.name)|n}</p>
        </div>
    </div>
</div>

% if result.page.selected_revision!='latest':
    <div class="row alert alert-warning" role="alert">
        <div class="col-sm-7 col-sm-offset-3">
            <p>
                <span class="pull-left">${ICON.FA_FW_2X('fa-warning')}</span>
                ${_('You are reading <b>an old revision</b> of the current page. (the shown revision is r{}).').format(result.page.selected_revision)|n}
            </p>
            <a class="pull-right alert-link" href="${tg.url('/workspaces/{}/folders/{}/pages/{}').format(result.page.workspace.id, result.page.parent.id, result.page.id)}">${_('Show latest revision')}</a>
        </div>
    </div>
% endif

% if result.page.status.id=='closed-deprecated':
    <div class="row alert alert-warning" role="alert">
        <div class="col-sm-7 col-sm-offset-3">
            <p>
                <span class="pull-left">${ICON.FA_FW_2X('fa-history')}</span>
                ${_('<b>This information is deprecated</b>')|n}
            </p>
        </div>
    </div>
% endif

<div class="row">
    <div class="col-sm-7 col-sm-offset-3">

## TODO - 2015-07-22 - D.A. - should we show a breadcrumb or not ?
## <button id="current-page-breadcrumb-toggle-button" class="btn btn-link" title="${_('Show localisation')}"><i class="fa fa-map-marker"></i></button>
## ${WIDGETS.BREADCRUMB('current-page-breadcrumb', fake_api.breadcrumb)}

        % if not result.page.content.strip():
            <div class="t-spacer-above t-less-visible">
                ${_('This page is empty')}
            </div>
        % else:
            <div class="t-spacer-above">
                ${result.page.content|n}
            </div>
        % endif
    </div>
</div>

<div class="row t-page-metadata-row t-spacer-above">
    <div class="col-sm-7 col-sm-offset-3">
        <div class="t-spacer-above">
            <span id="associated-revisions" ></span>
            <h4 class="anchored-title">${_('Page revisions')}</h4>
            <div>
                <table class="table table-striped table-hover">
                    % for revid, revision in reversed(list(enumerate(reversed(result.page.revisions)))):
                        <% warning_or_not = ('', 'warning')[result.page.selected_revision==revision.id] %>
                        <tr class="${warning_or_not}">
## FIXME - 2015-07-22 - D.A. - Do we really need to show a rev. id ?!
## <td><span class="label label-default">v${revid}</span></td>
                            <td class="t-less-visible">
                                <span class="label label-default">${ICON.FA_FW(revision.action.icon)}
                                ${revision.action.label}</span>
                            </td>
                            <td>${h.date(revision.created)}</td>
                            <td>${h.time(revision.created)}</td>
                            <td>${revision.owner.name}</td>
                            <td><a href="${tg.url('/workspaces/{}/folders/{}/pages/{}?revision_id={}').format(result.page.workspace.id, result.page.parent.id, result.page.id, revision.id)}">${revision.label}</a></td>
                            <td class="t-less-visible" title="${_('Currently shown')}">
                                % if warning_or_not:
                                    ${ICON.FA_FW('fa fa-caret-left')} ${_('shown').format(result.page.selected_revision)}
                                % endif
                            </td>
                        </tr>
                    % endfor
                </table>
            </div>
        </div>
    </div>
<div/>
