'use strict';

import ConsoleTransport from 'logd-console-transport';
import log from 'ee-log';
import Service, {Controller} from '../index.mjs';
import section, {SpecReporter} from 'section-tests';
import ServiceManager from '../src/service-manager/ServiceManager';
import assert from 'assert';




section('Service Registering', (section) => {
    let sm;

    section.setup(async() => {
        sm = new ServiceManager({
            args: '--dev --log-level=error+ --log-module=*'.split(' ')
        });
        
        
        await sm.startServices('rda-service-registry');
    });



    section.test('register service at the service registry', async() => {
        const serviceId = 'service-'+Math.round(Math.random()*100000);
        const service = new Service(serviceId);

        section.info('load service');
        await service.load();

        section.info('load service');
        await service.registerService('http://l.dns.porn:9000');

        // check if it was registered
        const serviceInfo = await service.registryClient.resolve(serviceId);
        assert(serviceInfo);

        section.info('end service');
        await service.end(); 
    });



    section.destroy(async() => {
        await sm.stopServices();
    });
});