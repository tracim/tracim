<%inherit file="local:templates.master_authenticated_left_treeview_right_toolbar"/>

<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="TOOLBAR" file="tracim.templates.search.toolbar"/>
<%namespace name="FORMS" file="tracim.templates.user_workspace_forms"/>
<%namespace name="WIDGETS" file="tracim.templates.user_workspace_widgets"/>

<%namespace name="ICON" file="tracim.templates.widgets.icon"/>

<%def name="title()">${_('My workspaces')}</%def>

<%def name="SIDEBAR_LEFT_CONTENT()">
    <h4>${_('Workspaces')}</h4>
    ${WIDGETS.TREEVIEW('sidebar-left-menu', '__')}
    <hr/>
</%def>

<%def name="SIDEBAR_RIGHT_CONTENT()">
    ${TOOLBAR.SECURED_SEARCH(fake_api.current_user)}
</%def>

<%def name="REQUIRED_DIALOGS()">
</%def>

############################################################################
##
## SEARCH RESULT CONTENT BELOW
##
############################################################################

<div class="row t-page-header-row bg-secondary">
    <div class="col-sm-7 col-sm-offset-3 main">
        <h1 class="page-header t-search-color-border">
            <i class="fa fa-fw fa-lg fa-search t-search-color"></i>
            ${_('Search results')}
            <small>
                ${_('for keywords: ')|n}
                % for keyword in search.keywords:
                    <span class="label label-default">${keyword}</span>
                % endfor
            </small>
        </h1>

        <div style="margin: -1.5em auto -1.5em auto;" class="tracim-less-visible">
##            <% created_localized = h.get_with_timezone(result.folder.created) %>
##          <p>${_('folder created on {date} at {time} by <b>{author}</b>').format(date=h.date(created_localized), time=h.time(created_localized), author=result.folder.owner.name)|n}</p>
        </div>
    </div>
</div>

<div class="row">
    <div class="col-sm-7 col-sm-offset-3 main">
        <p>
            <p id="search-result-dynamic-resume">${_('loading...')}</p>
        </p>
    </div>
</div>

% for item in search.results:
    <div class="row t-odd-or-even t-hacky-thread-comment-border-top">
        <div class="col-sm-7 col-sm-offset-3">
            <div class="search-result-item search-result-type-${item.type.id} search-result-status-${item.status.id} search-result-type-filter-show search-result-status-filter-show">
                ${ICON.FA_FW('{} fa-3x t-less-visible pull-left'.format(item.type.icon))}
                <div style="margin-left: 5em;">
                    <h4>
                        <a href="${item.breadcrumb[-1].url}">${TIM.FA(item.icon)} ${item.label}</a>
                         <small class="pull-right ${item.status.css}">
                             ${item.status.label}
                             ${ICON.FA_FW('{} {}'.format(item.status.icon, item.status.css))}
                         </small>
                    </h4>
                    <div style="margin-bottom: 2em; margin-right: 4em; padding-top: 1em" class="search-result-item-breadcrumb">
                        <p style="margin-bottom: 1em;">
                            <i class="fa fa-fw fa-map-marker t-less-visible"></i>
                            % for bread in item.breadcrumb:
                                / <a href="${bread.url}">${bread.label}</a>
                            % endfor
                            <br/>
                            <span style="color: #AAA;" title="${_('Last known activty')}" >
                                <i class="fa fa-fw fa-calendar"></i> ${_('Last activity: {} ago').format(item.last_activity_as_delta)}</span>
                        </p>
                        <p>${h.shorten(item.content_raw, 300)}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
% endfor
