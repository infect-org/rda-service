import { Controller } from '../index.mjs';
import section, { SpecReporter } from 'section-tests';

// set up console reporter
section.use(new SpecReporter());




section('Controller', (section) => {

    section.test('Create instance', async() => {
        new Controller('test');
    });


    section.test('Execute load', async() => {
        const controller = new Controller('test');
        await controller.load();
    });


    section.test('Enable action', async() => {
        const controller = new Controller('test');

        controller.enableAction('test');

        await controller.load();
    });
});