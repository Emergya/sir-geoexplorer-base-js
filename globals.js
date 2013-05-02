/**
 * Copyright (C) 2012
 *
 * This file is part of the project ohiggins
 *
 * This software is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation; either version 2 of the License, or (at your option) any
 * later version.
 *
 * This software is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this library; if not, write to the Free Software Foundation, Inc., 51
 * Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 *
 * As a special exception, if you link this library with other files to produce
 * an executable, this library does not by itself cause the resulting executable
 * to be covered by the GNU General Public License. This exception does not
 * however invalidate any other reasons why the executable file might be covered
 * by the GNU General Public License.
 *
 * Author: Antonio Hernández <ahernandez@emergya.com>
 */

Ext.ns(
    'Viewer.controller',
    'Viewer.store',
    'Viewer.widgets',
    'Viewer.dialog'
);

(function() {

    /**
     * Default precision for coordinates which are represented as decimal degrees.
     */
    Viewer.DEGREES_PRECISION = 8;

    /**
     * Default precision for coordinates which are represented in UTM.
     */
    Viewer.UTM_PRECISION = 8;

    /**
     * Default precision for the seconds component of coordinates represented as
     * degrees.
     */
    Viewer.SECONDS_PRECISION = 2;

    /**
     * Default projection for UTM coordinates.
     */
    Viewer.UTM_PROJECTION = 'EPSG:32719';

    /**
     * Default projection for geographics coordinates.
     */
    Viewer.GEO_PROJECTION = 'EPSG:4326';

    /**
     * Object to store components to be instantiated only once.
     * Use Viewer.getComponent() to retrieve them.
     */
    var __components__ = {};

    /**
     * Array of instantiated controllers.
     * Use Viewer.getController() to retrieve them.
     */
    var __controllers__ = {};


    /**
     * Base URL for AJAX requests.
     */
    var base_url = (function() {
        return '${protocol}//${host}'
            .replace('${protocol}', location.protocol)
            .replace('${host}', location.host);
    })();

    /**
     * Returns an absolute URL.
     */
    Viewer.formatUrl = function(path) {
        if (path.search(/^[^:]+:\/\/[^\/:]+(:\d*)*/) == 0) {
            // TODO: Improve this regexp.
            return path;
        }
        return '${base_url}/${path}'
            .replace('${path}', path)
            .replace(/(\/)+/g, '/')
            .replace('${base_url}', base_url);
    };

    /**
     * Returns a list of components of the specified xtype.
     */
    Viewer.getByXType = function(xtype) {
        var items = Ext.ComponentMgr.all.filterBy(function(item) {
            return item.getXType() == xtype;
        });
        return items;
    };

    /**
     * Returns a list of components of the specified class name.
     */
    Viewer.getByClass = function(className) {
        var items = Ext.ComponentMgr.all.filterBy(function(item) {
            try {
                return item.getEl().hasClass(className);
            } catch(e) {
                return false;
            }
        });
        return items;
    };

    /**
     * Register a component in the components object.
     */
    Viewer.registerComponent = function(id, component) {
        if (__components__[id] === undefined) {
            __components__[id] = component;
        }
    };

    /**
     * Unregisters a component.
     */
    Viewer.unregisterComponent = function(id) {
        if (__components__[id] === undefined) {
            throw new Error("unregisterComponent: Compoonent "+id+" wasn't previously registered.");            
        } else {
            __components__[id] = undefined;
        }
    }

    /**
     * Retrieve a component from the components object.
     */
    Viewer.getComponent = function(id) {
        return __components__[id] || undefined;
    };

    /**
     * Retrieve a controller from the controllers object.
     */
    Viewer.getController = function(id) {
        if (__controllers__[id] === undefined) {
            var klass = Viewer.controller[id];
            __controllers__[id] = new klass();
        }
        return __controllers__[id];
    };

    /**
     * Retrieve the MapPanel object.
     */
    Viewer.getMapPanel = function() {
        try {
            return window.app.mapPanel;
        } catch(e) {
            return null;
        }
    };

    /**
     * Retrieve the layer selector tree.
     */
    Viewer.getLayerSelector = function() {
        try {
            return Viewer.viewport.layerSelector;
        } catch(e) {
            return null;
        }
    };

    /**
     * Retrieve the currently selected layer.
     */
    Viewer.getSelectedLayer = function() {
        try {
            return window.app.selectedLayer.getLayer();
        } catch(e) {
            return null;
        }
    };

    /**
     * Call the StatsController to track the URL
     * passed as parameter.
     */
    Viewer.trackUrl = function(url) {
        Ext.Ajax.request({
            url: 'proxy/?url=http://localhost:8080/sir-ohiggins/stats/' + url,
            method: 'POST',
            disableCaching: false            
        });
    };

})();
