var apiKey;
var sessionId;
var token;

$(document).ready(function() {
  // Make an Ajax Request to get the OpenTok API key, session ID and token
  $.get(SAMPLE_SERVER_BASE_URL + '/session', function(res) {
    apiKey = res.apiKey;
    sessionId = res.sessionId;
    token = res.token;
    initializeSession();
  });
});

function initializeSession() {
  // Initialize Session object
  var session = OT.initSession(apiKey, sessionId)
    .on('streamCreated', function(event) {
      subscriber = session.subscribe(event.stream, 'subscriber', {
        insertMode: 'append',
        width: '100%',
        height: '100%'
      });
    })
    .on('sessionDisconnected', function(event) {
      console.log('You were disconnected from the session.', event.reason);
    })
    .connect(token, function(error) {
      // If the connection is successful, initialize a publisher and publish to the session
      if (!error) {
        publisher = OT.initPublisher('publisher', {
          insertMode: 'append',
          resolution: '320x240',
          width: '100%',
          height: '100%'
        });
        session.publish(publisher, function(error) {
          setInterval(function() {
            var imgData = publisher.getImgData();
            var img = document.createElement("img");
            img.setAttribute("src", "data:image/png;base64," + imgData);
            img.style.width = '20%'; img.style.height = '20%';
            preview = document.getElementById('subscriber');
            if (preview.firstChild) preview.removeChild(preview.firstChild);
            //preview.appendChild(img);
            var asciiStr = getAsciiArt(img);
            var asciiDiv = document.createElement('div');
            asciiDiv.style['font-family'] = 'Courier';
            asciiDiv.style['font-size'] = '12px';
            asciiDiv.style['letter-spacing'] = '6px';
            asciiDiv.innerHTML = asciiStr;
            console.info(asciiStr);
            preview.appendChild(asciiDiv);
          }, 1000)
        });
      } else {
        console.log('There was an error connecting to the session:', error.code, error.message);
      }
    });

    var palette = "@#$%&8BMW*mwqpdbkhaoQ0OZXYUJCLtfjzxnuvcr[]{}1()|/?Il!i><+_~-;,. ";
    var paletteLength = palette.length;

    // See httphttp://tinyurl.com/phvnw3e
    function getAsciiArt(imgEl) {
        // The characters are in order from darkest to lightest, so that their 
        // position (index) in the string corresponds to a relative color value 
        // (0 = black). 
        
        var blockSize = 4, // only visit every 8 pixels
            canvas = document.createElement('canvas'),
            context = canvas.getContext && canvas.getContext('2d'),
            data, width, height,
            count = 0;

        height = canvas.height = imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height;
        width = canvas.width = imgEl.naturalWidth || imgEl.offsetWidth || imgEl.width;

        context.drawImage(imgEl, 0, 0);
        //context.width = 64; context.height = 48;

        data = context.getImageData(0, 0, width, height);
        asciiStr = "";
        for (var i = 0; i < height; i += blockSize) {
          for (var j = 0; j < width; j += blockSize) {
            var red = data.data[i * height + j];
            var green = data.data[i * height + j + 1];
            var blue = data.data[i * height + j + 2];
            var gray = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
            var palletteIndex = Math.floor( gray * paletteLength);
            asciiStr = asciiStr + palette.charAt(palletteIndex);
          }
          asciiStr = asciiStr + "<br>\n";
        }

        //return {width: width, height: height, length:length};
        return asciiStr;
    }

}
