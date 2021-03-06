import ConsoleTransport from 'logd-console-transport';
import log from 'ee-log';
import Service, { Controller } from '../index.js';
import section, { SpecReporter } from 'section-tests';
import ServiceManager from '@infect/rda-service-manager';
import assert from 'assert';
import path from 'path';




const appRoot = path.join(path.dirname(new URL(import.meta.url).pathname), '../');

section('Service Registering', (section) => {
    let sm;

    section.setup(async() => {
        sm = new ServiceManager({
            args: '--dev.testing --log-level=error+ --log-module=*'.split(' ')
        });
        
        await sm.startServices('rda-service-registry');
    });



    section.test('register service at the service registry', async() => {
        const serviceId = 'service-'+Math.round(Math.random()*100000);
        const service = new Service({
            name: serviceId,
            appRoot,
        });

        section.info('load service');
        await service.load();

        section.info('register service');
        await service.registerService('http://l.dns.porn:9000');

        // check if it was registered
        section.info('resolve service');
        const serviceInfo = await service.registryClient.resolve(serviceId);
        assert(serviceInfo);

        section.info('end service');
        await service.end(); 
    });




    section.destroy(async() => {
        await sm.stopServices();
    });
});