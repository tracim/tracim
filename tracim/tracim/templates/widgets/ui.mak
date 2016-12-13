<%namespace name="BUTTON" file="tracim.templates.widgets.button"/>

<%def name="GENERIC_DISPLAY_VIEW_BUTTONS_CONTAINER(base_url)">
    <div class="btn-group" role="group" aria-label="...">
        ${BUTTON.TEXT('', 'btn btn-default disabled', _('display...'))}
        <a href="${base_url}"
           class="btn btn-default disabled-has-priority ${'t-inactive-color' if show_deleted or show_archived else ''}"
        >
            ${_('normal view')}
        </a>

        % if show_deleted:
        <a href="${base_url}"
           % else:
        <a href="${base_url}?show_deleted=1"
           % endif
           class="btn btn-default disabled-has-priority ${'t-inactive-color' if not show_deleted else ''}"
        >
            ${_('deleted')}
        </a>

        % if show_archived:
        <a href="${base_url}"
           % else:
        <a href="${base_url}?show_archived=1"
           % endif
           class="btn btn-default disabled-has-priority ${'t-inactive-color' if not show_archived else ''}"
        >
            ${_('archived')}
        </a>
    </div>
</%def>
