var hosts = require('../config/hosts');
var config = require('../config/general');

var services = null;

/**
 * Returns exiting services from persistance repository (or config file)
 * It also normalises the configuration based on service + host config.
 * @param  {Function} cb 
 */
module.exports.load_services = function (cb){

  // Now this function is reading from the config file but 
  // eventually services can be persisted in a database or fetched form a remote server

  if (services) { //cache services collection
    return cb(null, services);
  }

  services = [];

  hosts.forEach (function(host){

    host.protocol = host.protocol || 'http';

    host.services.forEach(function(service){
      service.host = host;
      delete service.host.services; //avoid circular references

      //friendly display
      service.url_info = host.name + ' - ' + host.host + ':'+ host.port  + ' / ' + service.name;

      service.warning_if_takes_more_than = service.warning_if_takes_more_than || host.warning_if_takes_more_than;

      service.remove_events_older_than_seconds = service.remove_events_older_than_seconds || host.remove_events_older_than_seconds || config.remove_events_older_than_seconds;

      service.ping_interval = service.ping_interval || host.ping_interval || 60;

      // default set to 1/3 of ping_interval
      service.failed_ping_interval = service.failed_ping_interval || host.failed_ping_interval || (service.ping_interval / 3);

      service.alert_to = service.alert_to || host.alert_to || [];

      service.ping_service_name = service.ping_service_name || host.ping_service_name || 'http';

      service.ping_service = require('./ping_services/' + service.ping_service_name);

      service.timeout = service.timeout || host.timeout || 10000; // default to 10 seconds.

      if (service.enabled === undefined){ //no enabled config found for service
        service.enabled = host.enabled;
      }

      if (service.enabled === undefined){ //no enabled config found for host
        service.enabled = true;
      }

      if (service.restrictedTo === undefined){
        service.restrictedTo = host.restrictedTo;
      }

      services.push (service);
    });
  });

  cb(null, services);
};