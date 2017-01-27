<%namespace name="BUTTON" file="tracim.templates.widgets.button"/>

<%def name="GENERIC_DISPLAY_VIEW_BUTTONS_CONTAINER(base_url)">
    <div class="btn-group folder__filter" role="group" aria-label="...">

        <% show_deleted_param = int(not show_deleted) %>
        <% show_archived_param = int(not show_archived) %>
        <% show_deleted_url = '{}?show_deleted={}&show_archived={}'.format(base_url, show_deleted_param, int(show_archived)) %>
        <% show_archive_url = '{}?show_deleted={}&show_archived={}'.format(base_url, int(show_deleted), show_archived_param) %>

        <a href="${show_deleted_url}" class="btn btn-default disabled-has-priority ${('t-inactive-color', '')[show_deleted ]}">
            ${(_('Show trashed items'), _('Hide trashed items'))[show_deleted]} <i class="fa fa-fw fa-trash ${('t-inactive-color', 'tracim-less-visible')[show_deleted]}"></i>
        </a>

        <a href="${show_archive_url}" class="btn btn-default disabled-has-priority ${('t-inactive-color', '')[show_archived]}">
            ${(_('Show archives'),_('Hide archives'))[show_archived]} <i class="fa fa-fw fa-archive ${('t-inactive-color', 'tracim-less-visible')[show_archived]}"></i>
        </a>
    </div>
</%def>
