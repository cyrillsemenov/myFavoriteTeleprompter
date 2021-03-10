const socket = io("/");
const h = document.getElementById("container");
const url = "https://mfpromptr.herokuapp.com/";
var axis;
var block = false;

window.onload = () => {
    $(document).on("gesturestart", (e) => { e.preventDefault();});
    $(document).on("touchmove", (e) => {e.preventDefault();});
    socketConnect();

    $(window).on("orientationchange", () => {
        // https://stackoverflow.com/questions/6448465/jquery-mobile-device-scaling/
        if (window.orientation == 90 || window.orientation == -90 || window.orientation == 270) {
            // if orientation is landscape read gamma from accelerometer
            axis = "gamma";
        } else {
            // otherwise read beta
            axis = "beta";
        }
    //trigger an orientationchange event on the window object to initialize this code (basically in-case the user opens the page in landscape mode)
    }).trigger('orientationchange');
    
    // Handle events on container
    $("#container").on("scroll", (e) => {
        let scrl = getScroll();
        $("#bar").css("width", scrl*100 + "%");
        if (!block) {
            console.log("OUTPUT <<<", "scroll", scrl);
            socket.emit("sync", "scroll", scrl);
        };
    });

    $("#container").on("input", e => {
        if (!block) {
            socket.emit("sync", "input", e.target.innerHTML);
        };
    });
    // window.onscroll = e => {
    //     $("#bar").css("width", getScroll()*100 + "%");
    //     if (!block) {
    //         console.log("OUTPUT <<<", "scroll", getScroll());
    //         socket.emit("sync", "scroll", getScroll());
    //     }
    // };

    $("input[type=range]").on("input change", function() {
        if (!block) {
            console.log("OUTPUT <<<", this.id, $(this).val());
            socket.emit("sync", this.id, $(this).val());
            switch (this.id) {
                case "size":
                    $("#container").css("font-size", $(this).val()+"vw");
                case "margin":
                    $("#container").css("margin-right", $(this).val()+"vw").css("margin-left", $(this).val()+"vw");
            };
        };
    });
};

function socketConnect() {
    uuid = window.location.pathname;
    const room = uuid == "/" ? randomString(6) : uuid.slice(1);
    var blocker; // timeout for events
    
    socket.on("connect", () => {
        console.log("room", room);
        socket.emit("join", room);
        $("#qr").html('<a href="' + url + room + '"><img src="https://chart.googleapis.com/chart?cht=qr&chs=120x120&chld=L|0&chl=' + url + room + '&choe=UTF-8" alt=""/></a>');
    });

    socket.on("joined", (id) => {
        console.log("joined", id);
    })

    function preventEvent() {
        blocker = setTimeout(() => block = false, 300);
    }

    socket.on("sync", (command, value) => {
        clearTimeout(blocker);
        block = true;
        console.log("INPUT >>>", command, value);
        switch (command) {
            case "scroll":
                    // window.scroll(0, setScroll(value));
                    document.getElementById("container").scrollTop = setScroll(value);
                break;
            case "input":
                $("#container").html(value);
                break;
            case "size":
            case "margin":
                $("#"+command).val(value);
                $("#"+command).trigger("change")
                break;
        };
        preventEvent();
    });
}


function getScroll() {
    return h.scrollTop / h.scrollHeight
}

function setScroll(value) {
    return h.scrollHeight * value;
}

const throttle = (func, limit = 100) => {
    let inThrottle
    return function() {
      const args = arguments
      const context = this
      if (!inThrottle) {
        func.apply(context, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }

function randomString(stringLength = 6) {
    let chars = "0123456789abcdefghijklmnopqrstuvwzyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_";
    let randomString = "";
    for (let i=0; i<stringLength; i++) {
        let rNum = Math.floor(Math.random() * chars.length);
        randomString += chars.substring(rNum,rNum+1);
    }
    return randomString
}

function getAccel(){
    if (typeof DeviceOrientationEvent['requestPermission'] === 'function') {
        DeviceOrientationEvent['requestPermission']()
        .then(permissionState => {
            if (permissionState === 'granted') {
                window.addEventListener('deviceorientation', (event) => {
                    h.scrollBy(0,Math.round(Math.pow(event[axis]/10,3)));
                });
            }
        }).catch(console.error);
    } 
    // else {
    //     if (this.globals.iphone) {
    //         window.addEventListener('deviceorientation', (event) => {
    //             accelerometerCallback(event.beta);
    //             socket.emit("print", "VAL2 " + event.beta);
    //         });
    //     } else {
    //         window.addEventListener('deviceorientationabsolute', (event) => {
    //             socket.emit("print", "ABSOLUTE" + event.beta);
    //             // this.currentCompass$.next(360 - Math.round(event['alpha']));
    //         }, true);
    //     }
    //   }
}