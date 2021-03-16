const socket = io("/", {'force new connection': false});
const h = document.getElementById("container");
const url = "https://mfpromptr.herokuapp.com/";
var axis;
// var block = false;
var block = true;
setTimeout(() => {block = false}, 1000);

window.onload = () => {
    $(document).on("gesturestart", (e) => { e.preventDefault();});
    $(document).on("touchmove", (e) => {e.preventDefault();});
    socketConnect();

    $(window).on("orientationchange", () => {
        // https://stackoverflow.com/questions/6448465/jquery-mobile-device-scaling/
        if (window.orientation == 90 || window.orientation == -90 || window.orientation == 270) {
            axis = "gamma";
        } else {
            axis = "beta";
        }
    }).trigger('orientationchange');
    
    // Handle events on container
    $("#container").on("scroll", (e) => {
        let scrl = getScroll();
        // Show progress in bar
        $("#bar").css("width", scrl*100 + "%");
        if (!block) {
            console.log("OUTPUT <<<", "scroll", scrl);
            socket.emit("sync", "scroll", scrl);
        };
    }).on("input", (e) => {
        if (!block) {
            socket.emit("sync", "input", e.target.innerHTML);
        };
    });

    // Handle text properties
    $("input[type=range]").on("input change", function() {
        console.log("OUTPUT <<<", this.id, $(this).val());
        this.nextElementSibling.value = this.value > 9 ? this.value : '0' + this.value;
        if (!block) {
            socket.emit("sync", this.id, $(this).val());
        };
        switch (this.id) {
            case "size":
                $("#container").css("font-size", $(this).val()+"vw");
                break;
            case "margin":
                $("#container").css("margin-right", $(this).val()+"vw").css("margin-left", $(this).val()+"vw");
                break;
            case "lineHeight":
                $("#container").css("line-height", $(this).val()/10 +"em");
                break;
            case "letterSpacing":
                $("#container").css("letter-spacing", $(this).val()/100 +"em");
                break;
        };
    }).each(function() {
        console.log(this.value )
        this.nextElementSibling.value = this.value > 9 ? this.value : '0' + this.value;
    });

    // UI ==============
    var changeArrow, delay = 300;
    $(".arrow-cnt").on("mousedown", function (e) {
        let $range = $(this).parent(".control-elem").children("input[type=range]");
        if ($(this).children(":first").hasClass("right")) {
            $range.val(parseInt($range.val()) + 1);
        } if ($(this).children(":first").hasClass("left"))  {
            $range.val(parseInt($range.val()) - 1);
        };
        $range.trigger('input');
        changeArrow = setTimeout(() => {$(this).mousedown()}, delay);
        delay -= delay > 50 ? delay/4 : 0;
    }).on("mouseup mouseout", () => {
        clearTimeout(changeArrow);
        delay = 300;
    });

};

async function socketConnect() {
    uuid = window.location.pathname;
    const room = uuid == "/" ? randomString(6) : uuid.slice(1);
    var blocker; // timeout for events

    // socket.on("connect", () => {
    // });

    // console.log("room", room);
    socket.emit("join", room);
    
    $("#qr").html('<img src="https://chart.googleapis.com/chart?cht=qr&chs=120x120&chld=L|0&chl=' + url + room + '&choe=UTF-8" alt=""/>')
        .on("click", () => {
            $("#big-qr-container").html('<div id="big-qr"><img src="https://chart.googleapis.com/chart?cht=qr&chs=512x512&chld=L|0&chl=' + url + room + '&choe=UTF-8" alt=""/></div><input readonly type="text" value="' + url + room + '" id="link"><button onclick=\'let link = document.getElementById("link");link.select();link.setSelectionRange(0, 99999); document.execCommand("copy");\'><i class="fas fa-copy"></i></button>')
                .show();
            $("#big-qr").on("click", function () {$("#big-qr-container").hide()});
        });
    

    socket.on("joined", (id) => {
        // socket.emit("print", id);
        console.log("joined", id);
    })

    function preventEvent() {
        blocker = setTimeout(() => {
            block = false;
            $("#block-led").css("background-color", "#000");
        }, 300);
    }

    socket.on("sync", (command, value) => {
        clearTimeout(blocker);
        block = true;
        $("#block-led").css("background-color", "#ff604675");
        console.log("INPUT >>>", command, value);
        switch (command) {
            case "scroll":
                    document.getElementById("container").scrollTop = setScroll(value);
                break;
            case "input":
                $("#container").html(value);
                break;
            case "size":
            case "margin":
            case "lineHeight":
            case "letterSpacing":
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