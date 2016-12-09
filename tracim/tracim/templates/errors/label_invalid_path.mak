<%inherit file="local:templates.master_authenticated"/>

<div class="row">
    <div class="col-sm-7 col-sm-offset-3 main">
        <p>
            ${_('Chosen label "{0}" is invalid because is in conflict with other resource.').format(invalid_label)}
        </p>

        <button onclick="goBack()">${_('Go Back')}</button>

        <script>
        function goBack() {
            window.history.back();
        }
        </script>

    </div>
</div>
