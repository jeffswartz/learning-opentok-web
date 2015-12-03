var apiKey,
    sessionId,
    token,
    subscriber,
    canvas;

$(document).ready(function() {
  // Make an Ajax request to get the OpenTok API key, session ID, and token from the server
  $.get(SAMPLE_SERVER_BASE_URL + '/session', function(res) {
    apiKey = res.apiKey;
    sessionId = res.sessionId;
    token = res.token;

    initializeSession();
  });
});

function initializeSession() {
  var session = OT.initSession(apiKey, sessionId);

  // Subscribe to a newly created stream
  session.on('streamCreated', function(event) {
    subscriber = session.subscribe(event.stream, 'subscriber', {
      insertMode: 'append',
      width: '100%',
      height: '100%',
      fitMode: 'contain'
    });
    canvas = document.createElement('div');
    canvas.id = 'canvas'
    canvas.style = {
      opacity: 0.4,
    }
    canvas.style['background-color'] = 'yellow';
    canvas.style['z-index'] = '5555555';
    canvas.style.position = 'absolute';
    canvas.style.opacity = '0.4';
    canvas.style.filter = 'alpha(opacity=40)'; // For IE 8
    subscriber.element.appendChild(canvas);
    positionCanvas();
    $(window).resize(function() {
      positionCanvas();
    });
  });

  session.on('sessionDisconnected', function(event) {
    console.log('You were disconnected from the session.', event.reason);
  });

  // Connect to the session
  session.connect(token, function(error) {
    // If the connection is successful, initialize a publisher and publish to the session
    if (!error) {
      var publisher = OT.initPublisher('publisher', {
        insertMode: 'append',
        width: '100%',
        height: '100%'
      });

      session.publish(publisher);
    } else {
      console.log('There was an error connecting to the session: ', error.code, error.message);
    }
  });
}

function positionCanvas() {
  if (!subscriber || !subscriber.stream) {
    return;
  }
  var aspectRatio = subscriber.stream.videoDimensions.width / subscriber.stream.videoDimensions.height;
  var bounds = {};
  bounds.width = subscriber.element.clientWidth;
  bounds.height = subscriber.element.clientHeight;
  if (bounds.width / bounds.height > aspectRatio) {
    bounds.width = bounds.height * aspectRatio;
    bounds.x = (subscriber.element.clientWidth - bounds.width) / 2;
    bounds.y = 0;
  } else {
    bounds.height = bounds.width / aspectRatio;
    bounds.x = 0;
    bounds.y = (subscriber.element.clientHeight - bounds.height) / 2;
  }
  canvas.style.width = bounds.width + 'px';
  canvas.style.height = bounds.height + 'px';
  canvas.style.left = bounds.x + 'px';
  canvas.style.top = bounds.y + 'px';
  console.log(bounds);
}
