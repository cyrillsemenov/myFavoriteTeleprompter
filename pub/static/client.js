const socket = io("/", {'force new connection': false});
// socketStatusEvents();
const $container = document.getElementById("container");
var axis, block = true;
setTimeout(() => {block = false}, 1000);
$(document).on("gesturestart", (e) => { e.preventDefault();});
$(document).on("touchmove", (e) => {e.preventDefault();});

window.onload = () => {
    socketConnect();
    screenLock();
    // $($container).chromeinsertfix();
    // Handle events on container
    $($container).on("scroll", (e) => {
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

    // Resize bar =====
    $(document.body).on("mousedown", (event) => {
        if (event.originalEvent.offsetY > document.body.offsetHeight) {

            $($container).addClass("noselect").attr("contenteditable", "false");
            $(document).on("mousemove", (e) => {

                let padding = parseInt($("#container").css("padding-top"));
                let newHeight = (100 * (e.originalEvent.clientY - padding)) / window.innerWidth;
                socket.emit("sync", "height", newHeight);
                $("#container").css("height", newHeight+"vw")
            }).on("mouseup", () => {

                $(document).off("mousemove");
                $($container).removeClass("noselect").attr("contenteditable", "true");
            })
        };
    })

    $("#flip").on("click", () => {
        $('#container').toggleClass('flip');
        if (screenfull.isEnabled) {
            screenfull.request();
        }
    })

    $("#control").on("click", function(e) {
        if (e.originalEvent.offsetY > this.offsetHeight - vw()) {
            console.log(e.originalEvent.offsetY, this.offsetHeight);
            $(this).children().toggle();
            $(this).toggleClass("hidden");
        }
    })
};

function socketConnect() {
    const url = window.location.protocol+"//"+window.location.host+"/";
    const uuid = window.location.pathname;
    const room = uuid == "/" ? randomString(6) : uuid.slice(1);
    var blocker; // timeout for events

    socket.emit("join", room);
    createQR(url+room);

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
                $container.scrollTop = setScroll(value);
                break;
            case "input":
                $($container).html(value);
                break;
            case "height":
                $($container).css("height", value+"vw");
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
    return $container.scrollTop / $container.scrollHeight
}

function setScroll(value) {
    return $container.scrollHeight * value;
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
                    $container.scrollBy(0,Math.round(Math.pow(event[axis]/10,3)));
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

function vw() {
    return Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) / 100
}

function socketStatusEvents() {
    socket.on("connect", () => {
    });
    socket.on("connect_error", (error) => {
    });
    socket.on("disconnect", () => {
    });
    socket.on("joined", (id) => {
    })
}

function createQR(url) {
    $("#qr").html('<img src="https://chart.googleapis.com/chart?cht=qr&chs=120x120&chld=L|0&chl=' + url + '&choe=UTF-8" alt=""/>')
    .on("click", () => {
        $("#big-qr-container").html('<div id="big-qr"><img src="https://chart.googleapis.com/chart?cht=qr&chs=512x512&chld=L|0&chl=' + url + '&choe=UTF-8" alt=""/></div><input readonly type="text" value="' + url + '" id="link"><button onclick=\'let link = document.getElementById("link");link.select();link.setSelectionRange(0, 99999); document.execCommand("copy");\'><i class="fas fa-copy"></i></button>')
            .show();
        $("#big-qr").on("click", function () {$("#big-qr-container").hide()});
    });
}

async function screenLock() {
    
    // Create a reference for the Wake Lock.
    let wakeLock = null;

    // create an async function to request a wake lock
    try {
        wakeLock = await navigator.wakeLock.request('screen');
        // $($container).html("Wake Lock is active!");
        console.log('Wake Lock is active!');
    } catch (err) {
        // The Wake Lock request has failed - usually system related, such as battery.
        console.log(`${err.name}, ${err.message}`);
        // console.log(err);
    }
}

$(window).on("orientationchange", () => {
    // https://stackoverflow.com/questions/6448465/jquery-mobile-device-scaling/
    if (window.orientation == 90 || window.orientation == -90 || window.orientation == 270) {
        axis = "gamma";
    } else {
        axis = "beta";
    }
}).trigger('orientationchange');

// $(document).on("DOMNodeInserted", $.proxy(function (e) {
//     if (e.target.parentNode.getAttribute("contenteditable") === "true") {
//         var newTextNode = document.createTextNode("");
//         function antiChrome(node) {
//             if (node.nodeType == 3) {
//                 newTextNode.nodeValue += node.nodeValue.replace(/(\r\n|\n|\r)/gm, "<br>")
//             }
//             else if (node.nodeType == 1 && node.childNodes) {
//                     for (var i = 0; i < node.childNodes.length; ++i) {
//                         antiChrome(node.childNodes[i]);
//                     }
//             }
//         }
//         antiChrome(e.target);

//         e.target.parentNode.replaceChild(newTextNode, e.target);
//     }
// }, this));
// Select the node that will be observed for mutations
// const targetNode = document.getElementById('container');

// // Options for the observer (which mutations to observe)
// const config = { 
//     attributes: true, 
//     childList: true, 
//     subtree: true,
//     attributeOldValue: true,
//     characterDataOldValue: true
// };

// // Callback function to execute when mutations are observed
// const callback = function(mutationList, observer) {
//     mutationList.forEach( (mutation) => {
//         switch (mutation.type) {
//             case "childList":

//                 break;

//             case "characterData":
            
//                 break;

//             case "attributes":
//                 console.log(mutation.target[mutation.attributeName]);
//                 if (mutation.target === targetNode) {
//                     console.log("container was changed");
//                 } else {
//                     console.log("child was changed");
//                     // mutation.target[mutation.attributeName] = ""
//                 }
//                 break;
        
//             default:
//                 break;
//         }
//     });
//     console.log(mutationList);
// };

// // Create an observer instance linked to the callback function
// const observer = new MutationObserver(callback);
// observer.observe(targetNode, config);

// $editables = $('[contenteditable=true]');
$editables = $('#container');

$editables.on('paste', (e) => {
    // https://stackoverflow.com/questions/53186433/restrict-paste-in-contenteditable-html-js
    // Prevent the standard paste behavior
    e.preventDefault();
    
    // Get clipboard data (obsolete way)
    let data = e.originalEvent.clipboardData.getData('text/html') ||
    e.originalEvent.clipboardData.getData('text/plain');

    // Filter out everything except simple text and allowable HTML elements
    let regex = /<(?!(\/\s*)?(p|div)[>,\s])([^>])*>/g;
    data = data.replace(regex, '');

    // Insert the filtered content (obsolete way)
    document.execCommand('insertHTML', false, data);

    // Fcuk! There is still some syling? Let's get rid of them!!!
    $($editables).children().each(function () {$(this).attr("style", "")});
});

$editables.on("keydown", function (e) {
    switch (e.keyCode) {
        case 13:
            e.preventDefault(); //Prevent default browser behavior
            if (window.getSelection) {
                var selection = window.getSelection(),
                    range = selection.getRangeAt(0),
                    br = document.createElement("br"),
                    textNode = document.createTextNode("\u00a0"); //Passing " " directly will not end up being shown correctly
                range.deleteContents();//required or not?
                range.insertNode(br);
                range.collapse(false);
                // range.insertNode(textNode);
                // range.selectNodeContents(textNode);

                selection.removeAllRanges();
                selection.addRange(range);
                // return false;
            }
            break;
        case 46: // Delete
        case 8: // Backspace
            console.log("Delete pressed");
            break;
      };
    //   clearChildrenStyles(this);
      $editables.find("span[style]").contents().unwrap();
});

// (function( $ ){
//     $.fn.clearChildrenStyles = function() {
//         console.log(this);
//         if ( $(this).children().filter("p,span,div").length > 0 ) {
//             $(this).children().each(clearChildrenStyles);
//         } else {
//             $(this).attr("style", "")
//         }
//     }; 
//  })( jQuery );

function clearChildrenStyles(jNode) {
    if ( $(jNode).children().filter("p,span,div").length > 0 ) {
        $(jNode).children().each(clearChildrenStyles);
    } else {
        $(jNode).attr("style", "")
    }
}
// $editables.filter("p,span").on('keypress',function(e){
//  if(e.keyCode==13){ //enter && shift

//   e.preventDefault(); //Prevent default browser behavior
//   if (window.getSelection) {
//       var selection = window.getSelection(),
//           range = selection.getRangeAt(0),
//           br = document.createElement("br"),
//           textNode = document.createTextNode("\u00a0"); //Passing " " directly will not end up being shown correctly
//       range.deleteContents();//required or not?
//       range.insertNode(br);
//       range.collapse(false);
//       range.insertNode(textNode);
//       range.selectNodeContents(textNode);

//       selection.removeAllRanges();
//       selection.addRange(range);
//       return false;
//   }

//    }
// });