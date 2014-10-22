/**
 * This file contains utility functions for general use in the application
 */
girder.DATE_MONTH = 0;
girder.DATE_DAY = 1;
girder.DATE_MINUTE = 2;
girder.DATE_SECOND = 3;

/**
 * Format a date string to the given resolution.
 * @param datestr The date string to format.
 * @param resolution The resolution, defaults to 'day'. Minimum is month.
 */
girder.formatDate = function (datestr, resolution) {
    datestr = datestr.replace(' ', 'T'); // Cross-browser accepted date format
    var date = new Date(datestr);
    var output = girder.MONTHS[date.getMonth()];

    resolution = resolution || girder.DATE_MONTH;

    if (resolution >= girder.DATE_DAY) {
        output += ' ' + date.getDate() + ',';
    }

    output += ' ' + date.getFullYear();

    if (resolution >= girder.DATE_MINUTE) {
        output += ' at ' + date.getHours() + ':' +
            ('0' + date.getMinutes()).slice(-2);
    }
    if (resolution >= girder.DATE_SECOND) {
        output += ':' + ('0' + date.getSeconds()).slice(-2);
    }

    return output;
};

/**
 * Format a size in bytes into a human-readable string with metric unit prefixes.
 */
girder.formatSize = function (sizeBytes) {
    // If it's > 1GB, report to two decimal places, otherwise just one.
    var precision = sizeBytes > 1073741824 ? 2 : 1;

    // If we are just reporting bytes, no need for decimal places.
    if (sizeBytes < 1024) {
        precision = 0;
    }

    var i;
    for (i = 0; sizeBytes >= 1024; i += 1) {
        sizeBytes /= 1024;
    }

    return sizeBytes.toFixed(precision) + ' ' +
        ['B', 'KB', 'MB', 'GB', 'TB'][i];
};

/**
 * Prompt the user to confirm an action.
 * @param [text] The text to prompt the user with.
 * @param [yesText] The text for the confirm button.
 * @param [yesClass] Class string to apply to the confirm button.
 * @param [noText] The text for the no/cancel button.
 * @param [escapedHtml] If you want to render the text as HTML rather than
 *        plain text, set this to true to acknowledge that you have escaped any
 *        user-created data within the text to prevent XSS exploits.
 * @param confirmCallback Callback function when the user confirms the action.
 */
girder.confirm = function (params) {
    params = _.extend({
        text: 'Are you sure?',
        yesText: 'Yes',
        yesClass: 'btn-danger',
        noText: 'Cancel',
        escapedHtml: false
    }, params);
    $('#g-dialog-container').html(jade.templates.confirmDialog({
        params: params
    })).girderModal(false);

    var el = $('#g-dialog-container').find('.modal-body>p');
    if (params.escapedHtml) {
        el.html(params.text);
    } else {
        el.text(params.text);
    }

    $('#g-confirm-button').unbind('click').click(function () {
        $('#g-dialog-container').modal('hide');
        params.confirmCallback();
    });
};

/**
 * This comparator can be used by collections that wish to support locale-based
 * sorting.  The locale specifies how upper and lower case are compared.
 */
girder.localeComparator = function (model1, model2) {
    var a1 = model1.get(this.sortField),
        a2 = model2.get(this.sortField);

    if (a1 !== undefined && a1.localeCompare) {
        var result = a1.localeCompare(a2) * this.sortDir;
        if (result || !this.secondarySortField) {
            return result;
        }
        a1 = model1.get(this.secondarySortField);
        a2 = model2.get(this.secondarySortField);
        return a1.localeCompare(a2) * this.sortDir;
    }

    return a1 > a2 ? this.sortDir : (a1 < a2 ? -this.sortDir : 0);
};

/**
 * This comparator can be passed to the sort function on javascript arrays.
 */
girder.localeSort = function (a1, a2) {
    if (a1 !== undefined && a1.localeCompare) {
        return a1.localeCompare(a2);
    }
    return a1 > a2 ? 1 : (a1 < a2 ? -1 : 0);
};

/**
 * Return the model class name given its collection name.
 * @param name Collection name, e.g. 'user'
 */
girder.getModelClassByName = function (name) {
    var className = name.charAt(0).toUpperCase();
    return className + name.substr(1) + 'Model';
};

girder.parseQueryString = function (queryString) {
    var params = {};
    if (queryString) {
        _.each(
            _.map(decodeURI(queryString).split(/&/g), function (el, i) {
                var aux = el.split('='), o = {};
                if (aux.length >= 1) {
                    var val;
                    if (aux.length === 2) {
                        val = aux[1];
                    }
                    o[aux[0]] = val;
                }
                return o;
            }),
            function (o) {
                _.extend(params, o);
            }
        );
    }
    return params;
};

girder.cookie = {
    findAll: function () {
        var cookies = {};
        _(document.cookie.split(';'))
            .chain()
            .map(function (m) {
                return m.replace(/^\s+/, '').replace(/\s+$/, '');
            })
            .each(function (c) {
                var arr = c.split('='),
                    key = arr[0],
                    value = null,
                    size = _.size(arr);
                if (size > 1) {
                    value = arr.slice(1).join('');
                }
                cookies[key] = value;
            });
        return cookies;
    },

    find: function (name) {
        var cookie = null,
            list = this.findAll();

        _.each(list, function (value, key) {
            if (key === name) {
                cookie = value;
            }
        });
        return cookie;
    }
};

(function () {
    var _pluginConfigRoutes = {};

    /**
     * Expose a plugin configuration page via the admin plugins page.
     * @param pluginName The canonical plugin name, i.e. its directory name
     * @param route The route to trigger that will render the plugin config.
     */
    girder.exposePluginConfig = function (pluginName, route) {
        _pluginConfigRoutes[pluginName] = route;
    };

    girder.getPluginConfigRoute = function (pluginName) {
        return _pluginConfigRoutes[pluginName];
    };
}());
