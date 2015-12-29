//init some globals
var vInterval;
var lInterval;

//moved to config.js
//const DB_API = '';

//Create some consts
const VOLUME_ENDPOINT = '/audio/events';
const LED_ENDPOINT = '/led';

const LOCAL_VOLUME_ENDPOINT = 'audio2.json';
const LOCAL_LED_ENDPOINT = 'led.json';

//---------------------------------------

/**
 * add an apply to string
 * replace string placeholders with values
 * 'this is a value of {1}'.apply(100) ===> 'this is a value of 100'
 */
String.prototype.apply = function() {
    var a = arguments;

    return this.replace(/\{(\d+)\}/g, function(m, i) {
        return a[i - 1];
    });
};

//---------------------------------------

/**
 * add a has to array
 * returns true if array contains the string
 * @param {string} v - value to search for
 */
Array.prototype.has = function(v) {
    return $.inArray(v, this) > -1;
};

//---------------------------------------
// UI LIB
//---------------------------------------

(function (uilib, $, undefined){

 uilib.refreshData = function(thingId, dType){

      var params={};
  	 	//params.limit=10;

      var baseUrl=''+DB_API;

      if(DEBUG){
        baseUrl='{1}/{2}';
      }
      else{
        baseUrl+='/things/{1}{2}';
      }

      var actionUrl='';
      var readFn;
      var alwaysFn;
      var validParams = false;

      if(thingId){
        if(dType){
          if(dType==='volume'){
            if(DEBUG){
                 actionUrl = baseUrl.apply(thingId, LOCAL_VOLUME_ENDPOINT);
            }
            else{
                actionUrl = baseUrl.apply(thingId, VOLUME_ENDPOINT);
            }
            readFn = uilib.readVolumeData;
            alwaysFn = uilib.alwaysVolume;
            validParams = true;
          }
          else if(dType==='led'){
            if(DEBUG){
                 actionUrl = baseUrl.apply(thingId, LOCAL_LED_ENDPOINT);
            }
            else{
                 actionUrl = baseUrl.apply(thingId , LED_ENDPOINT);
            }
            readFn = uilib.readLedData;
            alwaysFn = uilib.alwaysLed;
            validParams = true;
          }
          else{
            //invalid data type
            console.log('invalid data type');
          }
        }
        else{
          //must contain type
          console.log('no data type');
        }
      }
      else{
        //must have thing id
        console.log('no thing id');
      }

      //if valid params then make the ajax call
      if(validParams){
        var jqxhr = $.ajax({
          url: actionUrl,
          crossDomain: true,
          jsonp: false,
          cache: false,
          contentType: 'application/json',
          data: params
        })
        .done(readFn)
        .fail(function(data,txtStatus,jqXHR){
            console.log('fail get' + data + txtStatus);
        })
        .always(alwaysFn);
      }

    return false;

    };

    //---------------------------------------

    uilib.readVolumeData = function(data, txtStatus, jqXHR){

       var vUpdate = $('#volume-update');
       var volObj = null;

       try{
         if (DEBUG) {
            volObj = JSON.parse(data);
          } else {
            volObj = data;
          }
        }
        catch(Err){
          manageCallbackResult($('#volume-update'),'<span class=\"text-warning\">ajax error</span>');
          return;
        }
        
        var volGraph = $('#volume-graph'),
                circLeftPos = 6,
                timeLeftPos = -2,
                windowWidth = $(window).width(),
                numCircs,
                volumes;

        volGraph.empty();

        if(windowWidth >= 480) {
            numCircs = 11;
        } else if(windowWidth >= 740) {
            numCircs = 18;
        } else if(windowWidth >= 1200) {
            numCircs = 22;
        } else {
            numCircs = 7;
        }

        //read the volumes
        var volumeEvents = volObj.events;

        if(volumeEvents.length > 0){
          if(volumeEvents.length > numCircs){
            volumeEvents.slice(-1*numCircs);
          }
        }

        for(var i in volumeEvents) {
            var item = volumeEvents[i],
                    volItem = $('<div class="volume-item"/>'),
                    volCircle = $('<div class="volume-circle text-hide"/>'),
                    volTime = $('<div class="volume-time"/>');

            volCircle
                    .text(item.volume)
                    .attr('title', item.volume)
                    .addClass(item.volume == 'increase' ? 'circle-plus' : 'circle-minus')
                    .css('left', circLeftPos)
                    .appendTo(volItem);

            volTime
                    .text(item.timestamp)
                    .attr('title', item.timestamp)
                    .css('left', timeLeftPos)
                    .appendTo(volItem);

            volItem.appendTo(volGraph);

            circLeftPos += 34;
            timeLeftPos += 34;
        }
    };

    //---------------------------------------

    uilib.alwaysVolume = function(data, txtStatus, jqXHR){
        var vUpdate = $('#volume-update');

       if(jqXHR.status === 200){
          manageCallbackResult(vUpdate, moment().format('YYYY-MM-DD hh:mm:ss'));
        }
        else{
          manageCallbackResult(vUpdate,'<span class=\"text-danger\">ajax error</span>');
        }
    };

 //---------------------------------------
    
    uilib.readLedData = function (data, txtStatus, jqXHR){
        //fill #general-table-rows
        var lUpdate=$('#bulb-update');

        var ledObject;
        if (DEBUG) {
            ledObject = JSON.parse(data);
        } else {
            ledObject = data;
        }
        if(ledObject){
            //if true
            uilib.changeLedState(ledObject.active);

            var updateTime = moment().format('YYYY-MM-DD hh:mm:ss');
            manageCallbackResult(lUpdate, updateTime);
        }
        else{
          manageCallbackResult(lUpdate, '<span class=\"text-warning\">invalid json</span>');
        }
    };

    //---------------------------------------

    uilib.alwaysLed = function(data, txtStatus, jqXHR){
        var gUpdate=$('#bulb-update');

        if(jqXHR.status === 200){
          //manageCallbackResult(gUpdate, moment().format('YYYY-MM-DD hh:mm:ss'));
        }
        else{
          manageCallbackResult(gUpdate,'<span class=\"text-danger\">ajax error</span>');
        }
    };
    
    //---------------------------------------
    
    //there can only be 2 states, on or off
    uilib.changeLedState = function(enable){
        var ledBulbImg = $('#bulb-status-img');
        var ledBulbStatus= $('#bulb-status-text');
        var ledOnBtn = $('#btn-bulb-action-on');
        var ledOffBtn = $('#btn-bulb-action-off');
        
        //if on
        //set img to on, status to on, onbtn to nothing, offbtn to on
        //if off
        //set img to off, status to off, onbtn to on, offbtn to nothing
        var statusMsg = '<span>Status:</span> {1}';
        var msg = '';
        if(enable){
            msg = statusMsg.apply('LED On');
        }
        else{
            msg = statusMsg.apply('LED Off');
        }
        
        enableElement(ledBulbImg, enable, true);
        setElementStatus(ledBulbStatus, msg);
        enableElement(ledOnBtn, !enable, false);
        enableButton(ledOnBtn, !enable);
        enableElement(ledOffBtn, enable, false);
        enableButton(ledOffBtn, enable);
        
    }
    //---------------------------------------
    
    uilib.requestLedStateChange = function(thingId, enable){
        
        var baseUrl='';
        var actionUrl='';
        
        if(DEBUG){
            baseUrl='{1}/{2}';
            actionUrl = baseUrl.apply(thingId, LOCAL_LED_ENDPOINT);
        }
        else{
            baseUrl='{1}/things/{2}{3}';
            actionUrl = baseUrl.apply(DB_API, LED_THING_ID, '/led');
        }
        
        var payloadObj={};
        var payload='';
        
        if(enable){
            payloadObj.active=true;
        }
        else{
            payloadObj.active=false;
        }
        
       payload=JSON.stringify(payloadObj);
        
       var jqxhr = $.ajax({
          url: actionUrl,
          method: 'POST',
          contentType: 'application/json',
          crossDomain:  true,
          jsonp: false,
          cache: false,
          data: payload
        })
        .done(function(msg){
            console.log('sent: ' + payload);
        })
        .fail(function(data,txtStatus,jqXHR){
            console.log('fail post');
        });
    }

    //---------------------------------------

    function manageCallbackResult(element, message){
      if(element){
        element.html(message);
      }
    }

}(window.uilib = window.uilib || {}, $));

//---------------------------------------

$(document).ready(function() {

 //---------------------------------------
 // Set refresh intervals
 //---------------------------------------

  //general
  gInterval = setInterval(function(){
    uilib.refreshData(THING_ID,'volume')
  }, 5000);
  
  //led
  lInterval = setInterval(function(){
    uilib.refreshData(THING_ID,'led')
  }, 1000);

  //---------------------------------------
  //track change with 
  $(document).on('click', '.btn-led-status', function(e){
    var btnId = $(this).attr('id');

    //console.log(btnId);

    if(btnId.indexOf('-on') >= 0){
        //console.log('request on');
        //on button
        uilib.requestLedStateChange(THING_ID, true);
    }
    else{
        //console.log('request off');
        //off button
        uilib.requestLedStateChange(THING_ID, false);
    }
    
    return false;
  });
  
});

//---------------------------------------
// HELPER FUNCTIONS
//---------------------------------------

/**
 * set the html of an element
 * @param {object} elem - a jquery handle to the element
 * @param {string} status - the html to paint
 */
function setElementStatus(elem, status){
    if(elem){
        elem.html(status);
    }
}

//---------------------------------------

/**
 * check to see if it's null or empty, if it is print nothing
 * @param {object} input - could be string or object
 */
function prettyPrintEmpty(input){
  if(input){
    return input;
  }

  return '';
}

//---------------------------------------

function enableButton(elem, enable){
    if(elem){
        if(enable){
            if(elem.hasClass('disabled')){
                elem.removeClass('disabled');
            }
        }
        else{
            if(elem.hasClass('disabled')){

            }
            else{
                elem.addClass('disabled');
            }
        }
    }
}

//---------------------------------------

//enable the element to off/on, if writeOff is true, then add the off class
function enableElement(elem, enable, writeOff){
    
    var OFF_STATUS='off';
    var ON_STATUS='on';
    
    //default to be off
    var desiredStatus=OFF_STATUS;
    var currentStatus=ON_STATUS;
    
    if(enable){
        desiredStatus=ON_STATUS;
        currentStatus=OFF_STATUS;
    }
    else{
        desiredStatus=OFF_STATUS;
        currentStatus=ON_STATUS;
    }
    
    if(elem){
       //remove the current status
       if(elem.hasClass(currentStatus)){
           elem.removeClass(currentStatus);
       } 
       
       //add the desired status
       if(!elem.hasClass(desiredStatus)){
           var writeState=true;
           
           if(desiredStatus===OFF_STATUS && !writeOff){
               writeState=false;
           }
           if(writeState){
               elem.addClass(desiredStatus);
           } 
       }
    }
}

//---------------------------------------

//round to 2 sig digits
function roundToTwo(num) {
    return +(Math.round(num + "e+2")  + "e-2");
}