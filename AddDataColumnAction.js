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
 *  class = AddDataColumnAction
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("gxp.plugins");

/** api: constructor
 *  .. class:: AddDataColumnAction(config)
 *
 */
gxp.plugins.AddDataColumnAction = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = gxp_adddatacolumn */
    ptype: "gxp_adddatacolumn",
    
    /** api: config[buttonText]
     *  ``String`` Text to show next to the zoom button
     */
    buttonText: 'Nuevo elemento',
     
    /** api: config[menuText]
     *  ``String``
     *  Text for zoom menu item (i18n).
     */
    menuText: 'Nuevo elemento',

    /** api: config[tooltip]
     *  ``String``
     *  Text for zoom action tooltip (i18n).
     */
    tooltip: 'Nuevo elemento',
    
    /** private: property[iconCls]
     */
    iconCls: 'vw-icon-new-item-from-coords',
    
    /** private: method[constructor]
     */
    constructor: function(config) {
        gxp.plugins.AddDataColumnAction.superclass.constructor.apply(this, arguments);
    },

    /** private: method[init]
     * :arg target: ``Object`` The object initializing this plugin.
     */
    init: function(target) {
        gxp.plugins.AddDataColumnAction.superclass.init.apply(this, arguments);
        this.target.on('beforerender', this.addActions, this);
        window.app.on({
            layerselectionchange: this.onLayerSelected,
            scope: this
        });
    },

    /** api: method[addActions]
     */
    addActions: function() {

        var selectedLayer = Viewer.getController('Layers').getSelectedLayer();
        var disable = true;
        try {
            disable = selectedLayer.metadata.geometries.length == 0;
        } catch(e) {
        }

        return gxp.plugins.AddDataColumnAction.superclass.addActions.apply(this, [{
            text: this.showButtonText ? this.buttonText : '',
            menuText: this.menuText,
            iconCls: this.iconCls,
            tooltip: this.tooltip,
            disabled: disable,
            handler: function(action, evt) {

                var ds = Viewer.getComponent('NewElementFromCoords');
                if (ds === undefined) {
                    var mapPanel = Viewer.getMapPanel();
                    ds = new Viewer.dialog.NewElementFromCoords({
                        mapPanel: mapPanel,
                        map: mapPanel.map,
                        activeLayer: Viewer.getController('Layers').getSelectedLayer()
                    });
                    Viewer.registerComponent('NewElementFromCoords', ds);
                }
                if (ds.isVisible()) {
                    ds.hide();
                } else {
                    ds.show();
                }
            },
            scope: this
        }]);
    },

    onLayerSelected: function(layerRecord) {

        var layer;
        try {
            layer = layerRecord.getLayer();
        } catch (e) {
            return;
        }

        var disable;
        try {
            disable = layer.metadata.geometries.length == 0;
        } catch(e) {
            disable = true;
        }

        for (var i=0, l=this.actions.length; i<l; i++) {
            this.actions[i].setDisabled(disable);
        }
    }
        
});

Ext.preg(gxp.plugins.AddDataColumnAction.prototype.ptype, gxp.plugins.AddDataColumnAction);
