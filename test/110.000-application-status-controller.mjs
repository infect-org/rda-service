'use strict';

import Service from '../index.mjs';
import section from 'section-tests';
import superagent from 'superagent';
import log from 'ee-log';
import assert from 'assert';



section('Service Status', (section) => {

    section.test('get service status', async() => {
        const service = new Service('test');

        section.info('load service');
        await service.load();

        await section.wait(1100);

        section.info('get status');
        const response = await superagent.get(`http://l.dns.porn:${service.getPort()}/test.application-status`).ok(res => res.status === 200).send();

        assert(response.body);
        assert.equal(response.body.uptime, 1);

        section.info('end service');
        await service.end(); 
    });
});