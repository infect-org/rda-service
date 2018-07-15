'use strict';


import Response from './Response';



class ChildProcess {


    constructor() {
        process.on('message', this.request.bind(this));

        // make sure to exit when the parent dies
        process.on('disconnect', () => {
            this.stopService();
        });
    }




    /**
    * start the service by loading the module
    */
    async startService(data, response) {
        const modulePath = data.modulePath;
        const ServiceConstructor = (await import(modulePath)).default;

        this.service = new ServiceConstructor(); 
        await this.service.load();

        response.send({
            status: 'ok',
            port: this.service.getPort()
        });
    }




    /**
    * stop the service
    */
    async stopService(data, response) {
        if (this.service) await this.service.end();
        
        if (response) {
            response.send({
                status: 'ok'
            });
        }

        setImmediate(() => {
            process.exit();
        });
    }





    /**
    * messages sent from the parent process
    */
    request(message) {
        const data = message.data;
        const response = new Response(message, this);

        if (typeof this[message.action] === 'function') {
            this[message.action](message.data, response).catch((err) => {
                response.error(err);
            });
        } else response.error(`Unknown action ${message.action}!`);
    }





    /**
    * tell the parent that we're ready
    */
    load() {
        this.send({
            action: 'childReady'
        });
    }





    /**
    * send message back to the parent
    */
    send(message) {
        process.send(message);
    }
}



const child = new ChildProcess();
child.load();
