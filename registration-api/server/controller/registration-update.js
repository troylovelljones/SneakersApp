const EventEmitter = require('events');
class RegistrationUpdate extends EventEmitter {
    notify(newRegistrationServerUrl) {
        console.log('Sending message to update notification server Url.')
        this.emit('new-server-url', {url: newRegistrationServerUrl});
      }

}

const registrationUpdate = new RegistrationUpdate();
module.exports = registrationUpdate;