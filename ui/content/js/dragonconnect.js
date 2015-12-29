//init some globals
var vInterval;
var lInterval;

//moved to config.js
//const DB_API = '';

//Create some consts
const THINGS_ENDPOINT='/things';
const VOLUME_ENDPOINT = '/audio/events';
const LED_ENDPOINT = '/led';

const LOCAL_VOLUME_ENDPOINT = 'audio.json';
const LOCAL_LED_ENDPOINT = 'led.json';
const LOCAL_THINGS_ENDPOINT= 'things.json';

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

/**
 * extract the key, we assume the key to be constructed using -
 * @param {string} input - original string
 * @param {number} idx - index to return, starts at 0
 */
function extractKey(input, idx){
  // console.log('extracting: ' + input);
  if(input){
    var sp= input.split('-');
    if(idx){
      // console.log('extracted: ' + sp[idx]);
      return sp[idx];
    }
    else{
      // console.log('extracted: ' + sp[1]);
      return sp[1];
    }
  }
  return '';
}

//---------------------------------------
// UI LIB
//---------------------------------------

(function (uilib, $, undefined){

    /**
     * main ajax call to refresh data for the panels
     * @param {string} thingId - thingId in string form
     * @param {string} dType - type of data to return
     */
    uilib.refreshData = function(thingId, dType){

      var params={};
  	 	//params.limit=10;

      var baseUrl=''+DB_API;

      if(DEBUG){
        baseUrl='{1}{2}/{3}';
      }
      else{
        baseUrl+='{1}/{2}{3}';
      }

      var actionUrl='';
      var readFn;
      var alwaysFn;
      var validParams = false;

      if(thingId){
        if(dType){
          if(dType==='volume'){
            if(DEBUG){
                 actionUrl = baseUrl.apply(THINGS_ENDPOINT, thingId, LOCAL_VOLUME_ENDPOINT);
            }
            else{
                actionUrl = baseUrl.apply(THINGS_ENDPOINT,thingId, VOLUME_ENDPOINT);
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
                 actionUrl = baseUrl.apply(THINGS_ENDPOINT, thingId , LED_ENDPOINT);
            }
            readFn = uilib.readLedData;
            alwaysFn = uilib.alwaysLed;
            validParams = true;
          }
          else{
            //invalid data type
            // console.log('invalid data type');
          }
        }
        else{
          //must contain type
          // console.log('no data type');
        }
      }
      else{
        //must have thing id
        // console.log('no thing id');
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
            // console.log('fail get' + data + txtStatus);
        })
        .always(alwaysFn);
      }

    return false;

    };

    //---------------------------------------
    // VOLUME
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
    // LED
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
            baseUrl='{1}{2}/{3}';
            actionUrl = baseUrl.apply(THINGS_ENDPOINT, thingId, LOCAL_LED_ENDPOINT);
        }
        else{
            baseUrl='{1}{2}/{3}{4}';
            actionUrl = baseUrl.apply(DB_API, THINGS_ENDPOINT, thingId, LED_ENDPOINT);
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
            // console.log('sent: ' + payload);
        })
        .fail(function(data,txtStatus,jqXHR){
            // console.log('fail post');
        });
    }

    //---------------------------------------
    // THINGS
    //---------------------------------------
    
    uilib.getThings = function(){
        
        var baseUrl='';
        var actionUrl='';
        
        if(DEBUG){
            baseUrl='{1}/{2}';
            actionUrl = baseUrl.apply(THINGS_ENDPOINT, LOCAL_THINGS_ENDPOINT);
        }
        else{
            baseUrl='{1}/{2}';
            actionUrl = baseUrl.apply(DB_API, THINGS_ENDPOINT);
        }

        $('#menu-select-device').html('<li><a href=\"#\"><img src=\"gfxs/ajax-loader.gif\"/> getting things...</a></li>');

        var jqxhr = $.ajax({
          url: actionUrl,
          crossDomain: true,
          jsonp: false,
          cache: false,
          contentType: 'application/json'
        })
        .done(uilib.readThingsData)
        .fail(uilib.alwaysThings);
    }

    //---------------------------------------
    
    uilib.readThingsData = function (data, txtStatus, jqXHR){
        //fill #menu-select-device
        var sAlert=$('#status-alert');

        var thingsObj;
        if (DEBUG) {
            thingsObj = JSON.parse(data);
        } else {
            thingsObj = data;
        }
        if(thingsObj){
          var menuDevices = $('#menu-select-device');
          var menuContent='';
          var menuListTemplate='<li><a href=\"#\" id=\"device-{1}\" class=\"btn-device\">{2}</a></li>';

          if(thingsObj.length > 0){
            for(var i in thingsObj){
              var aThing = thingsObj[i];
              var dId = aThing.thingId;
              if(dId){
                var aStr = menuListTemplate.apply(dId, dId);
                menuContent+=aStr;
              }
            }
          }

          menuDevices.html(menuContent);

          manageStatusAlert(sAlert, false, '');
        }
        else{
          manageStatusAlert(sAlert, true, '<span class=\"text-warning\">invalid json</span>');
        }
    };

    //---------------------------------------

    uilib.alwaysThings = function(data, txtStatus, jqXHR){

        var sAlert=$('#status-alert');

        if(jqXHR.status === 200){
          //manageCallbackResult(gUpdate, moment().format('YYYY-MM-DD hh:mm:ss'));
        }
        else{
          manageStatusAlert(sAlert, true, '<span class=\"text-danger\">ajax error : could not get list of devices</span>');
        }
    };

    //---------------------------------------
    // STATUS / CALLBACKS
    //---------------------------------------

    function manageCallbackResult(element, message){
      if(element){
        element.html(message);
      }
    }

    //---------------------------------------

    function manageStatusAlert(element, enable, message){
      if(element){
        if(enable){
          element.show();
        }
        else{
          element.hide();
        }

        if(message){
          element.html(message);
        }
      }
    }

}(window.uilib = window.uilib || {}, $));

//---------------------------------------
// DOCUMENT READY
//---------------------------------------

$(document).ready(function() {

  $(document).on('click', '.btn-led-status', function(e){
    var btnId = $(this).attr('id');

    if(btnId.indexOf('-on') >= 0){
        // console.log('request on');
        //on button
        uilib.requestLedStateChange(THING_ID, true);
    }
    else{
        // console.log('request off');
        //off button
        uilib.requestLedStateChange(THING_ID, false);
    }
    
    return false;
  });

  //---------------------------------------

  $(document).on('click', '#btn-select-device', function(e){
    //execute ajax to pull in device data
    uilib.getThings();
    return false;
  });

  //---------------------------------------

  $(document).on('click', '.btn-device', function(e){
     // console.log('btn-device entered');
     var deviceAgg = $(this).attr('id');
     //extract the device id and put it into THING_ID
     var deviceId = extractKey(deviceAgg, 1);
     if(deviceId){
        THING_ID = deviceId;
        //all the other events have to cascade off this choice
       
        //reset the intervals
        clearInterval(vInterval);
        clearInterval(lInterval);

        //volume
        vInterval = setInterval(function(){
          uilib.refreshData(THING_ID,'volume')
        }, 5000);
        
        //led
        lInterval = setInterval(function(){
          uilib.refreshData(THING_ID,'led')
        }, 5000);

        $('#current-thing').html(THING_ID);
     }
     return false;
  });

}); //end document ready

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

/**
 * utility function to enable/disable buttons
 * @param {object} elem - a jquery selected object
 * @param {boolean} enable - true to enable, false to disable
 */
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

/**
 * extension to the previous utility function to enable the element to off/on, if writeOff is true, then add the off class
 * @param {object} elem - a jquery selected object
 * @param {boolean} enable - true to enable, false to disable
 * @param {string} writeOff - the class
 */
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

/**
 * round to 2 significant digits
 * @param {number} num - the number to round
 */
function roundToTwo(num) {
    return +(Math.round(num + "e+2")  + "e-2");
}