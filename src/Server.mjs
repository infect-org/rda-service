'use strict';


import express from 'express';
import logd from 'logd';
import bodyParser from 'body-parser';
import getPort from 'get-port';



const log = logd.module('server');




export default class Server {


    constructor() {
        this.app = express();

        // disable crappy crap. e.g. don't send 
        // etags, some behaviors are crazy like
        // caching of cors requests.
        this.app.set('etag', false);
        
        // add english as default language
        this.app.use((req, res, next) => {
            req.headers['accept-language'] += ',en; q=.1';
            next();
        });


        // accept json bodies
        this.app.use(bodyParser.json());

        // enable cors requests
        this.enableCORS();

        // get port from args
        const portConfig = process.argv.find(item => item.startsWith('--port='));
        this.port = portConfig ? parseInt(portConfig.substr(7), 10) : false;


    }





    /**
    * give responses to cors requests
    */
    enableCORS() {
        this.app.use(function(req, res, next) {
            res.header('Access-Control-Allow-Origin', (req.headers.origin || '*'));
            res.header('Access-Control-Allow-Headers', 'select, filter');
            res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.header('Access-Control-Allow-Credentials', 'true');

            if (req.method === 'options') res.status(200).end();
            else next();
        });
    }




    /**
    * start the web server, use the port passed by the --port argv
    * or the port passed to the function or a random free port
    */
    async listen(port) {
        this.port = this.port || port || await getPort();

        return new Promise((resolve, reject) => {
            this.server = this.app.listen(this.port, (err) => {
                if (err) reject(err);
                else resolve(this.port);
            });
        });
    }





    /**
    * shut down the server
    */
    close() {
        if (this.server) {
            return new Promise((resolve, reject) => {
                 this.server.close((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }
    }





    /**
    * returns the express app
    */
    getApp() {
        return this.app;
    }
}
