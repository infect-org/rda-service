'use strict';




export default class Response {


    constructor(message, child) {
        this.message = message;
        this.child = child;
    }




    send(data) {
        this.child.send({
            id: this.message.id,
            data: data,
        });
    }




    error(err) {
        if (typeof err === 'string') err = new Error(err);

        this.child.send({
            id: this.message.id,
            err: {
                name: err.name,
                message: err.message,
                stack: err.stack,
            },
        });
    }
}