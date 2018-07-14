'use strict';


import Controller from '../Controller';
import logd from 'logd';


const log = logd.module('rda-service');



export default class ApplicationStatusController extends Controller {


    constructor() {
        super('application-status');
        this.enableAction('list');
        this.started = new Date();
    }





    /**
    * register a new service
    */
    async list(request, response) {
        return {
            status: 'ready',
            uptime: Math.round((Date.now()-this.started.getTime())/1000),
            started: this.started.toISOString(),
        };
    }
}