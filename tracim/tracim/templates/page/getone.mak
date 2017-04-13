<%inherit file="local:templates.master_authenticated_left_treeview_right_toolbar"/>

<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="FORMS" file="tracim.templates.user_workspace_forms"/>
<%namespace name="LEFT_MENU" file="tracim.templates.widgets.left_menu"/>
<%namespace name="WIDGETS" file="tracim.templates.user_workspace_widgets"/>

<%namespace name="TOOLBAR" file="tracim.templates.page.toolbar"/>

<%namespace name="BUTTON" file="tracim.templates.widgets.button"/>
<%namespace name="TABLE_ROW" file="tracim.templates.widgets.table_row"/>
<%namespace name="ICON" file="tracim.templates.widgets.icon"/>
<%namespace name="P" file="tracim.templates.widgets.paragraph"/>

<%def name="title()">${result.page.label}</%def>

<%def name="SIDEBAR_LEFT_CONTENT()">
    ${LEFT_MENU.TREEVIEW('sidebar-left-menu', 'workspace_{}__item_{}'.format(result.page.workspace.id, result.page.id))}
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

<div class="content-container ${'not-editable' if not result.page.is_editable else ''} ${'archived' if result.page.is_archived else ''} ${'deleted' if result.page.is_deleted else ''}">

    <div class="t-page-header-row bg-secondary">
        <div class="main">
            <h1 class="page-header t-page-color-border">
                <i class="fa fa-fw fa-lg fa-file-text-o tracim-less-visible t-page-color"></i>
                ${result.page.label}

                <span class="pull-right">
                    ${WIDGETS.SECURED_SHOW_CHANGE_STATUS_FOR_PAGE(fake_api.current_user, result.page.workspace, result.page)}
                </span>
            </h1>

            <div style="margin: -1.5em auto -1.5em auto;" class="tracim-less-visible">
                <% created_localized = h.get_with_timezone(result.page.created) %>
                <% updated_localized = h.get_with_timezone(result.page.updated) %>
                <% last_modification_author = result.page.last_modification_author.name %>
                <p>
                    ${_('page created on {date} at {time} by <b>{author}</b> ').format(date=h.date(created_localized), time=h.time(created_localized), author=result.page.owner.name)|n}
                    % if result.page.revision_nb > 1:
                      ${_('(last modification on {update_date} at {update_time} by {last_modification_author})').format(update_date=h.update_date(updated_localized), update_time=h.update_time(updated_localized), last_modification_author = last_modification_author)|n}
                    % endif
                </p>
            </div>
        </div>
    </div>

    % if (result.page.is_archived) :
    <div class="alert alert-info" role="alert">
        <p>
            <span class="pull-left"><i class="fa fa-fw fa-2x fa-warning" alt="" title=""></i></span>
            ${_('You are viewing <b>an archived version</b> of the current page.')|n}
        </p>
    </div>
    % elif (result.page.is_deleted) :
    <div class="alert alert-info" role="alert">
        <p>
            <span class="pull-left"><i class="fa fa-fw fa-2x fa-warning" alt="" title=""></i></span>
            ${_('You are viewing <b>a deleted version</b> of the current page.')|n}
        </p>
    </div>
    % endif

    % if result.page.selected_revision!='latest':
    <div class="alert alert-warning" role="alert">
        <p>
            <span class="pull-left">${ICON.FA_FW_2X('fa-warning')}</span>
            ${_('You are reading <b>an old revision</b> of the current page. (the shown revision is r{}).').format(result.page.selected_revision)|n}
        </p>
        <a class="pull-right alert-link" href="${tg.url('/workspaces/{}/folders/{}/pages/{}').format(result.page.workspace.id, result.page.parent.id, result.page.id)}">
            ${_('Show latest revision')}
        </a>
    </div>
    % endif

    % if result.page.status.id=='closed-deprecated':
    <div class="alert alert-warning" role="alert">
        <p>
            <span class="pull-left">${ICON.FA_FW_2X('fa-history')}</span>
            ${_('<b>This information is deprecated</b>')|n}
        </p>
    </div>
    % endif

    <div class="content__detail page">
        <div class="">
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

        <div class="t-page-metadata-row t-spacer-above">
            <div class="t-spacer-above">
                <span id="associated-revisions" ></span>
                <h4 class="anchored-title">${_('Page history')}</h4>
                <div>
                    <table class="table table-striped table-hover">
                        % for event in result.page.history:
                            ${WIDGETS.SECURED_HISTORY_VIRTUAL_EVENT_AS_TABLE_ROW(fake_api.current_user, event, result.page.selected_revision)}
                        % endfor
                    </table>
                </div>
            </div>
        <div/>
    </div>

</div>
