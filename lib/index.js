const Hoek = require('@hapi/hoek');

const internals = {
    inertia: {}
};

exports.plugin = {
    multiple: false,
    pkg: require('../package.json'),
    requirements: {
        hapi: '>=20.0.0',
        node: '>=20.13.1'
    },
    dependencies: {
        '@hapi/vision': '>=7.0.3'
    },
    register: function (server, options) {
        console.log({ options });

        // Use Hoek to apply defaults and validate options
        const defaultOptions = {
            defaultTemplate: 'index',
            sharedProps: (_request) => ({})
        };
        options = Hoek.applyToDefaults(defaultOptions, options);

        // Validate that sharedProps is a function
        Hoek.assert(typeof options.sharedProps === 'function', 'sharedProps must be a function');

        // Decorate the toolkit with the inertia function, passing options as a closure
        server.decorate("toolkit", "inertia", internals.inertia(options));
    }
};

internals.inertia = function (pluginOptions) {
    return async function (component, props = {}, viewData = {}) {
        const page = {
            version: 1,
            component,
            props: props,
            url: this.request.url
        };

        // Access the sharedProps and defaultTemplate from pluginOptions
        const sharedProps = await pluginOptions.sharedProps(this.request);
        const defaultTemplate = pluginOptions.defaultTemplate;

        const allProps = { ...sharedProps, ...page.props };

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
            return response.takeover();
        } else {
            viewData = { __inertia_page__: page, ...viewData }
            return this.view(defaultTemplate, viewData).takeover();
        }
    };
};
