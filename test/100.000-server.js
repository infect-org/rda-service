import {Server, Controller} from '../index.js';
import section, { SpecReporter } from 'section-tests';


section('Server', (section) => {
    section.test('Create instance', async() => {
        new Server();
    });


    section.test('Create listen & close', async() => {
        const server = new Server();

        section.info('listen');
        await server.listen(6380);

        section.info('close');
        await server.close();
    });
});