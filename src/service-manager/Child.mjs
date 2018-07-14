'use strict';


import cp from 'child_process';
import path from 'path';




export default class Child {


    constructor({
        modulePath,
        args = []
    }) {
        this.args = args;
        this.modulePath = modulePath;
        this.messages = new Map();
    }




    /**
    * start children
    */
    async load() {
        const promise = new Promise((resolve) => {
            this.resolveReady = resolve;
        });


        this.child = cp.fork(path.join(this.dirname(), 'ChildProcess.mjs'), this.args);

        this.child.on('exit', () => {
            for (const {reject} of this.messages.values()) reject(new Error(`Child process exited!`));
        });

        this.child.on('message', (message) => {
            this.incomingMessage(message);
        });

        return promise;
    }





    async start() {
        return await this.send('startService', {
            modulePath: this.modulePath
        });
    }





    async stop() {
        return await this.send('stopService');
    }






    /**
    * called by the child
    */
    childReady() {
        this.resolveReady();
    }





    /**
    * incoming messages
    */
    incomingMessage(message) {
        if (this.messages.has(message.id)) {
            const {resolve, reject} = this.messages.get(message.id);
            if (message.err) reject(message.err);
            else resolve(message.data);
        } else {

            if (typeof this[message.action] === 'function') {
                this[message.action](message.data);
            } else throw new Error(`Unknown action ${message.action}!`);
        }
    }






    /**
    * send message back to the parent
    */
    send(action, data) {
        const id = this.getId();
        const promise = new Promise((resolve, reject) => {
            this.messages.set(id, {
                resolve,
                reject,
            });
        });

        
        this.child.send({
            id,
            action,
            data,
        });


        return promise;
    }





    /**
     * get the next message id
     */
    getId() {
        if (!this.index || this.index === Number.MAX_SAFE_INTEGER) this.index = 0;
        
        this.index++;
        
        return this.index;
    }




    /**
    * returns the current directory for this class
    */
    dirname() {
        return path.dirname(new URL(import.meta.url).pathname);
    }
}