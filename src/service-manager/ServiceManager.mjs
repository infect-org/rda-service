'use strict';

import logd from 'logd';
import path from 'path';
import fs from 'fs';
import Child from './Child';


const log = logd.module('service-manager');




export default class ServiceManager {


    constructor({
        args
    }) {
        this.args = args;
        this.services = new Set();
    }




    /**
    * stop some services
    */
    async stopServices() {

        // stop all services, make sure to do this in reverse order
        const services = [...this.services.values()].reverse();
        for (const service of services) {
            await service.stop();
        }
    }





    /**
    * start services don't wait until are available
    */
    async startServices(...serviceNames) {

        // try to load all modules
        for (const serviceName of serviceNames) {
            const modulePath = await this.getModulePath(serviceName);

            this.services.add(new Child({
                modulePath,
                args: this.args,
            }));
        }

        // looks god, create child processes
        for (const service of this.services.values()) {
            if (!service.loaded) await service.load();
        }


        // looks god, start them
        for (const service of this.services.values()) {
            if (!service.started) await service.start();
        }
    }






    /**
    * looks if a given package can be found on the
    * same level as the current package or in the node
    * modules folder.
    */
    async getModulePath(serviceName) {
        const sameLevelDir = path.join(process.cwd(), '../', serviceName);
        const modulesDir = path.join(process.cwd(), 'node_modules', serviceName);

        return this.fileExists(sameLevelDir).catch(() => {
            return this.fileExists(modulesDir).catch(() => {
                throw new Error(`Module '${serviceName}' could not be found in folder '${sameLevelDir}' or '${modulesDir}'!`);
            });
        });
    }



    fileExists(file) {
        return new Promise((resolve, reject) => {
            fs.access(file, fs.constants.F_OK, (err) => {
                if (err) reject(err);
                else resolve(file);
            });
        });
    }




    async startService(serviceName) {
        await this.startServices(serviceName);
    }
}