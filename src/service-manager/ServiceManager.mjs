'use strict';

import logd from 'logd';
import path from 'path';
import fs from 'fs-promise';
import Child from './Child';


const log = logd.module('service-manager');




export default class ServiceManager {


    constructor({
        args
    }) {
        this.args = args;
        this.services = new Map();
    }




    /**
    * stop some services
    */
    async stopServices(...serviceNames) {
        if (serviceNames.length) {
            // stop single services
            for (const serviceName of serviceNames) {
                if (this.services.has(serviceName)) {
                    await this.services.get(serviceName).stop();
                } else throw new Error(`Cannot stop service '${serviceName}', it was not started before!`);
            }
        } else {
            // stop all services
            for (const service of this.services.values()) {
                await service.stop();
            }
        }
    }




    /**
    * start services don't wait until are available
    */
    async startServices(...serviceNames) {

        // try to load all modules
        for (const serviceName of serviceNames) {
            const modulePath = await this.getModulePath(serviceName);

            if (this.services.has(serviceName)) throw new Error(`The service '${serviceName}' cannot be loaded, it is running already!`);

            this.services.set(serviceName, new Child({
                modulePath,
                args: this.args,
            }));
        }


        // looks god, create child processes
        for (const service of this.services.values()) {
            await service.load();
        }


        // looks god, start them
        for (const service of this.services.values()) {
            await service.start();
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

        return fs.access(sameLevelDir, fs.constants.F_OK).then(() => sameLevelDir).catch(() => {
            return fs.access(modulesDir, fs.constants.F_OK).then(() => modulesDir).catch(() => {
                throw new Error(`Module '${serviceName}' could not be found in folder '${sameLevelDir}' or '${modulesDir}'!`);
            });
        });
    }




    async startService(serviceName) {
        await this.startServices(serviceName);
    }
}