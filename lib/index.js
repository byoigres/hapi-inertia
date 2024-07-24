const internals = {
    inertia: {}
};

exports.plugin = {
    multiple: false,
    pkg: require('../package.json'),
    requirements: {
        hapi: '>=20.0.0',
        node: '>=20.15.1'
    },
    dependencies: {
        '@hapi/vision': '>=7.0.3'
    },
    register: function (server, options) {
        console.log({ options })
        server.decorate("toolkit", "inertia", internals.inertia)
    }
};

internals.inertia = async function (component, props = {}, viewData = {}) {
    const page = {
        version: 1,
        component,
        props: props,
        url: this.request.url
    };

    const allProps = { ...page.props };

    let dataKeys = Object.keys(allProps);

    if (this.request.headers["x-inertia-partial-data"] &&
        this.request.headers["x-inertia-partial-component"] === component) {
        dataKeys = this.request.headers["x-inertia-partial-data"].split(",")
    }

    for (const key of dataKeys) {
        if (typeof allProps[key] === "function") {
            page.props[key] = await allProps[key]();
        } else {
            page.props[key] = allProps[key];
        }
    }

    if (this.request.headers["x-inertia"]) {
        const response = this.request.generateResponse(page);
        response.header("X-Inertia", "true");
        response.header("Vary", "Accept");
        response.type('application/json');
        response.code(200);
        return response;
    } else {
        viewData = { __inertia_page__: page, ...viewData }
        return this.view('index', viewData);
    }
}