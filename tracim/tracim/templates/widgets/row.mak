<%def name="TITLE_ROW(label, icon, width_classes, color_classes, subtitle)">
    <div class="bg-secondary" style="border-bottom: 1px solid #CCC;">
        <div class="${width_classes} main">
            <h1 class="page-header ${color_classes}">
                <i class="fa fa-fw fa-lg ${icon} ${color_classes}"></i>
                ${label}
            </h1>
            <div style="margin: -1.5em auto -1.5em auto;" class="tracim-less-visible">
              <p>${subtitle}</p>
            </div>
        </div>
    </div>
</%def>
