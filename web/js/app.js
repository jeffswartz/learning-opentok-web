// Declare Variables
var apiKey,
    sessionId,
    token;

// get the APIKEY and TOKEN 
$(document).ready(function() {
    getApiAndToken();
});


function getApiAndToken() {
    // make an Ajax Request to get the apiKey, sessionId and token from the server
    $.get(SAMPLE_SERVER_BASE_URL + '/session', function(res) {

        apiKey = res.apiKey;
        sessionId = res.sessionId;
        token = res.token;

        initializeSession();
    });

}

var session;
var subscribedStreams = [];
var largeSubscriberStream;
var newSubscriberIndex = 0;

function initializeSession() {
    // Initialize Session Object
    session = OT.initSession(apiKey, sessionId);

    // Subscribe to a newly created stream
    session.on('streamCreated', function(event) {
        var streamId = event.stream.id;
        if (!largeSubscriberStream) {
            largeSubscriberStream = event.stream;
        }
        var $subscriberContainer = $('<div/>',
            {id: streamId + '-container', class: 'video-320'});
        var expandButton = $('<button/>', {
            text: 'Expand ' + newSubscriberIndex,
            id: streamId + '-expand',
            class: 'expand-button',
            click: function () {
              largeSubscriberStream = event.stream;
              arrangeSubscribers();
            }
        });
        $subscriberContainer.append(expandButton);
        $('#videos').append($subscriberContainer);

        var subscriber = session.subscribe(event.stream, $subscriberContainer.get(0), {
            insertMode: 'append',
            width: '100%',
            height: '100%'
        });
        newSubscriberIndex++;
        subscribedStreams.push(event.stream);
        arrangeSubscribers();
    });

    // Handler for streamDestroyed event
    session.on('streamDestroyed', function(event) {
        var subscriberContainer = $('#' + event.stream.id + '-container');
        if (subscriberContainer) {
            subscriberContainer.remove();
            var subscribedStreamsIndex = subscribedStreams.indexOf(event.stream);
            if (subscribedStreamsIndex > -1) {
              subscribedStreams.splice(subscribedStreamsIndex, 1);
            }
            if (event.stream == largeSubscriberStream) {
              largeSubscriberStream = null;
            }
            arrangeSubscribers();
        };
    });

    // Handler for sessionDisconnected event
    session.on('sessionDisconnected', function(event) {
        console.log('You were disconnected from the session.', event.reason);
        for (var i = 0; i < subscribedStreams.length; i++) {
            $('#' + subscribedStreams[i].id + '-container').remove();
        }
    });

    // Connect to the Session
    session.connect(token, function(error) {
        // If the connection is successful, initialize a publisher and publish to the session
        if (!error) {
          var publisher = OT.initPublisher('publisher', {
              insertMode: 'append',
              width: '100%',
              height: '100%',
              _enableSimulcast: true,  // This enables simulcasting for the publisher
              resolution: '640x480',
              frameRate: 30
          });
          session.publish(publisher);
          arrangeSubscribers();
        } else {
            console.log('There was an error connecting to the session:', error.code, error.message);
        }

    });

    function arrangeSubscribers() {
      var smallnewSubscriberIndex = 0;
      for (var i = 0; i < subscribedStreams.length; i++) {
          $subscriberContainer = $('#' + subscribedStreams[i].id + '-container');
          var subscriber = session.getSubscribersForStream(subscribedStreams[i]);
          if (subscribedStreams[i] == largeSubscriberStream) {
              $('#videos').prepend($subscriberContainer);
              $subscriberContainer.css('left', '');
              $subscriberContainer.removeClass('video-320');
              $subscriberContainer.addClass('mainVideo');
              /* Subscriber.setMaxResolution() & setMaxFrameRate() are not yet implemented.
              // Use the higher resolution stream and the higer frame rate for the small subscriber
              subscriber.setMaxResolution({
                  width: 640,
                  height: 480
              });
              subscriber.setMaxFrameRate(30);
              */
          } else {
              smallnewSubscriberIndex ++;
              $subscriberContainer.removeClass('mainVideo');
              $subscriberContainer.addClass('video-320');
              var leftOffset = $('#publisher').position().left
                + ($('#publisher').width() + 8) * smallnewSubscriberIndex + 'px';
              $subscriberContainer.css('left', leftOffset);
              $subscriberContainer.position().top = $('#publisher').position().top;
              /* Subscriber.setMaxResolution() and setMaxFrameRate() are not yet implemented.
              // Use the lower resolution stream and the lower frame rate for the small subscriber
              subscriber.setMaxResolution({
                  width: 320,
                  height: 240
              });
              subscriber.setMaxFrameRate(15);
              */
          }
      }
    }
}
