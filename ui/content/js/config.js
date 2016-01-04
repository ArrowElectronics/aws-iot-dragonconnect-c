//---------------------------------------
// CONFIG FILE
//---------------------------------------

//debug locally
var DEBUG=false;

//control where ajax calls are made to
var DB_API='';

//placeholder to store the thingId
//we go against the thing registry to see what things are available and store it here
var THING_ID='';

//refresh times
//times are in ms. 1000 ms = 1 second
//NOTE: due to limitations of AWS, we can poll faster, but it will require rate throttling changes on Amazon side
var VOLUME_REFRESH_INTERVAL = 5000;
var LED_REFRESH_INTERVAL = 3000;