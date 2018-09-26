import envr from 'envr';
import path from 'path';
import type from 'ee-types';
import ApplicationStatusController from './controllers/ApplicationStatus';
import HTTP2Client from '@distributed-systems/http2-client';
import logd from 'logd';
import RegistryClient from '@infect/rda-service-registry-client';
import rootPath from 'app-root-path';
import Server from './Server.mjs';



const log = logd.module('rda-service');



export default class Service {


    constructor(name) {
        if (!name) throw new Error(`Canont create service: missing parameter 'name'!`);
        log.debug(`Setting up the service '${name}'' ...`);

        this.name = name;
        this.controllers = new Map();

        // shared http client for all controllers
        this.httpClient = new HTTP2Client();

        this.actionPatterns = new Map([
            ['list', {
                url: '/${service}.${resource}',
                action: 'get',
                defaultStatus: 200,
            }],
            ['listOne',  {
                url: '/${service}.${resource}/:id',
                action: 'get',
                defaultStatus: 200,
            }],
            ['create',  {
                url: '/${service}.${resource}',
                action: 'post',
                defaultStatus: 201,
            }],
            ['createOrUpdate',  {
                url: '/${service}.${resource}/:id?',
                action: 'put',
                defaultStatus: 200,
            }],
            ['update',  {
                url: '/${service}.${resource}/:id',
                action: 'patch',
                defaultStatus: 200,
            }],
            ['delete',  {
                url: '/${service}.${resource}/:id',
                action: 'delete',
                defaultStatus: 200,
            }]
        ]);

        
        // load config file
        this.loadConfig(rootPath.path);


        // set up the registry client
        this.registryClient = new RegistryClient(this.config && this.config.registryHost);
    }




    /**
    * returns the servicename
    */
    getName() {
        return this.name;
    }




    /**
    * register this service at the service registry
    */
    async registerService() {
        this.serviceIsRegistered = true;
        await this.registryClient.register({
            serviceName: this.getName(),
            port: this.getPort(),
        });
    }




    /**
    * add a controller that needs to be registered
    */
    registerController(controllerInstance) {
        const controllerName = controllerInstance.getName();

        if (!this.controllers.has(controllerName)) {
            log.info(`Registering controller '${controllerName}' for service '${this.name}'' ...`);
            this.controllers.set(controllerName, controllerInstance);
        } else {
            throw new Error(`Cannot register controller ${controllerName}, it was alread registered before!`);
        }
    }





    /**
    * load the config, initialize all components
    */
    async load(port) {
        const options = {
            registryClient: this.registryClient
        };

        // register our status controller
        this.registerController(new ApplicationStatusController(options));

        // load the webserver
        await this.creatServer();

        // load the controllers
        await this.loadControllers();

        // start the webserver
        await this.server.listen(port);

        

        // set th servers port on the registry client
        this.registryClient.setPort(this.getPort());
    }





    /**
    * load controllers
    */
    async loadControllers() {
        const router = this.server.getRouter();


        for (const controller of this.controllers.values()) {
            const controllerName = controller.getName();

            log.info(`Loading controller '${controllerName}' for service '${this.name}'' ...`);


            // use the same http client on all controllers
            controller.setHttpClient(this.httpClient);


            // load the controller
            await controller.load();

            // get all available actions
            const enabledActions = controller.getEnabledActionNames();


            // register the routes for all actions
            for (const actionName of enabledActions.values()) {
                if (this.actionPatterns.has(actionName)) {
                    const action = this.actionPatterns.get(actionName);

                    // get a valid express url
                    const url = this.compileURLPattern(action.url, {
                        resource: controllerName,
                        service: this.name,
                    });

                    log.debug(`Registering route '${url}' for action '${actionName}' (method ${action.action}) on controller '${controllerName}' for service '${this.name}'' ...`);


                    // register on app
                    router[action.action](url, (request) => {
                        if (type.function(controller[actionName])) {

                            // call the action handler on the controller
                            controller[actionName](request).then((data) => {

                                // check if the response was already sent, if not, 
                                // send it now with the status defined by the action
                                // configuration
                                if (!request.response().isSent()) {
                                    if (typeof data === 'object' && data !== null && typeof data.toJSON === 'function') data = data.toJSON();
                                    
                                    request.response().status(action.defaultStatus).send(data);
                                }
                            }).catch((err) => {
                                log.error(`Encountered an error while processing the '${actionName}' action for the controller '${controllerName}' on the service '${this.name}':`, err);

                                // send the error to the client if the response wasn't sent yet
                                if (!request.response().isSent()) {
                                    request.response.status(500).send(err.message);
                                }
                            });
                        } else {
                            request.response().status(500).send(`Cannot route request: the action ${actionName} does not exist on the controller ${controllerName}!`);
                            throw new Error(`Cannot route request: the action ${actionName} does not exist on the controller ${controllerName}!`);
                        }
                    });
                } else {
                    throw new Error(`The action ${actionName} for the controller ${controllerName} is not a valid action!`);
                }
            }
        }
    }






    /**
    * fill in details in action url patters
    */
    compileURLPattern(url, values) {
        let result;

        while(result = /\{([^\}]+)\}/gi.exec(url)) {
            const paramterName = result[1];
            if (!type.undefined(values[paramterName])) {
                url = url.replace('${'+paramterName+'}', values[paramterName]);
            } else throw new Error(`Cannot replace parameter ${paramterName} with value, the value was not passed to the url patter compiler!`);
        }

        return url;
    }






    /**
    * shut down the service
    */
    async end() {
        if (this.serviceIsRegistered) await this.registryClient.deregister();
        await this.server.close();
    }



    /**
    * returns the apps root directory
    */
    getRootDir() {
        return rootPath.path;
    }



    /**
    * get the webservers port
    */
    getPort() {
        return this.server.port;
    }




    /**
    * start the webserver
    */
    async creatServer() {
        this.server = new Server();

        // get the app
        this.httpServer = this.server.getServer();
    }





    /**
    * load the configuration files from the /config directory
    * and secrets from the /secrets.${env}.js file
    */
    loadConfig(rootDir) {

        // load the config files for the application
        this.config = envr.config(path.join(rootDir, '/config/'), rootDir);
    }
}