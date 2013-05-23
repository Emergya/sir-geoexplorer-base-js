/*
 * LayerOpacitySlider.js Copyright (C) 2013 This file is part of PersistenceGeo project
 * 
 * This software is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 * 
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 *
 * As a special exception, if you link this library with other files to
 * produce an executable, this library does not by itself cause the
 * resulting executable to be covered by the GNU General Public License.
 * This exception does not however invalidate any other reasons why the
 * executable file might be covered by the GNU General Public License.
 * 
 * Authors: Alejandro Diaz Torres (mailto:adiaz@emergya.com)
 */


/**
 * @include GeoExt/widgets/tips/LayerOpacitySliderTip.js
 */

/** api: (define)
 *  module = PersistenceGeo.tree
 *  class = LayerOpacitySlider
 */
Ext.namespace("PersistenceGeo.tree");

/**
 * Class: PersistenceGeo.tree.LayerOpacitySlider
 * 
 * Layer opacity slider
 * 
 */
PersistenceGeo.tree.LayerOpacitySlider = Ext.extend(gxp.plugins.Tool, {

    /** api: ptype = pgeo_layeropacityslider */
    ptype: "pgeo_layeropacityslider",

    /** i18n **/
    opacityText: "Opacity",
    opacityTooltipText: "Opacity",
    opacityWindowText: "Layer {0} opacity",

    /** api: config[checkUserInfo]
     *  ``Boolean``
     *  Check user logged info to active this tool
     */
    checkUserInfo: false,

    /**
     * private: method[init] :arg target: ``Object`` The object initializing
     * this plugin.
     */
    init: function(target) {
        PersistenceGeo.tree.LayerOpacitySlider.superclass.init.apply(this, arguments);
        this.target.on('beforerender', this.addActions, this);

    },

    /** api: method[addActions]
     */
    addActions: function() {     

        var actions = PersistenceGeo.tree.LayerOpacitySlider.superclass.addActions.apply(this, [{
                menuText: this.opacityText,
                iconCls: "gxp-icon-palette pgeo-layer-opacity-slider",
                disabled: false,
                tooltip: this.opacityTooltipText,
                handler: function() {
                    var record = this._selectedLayer;
                    if (record) {
                        this.showWindow(record);
                    }
                },
                scope: this
            }
        ]); 

        this.launchAction = actions[0];

        this.target.on("layerselectionchange", function(record) {
            this._selectedLayer = record;
            this.checkIfEnable(record);
        }, this);
        var enforceOne = function(store) {
            if(!!this.launchAction){
                this.launchAction.setDisabled(!this._selectedLayer || store.getCount() <= 1);
            }
        };
        this.target.mapPanel.layers.on({
            "add": enforceOne,
            "remove": enforceOne
        });

        return actions;
    },
    /**

     * private: method[showWindow]
     * Show a dialog
     */
    showWindow: function(layerRecord) {
        var layer = layerRecord.getLayer();
        var windowToShow = new Ext.Window({
            title: String.format(this.opacityWindowText, layer.name),
            closeAction: 'hide',
            items:[{
                xtype: "gx_opacityslider",
                name: "opacity",
                anchor: "99%",
                isFormField: true,
                fieldLabel: this.opacityText,
                listeners: {
                    change: function() {
                        this.fireEvent("change");
                    },
                    scope: this
                },
                layer: layer
            }]
        });
        windowToShow.show();
    },

    /** private: method[checkIfEnable]
     *  :arg layerRec: ``GeoExt.data.LayerRecord``
     *
     *  Enable this.launchAction if the layer don't be management by 
     *  the user logged or disable this.launchAction otherwise if this.checkUserInfo flag is active
     */
    checkIfEnable: function(record) {

        var disable = true;
        
        if(!!record){
            var layer = record.getLayer();
            var userInfo = app.persistenceGeoContext.userInfo;
            disable = false;
            
            if(layer.isBaseLayer){
                disable = true;
            }
            if(!disable && this.checkUserInfo){
                if(!!layer.groupID){
                    // Authority layers
                    var isAdministrable = userInfo.authorityId == layer.groupID;
                    disable = isAdministrable;
                } else if(!!layer.layerID){ 
                    // Public layers
                    var isAdministrable = userInfo.admin;
                    disable = isAdministrable;
                }
            }
        }

        this.launchAction.setDisabled(disable); 
    }

});

Ext.preg(PersistenceGeo.tree.LayerOpacitySlider.prototype.ptype, PersistenceGeo.tree.LayerOpacitySlider);