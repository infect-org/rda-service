import ConsoleTransport from 'logd-console-transport';
import logd from 'logd';
import Service, { Controller } from '../index.js';
import section, { SpecReporter } from 'section-tests';
import path from 'path';


logd.transport(new ConsoleTransport());

const appRoot = path.join(path.dirname(new URL(import.meta.url).pathname), '../');

section('Service', (section) => {

    section.test('Create instance', async() => {
        new Service({
            name: 'test',
            appRoot,
        });
    });



    section.test('Execute load, execute end', async() => {
        const service = new Service({
            name: 'test',
            appRoot,
        });

        section.info('load service');
        await service.load();

        section.info('end service');
        await service.end(); 
    });




    section.test('load a controller', async() => {
        const service = new Service({
            name: 'test',
            appRoot,
        });

        section.info('create & register controller');
        const controller = new Controller('user');

        // enable an action
        controller.enableAction('listOne');

        // register at the service
        service.registerController(controller);


        section.info('load service');
        await service.load();


        section.info('end service');
        await service.end(); 
    });
});