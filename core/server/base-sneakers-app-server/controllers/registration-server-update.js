const EventEmitter = require('events');
class RegistrationServerUpdate extends EventEmitter {
    notify(newRegistrationServerUrl) {
        console.log('Sending message to update notification server Url.')
        this.emit('new-server-url', {url: newRegistrationServerUrl});
      }

}

const registrationServerUpdate = new RegistrationServerUpdate();
module.exports = registrationServerUpdate;