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
 * Author: Alejandro Díaz <adiaz@emergya.com>
 */


/**
 * @requires plugins/Measure.js
 */

/** api: (define)
 *  module = gxp.plugins
 *  class = MeasureArea
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("gxp.plugins");

/** api: constructor
 *  .. class:: MeasureArea(config)
 *
 *    Provides measuring area.
 */
gxp.plugins.MeasureArea = Ext.extend(gxp.plugins.CustomMeasure, {
    
    /** api: ptype = gxp_measurearea */
    ptype: "gxp_measurearea",
    
    /** private: method[constructor]
     */
    constructor: function(config) {
        gxp.plugins.MeasureArea.superclass.constructor.apply(this, arguments);
    },

    /** private: method[init]
     * :arg target: ``Object`` The object initializing this plugin.
     */
    init: function(target) {
        gxp.plugins.MeasureArea.superclass.init.apply(this, arguments);
        this.target.on('beforerender', this.addActions, this);
    },

    /** api: method[addActions]
     */
    addActions: function() {

        var geoAction = new GeoExt.Action({
            text: this.areaMenuText,
            iconCls: "gxp-icon-measure-area",
            listeners: {
                checkchange: function(item, checked) {
                    this.activeIndex = 1;
                    this.button.toggle(checked);
                    if (checked) {
                        this.button.setIconClass(item.iconCls);
                    }
                },
                scope: this
            },
            map: this.target.mapPanel.map,
            control: this.createMeasureControl(
                OpenLayers.Handler.Polygon, this.areaTooltip
            )
        });

        this.geoAction = geoAction;

        return gxp.plugins.CustomMeasure.superclass.addActions.apply(this, [{
            text: this.showButtonText ? this.buttonText : '',
            menuText: this.areaMenuText,
            iconCls: "gxp-icon-measure-area",
            tooltip: this.areaTooltip,
            toggleGroup: this.toggleGroup,
            enableToggle: true,
            allowDepress: true,
            listeners : {
            	toggle: function(button, pressed) {
                    if (pressed) {
                        this.geoAction.control.activate();
                    } else {
                        this.geoAction.control.deactivate();
                    }
                },
                scope: this
            }
        }]);
    }
        
});

Ext.preg(gxp.plugins.MeasureArea.prototype.ptype, gxp.plugins.MeasureArea);
