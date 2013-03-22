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

/**
 * @requires plugins/Tool.js
 */

/** api: (define)
 *  module = gxp.plugins
 *  class = ZoomToInitialValues
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("gxp.plugins");

/** api: constructor
 *  .. class:: ZoomToInitialValues(config)
 *
 *    Provides an action for zooming and centering to initial values.  If not configured with a 
 *    specific zoom and center, the action will zoom to the map's current zoom and current center.
 */
gxp.plugins.ZoomToInitialValues = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = gxp_zoomtoinitialvalues */
    ptype: "gxp_zoomtoinitialvalues",
    
    /** api: config[buttonText]
     *  ``String`` Text to show next to the zoom button
     */
     
    /** api: config[menuText]
     *  ``String``
     *  Text for zoom menu item (i18n).
     */
    menuText: "Zoom To Initial Values",

    /** api: config[tooltip]
     *  ``String``
     *  Text for zoom action tooltip (i18n).
     */
    tooltip: "Zoom To Initial Values",
    
    /** api: config[center]
     *  ``Array | OpenLayers.LonLat``
     *  The target center.  If none is provided, the map's current center will 
     *  be used.
     */
    center: null,

    /** api: config[zoom]
     *  ``Integer``
     *  The target zoom.  If none is provided, the map's current zoom will 
     *  be used.
     */
    zoom: null,
    
    /** private: property[iconCls]
     */
    iconCls: 'vw-icon-initial-view',
    
    /** private: method[constructor]
     */
    constructor: function(config) {
        gxp.plugins.ZoomToInitialValues.superclass.constructor.apply(this, arguments);
    },

    /** api: method[addActions]
     */
    addActions: function() {
        if (this.center === null) {
            this.center = this.target.mapPanel.map.getCenter();
        } else if (this.center instanceof Array) {
            this.center = new OpenLayers.LonLat(this.center);
        }
        if (this.zoom === null) {
            this.zoom = this.target.mapPanel.map.getZoom();
        }
        return gxp.plugins.ZoomToInitialValues.superclass.addActions.apply(this, [{
            text: this.buttonText,
            menuText: this.menuText,
            iconCls: this.iconCls,
            tooltip: this.tooltip,
            handler: this.zoomToInitialValues,
            scope: this
        }]);
    },

    zoomToInitialValues: function() {
        this.target.mapPanel.map.setCenter(this.center, this.zoom, false, false);
    }
        
});

Ext.preg(gxp.plugins.ZoomToInitialValues.prototype.ptype, gxp.plugins.ZoomToInitialValues);
