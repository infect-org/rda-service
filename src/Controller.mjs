export default class Controller {

    


    constructor(name) {
        if (!name) throw new Error(`Canont create controller: missing parameter 'name'!`);
        this.name = name;

        this.enabledActions = new Set();
    }




    /**
    * returns the names of all enabled actions
    */
    getEnabledActionNames() {
        return this.enabledActions;
    }




    /**
    * returns the name of the controller
    */
    getName() {
        return this.name;
    }




    /**
    * enable an action
    */
    enableAction(actionName) {
        if (this.loaded) throw new Error(`Cannot enable action '${actionName}, the controller '${this.getName()}' was already loaded!`);
        if (!actionName) throw new Error(`Cannot enable action '${actionName}' for the controller '${this.getName()}', the action name is invalid!`);

        this.enabledActions.add(actionName);
    }




    /**
     * Sets the http client.
     *
     * @param      {HTTP2Client}  httpClient  The http client
     */
    setHttpClient(httpClient) {
        this.httpClient = httpClient;
    }




    getClient() {
        return this.httpClient;
    }



    /**
    * controllers can load stuff
    */
    async load() {
        this.loaded = true;
    }
}