/**
 * Copyright (C) 2013
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
 * Author: Luis Román <lroman@emergya.com>
 */

/**
 * @requires plugins/Zoom.js
 * @require OpenLayers/Control/ZoomBox.js
 * @require GeoExt/widgets/Action.js
 */

/** api: (define)
 *  module = gxp.plugins
 *  class = Zoom
 */

/** api: (extends)
 *  plugins/Zoom.js
 */
Ext.namespace("gxp.plugins");

/** api: constructor
 *  .. class:: CustomZoom(config)
 *
 *    Provides actions for box zooming, zooming in and zooming out.
 */
gxp.plugins.CustomZoom = Ext.extend(gxp.plugins.Zoom, {

    /** api: ptype = gxp_zoom */
    ptype: "gxp_customzoom",

    /** private: method[constructor]
     */
    constructor: function(config) {
        gxp.plugins.CustomZoom.superclass.constructor.apply(this, arguments);
    },

    /** api: method[addActions]
     */
    addActions: function() {
        var actions = [{
                menuText: this.zoomInMenuText,
                iconCls: "gxp-icon-zoom-in",
                tooltip: this.zoomInTooltip,
                handler: function() {
                    this.target.mapPanel.map.zoomIn();
                },
                scope: this
            }, {
                menuText: this.zoomOutMenuText,
                iconCls: "gxp-icon-zoom-out",
                tooltip: this.zoomOutTooltip,
                handler: function() {
                    this.target.mapPanel.map.zoomOut();
                },
                scope: this
            }
        ];
        if (this.showZoomBoxAction) {
            actions.unshift(new GeoExt.Action({
                menuText: this.zoomText,
                iconCls: "gxp-icon-zoom",
                tooltip: this.zoomTooltip,
                control: new OpenLayers.Control.ZoomBox(this.controlOptions),
                map: this.target.mapPanel.map,
                enableToggle: true,
                allowDepress: true,
                toggleGroup: this.toggleGroup
            }));
        }
        // We skip the Zoom plugin and go directly to its parent.
        return gxp.plugins.Zoom.superclass.addActions.apply(this, [actions]);
    }

});

Ext.preg(gxp.plugins.CustomZoom.prototype.ptype, gxp.plugins.CustomZoom);