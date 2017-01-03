<%namespace name="BUTTON" file="tracim.templates.widgets.button"/>

<%def name="GENERIC_DISPLAY_VIEW_BUTTONS_CONTAINER(base_url)">
    <div class="btn-group" role="group" aria-label="...">
        ${BUTTON.TEXT('', 'btn btn-default disabled', _('display...'))}

        <% show_deleted_param = 1 %>
        <% show_archived_param = 1 %>

        % if show_deleted:
            <% show_deleted_param = 0 %>
        % endif
        % if show_archived:
            <% show_archived_param = 0 %>
        % endif

        <a href="${base_url}?show_deleted=${show_deleted_param}&show_archived=${show_archived if show_archived else 0}"
           class="btn btn-default disabled-has-priority ${'t-inactive-color' if not show_deleted else ''}"
        >
            ${_('deleted')}
        </a>

        <a href="${base_url}?show_deleted=${show_deleted if show_deleted else 0}&show_archived=${show_archived_param}"
           class="btn btn-default disabled-has-priority ${'t-inactive-color' if not show_archived else ''}"
        >
            ${_('archived')}
        </a>
    </div>
</%def>
