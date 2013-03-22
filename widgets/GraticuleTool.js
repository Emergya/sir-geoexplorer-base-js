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
 * Author: Moisés Arcos Santiago <marcos@emergya.com>
 */
/**
 * @requires plugins/Tool.js
 */

/** api: (define)
 *  module = gxp.plugins
 *  class = GraticuleTool
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("Viewer.plugins");
/** api: constructor
 *  .. class:: GraticuleTool(config)
 *
 *    Plugin to display a grid of latitude and longitude
 */
Viewer.plugins.GraticuleTool = Ext.extend(gxp.plugins.Tool, {
    /** api: ptype = vw_graticuletool */
    ptype: "vw_graticuletool",
    /** private: property[iconCls]
     */
    iconCls: "vw-icon-graticule-tool",
    /** private: variables */
    graticuleButtonText: "Show Graticule",
    graticuleTooltip: "Show a Graticule on the map",
    /** private: method[constructor]
     */
    constructor: function(config) {
        Viewer.plugins.GraticuleTool.superclass.constructor.apply(this, arguments);
    },
    /** private: method[init]
     * :arg target: ``Object`` The object initializing this plugin.
     */
    init: function(target) {
        Viewer.plugins.GraticuleTool.superclass.init.apply(this, arguments);
        this.target.on('beforerender', this.addActions, this);
    },
    /** api: method[addActions] */
    addActions: function(){
        var graticuleControl = new OpenLayers.Control.Graticule({
            autoActivate: false,
            displayInLayerSwitcher: false
        });
        var geoAction = new GeoExt.Action({
            map: this.target.mapPanel.map,
            control: graticuleControl
        });
        this.geoAction = geoAction;
        return Viewer.plugins.GraticuleTool.superclass.addActions.apply(this, [{
            menuText: this.graticuleButtonText,
            tooltip: this.graticuleTooltip,
            iconCls: this.iconCls,
        enableToggle: true,
            handler: function (button, evt){
                if (!this.geoAction.control.active){
                    this.geoAction.control.activate();
                }else{
                    this.geoAction.control.deactivate();
                }
            },
            scope: this
        }]);
    }
});

Ext.preg(Viewer.plugins.GraticuleTool.prototype.ptype, Viewer.plugins.GraticuleTool);
