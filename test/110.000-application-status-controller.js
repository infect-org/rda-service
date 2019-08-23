import Service from '../index.js';
import section from 'section-tests';
import HTTP2Client from '@distributed-systems/http2-client';
import log from 'ee-log';
import assert from 'assert';
import path from 'path';



const appRoot = path.join(path.dirname(new URL(import.meta.url).pathname), '../');


section('Service Status', (section) => {

    section.test('get service status', async() => {
        const service = new Service({
            name: 'test',
            appRoot,
        });
        
        const httpClient = new HTTP2Client();

        section.info('load service');
        await service.load();

        await section.wait(1100);

        section.info('get status');
        const response = await httpClient.get(`http://l.dns.porn:${service.getPort()}/test.application-status`).expect(200).send();

        const data = await response.getData();
        
        assert(data);
        assert.equal(data.uptime, 1);

        section.info('end service');
        await service.end(); 
        await httpClient.end();
    });
});