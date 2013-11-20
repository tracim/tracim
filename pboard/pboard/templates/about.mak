<%inherit file="local:templates.master"/>
<%namespace name="POD" file="pboard.templates.pod"/>

<%def name="title()">
  pod :: take notes, list tasks, write documents, manage projects
</%def>

  <div class="row">
    <div class="span10 offset1">
      <div class="row">
        <div class="span7">
          <div class="well"  style="min-height: 17em;">
            <h1>
              <i class="fa fa-check-square-o"></i>
              ${_("Simple tool, flexible data.")}
            </h1>
            <p>
              With <strong>pod</strong> you will be able to:
            </p>
            <ul>
              <li>
                <i class="pod-blue fa fa-fw fa-sort-alpha-asc"></i> Manage semi-structured
                data like text <i class="fa fa-file-text-o"></i> ,
                contacts <i class="fa fa-user"></i> ,
                events <i class="fa fa-calendar"></i> ,
                files <i class="fa  fa-paperclip"></i> ...
                </li>
              <li>
                <i class="pod-blue fa fa-fw fa-pencil"></i> Write <i>structured text</i> 
                <i class="fa fa-text-height"></i> documents including
                <i>images</i> <i class="fa  fa-picture-o"></i> 
              </li>
              <li>
                <i class="pod-blue fa fa-bar-chart-o"></i>
                Make your documents live through <i class="fa fa-lightbulb-o"></i>
                <i>status management</i> and <i class="fa fa-comments-o"></i> <i>comments</i>.
            </ul>
            <p>
              <strong>pod</strong> is usable on both computers
              <i class="pod-blue fa fa-desktop"></i>
               , tablets <i class="pod-blue fa fa-tablet"></i> and mobile phones <i class="pod-blue fa fa-mobile-phone"></i>
            </p>
            <p class="text-right">
              <strong class="pod-blue"> Give it a try!</strong>
              <i class="fa fa-2x fa-arrow-right" style="vertical-align: middle;"></i>
            </p>
          </div>
        </div>
        ${POD.SignUpForm('17em')}
      </div>
    </div>
  </div>
  <div class="row">
    <div class="span5 offset1">
      <div class="well" style="height: 17em;">
        <h1>
          <i class="fa fa-signal"></i>
          ${_("Improving pod")}
        </h1>
        <p><strong>pod</strong> ${_(" is a piece of software developed with <u>user needs</u> in mind.")|n}</p>
        <p>${_("It means that we need:")|n}</p>
        <ul class="fa-ul">
          <li><i class="pod-blue fa fa-li fa-microphone"></i> ${_("your feedback,")}</li>
          <li><i class="pod-blue fa fa-li fa-question"></i> ${_("you to ask questions,")}</li>
          <li><i class="pod-blue fa fa-li fa-gears"></i> ${_("your feature requests,")}</li>
          <li><i class="pod-blue fa fa-li  fa-thumbs-up"></i> ${_("you to tell us what's cool and what's wrong.")}</li>
        </ul>
        <p>
          In order to improve <i>your experience</i> and the <i>benefits of pod for you</i>.
        </p>
      </div>
    </div>
    <div class="span5">
      <div class="well" style="min-height: 17em;">
        <h1>
          <i class="fa  fa-smile-o"></i>
          ${_("The author")}
        </h1>

        <p>
          My name is <strong>Damien Accorsi</strong> and
        </p>
        <ul class="fa-ul">
          <li><i class="pod-blue fa fa-li fa-calendar"></i> ${_("I'm 35 years old,")}</li>
          <li><i class="pod-blue fa fa-li fa-flask"></i> ${_("I'm a skilled software engineer,")}</li>
          <li><i class="pod-blue fa fa-li fa-map-marker"></i> ${_("I live in France, near Grenoble.")}</li>
        </ul>
        <p>
          Extra information:
        </p>
        <ul class="fa-ul">
          <li><i class="pod-blue fa fa-li fa-envelope-o"></i> damien.accorsi+pod@free.fr</li>
          <li><i class="pod-blue fa fa-li fa-comments-o"></i> I like to discuss</li>
        </ul>
      </div>
    </div>
  </div>
  <div class="row">
    <div class="span8 offset2">
      <div class="text-center">
        <p style="margin: 1em 0 0 0;">
          <a class="btn btn-success" href="mailto:pod+alphatest@accorsi.info?subject=feedback about pod software">
            <i class="fa fa-envelope-o"></i>
            <strong>${_("email us")}</strong>
          </a> ${_("and we will reply to you.")}
          <strong>${_("Thank you.")}</strong>
        </p>
      </div>
    </div>
  </div>


