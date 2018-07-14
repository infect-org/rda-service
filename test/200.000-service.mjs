'use strict';

import ConsoleTransport from 'logd-console-transport';
import logd from 'logd';
import Service, {Controller} from '../index.mjs';
import section, {SpecReporter} from 'section-tests';


logd.transport(new ConsoleTransport());



section('Service', (section) => {

    section.test('Create instance', async() => {
        new Service('test');
    });



    section.test('Execute load, execute end', async() => {
        const service = new Service('test');

        section.info('load service');
        await service.load();

        section.info('end service');
        await service.end(); 
    });




    section.test('load a controller', async() => {
        const service = new Service('test');

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