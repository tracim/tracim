<%inherit file="local:templates.master_authenticated_empty"/>


<%def name="title()">
    ${_('Calendar')}
</%def>

<%def name="content_wrapper()">
    <iframe width="100%"
            src="/_caldavzap/index.tracim.html"
            style="position: absolute; height: 100%; border: none; margin-bottom: 20px;"
    ></iframe>
</%def>
