<%inherit file="local:templates.master"/>

<%def name="title()">
  Welcome to TurboGears 2.3, standing on the shoulders of giants, since 2007
</%def>

  <div class="row">
    <div class="span9 hidden-phone hidden-tablet">
      <div class="hero-unit">
        <h1>pod <small>your information compagnion</small></h1>
      </div>

      <div class="row">
        <div class="span3">
          <h3>Store structured data</h3>
          <ul>
            <li>contact information,</li>
            <li>notes, files,</li>
            <li>todos, events, reminders,</li>
            <li>...</li>
          </ul>
        </div>

        <div class="span3">
          <h3>Share information</h3>
          <ul>
            <li>Data is private, shared or public,</li>
            <li>Send notification to co-workers,</li>
            <li>Work together on the same data,</li>
            <li>...</li>
          </ul>
        </div>

        <div class="span3">
          <h3>Manage Lifetime</h3>
          <ul>
            <li>Real life and information timelines,</li>
            <li>Explore the life of information,</li>
            <li>Create, open and close projects,</li>
            <li>...</li>
          </ul>
        </div>
      </div>

      <div class="row">
        <div class="span9">
          <h3>Is it for me ?</h3>
          <p>
            You are prospecting clients? Looking for a job? Taking notes for your work? You're not sure ?
          </p>
          <p class="alert aler-warning">
            Hey! What do you risk? Give it a try!
          </p>
        </div>
      </div>
      <div>
        <h2>What can I do with pod ?</h2>
        <ul style="list-style:none;">
          <li><i class="icon-chevron-right"></i> Manage projects and tasks during their entire life:
            <ul style="list-style:none;">
              <li><i class="icon-chevron-right"></i> Create events and reminders</li>
              <li><i class="icon-chevron-right"></i> Take and keep notes</li>
              <li><i class="icon-chevron-right"></i> Keep contact information about people</li>
              <li><i class="icon-chevron-right"></i> Organise data and information</li>
            </ul>
          </li>
          <li>
            <i class="icon-chevron-right"></i> Share up-to-date information:
            <ul style="list-style:none;">
              <li><i class="icon-chevron-right"></i> Organize and update information</li>
              <li><i class="icon-chevron-right"></i> Send notifications to friends</li>
              <li><i class="icon-chevron-right"></i> Manage information life</li>
            </ul>
          </li>
        </ul>
        If you see this page it means your installation was successful!</p>
        <p>TurboGears 2 is rapid web application development toolkit designed to make your life easier.</p>
        <p>
          <a class="btn btn-primary btn-large" href="http://www.turbogears.org" target="_blank">
            ${h.icon('book', True)} Learn more
          </a>
        </p>
      </div>
    </div>
    <div class="span3">
      <form class="well">
        <fieldset>
          <legend>Sign up</legend>
          <input type="text" id="email" placeholder="Email"><br/>
          <input type="text" id="password" placeholder="Password"><br/>
          <input type="text" id="retype_password" placeholder="Retype your password"><br/>
          <input type="submit" id="submit" value="Sign up" /><br/>
        </fieldset>
      </form>
      
      <div class="popover bottom">
        <div class="arrow"></div>
        <h3 class="popover-title">
          Why to sign up ?
        </h3>
        <div>
          <p>
            blabla
          </p>
        </div>
      </div>
      <div class="alert alert-info">
        <strong>Why to sign up ?</strong>
      </div>
      <div class="well">
        <p>
          <i class="icon-signal"></i> Make information live
        </p>
        <p>
          <i class="icon-refresh"></i> Share up-to-date information
        </p>
        <p>
          <i class="icon-list"></i> Manage tasks and projects
        </p>
      </div>
    </div>
  </div>

  <div class="row">
    <div class="span4">
      <h3>Code your data model</h3>
      <p> Design your data <code>model</code>, Create the database, and Add some bootstrap data.</p>
    </div>

    <div class="span4">
      <h3>Design your URL architecture</h3>
      <p> Decide your URLs, Program your <code>controller</code> methods, Design your
        <code>templates</code>, and place some static files (CSS and/or Javascript). </p>
    </div>

    <div class="span4">
      <h3>Distribute your app</h3>
      <p> Test your source, Generate project documents, Build a distribution.</p>
    </div>
  </div>

  <div class="notice"> Thank you for choosing TurboGears.</div>
